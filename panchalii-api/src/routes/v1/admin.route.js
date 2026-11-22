const express = require('express');
const multer = require('multer');
const { authenticate, requireRole } = require('../../middlewares/auth');
const admin = require('../../controllers/admin.controller');
const router = express.Router();

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.use(authenticate, requireRole('admin'));

// Analytics
router.get('/analytics', admin.getAnalytics);

// Products
router.get('/products', admin.getProducts);
router.post('/products', admin.createProduct);
router.patch('/products/:id', admin.updateProduct);
router.delete('/products/:id', admin.deleteProduct);
router.post('/upload', upload.single('image'), admin.uploadImage);

// Categories
router.get('/categories', admin.getCategories);
router.post('/categories', admin.createCategory);
router.patch('/categories/:id', admin.updateCategory);
router.delete('/categories/:id', admin.deleteCategory);

// Orders
router.get('/orders', admin.getOrders);
router.get('/orders/:id', admin.getOrderById);
router.patch('/orders/:id/status', admin.updateOrderStatus);

// Users
router.get('/users', admin.getUsers);
router.patch('/users/:id/toggle', admin.toggleUserStatus);

// Banners
router.get('/banners', admin.getBanners);
router.post('/banners', admin.createBanner);
router.patch('/banners/:id', admin.updateBanner);
router.delete('/banners/:id', admin.deleteBanner);

// Coupons
router.get('/coupons', admin.getCoupons);
router.post('/coupons', admin.createCoupon);
router.patch('/coupons/:id', admin.updateCoupon);
router.delete('/coupons/:id', admin.deleteCoupon);

// Reviews
router.get('/reviews/pending', admin.getPendingReviews);
router.patch('/reviews/:id/approve', admin.approveReview);

module.exports = router;
