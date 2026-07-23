// Generates placeholder PWA icons for the Scanner app (solid brand-purple
// squares with a QR-corner-style mark) — swap for real designed icons
// later. Regenerate with: node scripts/gen-pwa-icons.js

const zlib = require("zlib");
const fs = require("fs");
const path = require("path");

function crc32(buf) {
  const table = crc32.table || (crc32.table = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c >>> 0;
    }
    return t;
  })());
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

// Solid brand-purple square with a white QR-corner-style mark, so the
// installed-app icon reads distinctly from the wallet pass icon.
function iconPng(size, [r, g, b], padding) {
  const raw = Buffer.alloc(size * (1 + size * 4));
  const markSize = Math.floor(size * 0.5);
  const markStart = Math.floor((size - markSize) / 2);
  const corner = Math.floor(markSize * 0.28);

  for (let y = 0; y < size; y++) {
    const rowStart = y * (1 + size * 4);
    raw[rowStart] = 0;
    for (let x = 0; x < size; x++) {
      const off = rowStart + 1 + x * 4;
      let pr = r, pg = g, pb = b, pa = 255;

      const inPad = x < padding || y < padding || x >= size - padding || y >= size - padding;
      if (!inPad) {
        const mx = x - markStart;
        const my = y - markStart;
        const inMark = mx >= 0 && mx < markSize && my >= 0 && my < markSize;
        if (inMark) {
          // three QR-style corner squares
          const inTL = mx < corner && my < corner;
          const inTR = mx >= markSize - corner && my < corner;
          const inBL = mx < corner && my >= markSize - corner;
          if (inTL || inTR || inBL) {
            pr = 255; pg = 255; pb = 255;
          }
        }
      }

      raw[off] = pr;
      raw[off + 1] = pg;
      raw[off + 2] = pb;
      raw[off + 3] = pa;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;

  const idat = zlib.deflateSync(raw);
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
}

const PURPLE = [0x3e, 0x08, 0x56];
const outDir = process.argv[2] || path.join(__dirname, "..", "public", "icons");
fs.mkdirSync(outDir, { recursive: true });

const specs = [
  { name: "icon-192.png", size: 192, padding: 0 },
  { name: "icon-512.png", size: 512, padding: 0 },
  { name: "icon-maskable-512.png", size: 512, padding: 64 }, // safe-zone padding for maskable
  { name: "apple-touch-icon.png", size: 180, padding: 16 }, // iOS adds its own rounding, some padding avoids edge clipping
];

for (const spec of specs) {
  const buf = iconPng(spec.size, PURPLE, spec.padding);
  fs.writeFileSync(path.join(outDir, spec.name), buf);
  console.log("wrote", spec.name, buf.length, "bytes");
}
