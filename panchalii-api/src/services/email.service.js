const nodemailer = require('nodemailer');
const config = require('../config/config');

let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.port === 465,
      auth: { user: config.email.user, pass: config.email.pass },
    });
  }
  return transporter;
};

const isConfigured = () => Boolean(config.email.user && config.email.pass);

// Without SMTP credentials: fail loudly in production, log to the console in development.
const assertConfiguredOrStub = (logLine) => {
  if (isConfigured()) return false;
  if (config.env === 'production') throw new Error('Email delivery is not configured (SMTP_USER / SMTP_PASS)');
  console.info(`[Email stub] ${logLine}`);
  return true;
};

const send = async ({ to, subject, html }) => {
  if (assertConfiguredOrStub(`to=${to} subject="${subject}"`)) return;
  const t = getTransporter();
  await t.sendMail({ from: `"Panchalii" <${config.email.from}>`, to, subject, html });
};

const sendOtp = async (email, otp) => {
  if (assertConfiguredOrStub(`OTP ${otp} for ${email}`)) return;
  await send({
    to: email,
    subject: 'Your Panchalii OTP',
    html: `<p>Your OTP is <strong>${otp}</strong>. It expires in 10 minutes.</p>`,
  });
};

const sendOrderConfirmation = async (email, order) => {
  await send({
    to: email,
    subject: `Order Confirmed — ${order.orderNumber}`,
    html: `<p>Thank you for your order <strong>${order.orderNumber}</strong>! Total: ₹${order.total}. We will notify you when it ships.</p>`,
  });
};

const sendPasswordReset = async (email, resetToken) => {
  const link = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}`;
  if (assertConfiguredOrStub(`Password reset link for ${email}: ${link}`)) return;
  await send({
    to: email,
    subject: 'Reset your Panchalii password',
    html: `<p>Click <a href="${link}">here</a> to reset your password. This link expires in 15 minutes.</p>`,
  });
};

module.exports = { send, sendOtp, sendOrderConfirmation, sendPasswordReset };
