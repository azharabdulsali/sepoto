const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'sepoto_jwt_secret_key_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const SALT_ROUNDS = 12;

// Pre-computed hash used in constant-time comparison to prevent username-enumeration
// timing attacks (prevents distinguishing "user not found" from "wrong password").
const DUMMY_HASH = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewYpfQN6AkTmSBm2';

/** Build a signed JWT token from a user record. */
const buildJwt = (user) =>
  jwt.sign(
    { id: user.id, role: user.role, name: user.name, eventId: user.event_id },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );


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

    if (user.event_id) {
      const evRes = await query('SELECT is_active, title FROM events WHERE id = $1', [user.event_id]);
      if (evRes.rows.length > 0 && !evRes.rows[0].is_active) {
        const evName = evRes.rows[0].title || 'ini';
        return res.status(403).json({
          success: false,
          message: `Event "${evName}" saat ini dalam status non-aktif / telah berakhir. Akses login peserta & fotografer ditutup.`,
        });
      }
    }

    const token = buildJwt(user);

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
 * Login Super Admin or Event Admin via username + password.
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
    const hashToCompare = user ? user.password_hash : DUMMY_HASH;
    const isMatch = await bcrypt.compare(password, hashToCompare);

    if (!user || !isMatch) {
      return res.status(401).json({ success: false, message: 'Username atau Password tidak valid.' });
    }

    const token = buildJwt(user);

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
 * Login Photographer via username + password.
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
    const hashToCompare = user ? user.password_hash : DUMMY_HASH;
    const isMatch = await bcrypt.compare(password, hashToCompare);

    if (!user || !isMatch) {
      return res.status(401).json({ success: false, message: 'Username atau Password tidak valid.' });
    }

    if (user.event_id) {
      const evRes = await query('SELECT is_active, title FROM events WHERE id = $1', [user.event_id]);
      if (evRes.rows.length > 0 && !evRes.rows[0].is_active) {
        const evName = evRes.rows[0].title || 'ini';
        return res.status(403).json({
          success: false,
          message: `Event "${evName}" saat ini dalam status non-aktif / telah berakhir. Akses login peserta & fotografer ditutup.`,
        });
      }
    }

    const token = buildJwt(user);

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
    const { eventId, page, limit } = req.query;
    let sql = `
      SELECT u.id, u.name, u.username, u.bib_number, u.birth_date, u.role, u.event_id, u.created_at, e.title as event_title
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

    // Total Count Query
    const countSql = `SELECT COUNT(*) FROM (${sql}) AS count_table`;
    const countRes = await query(countSql, params);
    const total = parseInt(countRes.rows[0].count, 10);

    sql += ` ORDER BY u.id ASC`;

    // Pagination LIMIT & OFFSET
    const pageNum = page ? parseInt(page, 10) : null;
    const limitNum = limit ? parseInt(limit, 10) : null;

    if (pageNum && limitNum) {
      const offset = (pageNum - 1) * limitNum;
      sql += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limitNum, offset);
    }

    const result = await query(sql, params);

    const users = result.rows.map((u) => ({
      id: u.id,
      name: u.name,
      username: u.username || '-',
      bibNumber: u.bib_number || '-',
      birthDate: u.birth_date || '-',
      role: u.role,
      eventId: u.event_id,
      eventTitle: u.event_title || 'Semua Event',
      createdAt: u.created_at,
    }));

    const totalPages = limitNum ? Math.ceil(total / limitNum) : 1;

    return res.json({
      success: true,
      users,
      total,
      page: pageNum || 1,
      totalPages: totalPages || 1,
    });
  } catch (error) {
    console.error('Fetch Users Error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil daftar pengguna.' });
  }
};

/** Helper: normalize date strings to YYYY-MM-DD or digits for matching */
const normalizeDate = (dateStr) => {
  if (!dateStr) return '';
  const str = String(dateStr).trim();
  const ddmmyyyy = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (ddmmyyyy) {
    const [, day, month, year] = ddmmyyyy;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  const yyyymmdd = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
  if (yyyymmdd) {
    const [, year, month, day] = yyyymmdd;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  if (/^\d{8}$/.test(str)) {
    const day = str.substring(0, 2);
    const month = str.substring(2, 4);
    const year = str.substring(4, 8);
    return `${year}-${month}-${day}`;
  }
  return str;
};

const datesMatch = (inputDate, dbDate) => {
  if (!inputDate || !dbDate) return true;
  const norm1 = normalizeDate(inputDate);
  const norm2 = normalizeDate(dbDate);
  if (norm1 === norm2) return true;
  const dig1 = String(inputDate).replace(/\D/g, '');
  const dig2 = String(dbDate).replace(/\D/g, '');
  return dig1 === dig2;
};

/**
 * POST /api/auth/users
 * Create a participant, photographer, or admin account manually.
 */
const createUserManual = async (req, res) => {
  try {
    const { role, name, bibNumber, birthDate, username, password, eventId: targetEventId } = req.body;

    if (!role || !name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Role dan Nama Lengkap wajib diisi.' });
    }

    let finalEventId = targetEventId;

    if (req.user && req.user.role === 'admin') {
      if (role === 'admin' || role === 'super_admin') {
        return res.status(403).json({
          success: false,
          message: 'Akses ditolak. Event Admin hanya diizinkan menambahkan Peserta atau Fotografer.',
        });
      }

      // Scope created users to the admin's own event only
      const adminEventId = req.user.eventId
        || (await query('SELECT event_id FROM users WHERE id = $1', [req.user.id])).rows[0]?.event_id;
      finalEventId = adminEventId || 1;
    } else if (!finalEventId || finalEventId === 'all') {
      const eventRes = await query('SELECT id FROM events WHERE is_active = TRUE ORDER BY id DESC LIMIT 1');
      finalEventId = eventRes.rows.length > 0 ? eventRes.rows[0].id : 1;
    }

    if (role === 'user') {
      if (!bibNumber || !bibNumber.trim()) {
        return res.status(400).json({ success: false, message: 'Nomor BIB wajib diisi untuk peserta.' });
      }

      const checkDuplicate = await query(
        `SELECT id FROM users WHERE LOWER(TRIM(bib_number)) = LOWER($1) AND LOWER(TRIM(name)) = LOWER($2) AND role = 'user' AND event_id = $3`,
        [bibNumber.trim(), name.trim(), finalEventId]
      );
      if (checkDuplicate.rows.length > 0) {
        return res.status(400).json({ success: false, message: `Peserta "${name.trim()}" dengan Nomor BIB #${bibNumber.trim()} sudah terdaftar pada event ini.` });
      }

      const formattedBirthDate = birthDate && birthDate.trim() ? normalizeDate(birthDate.trim()) : null;

      const newUser = await query(
        `INSERT INTO users (event_id, name, bib_number, birth_date, role) VALUES ($1, $2, $3, $4, 'user') RETURNING *`,
        [finalEventId, name.trim(), bibNumber.trim(), formattedBirthDate]
      );

      return res.json({
        success: true,
        message: `Peserta "${name.trim()}" (BIB #${bibNumber.trim()}) berhasil ditambahkan!`,
        user: newUser.rows[0],
      });

    } else if (role === 'photographer' || role === 'admin') {
      if (!username || !username.trim() || !password) {
        return res.status(400).json({
          success: false,
          message: `Username dan Password wajib diisi untuk ${role === 'admin' ? 'Event Admin' : 'Fotografer'}.`,
        });
      }

      const checkUsername = await query('SELECT id FROM users WHERE LOWER(username) = LOWER($1)', [username.trim()]);
      if (checkUsername.rows.length > 0) {
        return res.status(400).json({ success: false, message: `Username "${username.trim()}" sudah digunakan.` });
      }

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
 * Super Admin: Delete a user account.
 */
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Self-deletion is always forbidden
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

    if (req.user && req.user.role === 'admin') {
      const adminEventId = req.user.eventId
        || (await query('SELECT event_id FROM users WHERE id = $1', [req.user.id])).rows[0]?.event_id;

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
 * POST /api/auth/users/bulk-delete
 * Super Admin / Admin: Hapus masal pengguna
 */
const bulkDeleteUsers = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Tidak ada ID pengguna yang dipilih.' });
    }

    const currentUserId = req.user?.id ? Number(req.user.id) : null;

    // Ambil detail target pengguna dari DB
    const usersRes = await query(
      `SELECT id, role, event_id FROM users WHERE id = ANY($1::int[])`,
      [ids]
    );

    let adminEventId = null;
    if (req.user && req.user.role === 'admin') {
      adminEventId = req.user.eventId
        || (await query('SELECT event_id FROM users WHERE id = $1', [req.user.id])).rows[0]?.event_id;
    }

    // Filter ID mana saja yang aman untuk dihapus
    const validIdsToDelete = usersRes.rows
      .filter((u) => {
        const uId = Number(u.id);
        // Jangan hapus akun sendiri
        if (currentUserId && uId === currentUserId) return false;
        // Jangan hapus Super Admin
        if (u.role === 'super_admin') return false;
        // Jika Event Admin: tidak boleh hapus admin lain & harus event miliknya
        if (req.user?.role === 'admin') {
          if (u.role === 'admin') return false;
          if (Number(u.event_id) !== Number(adminEventId)) return false;
        }
        return true;
      })
      .map((u) => Number(u.id));

    if (validIdsToDelete.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Tidak ada pengguna valid yang dapat dihapus (akun sendiri & Super Admin dilindungi).',
      });
    }

    await query(`DELETE FROM users WHERE id = ANY($1::int[])`, [validIdsToDelete]);

    return res.json({
      success: true,
      message: `${validIdsToDelete.length} pengguna berhasil dihapus.`,
      deletedCount: validIdsToDelete.length,
    });
  } catch (error) {
    console.error('Bulk Delete Users Error:', error);
    res.status(500).json({ success: false, message: 'Gagal menghapus masal pengguna.' });
  }
};

