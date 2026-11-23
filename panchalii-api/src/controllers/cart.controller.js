const httpStatus = require('http-status');
const Cart = require('../models/cart.model');
const Product = require('../models/product.model');
const { v4: uuid } = require('uuid');
const ApiError = require('../utils/ApiError');

// Never query with a missing guestToken: Mongoose drops undefined filters and
// { guestToken: null } matches every signed-in user's cart.
const cartFilter = (req, guestToken) => {
  if (req.user?._id) return { user: req.user._id };
  if (typeof guestToken === 'string' && guestToken) return { guestToken };
  return null;
};

const getPopulatedCart = (cart) =>
  Cart.findById(cart._id).populate({ path: 'items.product', select: 'name price mrp images slug inStock' }).lean();

// POST /v1/public/cart/add
const addToCart = async (req, res, next) => {
  try {
    const { productId, qty = 1, guestToken } = req.body;
    const userId = req.user?._id;
    const filter = cartFilter(req, guestToken);
    const product = await Product.findById(productId);
    if (!product || !product.isActive) throw new ApiError(httpStatus.NOT_FOUND, 'Product not found');
    if (!product.inStock) throw new ApiError(httpStatus.BAD_REQUEST, 'Product is out of stock');

    let cart = filter ? await Cart.findOne(filter) : null;
    if (!cart) {
      cart = new Cart(userId ? { user: userId } : { guestToken: guestToken || uuid() });
    }

    const existing = cart.items.find((i) => String(i.product) === String(productId));
    if (existing) existing.qty += qty;
    else cart.items.push({ product: productId, qty });
    await cart.save();

    const populated = await getPopulatedCart(cart);
    res.json({ success: true, data: populated, guestToken: cart.guestToken });
  } catch (err) { next(err); }
};

// POST /v1/public/cart/update
const updateCart = async (req, res, next) => {
  try {
    const { productId, qty, guestToken } = req.body;
    const filter = cartFilter(req, guestToken);
    const cart = filter && await Cart.findOne(filter);
    if (!cart) throw new ApiError(httpStatus.NOT_FOUND, 'Cart not found');

    if (qty <= 0) {
      cart.items = cart.items.filter((i) => String(i.product) !== String(productId));
    } else {
      const item = cart.items.find((i) => String(i.product) === String(productId));
      if (item) item.qty = qty;
    }
    await cart.save();
    const populated = await getPopulatedCart(cart);
    res.json({ success: true, data: populated });
  } catch (err) { next(err); }
};

// POST /v1/public/cart/remove
const removeFromCart = async (req, res, next) => {
  try {
    const { productId, guestToken } = req.body;
    const filter = cartFilter(req, guestToken);
    const cart = filter && await Cart.findOne(filter);
    if (!cart) throw new ApiError(httpStatus.NOT_FOUND, 'Cart not found');
    cart.items = cart.items.filter((i) => String(i.product) !== String(productId));
    await cart.save();
    const populated = await getPopulatedCart(cart);
    res.json({ success: true, data: populated });
  } catch (err) { next(err); }
};

// GET /v1/public/cart/:guestToken  or  GET /v1/me/cart
const getCart = async (req, res, next) => {
  try {
    const filter = cartFilter(req, req.params.guestToken || req.query.guestToken);
    if (!filter) return res.json({ success: true, data: { items: [] } });
    const cart = await Cart.findOne(filter)
      .populate({ path: 'items.product', select: 'name price mrp images slug inStock' })
      .lean();
    res.json({ success: true, data: cart || { items: [] } });
  } catch (err) { next(err); }
};

// POST /v1/me/cart/merge (merge guest cart into user cart after login)
const mergeCart = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { guestToken } = req.body;
    const guestCart = typeof guestToken === 'string' && guestToken
      ? await Cart.findOne({ guestToken, user: { $exists: false } })
      : null;

    let userCart = await Cart.findOne({ user: userId });
    if (!guestCart || !guestCart.items.length) {
      return res.json({ success: true, data: userCart ? await getPopulatedCart(userCart) : { items: [] } });
    }
    if (!userCart) userCart = new Cart({ user: userId, items: [] });

    for (const guestItem of guestCart.items) {
      const existing = userCart.items.find((i) => String(i.product) === String(guestItem.product));
      if (existing) existing.qty += guestItem.qty;
      else userCart.items.push(guestItem);
    }
    await userCart.save();
    await guestCart.deleteOne();
    const populated = await getPopulatedCart(userCart);
    res.json({ success: true, data: populated });
  } catch (err) { next(err); }
};

module.exports = { addToCart, updateCart, removeFromCart, getCart, mergeCart };
