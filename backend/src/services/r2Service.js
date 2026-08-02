const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'sepoto-photos';
const PUBLIC_DOMAIN = process.env.R2_PUBLIC_DOMAIN || '';

/**
 * Upload buffer image to Cloudflare R2
 * @param {Buffer} buffer - Buffer file gambar
 * @param {string} key - File key di R2 (misal: "original/photo1.jpg" atau "watermarked/photo1.jpg")
 * @param {string} contentType - Mime type ("image/jpeg", "image/png", dll)
 * @returns {Promise<string>} URL publik/akses gambar
 */
async function uploadToR2(buffer, key, contentType = 'image/jpeg') {
  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    });

    await r2Client.send(command);

    // Jika domain publik menggunakan r2.dev yang sering diblokir Telkomsel/Internet Baik,
    // gunakan proxy Express local (/api/photos/file/${key}) agar gambar selalu tampil sempurna di browser.
    if (PUBLIC_DOMAIN && !PUBLIC_DOMAIN.includes('r2.dev')) {
      return `${PUBLIC_DOMAIN.replace(/\/$/, '')}/${key}`;
    }
    const port = process.env.PORT || 5000;
    return `http://localhost:${port}/api/photos/file/${key}`;
  } catch (error) {
    console.error('❌ Cloudflare R2 Upload Error:', error);
    throw error;
  }
}

/**
 * Generate Presigned URL untuk download file asli dari Cloudflare R2
 * @param {string} key - File key di R2 (misal: "original/RAW-xxx.jpg")
 * @param {number} expiresInSeconds - Waktu kadaluarsa URL dalam detik (default: 300 = 5 menit)
 * @returns {Promise<string>} Presigned URL sementara untuk download
 */
async function getPresignedDownloadUrl(key, expiresInSeconds = 300, filename = 'SEPOTO-HD-photo.jpg') {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ResponseContentDisposition: `attachment; filename="${filename}"`,
    });

    const presignedUrl = await getSignedUrl(r2Client, command, {
      expiresIn: expiresInSeconds,
    });

    return presignedUrl;
  } catch (error) {
    console.error('❌ Cloudflare R2 Presigned URL Error:', error);
    throw error;
  }
}

module.exports = {
  r2Client,
  uploadToR2,
  getPresignedDownloadUrl,
};