/**
 * PATCH /api/auth/users/:id
 * Super Admin / Admin: Edit data pengguna (Peserta, Fotografer, atau Akun Sendiri)
 */
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, bibNumber, birthDate, username, password } = req.body;

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
      // Edit Peserta -> Nama, Nomor BIB, Tanggal Lahir
      const newName = name && name.trim() ? name.trim() : targetUser.name;
      const newBib = bibNumber && bibNumber.trim() ? bibNumber.trim() : targetUser.bib_number;
      const newBirthDate = birthDate !== undefined ? (birthDate && birthDate.trim() ? normalizeDate(birthDate.trim()) : null) : targetUser.birth_date;

      if (
        newBib.toLowerCase() !== (targetUser.bib_number || '').toLowerCase() ||
        newName.toLowerCase() !== (targetUser.name || '').toLowerCase()
      ) {
        const checkDuplicate = await query(
          `SELECT id FROM users WHERE LOWER(TRIM(bib_number)) = LOWER($1) AND LOWER(TRIM(name)) = LOWER($2) AND role = 'user' AND event_id = $3 AND id != $4`,
          [newBib, newName, targetUser.event_id, id]
        );
        if (checkDuplicate.rows.length > 0) {
          return res.status(400).json({ success: false, message: `Peserta "${newName}" dengan Nomor BIB #${newBib} sudah terdaftar pada event ini.` });
        }
      }

      const updated = await query(
        `UPDATE users SET name = $1, bib_number = $2, birth_date = $3 WHERE id = $4 RETURNING *`,
        [newName, newBib, newBirthDate, id]
      );

      return res.json({
        success: true,
        message: `Data peserta "${newName}" berhasil diperbarui!`,
        user: updated.rows[0],
      });

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

