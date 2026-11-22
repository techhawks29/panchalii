const app = require('./app');
const config = require('./config/config');
const { connect: connectMongo } = require('./config/mongoose');
const { connect: connectRedis } = require('./config/redis');

const start = async () => {
  await connectMongo();
  await connectRedis();

  app.listen(config.port, () => {
    console.log(`Panchalii API running on port ${config.port} [${config.env}]`);
  });
};

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
