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
      return res.status(401).json({
        success: false,
        message: 'Nama atau Nomor BIB tidak terdaftar dalam database peserta.',
      });
    }

    user = result.rows[0];

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

/**
 * GET /api/auth/users
 * Super Admin: Ambil daftar seluruh user/peserta/fotografer/admin dari database PostgreSQL
 */
const getAllUsers = async (req, res) => {
  try {
    const result = await query(
      `SELECT id, name, username, bib_number, role, created_at FROM users ORDER BY id ASC`
    );

    const users = result.rows.map((u) => ({
      id: u.id,
      name: u.name,
      username: u.username || '-',
      bibNumber: u.bib_number || '-',
      role: u.role,
      createdAt: u.created_at,
    }));

    return res.json({ success: true, users });
  } catch (error) {
    console.error('Fetch Users Error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil daftar pengguna.' });
  }
};

/**
 * POST /api/auth/users
 * Super Admin: Tambah user/peserta atau fotografer secara manual
 */
const createUserManual = async (req, res) => {
  try {
    const { role, name, bibNumber, username, password } = req.body;

    if (!role || !name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Role dan Nama Lengkap wajib diisi.' });
    }

    // Ambil event aktif
    const eventRes = await query('SELECT id FROM events WHERE is_active = TRUE ORDER BY id DESC LIMIT 1');
    const eventId = eventRes.rows.length > 0 ? eventRes.rows[0].id : 1;

    if (role === 'user') {
      // Pilihan 1: Peserta -> Nama Lengkap + Nomor BIB
      if (!bibNumber || !bibNumber.trim()) {
        return res.status(400).json({ success: false, message: 'Nomor BIB wajib diisi untuk peserta.' });
      }

      // Cek duplikasi Nomor BIB
      const checkBib = await query(
        `SELECT id FROM users WHERE bib_number = $1 AND role = 'user'`,
        [bibNumber.trim()]
      );
      if (checkBib.rows.length > 0) {
        return res.status(400).json({ success: false, message: `Nomor BIB #${bibNumber.trim()} sudah terdaftar.` });
      }

      const newUser = await query(
        `INSERT INTO users (event_id, name, bib_number, role) VALUES ($1, $2, $3, 'user') RETURNING *`,
        [eventId, name.trim(), bibNumber.trim()]
      );

      return res.json({
        success: true,
        message: `Peserta "${name.trim()}" (BIB #${bibNumber.trim()}) berhasil ditambahkan!`,
        user: newUser.rows[0],
      });

    } else if (role === 'photographer') {
      // Pilihan 2: Fotografer -> Nama Lengkap + Username + Password
      if (!username || !username.trim() || !password) {
        return res.status(400).json({ success: false, message: 'Username dan Password wajib diisi untuk fotografer.' });
      }

      // Cek duplikasi username
      const checkUsername = await query('SELECT id FROM users WHERE LOWER(username) = LOWER($1)', [username.trim()]);
      if (checkUsername.rows.length > 0) {
        return res.status(400).json({ success: false, message: `Username "${username.trim()}" sudah digunakan.` });
      }

      // Enkripsi password menggunakan bcrypt
      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

      const newPhotographer = await query(
        `INSERT INTO users (event_id, name, username, password_hash, role) VALUES ($1, $2, $3, $4, 'photographer') RETURNING *`,
        [eventId, name.trim(), username.trim(), passwordHash]
      );

      return res.json({
        success: true,
        message: `Fotografer "${name.trim()}" (Username: ${username.trim()}) berhasil ditambahkan!`,
        user: newPhotographer.rows[0],
      });

    } else {
      return res.status(400).json({ success: false, message: 'Pilihan role tidak valid.' });
    }
  } catch (error) {
    console.error('Create User Error:', error);
    res.status(500).json({ success: false, message: 'Gagal menambahkan pengguna.' });
  }
};

/**
 * DELETE /api/auth/users/:id
 * Super Admin: Hapus user/fotografer dari database
 */
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const checkUser = await query('SELECT role FROM users WHERE id = $1', [id]);
    if (checkUser.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
    }
    if (checkUser.rows[0].role === 'super_admin') {
      return res.status(403).json({ success: false, message: 'Akun Super Admin utama tidak dapat dihapus.' });
    }

    await query('DELETE FROM users WHERE id = $1', [id]);

    return res.json({
      success: true,
      message: 'Pengguna berhasil dihapus.',
    });
  } catch (error) {
    console.error('Delete User Error:', error);
    res.status(500).json({ success: false, message: 'Gagal menghapus pengguna.' });
  }
};

/**
 * PATCH /api/auth/users/:id
 * Super Admin: Edit data pengguna (Peserta atau Fotografer)
 */
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, bibNumber, username, password } = req.body;

    const checkUser = await query('SELECT * FROM users WHERE id = $1', [id]);
    if (checkUser.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
    }

    const targetUser = checkUser.rows[0];

    if (targetUser.role === 'user') {
      // Edit Peserta -> Nama & Nomor BIB
      const newName = name && name.trim() ? name.trim() : targetUser.name;
      const newBib = bibNumber && bibNumber.trim() ? bibNumber.trim() : targetUser.bib_number;

      if (newBib !== targetUser.bib_number) {
        const checkBib = await query(
          `SELECT id FROM users WHERE bib_number = $1 AND role = 'user' AND id != $2`,
          [newBib, id]
        );
        if (checkBib.rows.length > 0) {
          return res.status(400).json({ success: false, message: `Nomor BIB #${newBib} sudah terdaftar.` });
        }
      }

      const updated = await query(
        `UPDATE users SET name = $1, bib_number = $2 WHERE id = $3 RETURNING *`,
        [newName, newBib, id]
      );

      return res.json({
        success: true,
        message: `Data peserta "${newName}" berhasil diperbarui!`,
        user: updated.rows[0],
      });

    } else {
      // Edit Fotografer / Admin -> Nama, Username, Optional Password
      const newName = name && name.trim() ? name.trim() : targetUser.name;
      const newUsername = username && username.trim() ? username.trim() : targetUser.username;

      if (newUsername && newUsername !== targetUser.username) {
        const checkUname = await query(
          'SELECT id FROM users WHERE LOWER(username) = LOWER($1) AND id != $2',
          [newUsername, id]
        );
        if (checkUname.rows.length > 0) {
          return res.status(400).json({ success: false, message: `Username "${newUsername}" sudah digunakan.` });
        }
      }

      let newPasswordHash = targetUser.password_hash;
      if (password && password.trim().length > 0) {
        newPasswordHash = await bcrypt.hash(password.trim(), SALT_ROUNDS);
      }

      const updated = await query(
        `UPDATE users SET name = $1, username = $2, password_hash = $3 WHERE id = $4 RETURNING *`,
        [newName, newUsername, newPasswordHash, id]
      );

      return res.json({
        success: true,
        message: `Data pengguna "${newName}" berhasil diperbarui!`,
        user: updated.rows[0],
      });
    }
  } catch (error) {
    console.error('Update User Error:', error);
    res.status(500).json({ success: false, message: 'Gagal memperbarui data pengguna.' });
  }
};

module.exports = {
  loginUser,
  loginAdmin,
  loginPhotographer,
  getMe,
  getAllUsers,
  createUserManual,
  updateUser,
  deleteUser,
};
