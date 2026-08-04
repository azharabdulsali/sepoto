const { query } = require('../config/db');
const { getPresignedDownloadUrl } = require('../services/r2Service');

/**
 * Generates sequential order number: SEPOTO-YYYYMMDD-XXXX (e.g. SEPOTO-20260802-0001)
 */
async function generateSequentialOrderNumber() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const datePrefix = `SEPOTO-${year}${month}${day}`;

  // Hitung jumlah transaksi pada tanggal hari ini di database
  const result = await query(
    `SELECT COUNT(*) as count FROM transactions WHERE order_number LIKE $1`,
    [`${datePrefix}-%`]
  );

  const count = parseInt(result.rows[0].count, 10) + 1;
  const sequenceStr = String(count).padStart(4, '0');

  return `${datePrefix}-${sequenceStr}`;
}

/**
 * GET /api/transactions/next-order-number
 * Ambil nomor order sekuensial berikutnya untuk tanggal hari ini (User & Admin)
 */
const getNextOrderNumber = async (req, res) => {
  try {
    const orderNumber = await generateSequentialOrderNumber();
    return res.json({ success: true, orderNumber });
  } catch (error) {
    console.error('Get Next Order Number Error:', error);
    res.status(500).json({ success: false, message: 'Gagal mendapatkan nomor order.' });
  }
};

/**
 * POST /api/transactions
 * Buat transaksi / checkout cart
 */
const createTransaction = async (req, res) => {
  try {
    const userId = req.user.id; // Dari JWT token
    const { orderNumber, totalAmount, photoIds = [] } = req.body;

    if (!totalAmount || photoIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Data transaksi tidak lengkap.' });
    }

    let finalOrderNumber = orderNumber;
    if (!finalOrderNumber) {
      finalOrderNumber = await generateSequentialOrderNumber();
    } else {
      // Cek apakah orderNumber sudah ada di DB untuk mencegah duplikasi/race condition
      const checkResult = await query('SELECT id FROM transactions WHERE order_number = $1', [finalOrderNumber]);
      if (checkResult.rows.length > 0) {
        finalOrderNumber = await generateSequentialOrderNumber();
      }
    }

    // 1. Insert ke tabel transactions
    const txResult = await query(
      `INSERT INTO transactions (order_number, user_id, total_amount, status)
       VALUES ($1, $2, $3, 'pending') RETURNING *`,
      [finalOrderNumber, userId, totalAmount]
    );
    const transaction = txResult.rows[0];

    // 2. Insert ke transaction_items
    for (const photoId of photoIds) {
      await query(
        `INSERT INTO transaction_items (transaction_id, photo_id, price_at_purchase)
         SELECT $1, id, price FROM photos WHERE id = $2`,
        [transaction.id, photoId]
      );
    }

    return res.json({ success: true, message: 'Transaksi berhasil dibuat!', transaction });
  } catch (error) {
    console.error('Create Transaction Error:', error);
    res.status(500).json({ success: false, message: 'Gagal membuat transaksi.' });
  }
};

/**
 * GET /api/transactions
 * List semua transaksi (Super Admin & Admin)
 * Mendukung filter eventId
 */
const getTransactions = async (req, res) => {
  try {
    const { eventId } = req.query;
    let sql = `
      SELECT
        t.id, t.order_number, t.status, t.total_amount, t.created_at,
        u.name as user_name, u.bib_number, u.event_id,
        COALESCE(
          json_agg(
            json_build_object(
              'photoId',        p.id,
              'watermarkedUrl', p.watermarked_url,
              'originalFilename', p.original_filename
            ) ORDER BY ti.id
          ) FILTER (WHERE p.id IS NOT NULL),
          '[]'
        ) as items
      FROM transactions t
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN transaction_items ti ON ti.transaction_id = t.id
      LEFT JOIN photos p ON p.id = ti.photo_id
    `;
    const params = [];

    if (req.user && req.user.role === 'admin') {
      let adminEventId = req.user.eventId;
      if (!adminEventId) {
        const uRes = await query('SELECT event_id FROM users WHERE id = $1', [req.user.id]);
        adminEventId = uRes.rows[0]?.event_id;
      }
      sql += ` WHERE u.event_id = $1 OR p.event_id = $1`;
      params.push(adminEventId || 1);
    } else if (eventId && eventId !== 'all') {
      sql += ` WHERE u.event_id = $1 OR p.event_id = $1`;
      params.push(eventId);
    }

    sql += `
      GROUP BY t.id, u.name, u.bib_number, u.event_id
      ORDER BY t.id DESC
    `;

    const result = await query(sql, params);

    const transactions = result.rows.map((t) => ({
      id: t.id,
      orderNumber: t.order_number,
      userName: t.user_name || 'Peserta',
      bibNumber: t.bib_number || 'Umum',
      total: Number(t.total_amount),
      status: t.status,
      createdAt: new Date(t.created_at).toLocaleString('id-ID'),
      items: Array.isArray(t.items) ? t.items : [],
    }));

    return res.json({ success: true, transactions });
  } catch (error) {
    console.error('Fetch Transactions Error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil transaksi.' });
  }
};

