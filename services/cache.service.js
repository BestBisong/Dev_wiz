const redis = require('redis');
const memoryCache = require('memory-cache');
const { promisify } = require('util');

const isProduction = process.env.NODE_ENV === 'production';
let redisClient;

if (isProduction) {
  redisClient = redis.createClient({
    url: process.env.REDIS_URL
  });
  
  redisClient.on('error', (err) => {
    console.error('Redis error:', err);
  });
}

const cache = {
  async get(key) {
    if (isProduction) {
      const getAsync = promisify(redisClient.get).bind(redisClient);
      return await getAsync(key);
    }
    return memoryCache.get(key);
  },

  async set(key, value, duration) {
    if (isProduction) {
      const setAsync = promisify(redisClient.set).bind(redisClient);
      return await setAsync(key, value, 'EX', duration);
    }
    return memoryCache.put(key, value, duration * 1000);
  },

  async del(key) {
    if (isProduction) {
      const delAsync = promisify(redisClient.del).bind(redisClient);
      return await delAsync(key);
    }
    return memoryCache.del(key);
  }
};

module.exports = cache;