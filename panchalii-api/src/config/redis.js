const { createClient } = require('redis');
const config = require('./config');

let client = null;

const connect = async () => {
  client = createClient({ url: config.redis.url });
  client.on('error', (err) => console.error('Redis error:', err));
  await client.connect();
  console.log('Redis connected');
  return client;
};

const getClient = () => {
  if (!client) throw new Error('Redis not initialised — call connect() first');
  return client;
};

const isReady = () => client && client.isReady;

const set = async (key, value, ttlSeconds) => {
  if (!isReady()) return;
  await client.set(key, JSON.stringify(value), { EX: ttlSeconds });
};

const get = async (key) => {
  if (!isReady()) return null;
  const raw = await client.get(key);
  return raw ? JSON.parse(raw) : null;
};

const del = async (...keys) => {
  if (!isReady() || !keys.length) return;
  await client.del(keys);
};

const delByPattern = async (pattern) => {
  if (!isReady()) return;
  const keys = await client.keys(pattern);
  if (keys.length) await client.del(keys);
};

module.exports = { connect, getClient, set, get, del, delByPattern };
