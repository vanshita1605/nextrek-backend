// src/utils/cache.js
const redisClient = require('../config/redis');

const cacheKeys = {
  city: (cityId) => `city:${cityId}`,
  cities: () => 'cities:all',
  tourist: (placeId) => `tourist:${placeId}`,
  hotel: (hotelId) => `hotel:${hotelId}`,
  food: (foodId) => `food:${foodId}`,
  trip: (tripId) => `trip:${tripId}`,
  user: (userId) => `user:${userId}`,
  weather: (cityId) => `weather:${cityId}`,
};

const cacheGet = async (key) => {
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
};

const cacheSet = async (key, value, expirySeconds = 3600) => {
  try {
    await redisClient.setEx(key, expirySeconds, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error('Cache set error:', error);
    return false;
  }
};

const cacheDel = async (key) => {
  try {
    await redisClient.del(key);
    return true;
  } catch (error) {
    console.error('Cache delete error:', error);
    return false;
  }
};

const cacheClear = async (pattern) => {
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
    return true;
  } catch (error) {
    console.error('Cache clear error:', error);
    return false;
  }
};

module.exports = {
  cacheKeys,
  cacheGet,
  cacheSet,
  cacheDel,
  cacheClear,
};
