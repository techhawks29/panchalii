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

const set = async (key, value, ttlSeconds) => {
  const c = getClient();
  await c.set(key, JSON.stringify(value), { EX: ttlSeconds });
};

const get = async (key) => {
  const c = getClient();
  const raw = await c.get(key);
  return raw ? JSON.parse(raw) : null;
};

const del = async (...keys) => {
  const c = getClient();
  if (keys.length) await c.del(keys);
};

const delByPattern = async (pattern) => {
  const c = getClient();
  const keys = await c.keys(pattern);
  if (keys.length) await c.del(keys);
};

module.exports = { connect, getClient, set, get, del, delByPattern };
