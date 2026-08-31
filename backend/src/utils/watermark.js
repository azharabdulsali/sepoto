const sharp = require('sharp');

// Matikan internal cache Sharp agar RAM segera dibebaskan setelah selesai diproses
sharp.cache(false);
// Batasi thread Sharp ke 1 untuk menghemat konsumsi RAM di VPS kecil
sharp.concurrency(1);

/**
 * Membuat watermark otomatis berulang (tiled grid) "sepoto.project" secara diagonal di atas foto
 * Presisi sesuai dengan contoh foto rujukan.
 * @param {Buffer|string} input - Buffer gambar atau string absolute path ke file gambar
 * @returns {Promise<Buffer>} Buffer gambar yang sudah diberi watermark diagonal
 */
async function generateWatermark(input) {
  try {
    // 1. Normalize orientation and resize FIRST to reduce memory and fix pipeline ordering.
    // Sharp's composite evaluates AFTER resize in the same pipeline, so if we generate
    // the SVG based on original dimensions, it will be larger than the resized image.
    const resizedBuffer = await sharp(input)
      .rotate()
      .resize({ width: 800, withoutEnlargement: true })
      .toBuffer();

    const image = sharp(resizedBuffer);
    const metadata = await image.metadata();
    const width = metadata.width || 800;
    const height = metadata.height || 600;

    const path = require('path');
    const watermarkPath = path.join(__dirname, 'watermark.png');

    // Make it 100% foolproof:
    // Our base tile is 350x200. If a user uploads an EXTREMELY small thumbnail (e.g. 100x100),
    // tile: true would throw an error. So we handle that edge case dynamically.
    let overlayOptions = { input: watermarkPath, tile: true, top: 0, left: 0 };
    
    if (width < 350 || height < 200) {
      const croppedTile = await sharp(watermarkPath)
        .resize(width, height, { fit: 'cover', position: 'center' })
        .toBuffer();
      overlayOptions = { input: croppedTile, top: 0, left: 0 };
    }

    const watermarkedBuffer = await image
      .composite([overlayOptions])
      .webp({ quality: 80 }) 
      .toBuffer();

    return watermarkedBuffer;
  } catch (error) {
    console.error('❌ Watermark Generation Error:', error);
    // Jika input adalah string (path), jangan kembalikan string sebagai buffer fallback.
    // Lemparkan error agar ditangani oleh controller.
    throw error;
  }
}

module.exports = {
  generateWatermark,
};
