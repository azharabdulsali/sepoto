const sharp = require('sharp');

/**
 * Membuat watermark otomatis berulang (tiled grid) "sepoto.project" secara diagonal di atas foto
 * Presisi sesuai dengan contoh foto rujukan.
 * @param {Buffer} inputBuffer - Buffer gambar asli resolusi tinggi
 * @returns {Promise<Buffer>} Buffer gambar yang sudah diberi watermark diagonal
 */
async function generateWatermark(inputBuffer) {
  try {
    const metadata = await sharp(inputBuffer).metadata();
    const width = metadata.width || 1200;
    const height = metadata.height || 1600;

    // Ukuran font & grid rapat presisi seperti contoh rujukan
    const fontSize = Math.max(14, Math.round(Math.min(width, height) * 0.028));
    const stepX = Math.round(width * 0.18);
    const stepY = Math.round(height * 0.075);

    let textNodes = [];

    // Loop grid berulang dari luar batas gambar (-50% ke 150%) agar area ter-cover penuh saat diputar -35 derajat
    const startX = -Math.round(width * 0.5);
    const endX = Math.round(width * 1.5);
    const startY = -Math.round(height * 0.5);
    const endY = Math.round(height * 1.5);

    let rowIndex = 0;
    for (let y = startY; y <= endY; y += stepY) {
      const offsetX = (rowIndex % 2 === 0) ? 0 : stepX / 2;
      for (let x = startX; x <= endX; x += stepX) {
        const posX = Math.round(x + offsetX);
        const posY = Math.round(y);
        textNodes.push(`
          <g transform="rotate(-35, ${posX}, ${posY})">
            <text x="${posX}" y="${posY}" text-anchor="middle" dominant-baseline="middle" class="watermark-text">
              sepoto.project
            </text>
          </g>
        `);
      }
      rowIndex++;
    }

    // SVG Watermark Overlay berulang dengan outline halus & transparansi presisi
    const svgOverlay = `
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
        <style>
          .watermark-text {
            fill: #ffffff;
            fill-opacity: 0.5;
            stroke: #000000;
            stroke-opacity: 0.4;
            stroke-width: 1.2px;
            font-family: Arial, Helvetica, sans-serif;
            font-size: ${fontSize}px;
            font-weight: 700;
            letter-spacing: 0.5px;
            paint-order: stroke fill;
          }
        </style>
        ${textNodes.join('\n')}
      </svg>
    `;

    const watermarkedBuffer = await sharp(inputBuffer)
      .composite([{ input: Buffer.from(svgOverlay), top: 0, left: 0 }])
      .jpeg({ quality: 85 })
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
