const passport = require('passport');
const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');

const authenticate = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user) => {
    if (err) return next(err);
    if (!user) return next(new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate'));
    req.user = user;
    next();
  })(req, res, next);
};

// Attach req.user when a valid token is sent; guests pass through. An invalid
// token is rejected (401) so the client refreshes it instead of silently
// acting as a guest.
const optionalAuth = (req, res, next) => {
  if (!req.headers.authorization) return next();
  passport.authenticate('jwt', { session: false }, (err, user) => {
    if (err) return next(err);
    if (!user) return next(new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate'));
    req.user = user;
    next();
  })(req, res, next);
};

const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    return next(new ApiError(httpStatus.FORBIDDEN, 'Forbidden'));
  }
  next();
};

module.exports = { authenticate, optionalAuth, requireRole };
