const { query } = require('../config/db');

/**
 * GET /api/events/active
 * Ambil event yang sedang aktif
 */
/**
 * GET /api/events/active
 * Ambil event yang sedang aktif (mendukung ?eventId=X untuk peserta)
 */
const getActiveEvent = async (req, res) => {
  try {
    const { eventId } = req.query;
    let sql = 'SELECT * FROM events';
    const params = [];

    if (eventId) {
      sql += ' WHERE id = $1';
      params.push(eventId);
    } else {
      sql += ' WHERE is_active = TRUE ORDER BY id DESC LIMIT 1';
    }

    const result = await query(sql, params);

    if (result.rows.length === 0) {
      return res.json({
        success: true,
        event: null,
        message: 'Tidak ada event yang ditemukan.',
      });
    }

    const event = result.rows[0];
    return res.json({
      success: true,
      event: {
        id: event.id,
        title: event.title,
        eventDate: event.event_date,
        logoUrl: event.logo_url,
        qrCodeUrl: event.qr_code_url,
        isActive: event.is_active,
        createdAt: event.created_at,
      },
    });
  } catch (error) {
    console.error('Fetch Event Error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data event.' });
  }
};

/**
 * PATCH /api/events/:id
 * Update detail event (admin only)
 */
const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, eventDate, qrCodeUrl, isActive } = req.body;

    const fields = [];
    const values = [];
    let paramIndex = 1;

    if (title) {
      fields.push(`title = $${paramIndex++}`);
      values.push(title);
    }
    if (eventDate) {
      fields.push(`event_date = $${paramIndex++}`);
      values.push(eventDate);
    }
    if (qrCodeUrl) {
      fields.push(`qr_code_url = $${paramIndex++}`);
      values.push(qrCodeUrl);
    }
    if (typeof isActive === 'boolean' || isActive !== undefined) {
      fields.push(`is_active = $${paramIndex++}`);
      values.push(Boolean(isActive));
    }

    if (fields.length === 0) {
      return res.status(400).json({ success: false, message: 'Tidak ada data yang diubah.' });
    }

    values.push(id);
    const result = await query(
      `UPDATE events SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Event tidak ditemukan.' });
    }

    return res.json({
      success: true,
      message: 'Event berhasil diperbarui.',
      event: result.rows[0],
    });
  } catch (error) {
    console.error('Update Event Error:', error);
    res.status(500).json({ success: false, message: 'Gagal memperbarui event.' });
  }
};

/**
 * PATCH /api/events/:id/active
 * Toggle status aktif/nonaktif event (admin only)
 */
const toggleEventActive = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const result = await query(
      'UPDATE events SET is_active = $1 WHERE id = $2 RETURNING *',
      [isActive, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Event tidak ditemukan.' });
    }

    return res.json({
      success: true,
      message: `Status event berhasil diubah menjadi ${isActive ? 'AKTIF' : 'NON-AKTIF'}.`,
      event: result.rows[0],
    });
  } catch (error) {
    console.error('Toggle Event Error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengubah status event.' });
  }
};

/**
 * POST /api/events/:id/qris
 * Upload gambar QR Code QRIS oleh Super Admin
 */
const uploadQris = async (req, res) => {
  try {
    const { id } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ success: false, message: 'Tidak ada file gambar QRIS yang diunggah.' });
    }

    const { uploadToR2 } = require('../services/r2Service');
    const timeId = Date.now();
    const key = `qris/QRIS-${id}-${timeId}.jpg`;
    const qrCodeUrl = await uploadToR2(file.buffer, key, file.mimetype);

    const result = await query(
      'UPDATE events SET qr_code_url = $1 WHERE id = $2 RETURNING *',
      [qrCodeUrl, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Event tidak ditemukan.' });
    }

    return res.json({
      success: true,
      message: 'Gambar QRIS berhasil diunggah dan diperbarui!',
      qrCodeUrl,
      event: result.rows[0],
    });
  } catch (error) {
    console.error('Upload QRIS Error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengunggah gambar QRIS.' });
  }
};

/**
 * GET /api/events
 * Ambil seluruh daftar event (Super Admin & Admin)
 */
const getAllEvents = async (req, res) => {
  try {
    const result = await query('SELECT * FROM events ORDER BY id DESC');

    const events = result.rows.map((event) => ({
      id: event.id,
      title: event.title,
      eventDate: event.event_date,
      logoUrl: event.logo_url,
      qrCodeUrl: event.qr_code_url,
      isActive: event.is_active,
      createdAt: event.created_at,
    }));

    return res.json({ success: true, events });
  } catch (error) {
    console.error('Fetch All Events Error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil daftar event.' });
  }
};

/**
 * POST /api/events
 * Tambah event baru (Super Admin only)
 */
const createEvent = async (req, res) => {
  try {
    const { title, eventDate, qrCodeUrl } = req.body;

    if (!title || !title.trim() || !eventDate) {
      return res.status(400).json({ success: false, message: 'Nama Event dan Tanggal Event wajib diisi.' });
    }

    const defaultQr = qrCodeUrl && qrCodeUrl.trim()
      ? qrCodeUrl.trim()
      : 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=SEPOTO_QRIS_DEFAULT';

    const result = await query(
      `INSERT INTO events (title, event_date, qr_code_url, is_active)
       VALUES ($1, $2, $3, TRUE) RETURNING *`,
      [title.trim(), eventDate, defaultQr]
    );

    return res.json({
      success: true,
      message: `Event "${title.trim()}" berhasil dibuat!`,
      event: result.rows[0],
    });
  } catch (error) {
    console.error('Create Event Error:', error);
    res.status(500).json({ success: false, message: 'Gagal membuat event baru.' });
  }
};

module.exports = {
  getActiveEvent,
  getAllEvents,
  createEvent,
  updateEvent,
  toggleEventActive,
  uploadQris,
};
