module.exports = {
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  DATABASE_URL: process.env.DATABASE_URL || '',
  NODE_ENV: process.env.NODE_ENV || 'development',
};
