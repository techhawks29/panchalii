const httpStatus = require('http-status');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/user.model');
const Token = require('../models/token.model');
const tokenService = require('../services/token.service');
const otpService = require('../services/otp.service');
const emailService = require('../services/email.service');
const smsService = require('../services/sms.service');
const ApiError = require('../utils/ApiError');
const config = require('../config/config');

const googleClient = new OAuth2Client(config.google.clientId);

const normaliseEmail = (email) => (typeof email === 'string' && email.trim() ? email.trim().toLowerCase() : undefined);
const normalisePhone = (phone) => (typeof phone === 'string' && phone.replace(/\D/g, '') ? phone.replace(/\D/g, '') : undefined);

const normaliseIdentifier = (value) => (typeof value === 'string' && value.includes('@') ? normaliseEmail(value) : normalisePhone(value));

// POST /v1/public/auth/register
// The code is sent before anything is saved, so a failed send never leaves a half-made account behind.
const register = async (req, res, next) => {
  try {
    const { name, password, countryCode = '+91' } = req.body;
    const email = normaliseEmail(req.body.email);
    const phone = normalisePhone(req.body.phone);
    if (!name || !password) throw new ApiError(httpStatus.BAD_REQUEST, 'Name and password are required');
    if (!email && !phone) throw new ApiError(httpStatus.BAD_REQUEST, 'Email or phone is required');

    // Only verified accounts block sign-up; unverified ones are leftovers from abandoned attempts.
    if (email && await User.exists({ email, isVerified: true })) throw new ApiError(httpStatus.CONFLICT, 'Email already registered');
    if (phone && await User.exists({ phone, isVerified: true })) throw new ApiError(httpStatus.CONFLICT, 'Phone already registered');

    const identifier = email || phone;
    const otp = await otpService.createOtp(identifier, 'register');
    try {
      if (email) await emailService.sendOtp(email, otp);
      else await smsService.sendOtp(`${countryCode}${phone}`, otp);
    } catch (sendErr) {
      await otpService.discardOtp(identifier, 'register');
      console.error('Registration code delivery failed:', sendErr.message);
      throw new ApiError(httpStatus.SERVICE_UNAVAILABLE, "We couldn't send your verification code. Please try again in a moment.");
    }

    // Code delivered: create the account, or refresh a leftover unverified one with the new details.
    const match = [email && { email }, phone && { phone }].filter(Boolean);
    let user = await User.findOne({ isVerified: false, $or: match });
    if (user) {
      Object.assign(user, { name, email, phone, countryCode, passwordHash: password });
    } else {
      user = new User({ name, email, phone, countryCode, passwordHash: password });
    }
    await user.save();

    res.status(httpStatus.CREATED).json({ success: true, message: 'OTP sent. Please verify your account.', userId: user._id });
  } catch (err) {
    if (err.code === 11000) return next(new ApiError(httpStatus.CONFLICT, 'That email or phone is already linked to another account'));
    next(err);
  }
};

// POST /v1/public/auth/verify-otp
const verifyRegistrationOtp = async (req, res, next) => {
  try {
    const identifier = normaliseIdentifier(req.body.identifier);
    const { otp } = req.body;
    const valid = await otpService.verifyOtp(identifier, otp, 'register');
    if (!valid) throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid or expired OTP');
    const user = await User.findOneAndUpdate(
      { $or: [{ email: identifier }, { phone: identifier }] },
      { isVerified: true },
      { new: true }
    );
    if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    const tokens = await tokenService.generateAuthTokens(user);
    res.json({ success: true, user, tokens });
  } catch (err) { next(err); }
};

// POST /v1/public/auth/login
const loginEmail = async (req, res, next) => {
  try {
    const { password } = req.body;
    const user = await User.findOne({ email: normaliseEmail(req.body.email) }).select('+passwordHash');
    if (!user || !(await user.matchPassword(password))) throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid credentials');
    if (!user.isActive) throw new ApiError(httpStatus.FORBIDDEN, 'Account is deactivated');
    await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });
    const tokens = await tokenService.generateAuthTokens(user);
    res.json({ success: true, user, tokens });
  } catch (err) { next(err); }
};

// POST /v1/public/auth/login-phone
const loginPhone = async (req, res, next) => {
  try {
    const { phone, password, countryCode = '+91' } = req.body;
    const user = await User.findOne({ phone: normalisePhone(phone) }).select('+passwordHash');
    if (!user || !(await user.matchPassword(password))) throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid credentials');
    if (!user.isActive) throw new ApiError(httpStatus.FORBIDDEN, 'Account is deactivated');
    const tokens = await tokenService.generateAuthTokens(user);
    res.json({ success: true, user, tokens });
  } catch (err) { next(err); }
};

