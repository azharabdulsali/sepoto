const sharp = require('sharp');

/**
 * Membuat watermark otomatis "sepot.project" di atas foto
 * @param {Buffer} inputBuffer - Buffer gambar asli resolusi tinggi
 * @returns {Promise<Buffer>} Buffer gambar yang sudah diberi watermark
 */
async function generateWatermark(inputBuffer) {
  try {
    const metadata = await sharp(inputBuffer).metadata();
    const width = metadata.width || 1200;
    const height = metadata.height || 1600;

    // SVG Watermark Overlay dengan sepot.project brand styling
    const svgOverlay = `
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
        <style>
          .watermark-text {
            fill: rgba(255, 255, 255, 0.45);
            font-family: Arial, sans-serif;
            font-size: ${Math.round(width * 0.05)}px;
            font-weight: 900;
            letter-spacing: 2px;
          }
          .watermark-sub {
            fill: #EA580C;
            font-size: ${Math.round(width * 0.05)}px;
            font-weight: 900;
          }
        </style>
        <g transform="rotate(-30 ${width / 2} ${height / 2})">
          <text x="${width / 2}" y="${height / 2}" text-anchor="middle" dominant-baseline="middle" className="watermark-text">
            sepot<tspan fill="#EA580C">.project</tspan> — SAMPLE WATERMARK
          </text>
        </g>
      </svg>
    `;

    const watermarkedBuffer = await sharp(inputBuffer)
      .composite([{ input: Buffer.from(svgOverlay), top: 0, left: 0 }])
      .jpeg({ quality: 85 })
      .toBuffer();

    return watermarkedBuffer;
  } catch (error) {
    console.error('❌ Watermark Generation Error:', error);
    return inputBuffer; // Fallback jika gagal
  }
}

module.exports = {
  generateWatermark,
};
