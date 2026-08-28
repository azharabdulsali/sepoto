const sharp = require('sharp');
const fs = require('fs');

async function generateWatermarkPNG() {
  const width = 800;
  const height = 600;
  
  // We'll create a transparent PNG with a massive SVG that is 800x600, just like the old text grid
  const fontSize = Math.max(18, Math.round(Math.min(width, height) * 0.036));
  const stepX = Math.round(width * 0.28);
  const stepY = Math.round(height * 0.11);

  let textNodes = [];

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

  const svgOverlay = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      ${textNodes.join('\n')}
    </svg>
  `;

  try {
    const pngBuffer = await sharp(Buffer.from(svgOverlay)).png().toBuffer();
    const base64 = pngBuffer.toString('base64');
    fs.writeFileSync('watermark_base64.txt', base64);
    console.log('Watermark PNG generated successfully!');
  } catch (err) {
    console.error(err);
  }
}
generateWatermarkPNG();
