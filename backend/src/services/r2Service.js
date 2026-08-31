const fs = require('fs');
const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const isR2Configured = Boolean(
  process.env.R2_ACCOUNT_ID &&
  process.env.R2_ACCESS_KEY_ID &&
  process.env.R2_SECRET_ACCESS_KEY &&
  !process.env.R2_ACCESS_KEY_ID.includes('YOUR_')
);

let r2Client = null;
if (isR2Configured) {
  try {
    r2Client = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      },
    });
  } catch (err) {
    console.warn('⚠️ R2 Client init warning:', err.message);
  }
}

const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'sepoto-photos';
const PUBLIC_DOMAIN = process.env.R2_PUBLIC_DOMAIN || '';

/**
 * Fallback: Simpan file ke disk lokal jika R2 belum dikonfigurasi atau gagal
 */
async function uploadToLocal(buffer, key) {
  try {
    const uploadsDir = path.join(__dirname, '../../uploads');
    const filePath = path.join(uploadsDir, key);
    const fileDir = path.dirname(filePath);

    if (!fs.existsSync(fileDir)) {
      fs.mkdirSync(fileDir, { recursive: true });
    }

    fs.writeFileSync(filePath, buffer);
    const baseUrl = process.env.FRONTEND_URL || process.env.BACKEND_URL || '';
    const domain = baseUrl ? baseUrl.replace(/\/$/, '') : '';
    return `${domain}/api/photos/file/${key}`;
  } catch (err) {
    console.error('❌ Local Storage Upload Error:', err);
    throw err;
  }
}

/**
 * Upload buffer image to Cloudflare R2 dengan otomatis Fallback ke Disk Lokal
 */
async function uploadToR2(buffer, key, contentType = 'image/jpeg') {
  if (r2Client) {
    try {
      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      });

      await r2Client.send(command);

      if (PUBLIC_DOMAIN && !PUBLIC_DOMAIN.includes('r2.dev') && !PUBLIC_DOMAIN.includes('YOUR_')) {
        return `${PUBLIC_DOMAIN.replace(/\/$/, '')}/${key}`;
      }
      const baseUrl = process.env.FRONTEND_URL || process.env.BACKEND_URL || '';
      const domain = baseUrl ? baseUrl.replace(/\/$/, '') : '';
      return `${domain}/api/photos/file/${key}`;
    } catch (error) {
      console.warn('⚠️ Cloudflare R2 Upload Error, fallback ke penyimpanan lokal VPS:', error.message);
      // Jika input adalah Node.js Stream, stream kemungkinan besar sudah dikonsumsi sebagian (corrupt)
      // Jadi tidak bisa dilanjutkan ke fallback (disk lokal) karena fs.writeFileSync menolak Stream.
      if (buffer && typeof buffer.pipe === 'function') {
         throw new Error(`Cloudflare R2 timeout/error saat streaming file. Upload dibatalkan: ${error.message}`);
      }
    }
  }

  return await uploadToLocal(buffer, key);
}

/**
 * Hapus file dari Cloudflare R2 (jika R2 aktif)
 */
async function deleteFromR2(key) {
  if (r2Client) {
    try {
      await r2Client.send(new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: key }));
    } catch (err) {
      console.warn(`⚠️ R2 Delete Error (${key}):`, err.message);
    }
  }
}

/**
 * Hapus file dari disk lokal VPS (jika ada)
 */
function deleteFromLocal(key) {
  try {
    const filePath = path.join(__dirname, '../../uploads', key);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    console.warn(`⚠️ Local Delete Error (${key}):`, err.message);
  }
}

/**
 * Hapus file dari R2 DAN disk lokal sekaligus (best-effort, tidak throw error)
 */
async function deleteFileEverywhere(key) {
  await deleteFromR2(key);
  deleteFromLocal(key);
}

/**
 * Generate Presigned URL atau URL unduhan lokal (melalui Proxy Backend agar 100% aman dari NoSuchKey & Blokir DNS)
 */
async function getPresignedDownloadUrl(key, expiresInSeconds = 300, filename = 'SEPOTO-HD-photo.jpg') {
  const baseUrl = process.env.FRONTEND_URL || process.env.BACKEND_URL || '';
  const domain = baseUrl ? baseUrl.replace(/\/$/, '') : '';
  const cleanName = filename ? encodeURIComponent(filename) : '';

  // Menggunakan Backend Proxy untuk unduhan agar aman baik di lokal disk maupun Cloudflare R2
  return `${domain}/api/photos/file/${key}?download=true${cleanName ? `&name=${cleanName}` : ''}`;
}

module.exports = {
  r2Client,
  uploadToR2,
  deleteFromR2,
  deleteFromLocal,
  deleteFileEverywhere,
  getPresignedDownloadUrl,
};

