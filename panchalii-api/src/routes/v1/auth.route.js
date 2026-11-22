const express = require('express');
const { otpLimiter, loginLimiter } = require('../../middlewares/rateLimiter');
const auth = require('../../controllers/auth.controller');
const router = express.Router();

router.post('/register', auth.register);
router.post('/verify-otp', auth.verifyRegistrationOtp);
router.post('/login', loginLimiter, auth.loginEmail);
router.post('/login-phone', loginLimiter, auth.loginPhone);
router.post('/send-otp', otpLimiter, auth.sendLoginOtp);
router.post('/verify-login-otp', auth.verifyLoginOtp);
router.post('/google', auth.googleLogin);
router.post('/forgot-password', otpLimiter, auth.forgotPassword);
router.post('/reset-password', auth.resetPassword);
router.post('/refresh-tokens', auth.refreshTokens);
router.post('/logout', auth.logout);

module.exports = router;
