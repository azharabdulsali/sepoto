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

    // 2. Generate SVG overlay using the exact dimensions of the resized image
    const fontSize = Math.max(18, Math.round(Math.min(width, height) * 0.036));
    const stepX = Math.round(width * 0.28);
    const stepY = Math.round(height * 0.11);

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
            <text x="${posX}" y="${posY}" text-anchor="middle" dominant-baseline="middle"
              fill="#ffffff" fill-opacity="0.6"
              stroke="#000000" stroke-opacity="0.4" stroke-width="1.5"
              font-family="DejaVu Sans, Liberation Sans, Arial, sans-serif" font-size="${fontSize}" font-weight="bold" letter-spacing="0.5">
              sepoto.project
            </text>
          </g>
        `);
      }
      rowIndex++;
    }

    // SVG Watermark Overlay
    const svgOverlay = `
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
        ${textNodes.join('\n')}
      </svg>
    `;

    // 3. Composite the properly sized SVG and export to WebP
    const watermarkedBuffer = await image
      .composite([{ input: Buffer.from(svgOverlay), top: 0, left: 0 }])
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
