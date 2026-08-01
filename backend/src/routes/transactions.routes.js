const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

// POST /api/transactions (User: Checkout cart → buat transaksi)
router.post('/', verifyToken, transactionController.createTransaction);

// GET /api/transactions (Admin: List semua transaksi)
router.get('/', verifyToken, requireRole('super_admin'), transactionController.getTransactions);

// GET /api/transactions/my (User: List transaksi milik sendiri)
router.get('/my', verifyToken, transactionController.getUserTransactions);

// PATCH /api/transactions/:id/status (Admin: Approve / Reject)
router.patch('/:id/status', verifyToken, requireRole('super_admin'), transactionController.updateTransactionStatus);

// GET /api/transactions/:transactionId/download/:photoId (User: Download foto HD via Presigned URL)
router.get('/:transactionId/download/:photoId', verifyToken, transactionController.getDownloadUrl);

module.exports = router;
