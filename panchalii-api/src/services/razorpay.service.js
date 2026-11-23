const Razorpay = require('razorpay');
const crypto = require('crypto');
const httpStatus = require('http-status');
const config = require('../config/config');
const ApiError = require('../utils/ApiError');

let rzp = null;

const getInstance = () => {
  if (!config.razorpay.keyId || !config.razorpay.keySecret) {
    // Without this, the Razorpay SDK throws a cryptic "key_id is mandatory" error at checkout
    throw new ApiError(httpStatus.SERVICE_UNAVAILABLE, 'Online payments are not set up yet. Please try again later.');
  }
  if (!rzp) {
    rzp = new Razorpay({ key_id: config.razorpay.keyId, key_secret: config.razorpay.keySecret });
  }
  return rzp;
};

const createOrder = async ({ amount, currency = 'INR', receipt, notes = {} }) => {
  const instance = getInstance();
  return instance.orders.create({ amount: Math.round(amount * 100), currency, receipt, notes });
};

const hmacMatches = (secret, payload, signature) => {
  if (!secret || !payload || typeof signature !== 'string') return false;
  const expected = Buffer.from(crypto.createHmac('sha256', secret).update(payload).digest('hex'));
  const given = Buffer.from(signature);
  return expected.length === given.length && crypto.timingSafeEqual(expected, given);
};

const verifySignature = (razorpayOrderId, razorpayPaymentId, razorpaySignature) =>
  hmacMatches(config.razorpay.keySecret, `${razorpayOrderId}|${razorpayPaymentId}`, razorpaySignature);

// Webhooks are signed with the webhook secret set in the Razorpay dashboard, not the API key secret
const verifyWebhookSignature = (rawBody, signature) =>
  hmacMatches(config.razorpay.webhookSecret, rawBody, signature);

module.exports = { createOrder, verifySignature, verifyWebhookSignature };
