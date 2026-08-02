const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

// GET /api/transactions/next-order-number (User & Admin: Ambil nomor order sekuensial berikutnya)
router.get('/next-order-number', verifyToken, transactionController.getNextOrderNumber);

// POST /api/transactions (User: Checkout cart → buat transaksi)
router.post('/', verifyToken, transactionController.createTransaction);

// GET /api/transactions (Admin: List semua transaksi)
router.get('/', verifyToken, requireRole('super_admin'), transactionController.getTransactions);

// GET /api/transactions/my (User: List transaksi milik sendiri)
router.get('/my', verifyToken, transactionController.getUserTransactions);

// PATCH /api/transactions/:id/status (Admin: Approve / Reject)
router.patch('/:id/status', verifyToken, requireRole('super_admin'), transactionController.updateTransactionStatus);

// GET /api/transactions/:transactionId/download-zip (User: Unduh seluruh foto asli dalam 1 file .ZIP)
router.get('/:transactionId/download-zip', verifyToken, transactionController.downloadTransactionZip);

// GET /api/transactions/:transactionId/download/:photoId (User: Download foto HD via Presigned URL)
router.get('/:transactionId/download/:photoId', verifyToken, transactionController.getDownloadUrl);

module.exports = router;
