const httpStatus = require('http-status');
const Order = require('../models/order.model');
const razorpayService = require('../services/razorpay.service');

const handleRazorpayWebhook = async (req, res) => {
  // Always respond 200 immediately so Razorpay doesn't retry
  res.status(200).json({ received: true });

  const signature = req.headers['x-razorpay-signature'];
  const rawBody = req.rawBody;

  if (!razorpayService.verifyWebhookSignature(rawBody, signature)) {
    console.warn('[Webhook] Invalid Razorpay signature');
    return;
  }

  const { event, payload } = req.body;

  try {
    if (event === 'payment.captured' || event === 'order.paid') {
      const razorpayOrderId = payload?.order?.entity?.id || payload?.payment?.entity?.order_id;
      const razorpayPaymentId = payload?.payment?.entity?.id;
      if (razorpayOrderId) {
        await Order.findOneAndUpdate(
          { 'payment.razorpayOrderId': razorpayOrderId, 'payment.status': 'pending' },
          {
            status: 'confirmed',
            'payment.status': 'paid',
            'payment.razorpayPaymentId': razorpayPaymentId || '',
            'payment.paidAt': new Date(),
          }
        );
      }
    } else if (event === 'payment.failed') {
      const razorpayOrderId = payload?.payment?.entity?.order_id;
      if (razorpayOrderId) {
        await Order.findOneAndUpdate(
          { 'payment.razorpayOrderId': razorpayOrderId },
          { 'payment.status': 'failed', status: 'pending' }
        );
      }
    }
  } catch (err) {
    console.error('[Webhook] Error processing event:', event, err.message);
  }
};

module.exports = { handleRazorpayWebhook };
