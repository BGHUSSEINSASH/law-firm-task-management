require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { getPool, isDbEnabled } = require('../db');

const migrationsDir = path.join(__dirname, '..', 'migrations');

const ensureMigrationsTable = async (client) => {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      filename TEXT UNIQUE NOT NULL,
      applied_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);
};

const runMigrations = async (reset = false) => {
  if (!isDbEnabled()) {
    console.error('DATABASE_URL غير مضبوط.');
    process.exit(1);
  }

  const pool = getPool();
  const client = await pool.connect();

  try {
    await ensureMigrationsTable(client);

    if (reset) {
      await client.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
      await ensureMigrationsTable(client);
    }

    const applied = await client.query('SELECT filename FROM schema_migrations');
    const appliedSet = new Set(applied.rows.map(r => r.filename));

    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      if (appliedSet.has(file)) continue;
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations(filename) VALUES($1)', [file]);
      await client.query('COMMIT');
      console.log(`Applied ${file}`);
    }
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    process.exit(1);
  } finally {
    client.release();
  }
};

const reset = process.argv.includes('--reset');
runMigrations(reset);
