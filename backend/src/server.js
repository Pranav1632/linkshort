const app = require('./app');
const { PORT } = require('./config/env');
const { connectRedis } = require('./config/redis');
const { checkDbHealth } = require('./config/db');

async function startServer() {
  // Connect to Redis
  try {
    await connectRedis();
  } catch (err) {
    console.error('Failed to initialize Redis connection:', err.message);
  }

  // Check initial database connectivity
  try {
    await checkDbHealth();
    console.log('Connected to Supabase PostgreSQL successfully');
  } catch (err) {
    console.error('Initial DB Connection Warning:', err.message);
  }

  app.listen(PORT, () => {
    console.log(`LinkShort Server running on port ${PORT}`);
  });
}

module.exports = { startServer };
