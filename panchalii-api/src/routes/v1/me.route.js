const express = require('express');
const { authenticate } = require('../../middlewares/auth');
const me = require('../../controllers/me.controller');
const cart = require('../../controllers/cart.controller');
const router = express.Router();

router.use(authenticate);

// Profile
router.get('/profile', me.getProfile);
router.patch('/profile', me.updateProfile);
router.patch('/change-password', me.changePassword);

// Addresses
router.get('/addresses', me.getAddresses);
router.post('/addresses', me.saveAddress);
router.patch('/addresses/:id', me.updateAddress);
router.delete('/addresses/:id', me.deleteAddress);

// Orders
router.get('/orders', me.getOrders);
router.get('/orders/:id', me.getOrderById);
router.post('/payment/initiate', me.initiatePayment);
router.post('/payment/verify', me.verifyPayment);

// Cart (server-side, authenticated)
router.get('/cart', cart.getCart);
router.post('/cart/merge', cart.mergeCart);

// Wishlist
router.post('/wishlist/toggle', me.toggleWishlist);
router.get('/wishlist', me.getWishlist);

// Reviews
router.post('/reviews', me.saveReview);
router.get('/reviews', me.getMyReviews);

// Wallet
router.get('/wallet', me.getWallet);

// Notifications
router.get('/notifications', me.getNotifications);
router.patch('/notifications/read-all', me.markAllRead);
router.patch('/notifications/:id/read', me.markRead);

// Coupons
router.post('/coupons/validate', me.validateCoupon);

module.exports = router;
