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

// GET /api/events (Publik: Ambil semua daftar event)
router.get('/', eventController.getAllEvents);

// POST /api/events (Super Admin: Buat event baru)
router.post('/', verifyToken, requireRole('super_admin'), eventController.createEvent);

// PATCH /api/events/:id (Super Admin & Admin: Update detail event)
router.patch('/:id', verifyToken, requireRole('super_admin', 'admin'), eventController.updateEvent);

// POST /api/events/:id/qris (Super Admin & Admin: Upload QR Code QRIS)
router.post('/:id/qris', verifyToken, requireRole('super_admin', 'admin'), upload.single('qrisImage'), eventController.uploadQris);

// POST /api/events/:id/banner (Super Admin & Admin: Upload Gambar Banner Event)
router.post('/:id/banner', verifyToken, requireRole('super_admin', 'admin'), upload.single('bannerImage'), eventController.uploadBanner);

// PATCH /api/events/:id/active (Super Admin & Admin: Toggle status ON/OFF event)
router.patch('/:id/active', verifyToken, requireRole('super_admin', 'admin'), eventController.toggleEventActive);

module.exports = router;
