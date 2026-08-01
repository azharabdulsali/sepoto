const { query } = require('../config/db');
const { getPresignedDownloadUrl } = require('../services/r2Service');

/**
 * POST /api/transactions
 * Buat transaksi / checkout cart
 */
const createTransaction = async (req, res) => {
  try {
    const userId = req.user.id; // Dari JWT token
    const { orderNumber, totalAmount, photoIds = [] } = req.body;

    if (!orderNumber || !totalAmount || photoIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Data transaksi tidak lengkap.' });
    }

    // 1. Insert ke tabel transactions
    const txResult = await query(
      `INSERT INTO transactions (order_number, user_id, total_amount, status)
       VALUES ($1, $2, $3, 'pending') RETURNING *`,
      [orderNumber, userId, totalAmount]
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
 * List semua transaksi (admin only)
 */
const getTransactions = async (req, res) => {
  try {
    const result = await query(`
      SELECT t.*, u.name as user_name, u.bib_number
      FROM transactions t
      LEFT JOIN users u ON t.user_id = u.id
      ORDER BY t.id DESC
    `);

    const transactions = result.rows.map((t) => ({
      id: t.id,
      orderNumber: t.order_number,
      userName: t.user_name || 'Peserta',
      bibNumber: t.bib_number || 'Umum',
      total: Number(t.total_amount),
      status: t.status,
      createdAt: new Date(t.created_at).toLocaleString('id-ID'),
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
 * Approve / reject transaksi (admin only)
 */
const updateTransactionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'approved' | 'rejected'

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status harus "approved" atau "rejected".' });
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
      message: `Status transaksi berhasil diubah menjadi ${status}.`,
      transaction: result.rows[0],
    });
  } catch (error) {
    console.error('Update Status Error:', error);
    res.status(500).json({ success: false, message: 'Gagal memperbarui status transaksi.' });
  }
};

/**
 * GET /api/transactions/:transactionId/download/:photoId
 * Generate Presigned URL untuk download foto HD (hanya jika transaksi approved)
 */
const getDownloadUrl = async (req, res) => {
  try {
    const { transactionId, photoId } = req.params;
    const userId = req.user.id;

    // 1. Verifikasi transaksi milik user dan statusnya approved
    const txCheck = await query(
      `SELECT t.status, ti.photo_id
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

    // 2. Ambil original_url dari foto
    const photoRes = await query('SELECT original_url FROM photos WHERE id = $1', [photoId]);
    if (photoRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Foto tidak ditemukan.' });
    }

    const originalUrl = photoRes.rows[0].original_url;

    // 3. Ekstrak key dari URL
    //    Format: https://pub-xxx.r2.dev/original/RAW-xxx.jpg -> original/RAW-xxx.jpg
    const publicDomain = process.env.R2_PUBLIC_DOMAIN || '';
    let key = originalUrl;
    if (publicDomain && originalUrl.startsWith(publicDomain)) {
      key = originalUrl.replace(publicDomain.replace(/\/$/, '') + '/', '');
    }

    // 4. Generate Presigned URL (expire 5 menit)
    const downloadUrl = await getPresignedDownloadUrl(key, 300);

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

module.exports = {
  createTransaction,
  getTransactions,
  getUserTransactions,
  updateTransactionStatus,
  getDownloadUrl,
};
