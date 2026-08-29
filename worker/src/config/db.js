const { Pool } = require('pg');
const { DATABASE_URL } = require('./env');

const dbPool = new Pool({
  connectionString: DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: DATABASE_URL.includes('localhost') || DATABASE_URL.includes('127.0.0.1')
    ? false
    : { rejectUnauthorized: false },
});

dbPool.on('error', (err) => {
  console.error('[Worker DB] Unexpected error on idle client:', err);
});

module.exports = {
  dbPool,
  query: (text, params) => dbPool.query(text, params),
};
