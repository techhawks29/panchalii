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

const verifySignature = (razorpayOrderId, razorpayPaymentId, razorpaySignature) => {
  const body = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expected = crypto
    .createHmac('sha256', config.razorpay.keySecret)
    .update(body)
    .digest('hex');
  return expected === razorpaySignature;
};

const verifyWebhookSignature = (rawBody, signature) => {
  const expected = crypto
    .createHmac('sha256', config.razorpay.keySecret)
    .update(rawBody)
    .digest('hex');
  return expected === signature;
};

module.exports = { createOrder, verifySignature, verifyWebhookSignature };
