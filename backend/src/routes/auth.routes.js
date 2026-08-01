const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');

// POST /api/auth/login-user (Login Peserta via Nama & Nomor BIB)
router.post('/login-user', authController.loginUser);

// POST /api/auth/login-admin (Login Super Admin via username + password)
router.post('/login-admin', authController.loginAdmin);

// POST /api/auth/login-photographer (Login Fotografer via username + password)
router.post('/login-photographer', authController.loginPhotographer);

// GET /api/auth/me (Validasi token & ambil data user terbaru)
router.get('/me', verifyToken, authController.getMe);

module.exports = router;