// POST /v1/public/auth/send-otp
const sendLoginOtp = async (req, res, next) => {
  try {
    const { type = 'email' } = req.body;
    const identifier = type === 'email' ? normaliseEmail(req.body.identifier) : normalisePhone(req.body.identifier);
    const user = type === 'email'
      ? await User.findOne({ email: identifier })
      : await User.findOne({ phone: identifier });
    if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'No account found');
    const otp = await otpService.createOtp(identifier, 'login');
    try {
      if (type === 'email') await emailService.sendOtp(identifier, otp);
      else await smsService.sendOtp(`${user.countryCode || '+91'}${identifier}`, otp);
    } catch (sendErr) {
      await otpService.discardOtp(identifier, 'login');
      console.error('Login code delivery failed:', sendErr.message);
      throw new ApiError(httpStatus.SERVICE_UNAVAILABLE, "We couldn't send your sign-in code. Please try again in a moment.");
    }
    res.json({ success: true, message: 'OTP sent' });
  } catch (err) { next(err); }
};

// POST /v1/public/auth/verify-login-otp
const verifyLoginOtp = async (req, res, next) => {
  try {
    const identifier = normaliseIdentifier(req.body.identifier);
    const { otp } = req.body;
    const valid = await otpService.verifyOtp(identifier, otp, 'login');
    if (!valid) throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid or expired OTP');
    const user = await User.findOne({ $or: [{ email: identifier }, { phone: identifier }] });
    if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    if (!user.isActive) throw new ApiError(httpStatus.FORBIDDEN, 'Account is deactivated');
    const tokens = await tokenService.generateAuthTokens(user);
    res.json({ success: true, user, tokens });
  } catch (err) { next(err); }
};

// POST /v1/public/auth/google
const googleLogin = async (req, res, next) => {
  try {
    const { idToken } = req.body;
    const ticket = await googleClient.verifyIdToken({ idToken, audience: config.google.clientId });
    const { email, name, picture, sub: googleId } = ticket.getPayload();
    let user = await User.findOne({ $or: [{ googleId }, { email }] });
    if (!user) {
      user = await User.create({ name, email, googleId, profileImage: picture, isVerified: true });
    } else if (!user.googleId) {
      user.googleId = googleId;
      await user.save();
    }
    if (!user.isActive) throw new ApiError(httpStatus.FORBIDDEN, 'Account is deactivated');
    const tokens = await tokenService.generateAuthTokens(user);
    res.json({ success: true, user, tokens });
  } catch (err) { next(err); }
};

// POST /v1/public/auth/forgot-password
const forgotPassword = async (req, res, next) => {
  try {
    const email = normaliseEmail(req.body.email);
    const user = email && await User.findOne({ email });
    if (user) {
      const resetToken = await tokenService.generateResetPasswordToken(user);
      await emailService.sendPasswordReset(email, resetToken);
    }
    // Same answer either way, so this can't be used to find out which emails have accounts
    res.json({ success: true, message: 'If an account exists for that email, a reset link is on its way.' });
  } catch (err) { next(err); }
};

// POST /v1/public/auth/reset-password
const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    const tokenDoc = await tokenService.verifyToken(token, 'resetPassword');
    const user = await User.findById(tokenDoc.user);
    if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    if (typeof password !== 'string' || password.length < 8) throw new ApiError(httpStatus.BAD_REQUEST, 'Password must be at least 8 characters');
    user.passwordHash = password;
    await user.save();
    // Sign out every device: drop reset links and refresh tokens issued before the reset
    await Token.deleteMany({ user: user._id, type: { $in: ['resetPassword', 'refresh'] } });
    res.json({ success: true, message: 'Password reset successfully' });
  } catch (err) { next(err); }
};

// POST /v1/public/auth/refresh-tokens
const refreshTokens = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const tokenDoc = await tokenService.verifyToken(refreshToken, 'refresh');
    const user = await User.findById(tokenDoc.user);
    if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    await tokenDoc.deleteOne();
    const tokens = await tokenService.generateAuthTokens(user);
    res.json({ success: true, tokens });
  } catch (err) { next(err); }
};

// POST /v1/public/auth/logout
const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await Token.deleteOne({ token: refreshToken, type: 'refresh' });
    }
    res.json({ success: true, message: 'Logged out' });
  } catch (err) { next(err); }
};

module.exports = {
  register, verifyRegistrationOtp, loginEmail, loginPhone,
  sendLoginOtp, verifyLoginOtp, googleLogin,
  forgotPassword, resetPassword, refreshTokens, logout,
};
