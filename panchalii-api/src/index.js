const app = require('./app');
const config = require('./config/config');
const { connect: connectMongo } = require('./config/mongoose');
const { connect: connectRedis } = require('./config/redis');

const start = async () => {
  await connectMongo();

  // Redis is used for caching only — start the server even if it's unavailable
  connectRedis().catch((err) => console.warn('Redis unavailable, running without cache:', err.message));

  const port = process.env.PORT || config.port;
  app.listen(port, () => {
    console.log(`Panchalii API running on port ${port} [${config.env}]`);
  });
};

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
