const { Pool } = require('pg');

let pool = null;

const isDbEnabled = () => !!process.env.DATABASE_URL;

const getPool = () => {
  if (!isDbEnabled()) return null;
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.PG_SSL === 'true'
        ? { rejectUnauthorized: false }
        : (process.env.DATABASE_URL?.includes('sslmode=require')
          ? { rejectUnauthorized: false }
          : false)
    });
  }
  return pool;
};

const query = async (text, params = []) => {
  const activePool = getPool();
  if (!activePool) {
    throw new Error('Database not configured');
  }
  return activePool.query(text, params);
};

module.exports = { isDbEnabled, getPool, query };
