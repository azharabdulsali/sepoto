const multer = require('multer');

/**
 * Konfigurasi Multer untuk upload foto
 * - Menggunakan memoryStorage (buffer) agar bisa langsung diproses Sharp
 * - Limit: 20MB per file, maksimal 20 file sekaligus
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20 MB per file
  },
  fileFilter: (req, file, cb) => {
    // Hanya terima file gambar
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Hanya file gambar (image/*) yang diizinkan.'), false);
    }
  },
});

// Bulk upload: maksimal 20 foto sekaligus
const bulkUploadPhotos = upload.array('photos', 20);

module.exports = {
  upload,
  bulkUploadPhotos,
};
