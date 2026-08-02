const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL }
    : {
        host: process.env.DB_HOST || '127.0.0.1',
        port: Number(process.env.DB_PORT || 5432),
        database: process.env.DB_NAME || 'sepoto_db',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
      }
);

pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL Database');
  // Auto-migration untuk kolom original_filename pada tabel photos
  pool.query('ALTER TABLE photos ADD COLUMN IF NOT EXISTS original_filename VARCHAR(255);')
    .catch((err) => console.error('Migration Column Warning:', err.message));

  // Auto-migration untuk Unique Index bib_number peserta
  pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_unique_bib 
    ON users (bib_number) 
    WHERE bib_number IS NOT NULL AND role = 'user';
  `).catch((err) => console.error('Migration Index Warning:', err.message));
});

pool.on('error', (err) => {
  console.error('❌ Unexpected Error on Idle PostgreSQL Client:', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
