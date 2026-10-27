/* global Buffer */
import { deflateSync, crc32 } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const midnight = [4, 29, 61, 255];
const ivory = [249, 246, 238, 255];
const publicDir = resolve(dirname(fileURLToPath(import.meta.url)), '../public');

const font = {
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  I: ['11111', '00100', '00100', '00100', '00100', '00100', '11111'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  V: ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
  Y: ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
};

function create(width, height, color) {
  const data = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i += 1) {
    data[i * 4] = color[0];
    data[i * 4 + 1] = color[1];
    data[i * 4 + 2] = color[2];
    data[i * 4 + 3] = color[3];
  }
  return { width, height, data };
}

function setPixel(img, x, y, color) {
  const px = Math.round(x);
  const py = Math.round(y);
  if (px < 0 || py < 0 || px >= img.width || py >= img.height) return;
  const index = (py * img.width + px) * 4;
  img.data[index] = color[0];
  img.data[index + 1] = color[1];
  img.data[index + 2] = color[2];
  img.data[index + 3] = color[3];
}

function fillCircle(img, x, y, radius, color) {
  const r = Math.ceil(radius);
  for (let dy = -r; dy <= r; dy += 1) {
    for (let dx = -r; dx <= r; dx += 1) {
      if (dx * dx + dy * dy <= radius * radius) setPixel(img, x + dx, y + dy, color);
    }
  }
}

function strokeLine(img, x0, y0, x1, y1, radius, color) {
  const steps = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0)));
  for (let step = 0; step <= steps; step += 1) {
    const t = step / steps;
    fillCircle(img, x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, radius, color);
  }
}

function drawV(img, color, cx, top, bottom, halfWidth, thickness) {
  strokeLine(img, cx - halfWidth, top, cx, bottom, thickness, color);
  strokeLine(img, cx + halfWidth, top, cx, bottom, thickness, color);
}

function drawText(img, text, x, y, scale, color) {
  let cursor = x;
  for (const char of text) {
    const glyph = font[char];
    if (!glyph) continue;
    glyph.forEach((row, rowIndex) => {
      [...row].forEach((bit, colIndex) => {
        if (bit !== '1') return;
        for (let dy = 0; dy < scale; dy += 1) {
          for (let dx = 0; dx < scale; dx += 1) {
            setPixel(img, cursor + colIndex * scale + dx, y + rowIndex * scale + dy, color);
          }
        }
      });
    });
    cursor += 6 * scale;
  }
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(body) >>> 0);
  return Buffer.concat([length, body, checksum]);
}

function png(img) {
  const raw = Buffer.alloc((img.width * 4 + 1) * img.height);
  for (let y = 0; y < img.height; y += 1) {
    const start = y * (img.width * 4 + 1);
    raw[start] = 0;
    img.data.copy(raw, start + 1, y * img.width * 4, (y + 1) * img.width * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(img.width, 0);
  ihdr.writeUInt32BE(img.height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([signature, chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

function ico(img) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);
  const xorSize = img.width * img.height * 4;
  const andSize = 4 * img.height;
  const dib = Buffer.alloc(40);
  dib.writeUInt32LE(40, 0);
  dib.writeInt32LE(img.width, 4);
  dib.writeInt32LE(img.height * 2, 8);
  dib.writeUInt16LE(1, 12);
  dib.writeUInt16LE(32, 14);
  const xor = Buffer.alloc(xorSize);
  for (let y = 0; y < img.height; y += 1) {
    for (let x = 0; x < img.width; x += 1) {
      const src = ((img.height - 1 - y) * img.width + x) * 4;
      const dst = (y * img.width + x) * 4;
      xor[dst] = img.data[src + 2];
      xor[dst + 1] = img.data[src + 1];
      xor[dst + 2] = img.data[src];
      xor[dst + 3] = img.data[src + 3];
    }
  }
  const entry = Buffer.alloc(16);
  entry[0] = img.width;
  entry[1] = img.height;
  entry.writeUInt16LE(1, 4);
  entry.writeUInt16LE(32, 6);
  entry.writeUInt32LE(40 + xorSize + andSize, 8);
  entry.writeUInt32LE(22, 12);
  return Buffer.concat([header, entry, dib, xor, Buffer.alloc(andSize)]);
}

function appIcon(size) {
  const img = create(size, size, midnight);
  const pad = size * 0.22;
  drawV(img, ivory, size / 2, pad, size - pad, size * 0.24, Math.max(2, size * 0.045));
  return img;
}

mkdirSync(publicDir, { recursive: true });
const icon32 = appIcon(32);
writeFileSync(resolve(publicDir, 'favicon.png'), png(icon32));
writeFileSync(resolve(publicDir, 'favicon.ico'), ico(icon32));
writeFileSync(resolve(publicDir, 'apple-touch-icon.png'), png(appIcon(180)));
writeFileSync(resolve(publicDir, 'icon-192.png'), png(appIcon(192)));
writeFileSync(resolve(publicDir, 'icon-512.png'), png(appIcon(512)));

const og = create(1200, 630, ivory);
const panel = { width: 420, height: 420 };
for (let y = 105; y < 105 + panel.height; y += 1) {
  for (let x = 96; x < 96 + panel.width; x += 1) {
    const dx = Math.min(x - 96, 96 + panel.width - 1 - x);
    const dy = Math.min(y - 105, 105 + panel.height - 1 - y);
    const radius = 24;
    if (dx < radius && dy < radius && (radius - dx) ** 2 + (radius - dy) ** 2 > radius ** 2) continue;
    setPixel(og, x, y, midnight);
  }
}
drawV(og, ivory, 96 + panel.width / 2, 180, 450, 110, 18);
drawText(og, 'VIDHYASAATHY', 560, 270, 8, midnight);
writeFileSync(resolve(publicDir, 'og-image.png'), png(og));
