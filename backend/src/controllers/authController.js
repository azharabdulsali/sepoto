const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'sepoto_jwt_secret_key_2026_CHANGE_THIS';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const SALT_ROUNDS = 12; // Ditingkatkan dari 10 ke 12 untuk keamanan lebih baik

// Dummy hash digunakan untuk mencegah timing attack saat user tidak ditemukan
// Tanpa ini, penyerang bisa membedakan "user tidak ada" vs "password salah"
// berdasarkan perbedaan waktu respons.
const DUMMY_HASH = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewYpfQN6AkTmSBm2';


/**
 * Generate JWT token dari user data
 */
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, role: user.role, name: user.name, eventId: user.event_id },
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
      `SELECT * FROM users WHERE LOWER(TRIM(name)) = LOWER($1) AND LOWER(TRIM(bib_number)) = LOWER($2) AND role = 'user'`,
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
 * Login Super Admin atau Event Admin via username + password (bcrypt verification)
 * Menggunakan dummy hash untuk mencegah timing attack
 */
const loginAdmin = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username dan Password wajib diisi.' });
    }

    const result = await query(
      `SELECT * FROM users WHERE LOWER(username) = LOWER($1) AND role IN ('super_admin', 'admin')`,
      [username.trim()]
    );

    const user = result.rows[0] || null;
    // Selalu jalankan bcrypt.compare untuk mencegah timing attack
    const hashToCompare = user ? user.password_hash : DUMMY_HASH;
    const isMatch = await bcrypt.compare(password, hashToCompare);

    if (!user || !isMatch) {
      return res.status(401).json({ success: false, message: 'Username atau Password tidak valid.' });
    }

    const token = generateToken(user);

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role,
        eventId: user.event_id,
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
 * Menggunakan dummy hash untuk mencegah timing attack
 */
const loginPhotographer = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username dan Password wajib diisi.' });
    }

    const result = await query(
      `SELECT * FROM users WHERE LOWER(username) = LOWER($1) AND role = 'photographer'`,
      [username.trim()]
    );

    const user = result.rows[0] || null;
    // Selalu jalankan bcrypt.compare untuk mencegah timing attack
    const hashToCompare = user ? user.password_hash : DUMMY_HASH;
    const isMatch = await bcrypt.compare(password, hashToCompare);

    if (!user || !isMatch) {
      return res.status(401).json({ success: false, message: 'Username atau Password tidak valid.' });
    }

    const token = generateToken(user);

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
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
 * Super Admin / Admin: Ambil daftar seluruh user/peserta/fotografer/admin dari database
 * Mendukung filter query `?eventId=X`
 */
