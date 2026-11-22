const httpStatus = require('http-status');
const Product = require('../models/product.model');
const Category = require('../models/category.model');
const Banner = require('../models/banner.model');
const Review = require('../models/review.model');
const { paginate } = require('../utils/paginate');

// GET /v1/public/settings
const getSettings = async (req, res, next) => {
  try {
    const [banners, categories] = await Promise.all([
      Banner.find({ isActive: true }).sort({ position: 1, sortOrder: 1 }).lean(),
      Category.find({ isActive: true, parentCategory: null }).sort({ sortOrder: 1 }).lean(),
    ]);
    res.json({ success: true, data: { banners, categories, storeName: 'Panchalii', currency: 'INR' } });
  } catch (err) { next(err); }
};

// GET /v1/public/products
const getProducts = async (req, res, next) => {
  try {
    const { category, fabric, occasion, colour, minPrice, maxPrice, sort, q, page = 1, limit = 20, featured, inStock } = req.query;
    const filter = { isActive: true };
    if (category) {
      if (require('mongoose').isValidObjectId(category)) {
        filter.category = category;
      } else {
        const cat = await Category.findOne({ slug: String(category).toLowerCase() }).select('_id').lean();
        if (!cat) return res.json({ success: true, data: [], pagination: { total: 0, page: 1, limit: Number(limit), pages: 0, hasNext: false, hasPrev: false } });
        filter.category = cat._id;
      }
    }
    if (fabric) filter.fabric = { $regex: fabric, $options: 'i' };
    if (occasion) filter.occasion = occasion;
    if (colour) filter['colour.name'] = { $regex: colour, $options: 'i' };
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    if (featured === 'true') filter.isFeatured = true;
    if (inStock === 'true') filter.inStock = true;
    if (q) filter.$text = { $search: q };

    const sortMap = {
      price_asc: { price: 1 },
      price_desc: { price: -1 },
      newest: { createdAt: -1 },
      popular: { totalReviews: -1 },
    };

    const result = await paginate(Product, filter, {
      page, limit,
      sort: sortMap[sort] || { createdAt: -1 },
      populate: 'category',
    });
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
};

// GET /v1/public/products/:slug
const getProductBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const match = require('mongoose').isValidObjectId(slug) ? { $or: [{ slug }, { _id: slug }] } : { slug };
    const product = await Product.findOne({ ...match, isActive: true }).populate('category').lean();
    if (!product) return next(new (require('../utils/ApiError'))(httpStatus.NOT_FOUND, 'Product not found'));
    res.json({ success: true, data: product });
  } catch (err) { next(err); }
};

// GET /v1/public/categories
const getCategories = async (req, res, next) => {
  try {
    const all = await Category.find({ isActive: true }).sort({ sortOrder: 1 }).lean();
    const roots = all.filter((c) => !c.parentCategory);
    const children = all.filter((c) => c.parentCategory);
    const tree = roots.map((r) => ({
      ...r,
      children: children.filter((c) => String(c.parentCategory) === String(r._id)),
    }));
    res.json({ success: true, data: tree });
  } catch (err) { next(err); }
};

// GET /v1/public/search?q=
const search = async (req, res, next) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;
    if (!q) return res.json({ success: true, data: [], pagination: { total: 0 } });
    const result = await paginate(Product, { isActive: true, $text: { $search: q } }, { page, limit, sort: { score: { $meta: 'textScore' } } });
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
};

// GET /v1/public/reviews/:productId
const getProductReviews = async (req, res, next) => {
  try {
    const result = await paginate(Review, { product: req.params.productId, isApproved: true }, {
      page: req.query.page || 1,
      limit: req.query.limit || 10,
      sort: { createdAt: -1 },
      populate: { path: 'user', select: 'name profileImage' },
    });
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
};

module.exports = { getSettings, getProducts, getProductBySlug, getCategories, search, getProductReviews };
