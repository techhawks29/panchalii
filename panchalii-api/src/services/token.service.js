const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const moment = require('moment');
const httpStatus = require('http-status');
const config = require('../config/config');
const ApiError = require('../utils/ApiError');
const Token = require('../models/token.model');

const generateToken = (userId, expires, type) => {
  // jti makes every token unique; without it two sign-ins in the same second got identical tokens
  const payload = { sub: userId, iat: moment().unix(), exp: expires.unix(), type, jti: crypto.randomUUID() };
  return jwt.sign(payload, config.jwt.secret);
};

const saveToken = async (token, userId, expires, type) => {
  return Token.create({ user: userId, token, type, expires: expires.toDate() });
};

const generateAuthTokens = async (user) => {
  const accessExpires = moment().add(config.jwt.accessExpirationMinutes, 'minutes');
  const refreshExpires = moment().add(config.jwt.refreshExpirationDays, 'days');

  const accessToken = generateToken(user._id || user.id, accessExpires, 'access');
  const refreshToken = generateToken(user._id || user.id, refreshExpires, 'refresh');

  await saveToken(refreshToken, user._id || user.id, refreshExpires, 'refresh');

  return {
    access: { token: accessToken, expires: accessExpires.toDate() },
    refresh: { token: refreshToken, expires: refreshExpires.toDate() },
  };
};

const verifyToken = async (token, type) => {
  let payload;
  try {
    payload = jwt.verify(token, config.jwt.secret);
  } catch {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Your session has expired. Please sign in again.');
  }
  const tokenDoc = await Token.findOne({ token, type, user: payload.sub, blacklisted: false });
  if (!tokenDoc) throw new ApiError(httpStatus.UNAUTHORIZED, 'Your session has expired. Please sign in again.');
  return tokenDoc;
};

const generateResetPasswordToken = async (user) => {
  const expires = moment().add(config.jwt.resetPasswordExpirationMinutes, 'minutes');
  const token = generateToken(user._id, expires, 'resetPassword');
  await Token.deleteMany({ user: user._id, type: 'resetPassword' });
  await saveToken(token, user._id, expires, 'resetPassword');
  return token;
};

module.exports = { generateAuthTokens, verifyToken, generateResetPasswordToken, saveToken };
