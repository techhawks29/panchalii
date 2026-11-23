const express = require('express');
const pub = require('../../controllers/public.controller');
const cart = require('../../controllers/cart.controller');
const { optionalAuth } = require('../../middlewares/auth');
const { cacheMiddleware } = require('../../middlewares/cache');
const router = express.Router();

// Settings & homepage (cached 60s)
router.get('/settings', cacheMiddleware(60), pub.getSettings);

// Products (cached 300s)
router.get('/products', cacheMiddleware(300), pub.getProducts);
router.get('/products/:slug', cacheMiddleware(300), pub.getProductBySlug);

// Categories (cached 600s)
router.get('/categories', cacheMiddleware(600), pub.getCategories);

// Search (not cached — dynamic)
router.get('/search', pub.search);

// Reviews (cached 120s)
router.get('/reviews/:productId', cacheMiddleware(120), pub.getProductReviews);

// Cart (never cached — per-user/guest state)
router.post('/cart/add', optionalAuth, cart.addToCart);
router.post('/cart/update', optionalAuth, cart.updateCart);
router.post('/cart/remove', optionalAuth, cart.removeFromCart);
router.get('/cart/:guestToken', optionalAuth, cart.getCart);

module.exports = router;
