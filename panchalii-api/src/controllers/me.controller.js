const httpStatus = require('http-status');
const User = require('../models/user.model');
const Address = require('../models/address.model');
const Order = require('../models/order.model');
const Wishlist = require('../models/wishlist.model');
const Wallet = require('../models/wallet.model');
const Notification = require('../models/notification.model');
const Review = require('../models/review.model');
const Coupon = require('../models/coupon.model');
const Product = require('../models/product.model');
const Token = require('../models/token.model');
const tokenService = require('../services/token.service');
const razorpayService = require('../services/razorpay.service');
const emailService = require('../services/email.service');
const { paginate } = require('../utils/paginate');
const ApiError = require('../utils/ApiError');

// Profile
const getProfile = async (req, res, next) => {
  try {
    const { passwordHash, ...user } = await User.findById(req.user._id).select('+passwordHash').lean();
    res.json({ success: true, data: { ...user, hasPassword: Boolean(passwordHash) } });
  } catch (err) { next(err); }
};

const updateProfile = async (req, res, next) => {
  try {
    const update = {};
    if (req.body.name !== undefined) {
      const name = String(req.body.name).trim();
      if (name.length < 2 || name.length > 60) throw new ApiError(httpStatus.BAD_REQUEST, 'Name must be 2–60 characters');
      update.name = name;
    }
    if (req.body.profileImage !== undefined) update.profileImage = String(req.body.profileImage);
    const user = await User.findByIdAndUpdate(req.user._id, update, { new: true, runValidators: true }).lean();
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (typeof newPassword !== 'string' || newPassword.length < 8) throw new ApiError(httpStatus.BAD_REQUEST, 'New password must be at least 8 characters');
    const user = await User.findById(req.user._id).select('+passwordHash');
    // Accounts created with Google have no password yet and may set one without a current password
    if (user.passwordHash && !(await user.matchPassword(currentPassword))) throw new ApiError(httpStatus.BAD_REQUEST, 'Current password is incorrect');
    user.passwordHash = newPassword;
    await user.save();
    // Sign out other devices; this one gets fresh tokens so it stays signed in
    await Token.deleteMany({ user: user._id, type: 'refresh' });
    const tokens = await tokenService.generateAuthTokens(user);
    res.json({ success: true, message: 'Password changed successfully', tokens });
  } catch (err) { next(err); }
};

// Addresses
const ADDRESS_FIELDS = ['label', 'name', 'phone', 'line1', 'line2', 'city', 'state', 'pincode'];

// Only copy known address fields from the request (never `user`, `_id`, etc.)
const pickAddress = (body) => {
  const out = {};
  for (const f of ADDRESS_FIELDS) if (body[f] !== undefined) out[f] = String(body[f]).trim();
  if (out.phone !== undefined) out.phone = out.phone.replace(/\D/g, '');
  if (out.phone !== undefined && !/^\d{10}$/.test(out.phone)) throw new ApiError(httpStatus.BAD_REQUEST, 'Enter a 10-digit mobile number');
  if (out.pincode !== undefined && !/^\d{6}$/.test(out.pincode)) throw new ApiError(httpStatus.BAD_REQUEST, 'Enter a 6-digit pincode');
  return out;
};

const getAddresses = async (req, res, next) => {
  try {
    const addresses = await Address.find({ user: req.user._id }).sort({ isDefault: -1, createdAt: -1 }).lean();
    res.json({ success: true, data: addresses });
  } catch (err) { next(err); }
};

const saveAddress = async (req, res, next) => {
  try {
    const fields = pickAddress(req.body);
    // A customer's first address becomes their default automatically
    const isDefault = Boolean(req.body.isDefault) || !(await Address.exists({ user: req.user._id }));
    if (isDefault) await Address.updateMany({ user: req.user._id }, { isDefault: false });
    const address = await Address.create({ ...fields, user: req.user._id, isDefault });
    res.status(httpStatus.CREATED).json({ success: true, data: address });
  } catch (err) { next(err); }
};

const updateAddress = async (req, res, next) => {
  try {
    const update = pickAddress(req.body);
    if (req.body.isDefault === true) {
      await Address.updateMany({ user: req.user._id, _id: { $ne: req.params.id } }, { isDefault: false });
      update.isDefault = true;
    }
    const address = await Address.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, update, { new: true, runValidators: true });
    if (!address) throw new ApiError(httpStatus.NOT_FOUND, 'Address not found');
    res.json({ success: true, data: address });
  } catch (err) { next(err); }
};

