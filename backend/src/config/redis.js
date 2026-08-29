const redis = require('redis');
const { REDIS_URL } = require('./env');

const redisClient = redis.createClient({ url: REDIS_URL });

redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

async function connectRedis() {
  if (!redisClient.isOpen) {
    await redisClient.connect();
    console.log('Connected to Redis successfully');
  }
  return redisClient;
}

async function checkRedisHealth() {
  const reply = await redisClient.ping();
  return reply === 'PONG';
}

module.exports = {
  redisClient,
  connectRedis,
  checkRedisHealth,
};
