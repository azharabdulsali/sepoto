const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'sepoto_jwt_secret_key_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const SALT_ROUNDS = 10;

/**
 * Generate JWT token dari user data
 */
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

/**
 * POST /api/auth/login-user
 * Login peserta via Nama + Nomor BIB (tanpa password, auto-create jika belum terdaftar)
 */
const loginUser = async (req, res) => {
  try {
    const { name, bibNumber } = req.body;
    if (!name || !bibNumber) {
      return res.status(400).json({ success: false, message: 'Nama dan Nomor BIB wajib diisi.' });
    }

    const result = await query(
      `SELECT * FROM users WHERE LOWER(name) = LOWER($1) AND bib_number = $2 AND role = 'user'`,
      [name.trim(), bibNumber.trim()]
    );

    let user;
    if (result.rows.length === 0) {
      // Auto-create akun peserta jika belum terdaftar
      const newRecord = await query(
        `INSERT INTO users (name, bib_number, role) VALUES ($1, $2, 'user') RETURNING *`,
        [name.trim(), bibNumber.trim()]
      );
      user = newRecord.rows[0];
    } else {
      user = result.rows[0];
    }

    const token = generateToken(user);

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        bibNumber: user.bib_number,
        role: user.role,
        eventId: user.event_id,
      },
    });
  } catch (error) {
    console.error('Login User Error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

/**
 * POST /api/auth/login-admin
 * Login Super Admin via username + password (bcrypt verification)
 */
const loginAdmin = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username dan Password wajib diisi.' });
    }

    const result = await query(
      `SELECT * FROM users WHERE username = $1 AND role = 'super_admin'`,
      [username.trim()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Username atau Password Admin salah.' });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Username atau Password Admin salah.' });
    }

    const token = generateToken(user);

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login Admin Error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

/**
 * POST /api/auth/login-photographer
 * Login Fotografer via username + password (bcrypt verification)
 */
const loginPhotographer = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username dan Password wajib diisi.' });
    }

    const result = await query(
      `SELECT * FROM users WHERE username = $1 AND role = 'photographer'`,
      [username.trim()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Username atau Password Fotografer salah.' });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Username atau Password Fotografer salah.' });
    }

    const token = generateToken(user);

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        eventId: user.event_id,
      },
    });
  } catch (error) {
    console.error('Login Photographer Error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

/**
 * GET /api/auth/me
 * Validasi token & ambil data user terbaru dari database
 */
const getMe = async (req, res) => {
  try {
    const result = await query('SELECT * FROM users WHERE id = $1', [req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });
    }

    const user = result.rows[0];
    return res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        bibNumber: user.bib_number,
        role: user.role,
        eventId: user.event_id,
      },
    });
  } catch (error) {
    console.error('Get Me Error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

module.exports = {
  loginUser,
  loginAdmin,
  loginPhotographer,
  getMe,
};
