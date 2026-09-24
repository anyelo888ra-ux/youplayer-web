import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

// Function to generate a simple RGBA PNG buffer
function createPng(width, height, drawFn) {
  const bytesPerPixel = 4;
  const rowSize = width * bytesPerPixel;
  const rawData = Buffer.alloc((rowSize + 1) * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * (rowSize + 1);
    rawData[rowOffset] = 0; // Filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * bytesPerPixel;
      const [r, g, b, a] = drawFn(x, y, width, height);
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const deflated = zlib.deflateSync(rawData);

  // PNG Signature
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);

    const typeBuf = Buffer.from(type, 'ascii');
    const body = Buffer.concat([typeBuf, data]);

    const crcBuf = Buffer.alloc(4);
    crcBuf.writeInt32BE(crc32(body), 0);

    return Buffer.concat([len, body, crcBuf]);
  }

  // Simple CRC32 table
  function crc32(buf) {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      c ^= buf[i];
      for (let k = 0; k < 8; k++) {
        c = (c >>> 1) ^ (-(c & 1) & 0xedb88320);
      }
    }
    return (c ^ 0xffffffff) | 0;
  }

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8-bit depth
  ihdrData[9] = 6; // color type 6 (RGBA)
  ihdrData[10] = 0; // compression method
  ihdrData[11] = 0; // filter method
  ihdrData[12] = 0; // interlace method

  const ihdrChunk = makeChunk('IHDR', ihdrData);
  const idatChunk = makeChunk('IDAT', deflated);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Icon generator logic: Dark slate background (#0f172a) with crimson play card (#ef4444) and white play symbol
function drawAppIcon(x, y, w, h) {
  const cx = w / 2;
  const cy = h / 2;
  const radius = w * 0.46;

  // Background rounded box or circular mask
  const distCenter = Math.hypot(x - cx, y - cy);
  const isInsideBg = distCenter < radius;

  if (!isInsideBg) {
    return [15, 23, 42, 255]; // Slate-900 background
  }

  // Inner card: red rounded rectangle
  const cardW = w * 0.65;
  const cardH = h * 0.48;
  const left = cx - cardW / 2;
  const top = cy - cardH / 2;

  if (x >= left && x <= left + cardW && y >= top && y <= top + cardH) {
    // Check if inside play triangle: (cx - w*0.08, cy - h*0.12) to (cx + w*0.12, cy) to (cx - w*0.08, cy + h*0.12)
    const px1 = cx - w * 0.08;
    const py1 = cy - h * 0.12;
    const px2 = cx + w * 0.12;
    const py2 = cy;
    const px3 = cx - w * 0.08;
    const py3 = cy + h * 0.12;

    // Barycentric test for triangle
    const d1 = (x - px2) * (py1 - py2) - (px1 - px2) * (y - py2);
    const d2 = (x - px3) * (py2 - py3) - (px2 - px3) * (y - py3);
    const d3 = (x - px1) * (py3 - py1) - (px3 - px1) * (y - py1);

    const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
    const hasPos = d1 > 0 || d2 > 0 || d3 > 0;
    const inPlayTriangle = !(hasNeg && hasPos);

    if (inPlayTriangle) {
      return [255, 255, 255, 255]; // Pure white play button
    }

    return [239, 68, 68, 255]; // Red-500 play screen
  }

  return [15, 23, 42, 255]; // Slate-900
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPng(192, 192, drawAppIcon));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPng(512, 512, drawAppIcon));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createPng(512, 512, drawAppIcon));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPng(180, 180, drawAppIcon));

console.log('Successfully generated PWA icon PNGs in /public!');
