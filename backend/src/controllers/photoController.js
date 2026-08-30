const bcrypt = require('bcrypt');
const { query } = require('../config/db');
const { uploadToR2, deleteFileEverywhere } = require('../services/r2Service');
const { generateWatermark } = require('../utils/watermark');

/**
 * GET /api/photos
 * Ambil semua foto galeri yang dijual (filter by BIB opsional)
 */
const getPhotos = async (req, res) => {
  try {
    const { bib, eventId, page, limit } = req.query;
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

    // Total count query
    const countSql = `SELECT COUNT(*) FROM (${sql}) AS count_table`;
    const countRes = await query(countSql, params);
    const total = parseInt(countRes.rows[0].count, 10);

    sql += ` ORDER BY p.id DESC`;

    // Pagination LIMIT & OFFSET
    const pageNum = page ? parseInt(page, 10) : null;
    const limitNum = limit ? parseInt(limit, 10) : null;

    if (pageNum && limitNum) {
      const offset = (pageNum - 1) * limitNum;
      sql += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limitNum, offset);
    }

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

    const totalPages = limitNum ? Math.ceil(total / limitNum) : 1;

    return res.json({
      success: true,
      photos,
      total,
      page: pageNum || 1,
      totalPages: totalPages || 1,
      hasMore: pageNum && limitNum ? pageNum < totalPages : false,
    });
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
    const { price = 0, bibTags = '', orientation = 'portrait', eventId } = req.body;
    const photoPrice = Number(price) || 0;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, message: 'Tidak ada file foto yang diunggah.' });
    }

    // Ambil event_id fotografer (dari body, token, atau tabel users)
    let photoEventId = eventId ? Number(eventId) : req.user?.eventId;
    if (!photoEventId) {
      const uRes = await query('SELECT event_id FROM users WHERE id = $1', [photographerId]);
      photoEventId = uRes.rows[0]?.event_id;
    }
    if (!photoEventId) {
      const eventRes = await query('SELECT id FROM events WHERE is_active = TRUE ORDER BY id DESC LIMIT 1');
      photoEventId = eventRes.rows.length > 0 ? eventRes.rows[0].id : 1;
    }

    const uploadedRecords = [];
    const BATCH_SIZE = 3; // Proses 3 foto secara paralel agar lebih cepat dan mencegah Timeout

    for (let i = 0; i < files.length; i += BATCH_SIZE) {
      const batch = files.slice(i, i + BATCH_SIZE);
      
      const batchPromises = batch.map(async (file) => {
        const timeId = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const originalName = file.originalname || `IMG_${timeId}.jpg`;
        const originalKey = `original/RAW-${timeId}.jpg`;
        const watermarkedKey = `watermarked/WM-${timeId}.jpg`;

        // 1. Generate Watermark Buffer dengan Sharp
        const wmBuffer = await generateWatermark(file.buffer);

        // 2. Upload file asli (clean) & watermarked ke Cloudflare R2 secara paralel
        const [originalUrl, watermarkedUrl] = await Promise.all([
          uploadToR2(file.buffer, originalKey, file.mimetype),
          uploadToR2(wmBuffer, watermarkedKey, 'image/jpeg')
        ]);

        // 3. Simpan metadata ke PostgreSQL
        const dbRes = await query(
          `INSERT INTO photos (event_id, photographer_id, original_url, watermarked_url, price, bib_tags, orientation, original_filename)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
          [photoEventId, photographerId, originalUrl, watermarkedUrl, photoPrice, bibTags, orientation, originalName]
        );

        return dbRes.rows[0];
      });

      // Tunggu batch ini selesai sebelum lanjut ke batch berikutnya
      const batchResults = await Promise.all(batchPromises);
      uploadedRecords.push(...batchResults);
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
 * Fotografer ambil foto miliknya sendiri pada event aktif saat ini
 */
const getMyPhotos = async (req, res) => {
  try {
    const photographerId = req.user.id;
    const { page, limit } = req.query;

    let eventId = req.user?.eventId;
    if (!eventId) {
      const uRes = await query('SELECT event_id FROM users WHERE id = $1', [photographerId]);
      eventId = uRes.rows[0]?.event_id;
    }

    let sql = `SELECT * FROM photos WHERE photographer_id = $1`;
    const params = [photographerId];

    if (eventId) {
      sql += ` AND (event_id = $2 OR event_id IS NULL)`;
      params.push(eventId);
    }

    // Total count
    const countSql = `SELECT COUNT(*) FROM (${sql}) AS count_table`;
    const countRes = await query(countSql, params);
    const total = parseInt(countRes.rows[0].count, 10);

    sql += ` ORDER BY id DESC`;

    // Pagination
    const pageNum = page ? parseInt(page, 10) : null;
    const limitNum = limit ? parseInt(limit, 10) : null;

    if (pageNum && limitNum) {
      const offset = (pageNum - 1) * limitNum;
      sql += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limitNum, offset);
    }

    const result = await query(sql, params);

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

    const totalPages = limitNum ? Math.ceil(total / limitNum) : 1;

    return res.json({
      success: true,
      photos,
      total,
      page: pageNum || 1,
      totalPages: totalPages || 1,
      hasMore: pageNum && limitNum ? pageNum < totalPages : false,
    });
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

    const priceVal = price !== undefined && price !== null ? (String(price).trim() !== '' ? Number(price) : 0) : null;
    const bibVal = bibTags !== undefined && bibTags !== null ? String(bibTags).trim() : null;

    const result = await query(
      `UPDATE photos 
       SET price = COALESCE($1, price), 
           bib_tags = COALESCE($2, bib_tags),
           updated_by_id = $3
       WHERE id = $4 AND photographer_id = $3 
       RETURNING *`,
      [priceVal, bibVal, photographerId, id]
    );

    const updated = result.rows[0];

    return res.json({
      success: true,
      message: 'Detail foto berhasil disimpan ke database.',
      photo: {
        id: updated.id,
        watermarkedUrl: updated.watermarked_url,
        originalUrl: updated.original_url,
        price: Number(updated.price || 0),
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
 * Helper untuk mengekstrak key file (path relatif) dari URL
 */
const extractKey = (url) => {
  if (!url) return null;
  const matchOriginal = url.match(/(original\/[^?#]+)/);
  if (matchOriginal) return matchOriginal[1];
  const matchWatermarked = url.match(/(watermarked\/[^?#]+)/);
  if (matchWatermarked) return matchWatermarked[1];
  return url.replace(/^https?:\/\/[^\/]+\/(api\/photos\/file\/)?/, '');
};

/**
 * DELETE /api/photos/:id
 * Hapus foto (validasi kepemilikan: hanya pemilik foto yang bisa hapus)
 */
const deletePhoto = async (req, res) => {
  try {
    const { id } = req.params;
    const photographerId = req.user.id;

    // Validasi kepemilikan foto dan ambil URL untuk menghapus file
    const photoCheck = await query(
      'SELECT id, original_url, watermarked_url FROM photos WHERE id = $1 AND photographer_id = $2',
      [id, photographerId]
    );

    if (photoCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki hak untuk menghapus foto ini atau foto tidak ditemukan.',
      });
    }

    const photo = photoCheck.rows[0];

    // Hapus file fisik dari R2 dan lokal
    const originalKey = extractKey(photo.original_url);
    const watermarkedKey = extractKey(photo.watermarked_url);
    if (originalKey) await deleteFileEverywhere(originalKey);
    if (watermarkedKey) await deleteFileEverywhere(watermarkedKey);

    // Hapus dari database
    await query('DELETE FROM photos WHERE id = $1', [id]);

    return res.json({
      success: true,
      message: 'Foto berhasil dihapus secara permanen.',
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
    const fs = require('fs');
    const path = require('path');
    const key = req.params.folder && req.params.filename ? `${req.params.folder}/${req.params.filename}` : req.params[0];

    const customName = req.query.name || req.query.filename;
    const downloadName = customName
      ? decodeURIComponent(customName)
      : (req.params.filename ? `SEPOTO-HD-${req.params.filename}` : 'SEPOTO-HD-PHOTO.jpg');

    // Check local uploads disk storage first
    const localFilePath = path.join(__dirname, '../../uploads', key);
    if (fs.existsSync(localFilePath)) {
      if (req.query.download === '1' || req.query.download === 'true') {
        return res.download(localFilePath, downloadName);
      }
      return res.sendFile(localFilePath);
    }

    const { r2Client } = require('../services/r2Service');
    const { GetObjectCommand } = require('@aws-sdk/client-s3');

    if (!r2Client) {
      return res.status(404).send('Gambar tidak ditemukan.');
    }

    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME || 'sepoto-photos',
      Key: key,
    });

    const response = await r2Client.send(command);
    res.setHeader('Content-Type', response.ContentType || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=31536000');

    if (req.query.download === '1' || req.query.download === 'true') {
      res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
    }

    response.Body.pipe(res);
  } catch (error) {
    if (error.name !== 'NoSuchKey' && error.Code !== 'NoSuchKey') {
      console.error('Proxy R2 Image Error:', error);
    }
    res.status(404).send('Gambar tidak ditemukan.');
  }
};

/**
 * GET /api/photos/admin
 * Super Admin: Ambil semua foto galeri (dengan info pembaru & event)
 */
const getAdminPhotos = async (req, res) => {
  try {
    const { eventId, page, limit } = req.query;
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

    // Total count query
    const countSql = `SELECT COUNT(*) FROM (${sql}) AS count_table`;
    const countRes = await query(countSql, params);
    const total = parseInt(countRes.rows[0].count, 10);

    sql += ` ORDER BY p.id DESC`;

    // Pagination LIMIT & OFFSET
    const pageNum = page ? parseInt(page, 10) : null;
    const limitNum = limit ? parseInt(limit, 10) : null;

    if (pageNum && limitNum) {
      const offset = (pageNum - 1) * limitNum;
      sql += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limitNum, offset);
    }

    const result = await query(sql, params);

    const photos = result.rows.map((row) => ({
      id: row.id,
      watermarkedUrl: row.watermarked_url,
      originalUrl: row.original_url,
      originalFilename: row.original_filename || `IMG_${row.id}.jpg`,
      price: Number(row.price || 0),
      bibTags: row.bib_tags,
      orientation: row.orientation || 'portrait',
      photographerId: row.photographer_id,
      photographerName: row.photographer_name || 'Fotografer',
      eventId: row.event_id,
      eventTitle: row.event_title || 'Semua Event',
      updatedByName: row.updated_by_name || row.photographer_name || 'Fotografer',
      updatedByRole: row.updated_by_role || 'fotografer',
      createdAt: row.created_at,
    }));

    const totalPages = limitNum ? Math.ceil(total / limitNum) : 1;

    return res.json({
      success: true,
      photos,
      total,
      page: pageNum || 1,
      totalPages: totalPages || 1,
      hasMore: pageNum && limitNum ? pageNum < totalPages : false,
    });
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

    const finalPrice = price !== undefined && price !== null ? (String(price).trim() !== '' ? Number(price) : 0) : null;
    const finalBib = bibTags !== undefined && bibTags !== null ? String(bibTags).trim() : null;

    const result = await query(
      `UPDATE photos 
       SET price = COALESCE($1, price), 
           bib_tags = COALESCE($2, bib_tags),
           updated_by_id = $3
       WHERE id = $4
       RETURNING *`,
      [finalPrice, finalBib, adminUserId, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Foto tidak ditemukan.' });
    }

    const updated = result.rows[0];

    const userRes = await query('SELECT name, role FROM users WHERE id = $1', [adminUserId]);
    const updater = userRes.rows[0] || {};

    return res.json({
      success: true,
      message: 'Detail foto berhasil diperbarui oleh Super Admin.',
      photo: {
        id: updated.id,
        price: Number(updated.price || 0),
        bibTags: updated.bib_tags,
        updatedById: adminUserId,
        updatedByName: updater.name || 'Super Admin',
        updatedByRole: updater.role || 'super_admin',
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

    const hasPrice = price !== undefined && price !== null;
    const hasBib = bibTags !== undefined && bibTags !== null && String(bibTags).trim() !== '';

    if (!hasPrice && !hasBib) {
      return res.status(400).json({ success: false, message: 'Isi harga atau tag BIB yang ingin diubah.' });
    }

    const finalPrice = hasPrice ? (String(price).trim() !== '' ? Number(price) : 0) : null;
    const finalBib = hasBib ? String(bibTags).trim() : null;

    await query(
      `UPDATE photos 
       SET price = COALESCE($1, price), 
           bib_tags = COALESCE($2, bib_tags),
           updated_by_id = $3
       WHERE id = ANY($4::int[])`,
      [finalPrice, finalBib, adminUserId, photoIds]
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
 * Super Admin: Hapus foto dari database dan storage
 */
const deletePhotoAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const photoCheck = await query('SELECT original_url, watermarked_url FROM photos WHERE id = $1', [id]);
    if (photoCheck.rows.length === 0) {
       return res.status(404).json({ success: false, message: 'Foto tidak ditemukan.' });
    }

    const photo = photoCheck.rows[0];

    // Hapus file fisik
    const originalKey = extractKey(photo.original_url);
    const watermarkedKey = extractKey(photo.watermarked_url);
    if (originalKey) await deleteFileEverywhere(originalKey);
    if (watermarkedKey) await deleteFileEverywhere(watermarkedKey);

    // Hapus dari database
    await query('DELETE FROM photos WHERE id = $1', [id]);
    return res.json({ success: true, message: 'Foto berhasil dihapus secara permanen oleh Super Admin.' });
  } catch (error) {
    console.error('Delete Photo Admin Error:', error);
    res.status(500).json({ success: false, message: 'Gagal menghapus foto.' });
  }
};

/**
 * DELETE /api/photos/admin/event/:eventId/all
 * Super Admin: Hapus SEMUA foto pada event tertentu (dari R2, disk lokal VPS, dan Database).
 * Validasi keamanan ganda: password Super Admin + nama event harus sesuai.
 * Transaksi peserta TIDAK dihapus.
 */
const deleteAllEventPhotos = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { password, eventTitle } = req.body;
    const adminId = req.user.id;

    // 1. Validasi input
    if (!password || !eventTitle) {
      return res.status(400).json({
        success: false,
        message: 'Password dan nama event wajib diisi untuk konfirmasi.',
      });
    }

    // 2. Verifikasi password Super Admin
    const userRes = await query('SELECT password_hash, role FROM users WHERE id = $1', [adminId]);
    if (userRes.rows.length === 0 || userRes.rows[0].role !== 'super_admin') {
      return res.status(403).json({ success: false, message: 'Akses ditolak.' });
    }

    const isMatch = await bcrypt.compare(password, userRes.rows[0].password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Password Super Admin tidak valid.' });
    }

    // 3. Verifikasi nama event sesuai
    const eventRes = await query('SELECT id, title FROM events WHERE id = $1', [eventId]);
    if (eventRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Event tidak ditemukan.' });
    }

    const actualTitle = eventRes.rows[0].title.trim().toLowerCase();
    const inputTitle = eventTitle.trim().toLowerCase();
    if (actualTitle !== inputTitle) {
      return res.status(400).json({
        success: false,
        message: 'Nama event yang diketik tidak sesuai. Pastikan Anda mengetik nama event dengan benar.',
      });
    }

    // 4. Ambil semua foto pada event ini
    const photosRes = await query(
      'SELECT id, original_url, watermarked_url FROM photos WHERE event_id = $1',
      [eventId]
    );

    const photos = photosRes.rows;
    if (photos.length === 0) {
      return res.json({ success: true, message: 'Tidak ada foto yang perlu dihapus pada event ini.', deletedCount: 0 });
    }

    // 5. Hapus record foto dari database TERLEBIH DAHULU agar respons API cepat
    const deleteResult = await query('DELETE FROM photos WHERE event_id = $1', [eventId]);
    const deletedCount = deleteResult.rowCount || photos.length;

    console.log(`🗑️ Super Admin (ID: ${adminId}) memulai penghapusan ${deletedCount} foto pada Event "${eventRes.rows[0].title}" (ID: ${eventId})`);

    // Kirim respons sukses segera ke frontend agar tidak terjadi Timeout di VPS/Nginx
    res.json({
      success: true,
      message: `Memproses penghapusan ${deletedCount} foto. Data telah dihapus dari sistem, file fisik sedang dihapus di latar belakang.`,
      deletedCount,
    });

    // 6. Lakukan penghapusan file dari R2 dan lokal secara Asynchronous (Background Job)
    // Menggunakan sistem antrean (batch) agar VPS tidak terbebani jika menghapus >10.000 file sekaligus.
    (async () => {
      try {
        let deletedFileCount = 0;
        const BATCH_SIZE = 50; // Hapus 50 foto per proses
        
        for (let i = 0; i < photos.length; i += BATCH_SIZE) {
          const batch = photos.slice(i, i + BATCH_SIZE);
          const deletePromises = [];

          for (const photo of batch) {
            const originalKey = extractKey(photo.original_url);
            const watermarkedKey = extractKey(photo.watermarked_url);

            if (originalKey) {
              deletePromises.push(deleteFileEverywhere(originalKey).then(() => deletedFileCount++));
            }
            if (watermarkedKey) {
              deletePromises.push(deleteFileEverywhere(watermarkedKey).then(() => deletedFileCount++));
            }
          }

          // Tunggu batch ini selesai sebelum lanjut ke batch berikutnya
          await Promise.allSettled(deletePromises);
          
          // Jeda 100ms agar CPU dan koneksi jaringan VPS bisa bernapas
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        console.log(`✅ [Background Job] Selesai menghapus ${deletedFileCount} file fisik dari Event "${eventRes.rows[0].title}" (ID: ${eventId})`);
      } catch (bgError) {
        console.error('❌ [Background Job] Error saat menghapus file:', bgError);
      }
    })();

  } catch (error) {
    console.error('Delete All Event Photos Error:', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Gagal menghapus foto event.' });
    }
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
  deleteAllEventPhotos,
  proxyR2Image,
};