/**
 * GET /api/transactions/my
 * List transaksi milik user yang sedang login
 */
const getUserTransactions = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await query(`
      SELECT t.*, 
        json_agg(json_build_object(
          'id', ti.id,
          'photoId', ti.photo_id,
          'priceAtPurchase', ti.price_at_purchase,
          'watermarkedUrl', p.watermarked_url,
          'originalUrl', p.original_url,
          'originalFilename', p.original_filename,
          'bibTags', p.bib_tags
        )) as items
      FROM transactions t
      LEFT JOIN transaction_items ti ON ti.transaction_id = t.id
      LEFT JOIN photos p ON ti.photo_id = p.id
      WHERE t.user_id = $1
      GROUP BY t.id
      ORDER BY t.id DESC
    `, [userId]);

    const transactions = result.rows.map((t) => ({
      id: t.id,
      orderNumber: t.order_number,
      total: Number(t.total_amount),
      status: t.status,
      createdAt: new Date(t.created_at).toLocaleString('id-ID'),
      items: t.items.filter((item) => item.id !== null),
    }));

    return res.json({ success: true, transactions });
  } catch (error) {
    console.error('Fetch User Transactions Error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil transaksi.' });
  }
};

/**
 * PATCH /api/transactions/:id/status
 * Update status transaksi (Admin only: approve / reject)
 */
const updateTransactionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'approved' atau 'rejected'

    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status transaksi tidak valid.' });
    }

    const result = await query(
      'UPDATE transactions SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan.' });
    }

    return res.json({
      success: true,
      message: `Status transaksi berhasil diperbarui menjadi ${status}.`,
      transaction: result.rows[0],
    });
  } catch (error) {
    console.error('Update Status Error:', error);
    res.status(500).json({ success: false, message: 'Gagal memperbarui status transaksi.' });
  }
};

/**
 * GET /api/transactions/:transactionId/download/:photoId
 * Generate link unduh file asli (hanya untuk transaksi yang sudah di-approve)
 */