const unifiedLogin = async (req, res) => {
  try {
    const { role, name, bibNumber, birthDate, username, password, eventId } = req.body;

    // ── Mode A: Participant Login via Tab (name + bibNumber + birthDate) ──
    if (role === 'user' || (bibNumber && (birthDate || name))) {
      if (!bibNumber || !bibNumber.trim()) {
        return res.status(400).json({ success: false, message: 'Nomor BIB wajib diisi.' });
      }

      const trimmedName = name ? name.trim() : '';
      const trimmedBib = bibNumber.trim();
      const trimmedBirthDate = birthDate ? birthDate.trim() : '';

      // Query database strictly matching bib_number and name (if name provided)
      let sql = `
        SELECT u.*, e.title as event_name, e.event_date, e.is_active as event_is_active
        FROM users u
        LEFT JOIN events e ON u.event_id = e.id
        WHERE LOWER(TRIM(u.bib_number)) = LOWER($1) AND u.role = 'user'
      `;
      const params = [trimmedBib];

      if (trimmedName) {
        sql += ` AND LOWER(TRIM(u.name)) = LOWER($2)`;
        params.push(trimmedName);
      }

      const userResult = await query(sql, params);

      if (userResult.rows.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'Nama Lengkap atau Nomor BIB tidak terdaftar.',
        });
      }

      // Filter users matching birth_date
      const matchedUsersWithDate = userResult.rows.filter((u) => {
        if (!u.birth_date) return true; // Legacy entry without birth_date recorded yet
        return datesMatch(trimmedBirthDate, u.birth_date);
      });

      if (matchedUsersWithDate.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'Tanggal Lahir tidak cocok dengan data peserta terdaftar.',
        });
      }

      // Saring hanya event yang aktif untuk peserta
      const activeMatchedUsers = matchedUsersWithDate.filter((u) => u.event_is_active !== false);
      if (activeMatchedUsers.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Event untuk peserta ini saat ini dalam status non-aktif / telah berakhir. Akses login peserta ditutup.',
        });
      }

      // If user had no birth_date set yet, automatically save this verified birth_date
      for (const u of activeMatchedUsers) {
        if (!u.birth_date && trimmedBirthDate) {
          const norm = normalizeDate(trimmedBirthDate);
          await query('UPDATE users SET birth_date = $1 WHERE id = $2', [norm, u.id]);
          u.birth_date = norm;
        }
      }

      // If participant with this Name + BIB + BirthDate exists in multiple active events and no specific eventId is passed yet
      if (activeMatchedUsers.length > 1 && !eventId) {
        const eventsList = activeMatchedUsers.map((row) => ({
          eventId: row.event_id,
          eventName: row.event_name || `Event #${row.event_id}`,
          eventDate: row.event_date || null,
          userId: row.id,
          bibNumber: row.bib_number,
          isActive: row.event_is_active ?? true,
        }));
        return res.json({
          success: true,
          selectEventRequired: true,
          events: eventsList,
          user: { name: activeMatchedUsers[0].name, bibNumber: activeMatchedUsers[0].bib_number },
        });
      }

      let selectedUser = activeMatchedUsers[0];
      if (eventId) {
        const matched = activeMatchedUsers.find((row) => Number(row.event_id) === Number(eventId));
        if (matched) selectedUser = matched;
      }

      if (selectedUser.event_id) {
        const evRes = await query('SELECT is_active, title FROM events WHERE id = $1', [selectedUser.event_id]);
        if (evRes.rows.length > 0 && !evRes.rows[0].is_active) {
          const evName = evRes.rows[0].title || selectedUser.event_name || 'ini';
          return res.status(403).json({
            success: false,
            message: `Event "${evName}" saat ini dalam status non-aktif / telah berakhir. Akses login peserta ditutup.`,
          });
        }
      }

      const availableEvents = matchedUsersWithDate.map((row) => ({
        eventId: row.event_id,
        eventName: row.event_name || `Event #${row.event_id}`,
        eventDate: row.event_date || null,
        userId: row.id,
        bibNumber: row.bib_number,
      }));

      const token = buildJwt(selectedUser);
      return res.json({
        success: true,
        token,
        availableEvents,
        user: {
          id: selectedUser.id,
          name: selectedUser.name,
          bibNumber: selectedUser.bib_number,
          birthDate: selectedUser.birth_date,
          role: selectedUser.role,
          eventId: selectedUser.event_id,
          eventName: selectedUser.event_name,
        },
      });
    }

    // ── Mode B: Admin / Photographer / Legacy Single Form Login (username + password) ──
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username dan Password wajib diisi.' });
    }

    const trimmedUser = username.trim();
    const trimmedPass = password.trim();

    // Step 1: Try participant login (legacy mode: name = username, bib = password)
    const userResult = await query(
      `SELECT u.*, e.title as event_name, e.event_date
       FROM users u
       LEFT JOIN events e ON u.event_id = e.id
       WHERE LOWER(TRIM(u.name)) = LOWER($1) AND LOWER(TRIM(u.bib_number)) = LOWER($2) AND u.role = 'user'`,
      [trimmedUser, trimmedPass]
    );

    if (userResult.rows.length > 0) {
      let selectedUser = userResult.rows[0];
      if (eventId) {
        const matched = userResult.rows.find((row) => Number(row.event_id) === Number(eventId));
        if (matched) selectedUser = matched;
      }

      if (selectedUser.event_id) {
        const evRes = await query('SELECT is_active, title FROM events WHERE id = $1', [selectedUser.event_id]);
        if (evRes.rows.length > 0 && !evRes.rows[0].is_active) {
          const evName = evRes.rows[0].title || selectedUser.event_name || 'ini';
          return res.status(403).json({
            success: false,
            message: `Event "${evName}" saat ini dalam status non-aktif / telah berakhir. Akses login peserta ditutup.`,
          });
        }
      }

      const availableEvents = userResult.rows.map((row) => ({
        eventId: row.event_id,
        eventName: row.event_name || `Event #${row.event_id}`,
        eventDate: row.event_date || null,
        userId: row.id,
        bibNumber: row.bib_number,
      }));

      const token = buildJwt(selectedUser);
      return res.json({
        success: true,
        token,
        availableEvents,
        user: {
          id: selectedUser.id,
          name: selectedUser.name,
          bibNumber: selectedUser.bib_number,
          birthDate: selectedUser.birth_date,
          role: selectedUser.role,
          eventId: selectedUser.event_id,
          eventName: selectedUser.event_name,
        },
      });
    }

    // Step 2: Try admin / super_admin login (username + password hash)
    const adminResult = await query(
      `SELECT * FROM users WHERE LOWER(username) = LOWER($1) AND role IN ('super_admin', 'admin')`,
      [trimmedUser]
    );
    const adminUser = adminResult.rows[0] || null;
    const adminHash = adminUser ? adminUser.password_hash : DUMMY_HASH;
    const adminMatch = await bcrypt.compare(trimmedPass, adminHash);

    if (adminUser && adminMatch) {
      const token = buildJwt(adminUser);
      return res.json({
        success: true,
        token,
        user: {
          id: adminUser.id,
          name: adminUser.name,
          username: adminUser.username,
          role: adminUser.role,
          eventId: adminUser.event_id,
        },
      });
    }

    // Step 3: Try photographer login (username + password hash)
    const photoResult = await query(
      `SELECT * FROM users WHERE LOWER(username) = LOWER($1) AND role = 'photographer'`,
      [trimmedUser]
    );
    const photoUser = photoResult.rows[0] || null;
    const photoHash = photoUser ? photoUser.password_hash : DUMMY_HASH;
    const photoMatch = await bcrypt.compare(trimmedPass, photoHash);

    if (photoUser && photoMatch) {
      // Check if event is active for photographer login
      if (photoUser.event_id) {
        const evRes = await query('SELECT is_active, title FROM events WHERE id = $1', [photoUser.event_id]);
        if (evRes.rows.length > 0 && !evRes.rows[0].is_active) {
          const evName = evRes.rows[0].title || 'ini';
          return res.status(403).json({
            success: false,
            message: `Event "${evName}" saat ini dalam status non-aktif / telah berakhir. Akses login peserta & fotografer ditutup.`,
          });
        }
      }

      const token = buildJwt(photoUser);
      return res.json({
        success: true,
        token,
        user: {
          id: photoUser.id,
          name: photoUser.name,
          username: photoUser.username,
          role: photoUser.role,
          eventId: photoUser.event_id,
        },
      });
    }

    // ── All steps failed ──
    return res.status(401).json({
      success: false,
      message: 'Username atau Password tidak valid. Pastikan data yang Anda masukkan sudah benar.',
    });
  } catch (error) {
    console.error('Unified Login Error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

/**
 * POST /api/auth/users/import
 * Bulk import/update participants from CSV/Excel data
 * Option A: Overwrites name & birth_date if bib_number already exists for eventId
 */
const importParticipants = async (req, res) => {
  try {
    const { eventId, participants } = req.body;

    if (!Array.isArray(participants) || participants.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Tidak ada data peserta yang diberikan untuk diimport.',
      });
    }

    let targetEventId = eventId ? Number(eventId) : req.user?.eventId;
    if (!targetEventId && req.user?.role === 'admin') {
      const uRes = await query('SELECT event_id FROM users WHERE id = $1', [req.user.id]);
      targetEventId = uRes.rows[0]?.event_id;
    }
    if (!targetEventId) {
      targetEventId = 1; // fallback
    }

    let createdCount = 0;
    let updatedCount = 0;

    for (const p of participants) {
      const rawName = p.name || p.fullName || p.nama || p.namaLengkap || '';
      const rawBib = p.bibNumber || p.bib || p.nomorBib || p.noBib || '';
      const rawBirthDate = p.birthDate || p.tglLahir || p.tanggalLahir || p.birth_date || '';

      const name = String(rawName).trim();
      const bibNumber = String(rawBib).trim();
      if (!name || !bibNumber) continue; // Skip invalid rows without name or bib

      const birthDateNorm = normalizeDate(rawBirthDate);

      // Check if participant exists for this event matching both bib_number AND name
      const existing = await query(
        `SELECT id FROM users WHERE LOWER(TRIM(bib_number)) = LOWER($1) AND LOWER(TRIM(name)) = LOWER($2) AND event_id = $3 AND role = 'user'`,
        [bibNumber, name, targetEventId]
      );

      if (existing.rows.length > 0) {
        // Option A: Overwrite name and birth_date
        const userId = existing.rows[0].id;
        await query(
          `UPDATE users SET name = $1, birth_date = COALESCE(NULLIF($2, ''), birth_date) WHERE id = $3`,
          [name, birthDateNorm, userId]
        );
        updatedCount++;
      } else {
        // Create new participant
        await query(
          `INSERT INTO users (name, bib_number, birth_date, role, event_id) VALUES ($1, $2, $3, 'user', $4)`,
          [name, bibNumber, birthDateNorm, targetEventId]
        );
        createdCount++;
      }
    }

    return res.json({
      success: true,
      message: `Proses import selesai. ${createdCount} peserta baru ditambahkan, ${updatedCount} peserta diperbarui.`,
      createdCount,
      updatedCount,
      totalProcessed: createdCount + updatedCount,
    });
  } catch (error) {
    console.error('Import Participants Error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengimpor data peserta.' });
  }
};

module.exports = {
  unifiedLogin,
  loginUser,
  loginAdmin,
  loginPhotographer,
  getMe,
  getAllUsers,
  createUserManual,
  updateUser,
  deleteUser,
  bulkDeleteUsers,
  importParticipants,
};
