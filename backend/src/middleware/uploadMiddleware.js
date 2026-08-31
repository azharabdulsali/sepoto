const multer = require('multer');

const path = require('path');
const fs = require('fs');

// Pastikan folder temp ada
const tempDir = path.join(__dirname, '../../uploads/temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

/**
 * Konfigurasi Multer untuk upload foto
 * - Menggunakan diskStorage agar RAM VPS (yang terbatas) tidak penuh (OOM) saat menerima 50 foto @10MB
 * - Limit: 20MB per file, maksimal 50 file sekaligus per batch upload
 */
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, tempDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  }),
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
