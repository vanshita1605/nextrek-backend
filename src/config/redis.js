// src/config/redis.js
const redis = require('redis');

// If you're developing locally and don't want Redis noise, set REDIS_FORCE=true to force connection.
const isRedisConfigured = !!(process.env.REDIS_URL || process.env.REDIS_HOST || process.env.REDIS_PORT);
const isLocalRedis = (process.env.REDIS_URL && process.env.REDIS_URL.includes('localhost')) ||
  (process.env.REDIS_HOST && ['localhost', '127.0.0.1', '::1'].includes(process.env.REDIS_HOST));
const forceRedis = String(process.env.REDIS_FORCE || '').toLowerCase() === 'true';

if (!isRedisConfigured || (process.env.NODE_ENV === 'development' && isLocalRedis && !forceRedis)) {
  console.warn('Redis disabled in development — exporting noop client. Set REDIS_FORCE=true to enable connecting to local Redis.');

  const noop = {
    on: () => {},
    connect: async () => {},
    quit: async (cb) => { if (typeof cb === 'function') cb(); return Promise.resolve(); },
    get: async () => null,
    setEx: async () => 'OK',
    set: async () => 'OK',
    del: async () => 0,
    keys: async () => [],
  };

  module.exports = noop;
} else {
  const options = {};

  if (process.env.REDIS_URL) {
    options.url = process.env.REDIS_URL;
  } else {
    options.socket = {
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: Number(process.env.REDIS_PORT || 6379),
    };
    if (process.env.REDIS_PASSWORD) options.password = process.env.REDIS_PASSWORD;
  }

  const redisClient = redis.createClient(options);

  redisClient.on('error', (err) => console.error('Redis Client Error', err));
  redisClient.on('connect', () => console.log('Redis Client Connected'));

  // Connect but don't let an unhandled rejection crash the process — log and continue
  redisClient.connect().catch(err => console.error('Redis Connection Error:', err));

  module.exports = redisClient;
}
