const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

const multer = require('multer');
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // Maksimal 5MB
});

// GET /api/events/active (Publik: Ambil event aktif saat ini)
router.get('/active', eventController.getActiveEvent);

// PATCH /api/events/:id (Admin: Update detail event)
router.patch('/:id', verifyToken, requireRole('super_admin'), eventController.updateEvent);

// POST /api/events/:id/qris (Admin: Upload QR Code QRIS)
router.post('/:id/qris', verifyToken, requireRole('super_admin'), upload.single('qrisImage'), eventController.uploadQris);

// PATCH /api/events/:id/active (Admin: Toggle status ON/OFF event)
router.patch('/:id/active', verifyToken, requireRole('super_admin'), eventController.toggleEventActive);

module.exports = router;
