const redis = require('../config/redis');

const cacheMiddleware = (ttlSeconds = 300, keyFn = null) => async (req, res, next) => {
  const cacheKey = keyFn ? keyFn(req) : `cache:${req.originalUrl}`;
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.json({ ...cached, fromCache: true });
    }
    // Monkey-patch res.json to store result in Redis before sending
    const originalJson = res.json.bind(res);
    res.json = async (data) => {
      if (res.statusCode === 200) {
        await redis.set(cacheKey, data, ttlSeconds).catch(() => {});
      }
      return originalJson(data);
    };
    next();
  } catch {
    next();
  }
};

module.exports = { cacheMiddleware };