const getAllUsers = async (req, res) => {
  try {
    const { eventId } = req.query;
    let sql = `
      SELECT u.id, u.name, u.username, u.bib_number, u.role, u.event_id, u.created_at, e.title as event_title
      FROM users u
      LEFT JOIN events e ON u.event_id = e.id
    `;
    const params = [];

    // Filter by role if Admin (scoped strictly to their event)
    if (req.user && req.user.role === 'admin') {
      let adminEventId = req.user.eventId;
      if (!adminEventId) {
        const uRes = await query('SELECT event_id FROM users WHERE id = $1', [req.user.id]);
        adminEventId = uRes.rows[0]?.event_id;
      }
      sql += ` WHERE u.event_id = $1`;
      params.push(adminEventId || 1);
    } else if (eventId && eventId !== 'all') {
      sql += ` WHERE u.event_id = $1`;
      params.push(eventId);
    }

    sql += ` ORDER BY u.id ASC`;

    const result = await query(sql, params);

    const users = result.rows.map((u) => ({
      id: u.id,
      name: u.name,
      username: u.username || '-',
      bibNumber: u.bib_number || '-',
      role: u.role,
      eventId: u.event_id,
      eventTitle: u.event_title || 'Semua Event',
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
 * Super Admin / Admin: Tambah user/peserta/fotografer/admin secara manual
 */
const createUserManual = async (req, res) => {
  try {
    const { role, name, bibNumber, username, password, eventId: targetEventId } = req.body;

    if (!role || !name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Role dan Nama Lengkap wajib diisi.' });
    }

    let finalEventId = targetEventId;

    // Jika pembuat adalah Event Admin:
    if (req.user && req.user.role === 'admin') {
      if (role === 'admin' || role === 'super_admin') {
        return res.status(403).json({
          success: false,
          message: 'Akses ditolak. Event Admin hanya diizinkan menambahkan Peserta atau Fotografer.',
        });
      }

      // Kunci eventId ke event milik Event Admin
      let adminEventId = req.user.eventId;
      if (!adminEventId) {
        const uRes = await query('SELECT event_id FROM users WHERE id = $1', [req.user.id]);
        adminEventId = uRes.rows[0]?.event_id;
      }
      finalEventId = adminEventId || 1;
    } else if (!finalEventId || finalEventId === 'all') {
      const eventRes = await query('SELECT id FROM events WHERE is_active = TRUE ORDER BY id DESC LIMIT 1');
      finalEventId = eventRes.rows.length > 0 ? eventRes.rows[0].id : 1;
    }

    if (role === 'user') {
      // Pilihan 1: Peserta -> Nama Lengkap + Nomor BIB + eventId
      if (!bibNumber || !bibNumber.trim()) {
        return res.status(400).json({ success: false, message: 'Nomor BIB wajib diisi untuk peserta.' });
      }

      // Cek duplikasi Nomor BIB (case-insensitive) untuk event yang sama
      const checkBib = await query(
        `SELECT id FROM users WHERE LOWER(TRIM(bib_number)) = LOWER($1) AND role = 'user' AND event_id = $2`,
        [bibNumber.trim(), finalEventId]
      );
      if (checkBib.rows.length > 0) {
        return res.status(400).json({ success: false, message: `Nomor BIB #${bibNumber.trim()} sudah terdaftar.` });
      }

      const newUser = await query(
        `INSERT INTO users (event_id, name, bib_number, role) VALUES ($1, $2, $3, 'user') RETURNING *`,
        [finalEventId, name.trim(), bibNumber.trim()]
      );

      return res.json({
        success: true,
        message: `Peserta "${name.trim()}" (BIB #${bibNumber.trim()}) berhasil ditambahkan!`,
        user: newUser.rows[0],
      });

    } else if (role === 'photographer' || role === 'admin') {
      // Pilihan 2: Fotografer atau Event Admin -> Nama Lengkap + Username + Password + eventId
      if (!username || !username.trim() || !password) {
        return res.status(400).json({
          success: false,
          message: `Username dan Password wajib diisi untuk ${role === 'admin' ? 'Event Admin' : 'Fotografer'}.`,
        });
      }

      // Cek duplikasi username (case insensitive)
      const checkUsername = await query('SELECT id FROM users WHERE LOWER(username) = LOWER($1)', [username.trim()]);
      if (checkUsername.rows.length > 0) {
        return res.status(400).json({ success: false, message: `Username "${username.trim()}" sudah digunakan.` });
      }

      // Enkripsi password menggunakan bcrypt
      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

      const newUser = await query(
        `INSERT INTO users (event_id, name, username, password_hash, role) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [finalEventId, name.trim(), username.trim(), passwordHash, role]
      );

      const roleDisplay = role === 'admin' ? 'Event Admin' : 'Fotografer';
      return res.json({
        success: true,
        message: `${roleDisplay} "${name.trim()}" (Username: ${username.trim()}) berhasil ditambahkan!`,
        user: newUser.rows[0],
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

    // Tidak boleh menghapus akun sendiri
    if (req.user && Number(id) === Number(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Anda tidak dapat menghapus akun Anda sendiri.' });
    }

    const checkUser = await query('SELECT role, event_id FROM users WHERE id = $1', [id]);
    if (checkUser.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
    }
    const targetUser = checkUser.rows[0];

    if (targetUser.role === 'super_admin') {
      return res.status(403).json({ success: false, message: 'Akun Super Admin utama tidak dapat dihapus.' });
    }

    // Jika penghapus adalah Event Admin:
    if (req.user && req.user.role === 'admin') {
      let adminEventId = req.user.eventId;
      if (!adminEventId) {
        const uRes = await query('SELECT event_id FROM users WHERE id = $1', [req.user.id]);
        adminEventId = uRes.rows[0]?.event_id;
      }

      if (targetUser.role === 'admin' || targetUser.role === 'super_admin') {
        return res.status(403).json({ success: false, message: 'Event Admin tidak diizinkan menghapus akun Admin.' });
      }

      if (Number(targetUser.event_id) !== Number(adminEventId)) {
        return res.status(403).json({ success: false, message: 'Akses ditolak. Pengguna ini bukan bagian dari event Anda.' });
      }
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
 * Super Admin / Admin: Edit data pengguna (Peserta, Fotografer, atau Akun Sendiri)
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

    // Jika pengedit adalah Event Admin:
    if (req.user && req.user.role === 'admin') {
      let adminEventId = req.user.eventId;
      if (!adminEventId) {
        const uRes = await query('SELECT event_id FROM users WHERE id = $1', [req.user.id]);
        adminEventId = uRes.rows[0]?.event_id;
      }

      // Event Admin boleh mengedit akun sendiri, namun tidak boleh mengedit akun Admin lain
      if (Number(id) !== Number(req.user.id) && (targetUser.role === 'admin' || targetUser.role === 'super_admin')) {
        return res.status(403).json({ success: false, message: 'Event Admin tidak diizinkan mengedit akun Admin lain.' });
      }

      if (Number(targetUser.event_id) !== Number(adminEventId)) {
        return res.status(403).json({ success: false, message: 'Akses ditolak. Pengguna ini bukan bagian dari event Anda.' });
      }
    }

    if (targetUser.role === 'user') {
      // Edit Peserta -> Nama & Nomor BIB
      const newName = name && name.trim() ? name.trim() : targetUser.name;
      const newBib = bibNumber && bibNumber.trim() ? bibNumber.trim() : targetUser.bib_number;

      if (newBib.toLowerCase() !== (targetUser.bib_number || '').toLowerCase()) {
        const checkBib = await query(
          `SELECT id FROM users WHERE LOWER(TRIM(bib_number)) = LOWER($1) AND role = 'user' AND event_id = $2 AND id != $3`,
          [newBib, targetUser.event_id, id]
        );
        if (checkBib.rows.length > 0) {
          return res.status(400).json({ success: false, message: `Nomor BIB #${newBib} sudah terdaftar pada event ini.` });
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