const getDownloadUrl = async (req, res) => {
  try {
    const { transactionId, photoId } = req.params;
    const userId = req.user.id;

    // 1. Cek kepemilikan transaksi dan statusnya
    const txCheck = await query(
      `SELECT t.status 
       FROM transactions t
       JOIN transaction_items ti ON ti.transaction_id = t.id
       WHERE t.id = $1 AND t.user_id = $2 AND ti.photo_id = $3`,
      [transactionId, userId, photoId]
    );

    if (txCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Transaksi atau foto tidak ditemukan.',
      });
    }

    if (txCheck.rows[0].status !== 'approved') {
      return res.status(403).json({
        success: false,
        message: 'Transaksi belum disetujui. Foto hanya bisa diunduh setelah pembayaran di-approve.',
      });
    }

    // 2. Ambil original_url dan original_filename dari foto
    const photoRes = await query('SELECT original_url, original_filename FROM photos WHERE id = $1', [photoId]);
    if (photoRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Foto tidak ditemukan.' });
    }

    const originalUrl = photoRes.rows[0].original_url || '';
    const rawFileName = photoRes.rows[0].original_filename;

    // 3. Ekstrak R2 Key secara presisi (contoh: "original/RAW-123456.jpg")
    const match = originalUrl.match(/(original\/[^?#]+)/);
    const key = match ? match[1] : originalUrl.replace(/^https?:\/\/[^\/]+\/(api\/photos\/file\/)?/, '');

    const fileName = rawFileName || `IMG_${photoId}.jpg`;
    let downloadUrl;

    try {
      downloadUrl = await getPresignedDownloadUrl(key, 300, fileName);
    } catch (err) {
      console.warn('Presigned R2 URL failed, fallback to Express Proxy:', err);
      const port = process.env.PORT || 5000;
      downloadUrl = `http://localhost:${port}/api/photos/file/${key}?download=1`;
    }

    return res.json({
      success: true,
      downloadUrl,
      expiresIn: 300,
      message: 'Link download berlaku selama 5 menit.',
    });
  } catch (error) {
    console.error('Download URL Error:', error);
    res.status(500).json({ success: false, message: 'Gagal membuat link download.' });
  }
};

/**
 * GET /api/transactions/:transactionId/download-zip
 * Unduh seluruh foto asli dari transaksi yang disetujui dalam 1 file .ZIP
 */
const downloadTransactionZip = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const userId = req.user.id;

    // 1. Cek transaksi & status approved
    const txRes = await query(
      `SELECT t.id, t.order_number, t.status 
       FROM transactions t 
       WHERE t.id = $1 AND t.user_id = $2`,
      [transactionId, userId]
    );

    if (txRes.rows.length === 0) {
      return res.status(404).send('Transaksi tidak ditemukan.');
    }

    const tx = txRes.rows[0];
    if (tx.status !== 'approved') {
      return res.status(403).send('Transaksi belum disetujui.');
    }

    // 2. Ambil semua item foto
    const itemsRes = await query(
      `SELECT p.id, p.original_url, p.original_filename 
       FROM transaction_items ti 
       JOIN photos p ON p.id = ti.photo_id 
       WHERE ti.transaction_id = $1`,
      [transactionId]
    );

    if (itemsRes.rows.length === 0) {
      return res.status(404).send('Tidak ada foto dalam transaksi ini.');
    }

    const archiver = require('archiver');
    const { r2Client } = require('../services/r2Service');
    const { GetObjectCommand } = require('@aws-sdk/client-s3');
    const { Readable } = require('stream');

    const zipName = `${tx.order_number || `SEPOTO-TX-${transactionId}`}.zip`;
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${zipName}"`);

    // Gunakan level kompresi rendah (0 = store) supaya ZIP lebih cepat dan stabil
    const archive = archiver('zip', { zlib: { level: 0 } });

    // Jika archiver error, tutup response agar tidak hang
    archive.on('error', (err) => {
      console.error('Archiver error:', err);
      if (!res.headersSent) res.status(500).send('Gagal membuat ZIP.');
    });

    archive.pipe(res);

    // Kumpulkan semua foto dari R2 TERLEBIH DAHULU agar archive tidak finalize sebelum selesai
    const photoBuffers = [];
    for (let i = 0; i < itemsRes.rows.length; i++) {
      const item = itemsRes.rows[i];
      const match = (item.original_url || '').match(/(original\/[^?#]+)/);
      const key = match
        ? match[1]
        : (item.original_url || '').replace(/^https?:\/\/[^\/]+\/(api\/photos\/file\/)?/, '');
      const filename = item.original_filename || `IMG_${item.id}.jpg`;

      try {
        const getCmd = new GetObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME || 'sepoto-photos',
          Key: key,
        });
        const r2Response = await r2Client.send(getCmd);

        // Konversi Web ReadableStream / AWS SDK body ke Buffer
        // agar archiver mendapatkan data yang sudah lengkap
        const chunks = [];
        const webStream = r2Response.Body;

        // AWS SDK v3 Body bisa berupa ReadableStream (Web) atau Node Readable
        if (typeof webStream.getReader === 'function') {
          // Web ReadableStream → baca chunk per chunk
          const reader = webStream.getReader();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(Buffer.isBuffer(value) ? value : Buffer.from(value));
          }
        } else {
          // Node.js Readable stream
          for await (const chunk of webStream) {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
          }
        }

        const buffer = Buffer.concat(chunks);
        photoBuffers.push({ buffer, filename });
      } catch (err) {
        console.error(`Gagal mengambil foto ${item.id} untuk ZIP:`, err);
        // Lewati foto yang gagal, lanjutkan sisanya
      }
    }

    if (photoBuffers.length === 0) {
      archive.abort();
      return res.status(500).send('Gagal mengambil semua foto dari penyimpanan.');
    }

    // Tambahkan buffer ke archive
    for (const { buffer, filename } of photoBuffers) {
      archive.append(Readable.from(buffer), { name: filename });
    }

    await archive.finalize();
  } catch (error) {
    console.error('Download Zip Error:', error);
    if (!res.headersSent) {
      res.status(500).send('Gagal membuat file ZIP.');
    }
  }
};

module.exports = {
  createTransaction,
  getNextOrderNumber,
  getTransactions,
  getUserTransactions,
  updateTransactionStatus,
  getDownloadUrl,
  downloadTransactionZip,
};
