const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

// POST /api/auth/login-user (Login Peserta via Nama & Nomor BIB)
router.post('/login-user', authController.loginUser);

// POST /api/auth/login-admin (Login Super Admin via username + password)
router.post('/login-admin', authController.loginAdmin);

// POST /api/auth/login-photographer (Login Fotografer via username + password)
router.post('/login-photographer', authController.loginPhotographer);

// GET /api/auth/me (Validasi token & ambil data user terbaru)
router.get('/me', verifyToken, authController.getMe);

// GET /api/auth/users (Super Admin: Ambil seluruh daftar user/peserta dari database)
router.get('/users', verifyToken, requireRole('super_admin'), authController.getAllUsers);

// POST /api/auth/users (Super Admin: Tambah user/peserta atau fotografer secara manual)
router.post('/users', verifyToken, requireRole('super_admin'), authController.createUserManual);

// PATCH /api/auth/users/:id (Super Admin: Edit data user/fotografer)
router.patch('/users/:id', verifyToken, requireRole('super_admin'), authController.updateUser);

// DELETE /api/auth/users/:id (Super Admin: Hapus user/fotografer)
router.delete('/users/:id', verifyToken, requireRole('super_admin'), authController.deleteUser);

module.exports = router;
