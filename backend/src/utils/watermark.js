const sharp = require('sharp');

/**
 * Membuat watermark otomatis berulang (tiled grid) "sepoto.project" secara diagonal di atas foto
 * Presisi sesuai dengan contoh foto rujukan.
 * @param {Buffer} inputBuffer - Buffer gambar asli resolusi tinggi
 * @returns {Promise<Buffer>} Buffer gambar yang sudah diberi watermark diagonal
 */
async function generateWatermark(inputBuffer) {
  try {
    // 1. Normalize orientation and resize FIRST to reduce memory and fix pipeline ordering.
    // Sharp's composite evaluates AFTER resize in the same pipeline, so if we generate
    // the SVG based on original dimensions, it will be larger than the resized image.
    const resizedBuffer = await sharp(inputBuffer)
      .rotate()
      .resize({ width: 800, withoutEnlargement: true })
      .toBuffer();

    const image = sharp(resizedBuffer);
    const metadata = await image.metadata();
    const width = metadata.width || 800;
    const height = metadata.height || 600;

    const path = require('path');
    const watermarkPath = path.join(__dirname, 'watermark.png');

    // 2. Composite the pre-rendered transparent PNG watermark 
    // This bypasses Linux font dependency issues since it's already a pixel image.
    const watermarkedBuffer = await image
      .composite([{ input: watermarkPath, tile: true, top: 0, left: 0 }])
      .webp({ quality: 80 }) // Gunakan format WebP yang jauh lebih ringan daripada JPEG
      .toBuffer();

    return watermarkedBuffer;
  } catch (error) {
    console.error('❌ Watermark Generation Error:', error);
    return inputBuffer; // Fallback jika terjadi kendala
  }
}

module.exports = {
  generateWatermark,
};
