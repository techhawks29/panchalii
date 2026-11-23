const httpStatus = require('http-status');
const slugify = require('slugify');
const Product = require('../models/product.model');
const Category = require('../models/category.model');
const Order = require('../models/order.model');
const User = require('../models/user.model');
const Banner = require('../models/banner.model');
const Coupon = require('../models/coupon.model');
const Review = require('../models/review.model');
const Notification = require('../models/notification.model');
const cloudinaryService = require('../services/cloudinary.service');
const { paginate } = require('../utils/paginate');
const ApiError = require('../utils/ApiError');
const redis = require('../config/redis');

// ---- Products ----
const getProducts = async (req, res, next) => {
  try {
    const { q, category, inStock, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (q) filter.$text = { $search: q };
    if (category) filter.category = category;
    if (inStock !== undefined) filter.inStock = inStock === 'true';
    const result = await paginate(Product, filter, { page, limit, populate: 'category' });
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
};

const createProduct = async (req, res, next) => {
  try {
    const data = req.body;
    data.slug = slugify(data.name, { lower: true, strict: true });
    const exists = await Product.findOne({ slug: data.slug });
    if (exists) data.slug = `${data.slug}-${Date.now()}`;
    const product = await Product.create(data);
    await redis.delByPattern('cache:/v1/public/products*');
    await redis.delByPattern('cache:/v1/public/settings*');
    res.status(httpStatus.CREATED).json({ success: true, data: product });
  } catch (err) { next(err); }
};

const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!product) throw new ApiError(httpStatus.NOT_FOUND, 'Product not found');
    await redis.delByPattern('cache:/v1/public/products*');
    await redis.del(`cache:/v1/public/products/${product.slug}`);
    res.json({ success: true, data: product });
  } catch (err) { next(err); }
};

const deleteProduct = async (req, res, next) => {
  try {
    await Product.findByIdAndUpdate(req.params.id, { isActive: false });
    await redis.delByPattern('cache:/v1/public/products*');
    res.json({ success: true, message: 'Product deactivated' });
  } catch (err) { next(err); }
};

// Upload image to Cloudinary
const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) throw new ApiError(httpStatus.BAD_REQUEST, 'No file uploaded');
    const result = await cloudinaryService.uploadBuffer(req.file.buffer, 'panchalii/products');
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

// ---- Categories ----
const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find().sort({ sortOrder: 1 }).lean();
    res.json({ success: true, data: categories });
  } catch (err) { next(err); }
};

const createCategory = async (req, res, next) => {
  try {
    const { name, ...rest } = req.body;
    const slug = slugify(name, { lower: true, strict: true });
    const category = await Category.create({ name, slug, ...rest });
    await redis.delByPattern('cache:/v1/public/categories*');
    res.status(httpStatus.CREATED).json({ success: true, data: category });
  } catch (err) { next(err); }
};

const updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!category) throw new ApiError(httpStatus.NOT_FOUND, 'Category not found');
    await redis.delByPattern('cache:/v1/public/categories*');
    res.json({ success: true, data: category });
  } catch (err) { next(err); }
};

const deleteCategory = async (req, res, next) => {
  try {
    await Category.findByIdAndUpdate(req.params.id, { isActive: false });
    await redis.delByPattern('cache:/v1/public/categories*');
    res.json({ success: true, message: 'Category deactivated' });
  } catch (err) { next(err); }
};

// ---- Orders ----
const getOrders = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    const result = await paginate(Order, filter, {
      page, limit,
      populate: { path: 'user', select: 'name email phone' },
      sort: { createdAt: -1 },
    });
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
};

