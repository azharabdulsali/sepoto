const { query } = require('../config/db');
const { uploadToR2 } = require('../services/r2Service');
const { generateWatermark } = require('../utils/watermark');

/**
 * GET /api/photos
 * Ambil semua foto galeri yang dijual (filter by BIB opsional)
 */
const getPhotos = async (req, res) => {
  try {
    const { bib, eventId } = req.query;
    let sql = `
      SELECT p.*, u.name as photographer_name 
      FROM photos p
      LEFT JOIN users u ON p.photographer_id = u.id
      WHERE p.price > 0
    `;
    const params = [];

    if (eventId && eventId !== 'all') {
      sql += ` AND (p.event_id = $${params.length + 1} OR u.event_id = $${params.length + 1})`;
      params.push(eventId);
    }

    if (bib) {
      sql += ` AND p.bib_tags ILIKE $${params.length + 1}`;
      params.push(`%${bib}%`);
    }

    sql += ` ORDER BY p.id DESC`;
    const result = await query(sql, params);

    const photos = result.rows.map((row) => ({
      id: row.id,
      watermarkedUrl: row.watermarked_url,
      originalUrl: row.original_url,
      originalFilename: row.original_filename || `IMG_${row.id}.jpg`,
      price: Number(row.price),
      bibTags: row.bib_tags,
      orientation: row.orientation || 'portrait',
      photographerName: row.photographer_name || 'Fotografer',
    }));

    return res.json({ success: true, photos });
  } catch (error) {
    console.error('Fetch Photos Error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil foto galeri.' });
  }
};

/**
 * POST /api/photos/upload
 * Bulk upload foto oleh fotografer → Sharp watermark → Cloudflare R2 → save metadata
 */
