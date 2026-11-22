const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { xss } = require('express-xss-sanitizer');
const mongoSanitize = require('express-mongo-sanitize');
const compression = require('compression');
const morgan = require('morgan');
const passport = require('passport');
const httpStatus = require('http-status');

const config = require('./config/config');
const { jwtStrategy } = require('./config/passport');
const routes = require('./routes/v1');
const { errorConverter, errorHandler } = require('./middlewares/error');
const ApiError = require('./utils/ApiError');

const app = express();

app.disable('x-powered-by');

// HTTP logging
if (config.env !== 'test') {
  app.use(morgan(config.env === 'development' ? 'dev' : 'combined'));
}

// Security headers
app.use(helmet());

// Public static assets (product images in development); served before CORS so image loads work cross-origin
app.use('/static', express.static(require('path').join(__dirname, '../public'), {
  maxAge: '7d',
  setHeaders: (res) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    // Flutter web fetches images via XHR, which needs CORS even for public files
    res.setHeader('Access-Control-Allow-Origin', '*');
  },
}));

// CORS
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || config.allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// Raw body capture for Razorpay webhook HMAC verification
app.use((req, res, next) => {
  if (req.originalUrl.includes('/webhook/razorpay')) {
    let data = '';
    req.on('data', (chunk) => { data += chunk; });
    req.on('end', () => { req.rawBody = data; next(); });
  } else {
    next();
  }
});

// Body parsing
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Security sanitization
app.use(xss());
app.use(mongoSanitize());

// Compression
app.use(compression());

// Passport JWT
passport.use(jwtStrategy);
app.use(passport.initialize());

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', env: config.env }));

// API v1 routes
app.use('/v1', routes);

// 404
app.use((req, res, next) => next(new ApiError(httpStatus.NOT_FOUND, 'Route not found')));

// Error handling
app.use(errorConverter);
app.use(errorHandler);

module.exports = app;