const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email phone').lean();
    if (!order) throw new ApiError(httpStatus.NOT_FOUND, 'Order not found');
    res.json({ success: true, data: order });
  } catch (err) { next(err); }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const { status, note, trackingNumber, trackingUrl } = req.body;
    const update = { status };
    if (trackingNumber) update.trackingNumber = trackingNumber;
    if (trackingUrl) update.trackingUrl = trackingUrl;
    // findByIdAndUpdate skips the model's save hook, so record the status history here
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { $set: update, $push: { timeline: { status, note: note || '', at: new Date() } } },
      { new: true },
    ).populate('user', 'name email');
    if (!order) throw new ApiError(httpStatus.NOT_FOUND, 'Order not found');

    // Push notification to user
    await Notification.create({
      user: order.user._id,
      title: `Order ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      body: `Your order ${order.orderNumber} has been ${status}.${note ? ' ' + note : ''}`,
      type: 'order',
      link: `/account/orders/${order._id}`,
    });

    res.json({ success: true, data: order });
  } catch (err) { next(err); }
};

// ---- Users ----
const getUsers = async (req, res, next) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;
    const filter = { role: 'customer' };
    if (q) filter.$or = [{ name: { $regex: q, $options: 'i' } }, { email: { $regex: q, $options: 'i' } }];
    const result = await paginate(User, filter, { page, limit, sort: { createdAt: -1 } });
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
};

const toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    user.isActive = !user.isActive;
    await user.save();
    res.json({ success: true, data: { isActive: user.isActive } });
  } catch (err) { next(err); }
};

// ---- Banners ----
const getBanners = async (req, res, next) => {
  try {
    const banners = await Banner.find().sort({ position: 1, sortOrder: 1 }).lean();
    res.json({ success: true, data: banners });
  } catch (err) { next(err); }
};

const createBanner = async (req, res, next) => {
  try {
    const banner = await Banner.create(req.body);
    await redis.delByPattern('cache:/v1/public/settings*');
    res.status(httpStatus.CREATED).json({ success: true, data: banner });
  } catch (err) { next(err); }
};

const updateBanner = async (req, res, next) => {
  try {
    const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!banner) throw new ApiError(httpStatus.NOT_FOUND, 'Banner not found');
    await redis.delByPattern('cache:/v1/public/settings*');
    res.json({ success: true, data: banner });
  } catch (err) { next(err); }
};

const deleteBanner = async (req, res, next) => {
  try {
    await Banner.findByIdAndDelete(req.params.id);
    await redis.delByPattern('cache:/v1/public/settings*');
    res.json({ success: true, message: 'Banner deleted' });
  } catch (err) { next(err); }
};

// ---- Coupons ----
const getCoupons = async (req, res, next) => {
  try {
    const result = await paginate(Coupon, {}, { page: req.query.page || 1, limit: 20, sort: { createdAt: -1 } });
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
};

const createCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.create(req.body);
    res.status(httpStatus.CREATED).json({ success: true, data: coupon });
  } catch (err) { next(err); }
};

const updateCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!coupon) throw new ApiError(httpStatus.NOT_FOUND, 'Coupon not found');
    res.json({ success: true, data: coupon });
  } catch (err) { next(err); }
};

const deleteCoupon = async (req, res, next) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Coupon deleted' });
  } catch (err) { next(err); }
};

// ---- Reviews ----
const getPendingReviews = async (req, res, next) => {
  try {
    const result = await paginate(Review, { isApproved: false }, {
      page: req.query.page || 1, limit: 20,
      populate: [{ path: 'user', select: 'name email' }, { path: 'product', select: 'name images' }],
    });
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
};

const refreshProductRating = async (productId) => {
  const reviews = await Review.find({ product: productId, isApproved: true }).select('rating').lean();
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  await Product.findByIdAndUpdate(productId, { averageRating: Math.round(avg * 10) / 10, totalReviews: reviews.length });
};

const approveReview = async (req, res, next) => {
  try {
    const review = await Review.findByIdAndUpdate(req.params.id, { isApproved: true }, { new: true });
    if (!review) throw new ApiError(httpStatus.NOT_FOUND, 'Review not found');
    await refreshProductRating(review.product);
    res.json({ success: true, data: review });
  } catch (err) { next(err); }
};

const rejectReview = async (req, res, next) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) throw new ApiError(httpStatus.NOT_FOUND, 'Review not found');
    await refreshProductRating(review.product);
    res.json({ success: true });
  } catch (err) { next(err); }
};

// ---- Analytics ----
const getAnalytics = async (req, res, next) => {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const notCancelled = { status: { $nin: ['cancelled', 'refunded'] } };
    const paidRevenueSince = (from) => Order.aggregate([
      { $match: { 'payment.status': 'paid', ...(from && { createdAt: { $gte: from } }) } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]).then((r) => r[0]?.total || 0);

    const [
      revenueToday, revenueMonth, revenueTotal,
      ordersToday, ordersPending, ordersTotal,
      productsTotal, productsOutOfStock,
      usersTotal, usersNewThisMonth,
      topProducts, recentOrders,
    ] = await Promise.all([
      paidRevenueSince(today), paidRevenueSince(monthStart), paidRevenueSince(null),
      Order.countDocuments({ createdAt: { $gte: today }, ...notCancelled }),
      Order.countDocuments({ status: 'pending' }),
      Order.countDocuments(notCancelled),
      Product.countDocuments({ isActive: true }),
      Product.countDocuments({ isActive: true, inStock: false }),
      User.countDocuments({ role: 'customer' }),
      User.countDocuments({ role: 'customer', createdAt: { $gte: monthStart } }),
      Order.aggregate([
        { $match: notCancelled },
        { $unwind: '$items' },
        { $group: { _id: '$items.product', sold: { $sum: '$items.qty' }, revenue: { $sum: '$items.lineTotal' } } },
        { $sort: { sold: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
        { $unwind: '$product' },
        { $project: { name: '$product.name', sold: 1, revenue: 1 } },
      ]),
      Order.find().sort({ createdAt: -1 }).limit(6).select('orderNumber total status createdAt').lean(),
    ]);

    // Shape matches the admin dashboard's Analytics interface
    res.json({
      success: true,
      data: {
        revenue: { today: revenueToday, thisMonth: revenueMonth, total: revenueTotal },
        orders: { today: ordersToday, pending: ordersPending, total: ordersTotal },
        products: { total: productsTotal, outOfStock: productsOutOfStock },
        users: { total: usersTotal, newThisMonth: usersNewThisMonth },
        topProducts,
        recentOrders,
      },
    });
  } catch (err) { next(err); }
};

module.exports = {
  getProducts, createProduct, updateProduct, deleteProduct, uploadImage,
  getCategories, createCategory, updateCategory, deleteCategory,
  getOrders, getOrderById, updateOrderStatus,
  getUsers, toggleUserStatus,
  getBanners, createBanner, updateBanner, deleteBanner,
  getCoupons, createCoupon, updateCoupon, deleteCoupon,
  getPendingReviews, approveReview, rejectReview,
  getAnalytics,
};
