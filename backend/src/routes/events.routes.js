const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

// GET /api/events/active (Publik: Ambil event aktif saat ini)
router.get('/active', eventController.getActiveEvent);

// PATCH /api/events/:id (Admin: Update detail event)
router.patch('/:id', verifyToken, requireRole('super_admin'), eventController.updateEvent);

// PATCH /api/events/:id/active (Admin: Toggle status ON/OFF event)
router.patch('/:id/active', verifyToken, requireRole('super_admin'), eventController.toggleEventActive);

module.exports = router;
