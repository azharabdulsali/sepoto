const { query } = require('../config/db');
const { getPresignedDownloadUrl, uploadToR2 } = require('../services/r2Service');

/** Build today's date string in YYYYMMDD format */
function buildDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

/**
 * Fetch a user's event_id from the database.
 * Falls back to null when the user has no assigned event.
 */
async function resolveUserEventId(userId) {
  const result = await query('SELECT event_id FROM users WHERE id = $1', [userId]);
  return result.rows[0]?.event_id ?? null;
}

/**
 * Return the next sequential order number scoped to an event and today's date.
 * Format: SEPOTO-E{eventId}-YYYYMMDD-XXXX
 */
async function generateSequentialOrderNumber(eventId = null) {
  const eventTag = eventId ? `E${eventId}` : 'E1';
  const prefix = `SEPOTO-${eventTag}-${buildDateString()}`;

  const result = await query(
    `SELECT COUNT(*) as count FROM transactions WHERE order_number LIKE $1`,
    [`${prefix}-%`]
  );

  const sequence = parseInt(result.rows[0].count, 10) + 1;
  return `${prefix}-${String(sequence).padStart(4, '0')}`;
}

/**
 * GET /api/transactions/next-order-number
 * Returns the next available order number for the requesting user's event.
 */
const getNextOrderNumber = async (req, res) => {
  try {
    const eventId = req.query.eventId
      || req.user?.eventId
      || (req.user?.id ? await resolveUserEventId(req.user.id) : null);

    const orderNumber = await generateSequentialOrderNumber(eventId);
    return res.json({ success: true, orderNumber });
  } catch (error) {
    console.error('Get Next Order Number Error:', error);
    res.status(500).json({ success: false, message: 'Gagal mendapatkan nomor order.' });
  }
};

async function isOrderNumberTaken(orderNumber) {
  const result = await query(
    'SELECT id FROM transactions WHERE order_number = $1',
    [orderNumber]
  );
  return result.rows.length > 0;
}

async function insertTransactionItems(transactionId, photoIds) {
  for (const photoId of photoIds) {
    await query(
      `INSERT INTO transaction_items (transaction_id, photo_id, price_at_purchase)
       SELECT $1, id, price FROM photos WHERE id = $2`,
      [transactionId, photoId]
    );
  }
}

/**
 * POST /api/transactions
 * Create a new transaction (checkout).
 */
const createTransaction = async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderNumber, totalAmount, photoIds = [] } = req.body;

    if (!totalAmount || photoIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Data transaksi tidak lengkap.' });
    }

    const userEventId = req.user?.eventId || await resolveUserEventId(userId);

    const isDuplicateOrderNumber = orderNumber && await isOrderNumberTaken(orderNumber);
    const finalOrderNumber = (!orderNumber || isDuplicateOrderNumber)
      ? await generateSequentialOrderNumber(userEventId)
      : orderNumber;

    const txResult = await query(
      `INSERT INTO transactions (order_number, user_id, total_amount, status)
       VALUES ($1, $2, $3, 'pending') RETURNING *`,
      [finalOrderNumber, userId, totalAmount]
    );
    const transaction = txResult.rows[0];

    await insertTransactionItems(transaction.id, photoIds);

    return res.json({ success: true, message: 'Transaksi berhasil dibuat!', transaction });
  } catch (error) {
    console.error('Create Transaction Error:', error);
    res.status(500).json({ success: false, message: 'Gagal membuat transaksi.' });
  }
};

function buildTransactionEventFilter(role, requestEventId, adminEventId) {
  const targetEventId = (requestEventId && requestEventId !== 'all') ? requestEventId : adminEventId;
  if (role === 'admin') {
    return { clause: ' WHERE (u.event_id = $1 OR p.event_id = $1)', params: [targetEventId || 1] };
  }
  if (requestEventId && requestEventId !== 'all') {
    return { clause: ' WHERE (u.event_id = $1 OR p.event_id = $1)', params: [requestEventId] };
  }
  return { clause: '', params: [] };
}

function mapTransactionRow(row) {
  const rawItems = Array.isArray(row.items) ? row.items : [];
  const items = rawItems.map((item) => ({
    ...item,
    price: Number(item.price || 0),
  }));

  return {
    id: row.id,
    orderNumber: row.order_number,
    userName: row.user_name || 'Peserta',
    bibNumber: row.bib_number || 'Umum',
    total: Number(row.total_amount || 0),
    status: row.status,
    paymentProofUrl: row.payment_proof_url || null,
    approvedByName: row.approved_by_name || null,
    approvedByRole: row.approved_by_role || null,
    createdAt: new Date(row.created_at).toLocaleString('id-ID'),
    items,
  };
}

