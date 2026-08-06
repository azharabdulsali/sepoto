const { Pool } = require('pg');
const path = require('path');
const bcrypt = require('bcrypt');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { query } = require('./db');

const SALT_ROUNDS = 10;

async function createDatabaseIfNotExists() {
  const adminPool = new Pool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 5432),
    database: 'postgres', // Connect to default postgres DB first
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  });

  try {
    const targetDbName = process.env.DB_NAME || 'sepoto_db';
    const checkRes = await adminPool.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [targetDbName]
    );

    if (checkRes.rows.length === 0) {
      console.log(`🔨 Database "${targetDbName}" not found. Creating automatically...`);
      await adminPool.query(`CREATE DATABASE "${targetDbName}";`);
      console.log(`✨ Database "${targetDbName}" created successfully!`);
    }
  } catch (err) {
    console.error('⚠️ Notice on DB Check:', err.message);
  } finally {
    await adminPool.end();
  }
}

async function initDb() {
  try {
    await createDatabaseIfNotExists();
    console.log('🔄 Initializing database schema...');

    // 1. Tabel events
    await query(`
      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        event_date DATE NOT NULL,
        logo_url TEXT,
        qr_code_url TEXT NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Tabel users (dengan kolom username & password_hash untuk admin/fotografer)
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        event_id INT REFERENCES events(id) ON DELETE SET NULL,
        name VARCHAR(255) NOT NULL,
        username VARCHAR(100) UNIQUE,
        password_hash TEXT,
        bib_number VARCHAR(50),
        role VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Migrasi: Tambah kolom username & password_hash jika belum ada (backward-compatible)
    await query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='username') THEN
          ALTER TABLE users ADD COLUMN username VARCHAR(100) UNIQUE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='password_hash') THEN
          ALTER TABLE users ADD COLUMN password_hash TEXT;
        END IF;
      END
      $$;
    `);

    // Migrasi: Tambah kolom location & banner_url pada tabel events jika belum ada
    await query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='location') THEN
          ALTER TABLE events ADD COLUMN location TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='banner_url') THEN
          ALTER TABLE events ADD COLUMN banner_url TEXT;
        END IF;
      END
      $$;
    `);

    // Drop indeks lama (global) & buat Partial Unique Index per Event untuk Nomor BIB Peserta
    await query(`DROP INDEX IF EXISTS public.idx_users_unique_bib CASCADE;`);
    await query(`DROP INDEX IF EXISTS idx_users_unique_bib CASCADE;`);
    await query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_users_unique_event_bib 
      ON users (event_id, bib_number) 
      WHERE bib_number IS NOT NULL AND role = 'user';
    `);

    // 3. Tabel photos
    await query(`
      CREATE TABLE IF NOT EXISTS photos (
        id SERIAL PRIMARY KEY,
        event_id INT REFERENCES events(id) ON DELETE CASCADE,
        photographer_id INT REFERENCES users(id) ON DELETE CASCADE,
        original_url TEXT NOT NULL,
        watermarked_url TEXT NOT NULL,
        price DECIMAL(10, 2) DEFAULT 0.00,
        bib_tags VARCHAR(255),
        orientation VARCHAR(20) DEFAULT 'portrait',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4. Tabel transactions
    await query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        order_number VARCHAR(100) UNIQUE NOT NULL,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        approved_by_id INT REFERENCES users(id) ON DELETE SET NULL,
        total_amount DECIMAL(10, 2) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Migrasi: Tambah kolom approved_by_id jika belum ada
    await query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='approved_by_id') THEN
          ALTER TABLE transactions ADD COLUMN approved_by_id INT REFERENCES users(id) ON DELETE SET NULL;
        END IF;
      END
      $$;
    `);

    // 5. Tabel transaction_items
    await query(`
      CREATE TABLE IF NOT EXISTS transaction_items (
        id SERIAL PRIMARY KEY,
        transaction_id INT REFERENCES transactions(id) ON DELETE CASCADE,
        photo_id INT REFERENCES photos(id) ON DELETE CASCADE,
        price_at_purchase DECIMAL(10, 2) NOT NULL
      );
    `);

    // Migrasi: Tambah kolom updated_by_id pada tabel photos jika belum ada
    await query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='photos' AND column_name='updated_by_id') THEN
          ALTER TABLE photos ADD COLUMN updated_by_id INT REFERENCES users(id) ON DELETE SET NULL;
        END IF;
      END
      $$;
    `);

    console.log('✅ Database tables created/verified successfully!');

    // ─── Seed Default Data ──────────────────────────────────────────────
    const eventRes = await query('SELECT COUNT(*) FROM events');
    if (parseInt(eventRes.rows[0].count, 10) === 0) {
      // Seed default event
      const eventInsert = await query(`
        INSERT INTO events (title, event_date, qr_code_url, is_active)
        VALUES ('Marathon Boyolali 2026', '2026-08-01', 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=SEPOTO_QRIS_DEMO', TRUE)
        RETURNING id;
      `);
      const defaultEventId = eventInsert.rows[0].id;

      // Hash passwords
      const adminPasswordHash = await bcrypt.hash('password', SALT_ROUNDS);
      const photographerPasswordHash = await bcrypt.hash('foto123', SALT_ROUNDS);

      // Seed Super Admin (username: admin, password: password)
      await query(
        `INSERT INTO users (event_id, name, username, password_hash, bib_number, role) VALUES ($1, $2, $3, $4, $5, $6)`,
        [null, 'Super Admin', 'admin', adminPasswordHash, null, 'super_admin']
      );

      // Seed Photographer (username: fotografer, password: foto123)
      await query(
        `INSERT INTO users (event_id, name, username, password_hash, bib_number, role) VALUES ($1, $2, $3, $4, $5, $6)`,
        [defaultEventId, 'Reza Fotografer', 'fotografer', photographerPasswordHash, null, 'photographer']
      );

      // Seed Default Users (peserta, tanpa password)
      await query(
        `INSERT INTO users (event_id, name, bib_number, role) VALUES ($1, $2, $3, $4), ($1, $5, $6, $4)`,
        [defaultEventId, 'Budi Santoso', '101', 'user', 'Sari Dewi', '102']
      );

      console.log('🌱 Default event and initial users seeded (admin/password, fotografer/foto123)!');
    }

    // Pastikan Super Admin default (username: admin) punya password_hash jika belum ada
    const adminCheck = await query(
      `SELECT id, username, password_hash FROM users WHERE username = 'admin' LIMIT 1`
    );
    if (adminCheck.rows.length > 0 && !adminCheck.rows[0].password_hash) {
      const hash = await bcrypt.hash('password', SALT_ROUNDS);
      await query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, adminCheck.rows[0].id]);
      console.log('🔐 Default Admin password_hash initialized.');
    }

    // Pastikan Default Fotografer (username: fotografer) punya password_hash jika belum ada
    const photoCheck = await query(
      `SELECT id, username, password_hash FROM users WHERE username = 'fotografer' LIMIT 1`
    );
    if (photoCheck.rows.length > 0 && !photoCheck.rows[0].password_hash) {
      const hash = await bcrypt.hash('foto123', SALT_ROUNDS);
      await query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, photoCheck.rows[0].id]);
      console.log('🔐 Default Photographer password_hash initialized.');
    }

  } catch (error) {
    console.error('❌ Database Initialization Error:', error);
  }
}

module.exports = initDb;

