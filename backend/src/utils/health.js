const mongoose = require('mongoose');
const Redis = require('ioredis');
const logger = require('./logger');

/**
 * Check MongoDB connection health
 * @returns {Promise<Object>} Health status
 */
const checkMongoHealth = async () => {
  try {
    const status = mongoose.connection.readyState;
    const statusMap = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };

    return {
      status: statusMap[status] || 'unknown',
      healthy: status === 1,
      latency: await measureMongoLatency()
    };
  } catch (error) {
    logger.error('MongoDB health check failed:', error);
    return {
      status: 'error',
      healthy: false,
      error: error.message
    };
  }
};

/**
 * Check Redis connection health
 * @returns {Promise<Object>} Health status
 */
const checkRedisHealth = async () => {
  const redis = new Redis(process.env.REDIS_URL);
  try {
    const startTime = Date.now();
    await redis.ping();
    const latency = Date.now() - startTime;

    return {
      status: 'connected',
      healthy: true,
      latency
    };
  } catch (error) {
    logger.error('Redis health check failed:', error);
    return {
      status: 'error',
      healthy: false,
      error: error.message
    };
  } finally {
    await redis.quit();
  }
};

/**
 * Measure MongoDB operation latency
 * @returns {Promise<number>} Latency in milliseconds
 */
const measureMongoLatency = async () => {
  const startTime = Date.now();
  await mongoose.connection.db.admin().ping();
  return Date.now() - startTime;
};

/**
 * Get system health metrics
 * @returns {Promise<Object>} System health metrics
 */
const getHealthMetrics = async () => {
  const [mongoHealth, redisHealth] = await Promise.all([
    checkMongoHealth(),
    checkRedisHealth()
  ]);

  const systemHealth = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    services: {
      mongodb: mongoHealth,
      redis: redisHealth
    }
  };

  // Overall status is healthy only if all services are healthy
  if (!mongoHealth.healthy || !redisHealth.healthy) {
    systemHealth.status = 'degraded';
  }

  return systemHealth;
};

module.exports = {
  getHealthMetrics,
  checkMongoHealth,
  checkRedisHealth
}; 