const deleteAddress = async (req, res, next) => {
  try {
    const removed = await Address.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!removed) throw new ApiError(httpStatus.NOT_FOUND, 'Address not found');
    // Keep a default when the default one is removed
    if (removed.isDefault) {
      const replacement = await Address.findOne({ user: req.user._id }).sort({ createdAt: -1 });
      if (replacement) { replacement.isDefault = true; await replacement.save(); }
    }
    res.json({ success: true, message: 'Address deleted' });
  } catch (err) { next(err); }
};

// Orders
const getOrders = async (req, res, next) => {
  try {
    // Hide abandoned checkouts: an order is created when payment starts, but only counts once paid or progressed
    const visible = { user: req.user._id, $or: [{ 'payment.status': { $ne: 'pending' } }, { status: { $ne: 'pending' } }] };
    const result = await paginate(Order, visible, {
      page: req.query.page || 1,
      limit: req.query.limit || 10,
      sort: { createdAt: -1 },
    });
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
};

const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id })
      .populate('items.product', 'name images slug').lean();
    if (!order) throw new ApiError(httpStatus.NOT_FOUND, 'Order not found');
    res.json({ success: true, data: order });
  } catch (err) { next(err); }
};

// Initiate payment
const initiatePayment = async (req, res, next) => {
  try {
    const { addressId, items, couponCode, loyaltyPoints = 0, walletAmount = 0 } = req.body;
    const address = await Address.findOne({ _id: addressId, user: req.user._id });
    if (!address) throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid address');

    // Calculate totals from server-side prices (never trust client amounts)
    const productIds = items.map((i) => i.productId);
    const products = await Product.find({ _id: { $in: productIds }, isActive: true }).lean();
    if (products.length !== items.length) throw new ApiError(httpStatus.BAD_REQUEST, 'Some products are unavailable');

    let subtotal = 0;
    const orderItems = items.map((i) => {
      const p = products.find((pr) => String(pr._id) === String(i.productId));
      const lineTotal = p.price * i.qty;
      subtotal += lineTotal;
      return { product: p._id, name: p.name, image: p.images[0] || '', price: p.price, qty: i.qty, lineTotal };
    });

    // Coupon
    let couponDiscount = 0;
    let coupon = null;
    if (couponCode) {
      coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
      if (coupon && (!coupon.expiresAt || coupon.expiresAt > new Date()) && subtotal >= coupon.minOrderAmount) {
        couponDiscount = coupon.type === 'flat'
          ? coupon.value
          : Math.min(subtotal * coupon.value / 100, coupon.maxDiscount || Infinity);
      }
    }

    const shippingCharge = subtotal >= 999 ? 0 : 99;
    const total = Math.max(0, subtotal - couponDiscount + shippingCharge - loyaltyPoints - walletAmount);

    const rzOrder = await razorpayService.createOrder({
      amount: total,
      receipt: `PCH-${req.user._id}-${Date.now()}`,
      notes: { userId: String(req.user._id) },
    });

    // Store pending order context in session-like structure on order
    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      address: { name: address.name, phone: address.phone, line1: address.line1, line2: address.line2, city: address.city, state: address.state, pincode: address.pincode },
      couponCode: couponCode || '',
      couponDiscount,
      subtotal,
      shippingCharge,
      total,
      loyaltyPointsUsed: loyaltyPoints,
      walletAmountUsed: walletAmount,
      'payment.razorpayOrderId': rzOrder.id,
      'payment.status': 'pending',
      status: 'pending',
    });

    res.json({
      success: true,
      data: {
        orderId: order._id,
        razorpayOrderId: rzOrder.id,
        amount: total,
        currency: 'INR',
        keyId: require('../config/config').razorpay.keyId,
      },
    });
  } catch (err) { next(err); }
};

// Verify payment & place order
const verifyPayment = async (req, res, next) => {
  try {
    const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const isValid = razorpayService.verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    if (!isValid) throw new ApiError(httpStatus.BAD_REQUEST, 'Payment verification failed');

    const order = await Order.findOneAndUpdate(
      { _id: orderId, user: req.user._id, 'payment.razorpayOrderId': razorpay_order_id },
      {
        $set: {
          status: 'confirmed',
          'payment.razorpayPaymentId': razorpay_payment_id,
          'payment.razorpaySignature': razorpay_signature,
          'payment.status': 'paid',
          'payment.paidAt': new Date(),
        },
        $push: { timeline: { status: 'confirmed', note: 'Payment received', at: new Date() } },
      },
      { new: true }
    );
    if (!order) throw new ApiError(httpStatus.NOT_FOUND, 'Order not found');

    const user = await User.findById(req.user._id);
    if (user?.email) emailService.sendOrderConfirmation(user.email, order).catch(() => {});

    res.json({ success: true, data: order });
  } catch (err) { next(err); }
};

