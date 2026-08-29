const { Pool } = require('pg');
const { DATABASE_URL } = require('./env');

const dbPool = new Pool({
  connectionString: DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

dbPool.on('error', (err) => {
  console.error('Unexpected error on idle database client', err);
});

async function checkDbHealth() {
  const client = await dbPool.connect();
  try {
    await client.query('SELECT 1');
    return true;
  } finally {
    client.release();
  }
}

module.exports = {
  dbPool,
  query: (text, params) => dbPool.query(text, params),
  checkDbHealth,
};
