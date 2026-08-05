const express = require('express');
const router = express.Router();
const photoController = require('../controllers/photoController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const { bulkUploadPhotos } = require('../middleware/uploadMiddleware');

// GET /api/photos/file/:folder/:filename (Publik: Proxy R2 image via Express bypass Telkomsel/ISP DNS block)
router.get('/file/:folder/:filename', photoController.proxyR2Image);

// GET /api/photos (Publik: Ambil semua foto galeri yang dijual)
router.get('/', photoController.getPhotos);

// GET /api/photos/my (Fotografer: Ambil foto milik sendiri)
router.get('/my', verifyToken, requireRole('photographer'), photoController.getMyPhotos);

// POST /api/photos/upload (Fotografer: Bulk upload foto + watermark + R2)
router.post('/upload', verifyToken, requireRole('photographer'), bulkUploadPhotos, photoController.uploadPhotos);

// PATCH /api/photos/:id/price (Fotografer: Update harga foto milik sendiri)
router.patch('/:id/price', verifyToken, requireRole('photographer'), photoController.updatePhotoPrice);

// PATCH /api/photos/:id (Fotografer: Update harga & bib_tags foto milik sendiri ke PostgreSQL DB)
router.patch('/:id', verifyToken, requireRole('photographer'), photoController.updatePhoto);

// Super Admin: Kelola semua foto galeri (Filter by Event, Set Harga & BIB, Audit Trail)
router.get('/admin', verifyToken, requireRole('super_admin'), photoController.getAdminPhotos);
router.patch('/admin/bulk-update', verifyToken, requireRole('super_admin'), photoController.bulkUpdatePhotosAdmin);
router.patch('/admin/:id', verifyToken, requireRole('super_admin'), photoController.updatePhotoAdmin);
router.delete('/admin/:id', verifyToken, requireRole('super_admin'), photoController.deletePhotoAdmin);

// DELETE /api/photos/:id (Fotografer: Hapus foto milik sendiri)
router.delete('/:id', verifyToken, requireRole('photographer'), photoController.deletePhoto);

module.exports = router;
