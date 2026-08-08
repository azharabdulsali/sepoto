const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

// POST /api/auth/login (Unified Login — all roles: user, admin, photographer)
router.post('/login', authController.unifiedLogin);

// POST /api/auth/login-user (Legacy: Login Peserta via Nama & Nomor BIB)
router.post('/login-user', authController.loginUser);

// POST /api/auth/login-admin (Login Super Admin via username + password)
router.post('/login-admin', authController.loginAdmin);

// POST /api/auth/login-photographer (Login Fotografer via username + password)
router.post('/login-photographer', authController.loginPhotographer);

// GET /api/auth/me (Validasi token & ambil data user terbaru)
router.get('/me', verifyToken, authController.getMe);

// GET /api/auth/users (Super Admin & Admin: Ambil daftar user/peserta dari database)
router.get('/users', verifyToken, requireRole('super_admin', 'admin'), authController.getAllUsers);

// POST /api/auth/users (Super Admin & Admin: Tambah user/peserta/fotografer/admin secara manual)
router.post('/users', verifyToken, requireRole('super_admin', 'admin'), authController.createUserManual);

// PATCH /api/auth/users/:id (Super Admin & Admin: Edit data user/fotografer)
router.patch('/users/:id', verifyToken, requireRole('super_admin', 'admin'), authController.updateUser);

// DELETE /api/auth/users/:id (Super Admin & Admin: Hapus user/fotografer)
router.delete('/users/:id', verifyToken, requireRole('super_admin', 'admin'), authController.deleteUser);

// POST /api/auth/users/bulk-delete (Super Admin & Admin: Hapus masal user/fotografer)
router.post('/users/bulk-delete', verifyToken, requireRole('super_admin', 'admin'), authController.bulkDeleteUsers);

// POST /api/auth/users/import (Super Admin & Admin: Bulk import/update peserta via CSV/Excel)
router.post('/users/import', verifyToken, requireRole('super_admin', 'admin'), authController.importParticipants);

module.exports = router;
