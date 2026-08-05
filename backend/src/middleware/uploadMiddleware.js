const multer = require('multer');

/**
 * Konfigurasi Multer untuk upload foto
 * - Menggunakan memoryStorage (buffer) agar bisa langsung diproses Sharp
 * - Limit: 20MB per file, maksimal 50 file sekaligus per batch upload
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

// Bulk upload: maksimal 50 foto sekaligus per batch
const bulkUploadPhotos = upload.array('photos', 50);

/**
 * Upload bukti pembayaran: 1 file, maks 5MB, hanya image/*
 */
const uploadProofImage = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Hanya file gambar (JPG, PNG, dll) yang diizinkan untuk bukti pembayaran.'), false);
    }
  },
}).single('proof');

module.exports = {
  upload,
  bulkUploadPhotos,
  uploadProofImage,
};
