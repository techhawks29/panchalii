const mongoose = require('mongoose');
const config = require('./config');

const connect = async () => {
  await mongoose.connect(config.mongoose.url, {
    serverSelectionTimeoutMS: 5000,
  });
  console.log('MongoDB connected');
};

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

module.exports = { connect };
