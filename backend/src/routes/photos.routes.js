const express = require('express');
const router = express.Router();
const photoController = require('../controllers/photoController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const { bulkUploadPhotos } = require('../middleware/uploadMiddleware');

// GET /api/photos (Publik: Ambil semua foto galeri yang dijual)
router.get('/', photoController.getPhotos);

// GET /api/photos/my (Fotografer: Ambil foto milik sendiri)
router.get('/my', verifyToken, requireRole('photographer'), photoController.getMyPhotos);

// POST /api/photos/upload (Fotografer: Bulk upload foto + watermark + R2)
router.post('/upload', verifyToken, requireRole('photographer'), bulkUploadPhotos, photoController.uploadPhotos);

// PATCH /api/photos/:id/price (Fotografer: Update harga foto milik sendiri)
router.patch('/:id/price', verifyToken, requireRole('photographer'), photoController.updatePhotoPrice);

// DELETE /api/photos/:id (Fotografer: Hapus foto milik sendiri)
router.delete('/:id', verifyToken, requireRole('photographer'), photoController.deletePhoto);

module.exports = router;