// Wishlist
const toggleWishlist = async (req, res, next) => {
  try {
    const { productId } = req.body;
    let wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) wishlist = new Wishlist({ user: req.user._id, products: [] });
    const idx = wishlist.products.findIndex((p) => String(p) === String(productId));
    if (idx > -1) wishlist.products.splice(idx, 1);
    else wishlist.products.push(productId);
    await wishlist.save();
    res.json({ success: true, data: wishlist });
  } catch (err) { next(err); }
};

const getWishlist = async (req, res, next) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user._id })
      .populate('products', 'name price mrp images slug colour fabric inStock isActive').lean();
    // Most recently saved first; drop products that were deleted or hidden from the store
    const products = (wishlist?.products || []).filter((p) => p && p.isActive !== false).reverse();
    res.json({ success: true, data: { ...(wishlist || {}), products } });
  } catch (err) { next(err); }
};

// Reviews
const saveReview = async (req, res, next) => {
  try {
    const { productId, orderId, rating, title, body, images } = req.body;
    const existing = await Review.findOne({ user: req.user._id, product: productId });
    if (existing) throw new ApiError(httpStatus.CONFLICT, 'You have already reviewed this product');
    const review = await Review.create({ user: req.user._id, product: productId, order: orderId, rating, title, body, images: images || [] });
    res.status(httpStatus.CREATED).json({ success: true, data: review });
  } catch (err) { next(err); }
};

const getMyReviews = async (req, res, next) => {
  try {
    const result = await paginate(Review, { user: req.user._id }, { page: req.query.page || 1, limit: 10, populate: { path: 'product', select: 'name images slug' } });
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
};

// Wallet
const getWallet = async (req, res, next) => {
  try {
    let wallet = await Wallet.findOne({ user: req.user._id }).lean();
    if (!wallet) wallet = { balance: 0, transactions: [] };
    res.json({ success: true, data: wallet });
  } catch (err) { next(err); }
};

// Notifications
const getNotifications = async (req, res, next) => {
  try {
    const result = await paginate(Notification, { user: req.user._id }, { page: req.query.page || 1, limit: 20, sort: { createdAt: -1 } });
    const unreadCount = await Notification.countDocuments({ user: req.user._id, isRead: false });
    res.json({ success: true, ...result, unreadCount });
  } catch (err) { next(err); }
};

const markRead = async (req, res, next) => {
  try {
    const n = await Notification.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, { isRead: true }, { new: true });
    if (!n) throw new ApiError(httpStatus.NOT_FOUND, 'Notification not found');
    res.json({ success: true, data: n });
  } catch (err) { next(err); }
};

const markAllRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) { next(err); }
};

// Coupon validate
const validateCoupon = async (req, res, next) => {
  try {
    const { code, orderAmount } = req.body;
    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
    if (!coupon) throw new ApiError(httpStatus.NOT_FOUND, 'Coupon not found or expired');
    if (coupon.expiresAt && coupon.expiresAt < new Date()) throw new ApiError(httpStatus.BAD_REQUEST, 'Coupon has expired');
    if (orderAmount < coupon.minOrderAmount) throw new ApiError(httpStatus.BAD_REQUEST, `Minimum order ₹${coupon.minOrderAmount} required`);
    if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) throw new ApiError(httpStatus.BAD_REQUEST, 'Coupon usage limit reached');
    const perUserUsed = coupon.usedBy.filter((u) => String(u) === String(req.user._id)).length;
    if (perUserUsed >= coupon.perUserLimit) throw new ApiError(httpStatus.BAD_REQUEST, 'You have already used this coupon');

    const discount = coupon.type === 'flat'
      ? coupon.value
      : Math.min(orderAmount * coupon.value / 100, coupon.maxDiscount || Infinity);

    res.json({ success: true, data: { code: coupon.code, type: coupon.type, value: coupon.value, discount: Math.round(discount) } });
  } catch (err) { next(err); }
};

module.exports = {
  getProfile, updateProfile, changePassword,
  getAddresses, saveAddress, updateAddress, deleteAddress,
  getOrders, getOrderById, initiatePayment, verifyPayment,
  toggleWishlist, getWishlist,
  saveReview, getMyReviews,
  getWallet,
  getNotifications, markRead, markAllRead,
  validateCoupon,
};