const TRANSACTION_SELECT_SQL = `
  SELECT
    t.id, t.order_number, t.status, t.total_amount, t.created_at,
    t.payment_proof_url,
    u.name as user_name, u.bib_number, u.event_id,
    ab.name as approved_by_name, ab.role as approved_by_role,
    COALESCE(
      json_agg(
        json_build_object(
          'photoId',          p.id,
          'watermarkedUrl',   p.watermarked_url,
          'originalFilename', p.original_filename,
          'price',            COALESCE(ti.price_at_purchase, p.price, 0),
          'photographerId',   p.photographer_id,
          'photographerName', ph.name
        ) ORDER BY ti.id
      ) FILTER (WHERE p.id IS NOT NULL),
      '[]'
    ) as items
  FROM transactions t
  LEFT JOIN users u ON t.user_id = u.id
  LEFT JOIN users ab ON t.approved_by_id = ab.id
  LEFT JOIN transaction_items ti ON ti.transaction_id = t.id
  LEFT JOIN photos p ON p.id = ti.photo_id
  LEFT JOIN users ph ON p.photographer_id = ph.id
`;

/**
 * GET /api/transactions
 * List all transactions for admins, with optional event filter.
 */
const getTransactions = async (req, res) => {
  try {
    const { eventId, page, limit } = req.query;
    const adminEventId = req.user?.eventId || (req.user?.id ? await resolveUserEventId(req.user.id) : null);
    const { clause, params } = buildTransactionEventFilter(req.user?.role, eventId, adminEventId);

    // Total Count - Include joins for transaction_items and photos so p.event_id is valid
    const countSql = `
      SELECT COUNT(DISTINCT t.id)
      FROM transactions t
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN transaction_items ti ON ti.transaction_id = t.id
      LEFT JOIN photos p ON p.id = ti.photo_id
      ${clause}
    `;
    const countRes = await query(countSql, params);
    const total = parseInt(countRes.rows[0].count, 10);

    let sql = `
      ${TRANSACTION_SELECT_SQL}
      ${clause}
      GROUP BY t.id, u.name, u.bib_number, u.event_id, ab.name, ab.role
      ORDER BY t.id DESC
    `;

    // Pagination
    const pageNum = page ? parseInt(page, 10) : null;
    const limitNum = limit ? parseInt(limit, 10) : null;

    if (pageNum && limitNum) {
      const offset = (pageNum - 1) * limitNum;
      sql += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limitNum, offset);
    }

    const result = await query(sql, params);
    const totalPages = limitNum ? Math.ceil(total / limitNum) : 1;

    return res.json({
      success: true,
      transactions: result.rows.map(mapTransactionRow),
      total,
      page: pageNum || 1,
      totalPages: totalPages || 1,
    });
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
 * Update status transaksi (Admin: approve / reject, Super Admin: undo to pending)
 */
const updateTransactionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'approved', 'rejected', or 'pending'
    const adminUserId = req.user?.id || null;
    const adminRole = req.user?.role || null;

    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status transaksi tidak valid.' });
    }

    // Hanya Super Admin yang diizinkan mengembalikan status transaksi ke 'pending' (Undo)
    if (status === 'pending' && adminRole !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Akses ditolak. Hanya Super Admin yang diizinkan mengembalikan status pesanan ke Menunggu Verifikasi.',
      });
    }

    // Jika di-undo ke pending, reset approved_by_id menjadi NULL
    const approvedById = status === 'pending' ? null : adminUserId;

    const result = await query(
      'UPDATE transactions SET status = $1, approved_by_id = $2 WHERE id = $3 RETURNING *',
      [status, approvedById, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan.' });
    }

    const statusMessageMap = {
      approved: 'Status transaksi berhasil disetujui.',
      rejected: 'Status transaksi berhasil ditolak.',
      pending: 'Status transaksi berhasil dikembalikan ke Menunggu Verifikasi (Undo).',
    };

    return res.json({
      success: true,
      message: statusMessageMap[status] || `Status transaksi berhasil diperbarui menjadi ${status}.`,
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
      const baseUrl = process.env.BACKEND_URL ? process.env.BACKEND_URL.replace(/\/$/, '') : `http://localhost:${process.env.PORT || 5000}`;
      downloadUrl = `${baseUrl}/api/photos/file/${key}?download=1`;
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

    const archiverModule = require('archiver');
    const { r2Client } = require('../services/r2Service');
    const { GetObjectCommand } = require('@aws-sdk/client-s3');
    const fs = require('fs');
    const path = require('path');

    // 3. Kumpulkan semua buffer foto terlebih dahulu SEBELUM menulis header HTTP response
    const photoBuffers = [];
    for (let i = 0; i < itemsRes.rows.length; i++) {
      const item = itemsRes.rows[i];
      const filename = item.original_filename || `IMG_${item.id}.jpg`;
      let buffer = null;

      // Layer 1: Coba ambil dari R2 / S3 Storage
      try {
        const match = (item.original_url || '').match(/(original\/[^?#]+)/);
        const key = match
          ? match[1]
          : (item.original_url || '').replace(/^https?:\/\/[^\/]+\/(api\/photos\/file\/)?/, '');

        if (key && r2Client) {
          const getCmd = new GetObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME || 'sepoto-photos',
            Key: key,
          });
          const r2Response = await r2Client.send(getCmd);
          const chunks = [];
          const webStream = r2Response.Body;
          if (typeof webStream.getReader === 'function') {
            const reader = webStream.getReader();
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              chunks.push(Buffer.isBuffer(value) ? value : Buffer.from(value));
            }
          } else {
            for await (const chunk of webStream) {
              chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
            }
          }
          buffer = Buffer.concat(chunks);
        }
      } catch (r2Err) {
        console.warn(`[ZIP] R2 fetch failed for photo #${item.id}:`, r2Err.message);
      }

      // Layer 2: Fallback HTTP fetch jika original_url berupa URL lengkap
      if ((!buffer || buffer.length === 0) && item.original_url && /^https?:\/\//.test(item.original_url)) {
        try {
          const resp = await fetch(item.original_url);
          if (resp.ok) {
            const arrayBuf = await resp.arrayBuffer();
            buffer = Buffer.from(arrayBuf);
          }
        } catch (httpErr) {
          console.warn(`[ZIP] HTTP fetch fallback failed for photo #${item.id}:`, httpErr.message);
        }
      }

      // Layer 3: Fallback Local File System
      if ((!buffer || buffer.length === 0) && item.original_url) {
        try {
          const cleanPath = item.original_url.replace(/^\//, '');
          const localPath = path.resolve(process.cwd(), cleanPath);
          if (fs.existsSync(localPath)) {
            buffer = fs.readFileSync(localPath);
          }
        } catch (fsErr) {
          console.warn(`[ZIP] Local FS fallback failed for photo #${item.id}:`, fsErr.message);
        }
      }

      if (buffer && buffer.length > 0) {
        photoBuffers.push({ buffer, filename });
      }
    }

    if (photoBuffers.length === 0) {
      return res.status(500).json({
        success: false,
        message: 'Gagal mengambil berkas foto dari penyimpanan server.',
      });
    }

    // 4. Kirim header ZIP setelah buffer terbukti valid
    const zipName = `${tx.order_number || `SEPOTO-TX-${transactionId}`}.zip`;
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${zipName}"`);

    const archive = typeof archiverModule === 'function'
      ? archiverModule('zip', { zlib: { level: 5 } })
      : new archiverModule.ZipArchive({ zlib: { level: 5 } });

    archive.on('error', (err) => {
      console.error('Archiver error:', err);
      if (!res.headersSent) res.status(500).send('Gagal membuat ZIP.');
    });

    archive.pipe(res);

    for (const { buffer, filename } of photoBuffers) {
      archive.append(buffer, { name: filename });
    }

    await archive.finalize();
  } catch (error) {
    console.error('Download Zip Error:', error);
    if (!res.headersSent) {
      res.status(500).send('Gagal membuat file ZIP.');
    }
  }
};

/**
 * PATCH /api/transactions/:id/proof
 * Upload bukti pembayaran — maks 5MB, hanya image/*
 */
const uploadPaymentProof = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Pastikan transaksi milik user yang sedang login
    const txCheck = await query(
      'SELECT id, status FROM transactions WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    if (txCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan.' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'File bukti pembayaran tidak ditemukan.' });
    }

    // Validasi ukuran file (double-check, multer sudah handle tapi defence in depth)
    if (req.file.size > 5 * 1024 * 1024) {
      return res.status(400).json({ success: false, message: 'Ukuran file melebihi batas 5MB.' });
    }

    // Tentukan extension dari mimetype
    const mimeExtMap = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'image/heic': 'heic',
      'image/heif': 'heif',
    };
    const ext = mimeExtMap[req.file.mimetype] || 'jpg';
    const key = `payment-proofs/${id}-${Date.now()}.${ext}`;

    // Upload ke R2
    const proofUrl = await uploadToR2(req.file.buffer, key, req.file.mimetype);

    // Simpan URL ke database
    await query(
      'UPDATE transactions SET payment_proof_url = $1 WHERE id = $2',
      [proofUrl, id]
    );

    return res.json({
      success: true,
      message: 'Bukti pembayaran berhasil diupload.',
      proofUrl,
    });
  } catch (error) {
    console.error('Upload Payment Proof Error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengupload bukti pembayaran.' });
  }
};

module.exports = {
  createTransaction,
  getNextOrderNumber,
  getTransactions,
  getUserTransactions,
  updateTransactionStatus,
  uploadPaymentProof,
  getDownloadUrl,
  downloadTransactionZip,
};