const uploadPhotos = async (req, res) => {
  try {
    const photographerId = req.user.id; // Dari JWT token
    const { price = 0, bibTags = '', orientation = 'portrait' } = req.body;
    const photoPrice = Number(price) || 0;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, message: 'Tidak ada file foto yang diunggah.' });
    }

    // Ambil event_id fotografer (dari token atau tabel users)
    let photoEventId = req.user?.eventId;
    if (!photoEventId) {
      const uRes = await query('SELECT event_id FROM users WHERE id = $1', [photographerId]);
      photoEventId = uRes.rows[0]?.event_id;
    }
    if (!photoEventId) {
      const eventRes = await query('SELECT id FROM events WHERE is_active = TRUE ORDER BY id DESC LIMIT 1');
      photoEventId = eventRes.rows.length > 0 ? eventRes.rows[0].id : 1;
    }

    const uploadedRecords = [];

    for (const file of files) {
      const timeId = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const originalName = file.originalname || `IMG_${timeId}.jpg`;
      const originalKey = `original/RAW-${timeId}.jpg`;
      const watermarkedKey = `watermarked/WM-${timeId}.jpg`;

      // 1. Generate Watermark Buffer dengan Sharp
      const wmBuffer = await generateWatermark(file.buffer);

      // 2. Upload file asli (clean) & watermarked ke Cloudflare R2
      const originalUrl = await uploadToR2(file.buffer, originalKey, file.mimetype);
      const watermarkedUrl = await uploadToR2(wmBuffer, watermarkedKey, 'image/jpeg');

      // 3. Simpan metadata ke PostgreSQL
      const dbRes = await query(
        `INSERT INTO photos (event_id, photographer_id, original_url, watermarked_url, price, bib_tags, orientation, original_filename)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [photoEventId, photographerId, originalUrl, watermarkedUrl, photoPrice, bibTags, orientation, originalName]
      );

      uploadedRecords.push(dbRes.rows[0]);
    }

    return res.json({
      success: true,
      message: `${uploadedRecords.length} foto berhasil diunggah dan di-watermark!`,
      photos: uploadedRecords,
    });
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan saat unggah foto ke Cloudflare R2.' });
  }
};

/**
 * GET /api/photos/my
 * Fotografer ambil foto miliknya sendiri (berdasarkan photographer_id dari JWT)
 */
const getMyPhotos = async (req, res) => {
  try {
    const photographerId = req.user.id;

    const result = await query(
      `SELECT * FROM photos WHERE photographer_id = $1 ORDER BY id DESC`,
      [photographerId]
    );

    const photos = result.rows.map((row) => ({
      id: row.id,
      watermarkedUrl: row.watermarked_url,
      originalUrl: row.original_url,
      originalFilename: row.original_filename || `IMG_${row.id}.jpg`,
      price: Number(row.price),
      bibTags: row.bib_tags,
      orientation: row.orientation || 'portrait',
      createdAt: row.created_at,
    }));

    return res.json({ success: true, photos });
  } catch (error) {
    console.error('Get My Photos Error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil foto.' });
  }
};

/**
 * PATCH /api/photos/:id/price
 * Update harga foto (validasi kepemilikan: hanya pemilik foto yang bisa ubah)
 */
const updatePhotoPrice = async (req, res) => {
  try {
    const { id } = req.params;
    const { price } = req.body;
    const photographerId = req.user.id;

    if (price === undefined || price === null) {
      return res.status(400).json({ success: false, message: 'Harga wajib diisi.' });
    }

    // Validasi kepemilikan foto
    const photoCheck = await query(
      'SELECT id FROM photos WHERE id = $1 AND photographer_id = $2',
      [id, photographerId]
    );

    if (photoCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki hak untuk mengubah foto ini.',
      });
    }

    const result = await query(
      'UPDATE photos SET price = $1 WHERE id = $2 RETURNING *',
      [price, id]
    );

    return res.json({
      success: true,
      message: 'Harga foto berhasil diperbarui.',
      photo: result.rows[0],
    });
  } catch (error) {
    console.error('Update Price Error:', error);
    res.status(500).json({ success: false, message: 'Gagal memperbarui harga foto.' });
  }
};

/**
 * PATCH /api/photos/:id
 * Update harga dan/atau BIB tag foto ke PostgreSQL DB (hanya pemilik foto)
 */
const updatePhoto = async (req, res) => {
  try {
    const { id } = req.params;
    const { price, bibTags } = req.body;
    const photographerId = req.user.id;

    // Validasi kepemilikan foto
    const photoCheck = await query(
      'SELECT id FROM photos WHERE id = $1 AND photographer_id = $2',
      [id, photographerId]
    );

    if (photoCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki hak untuk mengedit foto ini.',
      });
    }

    const priceVal = price !== undefined && price !== null ? Number(price) : null;
    const bibVal = bibTags !== undefined && bibTags !== null ? String(bibTags).trim() : null;

    const result = await query(
      `UPDATE photos 
       SET price = COALESCE($1, price), 
           bib_tags = COALESCE($2, bib_tags) 
       WHERE id = $3 AND photographer_id = $4 
       RETURNING *`,
      [priceVal, bibVal, id, photographerId]
    );

    const updated = result.rows[0];

    return res.json({
      success: true,
      message: 'Detail foto berhasil disimpan ke database.',
      photo: {
        id: updated.id,
        watermarkedUrl: updated.watermarked_url,
        originalUrl: updated.original_url,
        price: Number(updated.price),
        bibTags: updated.bib_tags,
        orientation: updated.orientation || 'portrait',
        createdAt: updated.created_at,
      },
    });
  } catch (error) {
    console.error('Update Photo Error:', error);
    res.status(500).json({ success: false, message: 'Gagal memperbarui data foto di database.' });
  }
};

/**
 * DELETE /api/photos/:id
 * Hapus foto (validasi kepemilikan: hanya pemilik foto yang bisa hapus)
 */
const deletePhoto = async (req, res) => {
  try {
    const { id } = req.params;
    const photographerId = req.user.id;

    // Validasi kepemilikan foto
    const photoCheck = await query(
      'SELECT id FROM photos WHERE id = $1 AND photographer_id = $2',
      [id, photographerId]
    );

    if (photoCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki hak untuk menghapus foto ini.',
      });
    }

    await query('DELETE FROM photos WHERE id = $1', [id]);

    return res.json({
      success: true,
      message: 'Foto berhasil dihapus.',
    });
  } catch (error) {
    console.error('Delete Photo Error:', error);
    res.status(500).json({ success: false, message: 'Gagal menghapus foto.' });
  }
};

/**
 * GET /api/photos/file/*
 * Proxy gambar dari Cloudflare R2 via Backend (menghindari blokir Telkomsel / Internet Baik DNS pada *.r2.dev)
 */
const proxyR2Image = async (req, res) => {
  try {
    const key = req.params.folder && req.params.filename ? `${req.params.folder}/${req.params.filename}` : req.params[0];
    const { r2Client } = require('../services/r2Service');
    const { GetObjectCommand } = require('@aws-sdk/client-s3');

    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME || 'sepoto-photos',
      Key: key,
    });

    const response = await r2Client.send(command);
    res.setHeader('Content-Type', response.ContentType || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=31536000');

    if (req.query.download === '1' || req.query.download === 'true') {
      const downloadName = req.params.filename ? `SEPOTO-HD-${req.params.filename}` : 'SEPOTO-HD-PHOTO.jpg';
      res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
    }

    response.Body.pipe(res);
  } catch (error) {
    console.error('Proxy R2 Image Error:', error);
    res.status(404).send('Gambar tidak ditemukan.');
  }
};

/**
 * GET /api/photos/admin
 * Super Admin: Ambil semua foto galeri (dengan info pembaru & event)
 */
const getAdminPhotos = async (req, res) => {
  try {
    const { eventId } = req.query;
    let sql = `
      SELECT p.*, 
             u.name as photographer_name, 
             ub.name as updated_by_name, 
             ub.role as updated_by_role,
             e.title as event_title
      FROM photos p
      LEFT JOIN users u ON p.photographer_id = u.id
      LEFT JOIN users ub ON p.updated_by_id = ub.id
      LEFT JOIN events e ON p.event_id = e.id
    `;
    const params = [];

    if (eventId && eventId !== 'all') {
      sql += ` WHERE p.event_id = $1 OR u.event_id = $1`;
      params.push(eventId);
    }

    sql += ` ORDER BY p.id DESC`;
    const result = await query(sql, params);

    const photos = result.rows.map((row) => ({
      id: row.id,
      watermarkedUrl: row.watermarked_url,
      originalUrl: row.original_url,
      originalFilename: row.original_filename || `IMG_${row.id}.jpg`,
      price: Number(row.price),
      bibTags: row.bib_tags,
      orientation: row.orientation || 'portrait',
      photographerName: row.photographer_name || 'Fotografer',
      eventId: row.event_id,
      eventTitle: row.event_title || 'Semua Event',
      updatedByName: row.updated_by_name || null,
      updatedByRole: row.updated_by_role || null,
      createdAt: row.created_at,
    }));

    return res.json({ success: true, photos });
  } catch (error) {
    console.error('Fetch Admin Photos Error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil foto galeri.' });
  }
};

/**
 * PATCH /api/photos/admin/:id
 * Super Admin: Update harga dan/atau BIB tag foto serta catat updated_by_id
 */
const updatePhotoAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { price, bibTags } = req.body;
    const adminUserId = req.user.id;

    const priceVal = price !== undefined && price !== null && String(price).trim() !== '' ? Number(price) : null;
    const bibVal = bibTags !== undefined && bibTags !== null ? String(bibTags).trim() : null;

    const result = await query(
      `UPDATE photos 
       SET price = COALESCE($1, price), 
           bib_tags = COALESCE($2, bib_tags),
           updated_by_id = $3
       WHERE id = $4
       RETURNING *`,
      [priceVal, bibVal, adminUserId, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Foto tidak ditemukan.' });
    }

    const updated = result.rows[0];

    return res.json({
      success: true,
      message: 'Detail foto berhasil diperbarui oleh Super Admin.',
      photo: {
        id: updated.id,
        price: Number(updated.price),
        bibTags: updated.bib_tags,
        updatedById: adminUserId,
      },
    });
  } catch (error) {
    console.error('Update Photo Admin Error:', error);
    res.status(500).json({ success: false, message: 'Gagal memperbarui foto.' });
  }
};

/**
 * PATCH /api/photos/admin/bulk-update
 * Super Admin: Update harga dan/atau BIB tag foto secara massal
 */
const bulkUpdatePhotosAdmin = async (req, res) => {
  try {
    const { photoIds = [], price, bibTags } = req.body;
    const adminUserId = req.user.id;

    if (!Array.isArray(photoIds) || photoIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Pilih minimal 1 foto untuk diubah.' });
    }

    const priceVal = price !== undefined && price !== null && String(price).trim() !== '' ? Number(price) : null;
    const bibVal = bibTags !== undefined && bibTags !== null && String(bibTags).trim() !== '' ? String(bibTags).trim() : null;

    if (priceVal === null && bibVal === null) {
      return res.status(400).json({ success: false, message: 'Isi harga atau tag BIB yang ingin diubah.' });
    }

    await query(
      `UPDATE photos 
       SET price = COALESCE($1, price), 
           bib_tags = COALESCE($2, bib_tags),
           updated_by_id = $3
       WHERE id = ANY($4::int[])`,
      [priceVal, bibVal, adminUserId, photoIds]
    );

    return res.json({
      success: true,
      message: `Berhasil memperbarui ${photoIds.length} foto!`,
    });
  } catch (error) {
    console.error('Bulk Update Photos Admin Error:', error);
    res.status(500).json({ success: false, message: 'Gagal memperbarui foto secara massal.' });
  }
};

/**
 * DELETE /api/photos/admin/:id
 * Super Admin: Hapus foto dari database
 */
const deletePhotoAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM photos WHERE id = $1', [id]);
    return res.json({ success: true, message: 'Foto berhasil dihapus oleh Super Admin.' });
  } catch (error) {
    console.error('Delete Photo Admin Error:', error);
    res.status(500).json({ success: false, message: 'Gagal menghapus foto.' });
  }
};

module.exports = {
  getPhotos,
  getAdminPhotos,
  uploadPhotos,
  getMyPhotos,
  updatePhotoPrice,
  updatePhoto,
  updatePhotoAdmin,
  bulkUpdatePhotosAdmin,
  deletePhoto,
  deletePhotoAdmin,
  proxyR2Image,
};
