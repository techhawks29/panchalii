const express = require('express');
const authRoute = require('./auth.route');
const publicRoute = require('./public.route');
const meRoute = require('./me.route');
const adminRoute = require('./admin.route');
const webhookController = require('../../controllers/webhook.controller');

const router = express.Router();

router.use('/public/auth', authRoute);
router.use('/public', publicRoute);
router.use('/me', meRoute);
router.use('/admin', adminRoute);

// Razorpay webhook — raw body needed for HMAC verification (set in app.js)
router.post('/webhook/razorpay', webhookController.handleRazorpayWebhook);

module.exports = router;
