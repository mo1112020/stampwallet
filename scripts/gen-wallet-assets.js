const zlib = require("zlib");

function crc32(buf) {
  let c;
  const table = crc32.table || (crc32.table = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) {
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      }
      t[n] = c >>> 0;
    }
    return t;
  })());
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
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

// Solid-color RGBA PNG, optionally with a centered lighter rounded square
// (cheap placeholder "mark") so default wallet icons aren't a flat blob.
function solidPng(width, height, [r, g, b], mark = false) {
  const raw = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    const rowStart = y * (1 + width * 4);
    raw[rowStart] = 0; // filter: none
    for (let x = 0; x < width; x++) {
      const off = rowStart + 1 + x * 4;
      let pr = r, pg = g, pb = b;
      if (mark) {
        const cx = width / 2, cy = height / 2;
        const rad = Math.min(width, height) * 0.28;
        const d = Math.hypot(x - cx, y - cy);
        if (d < rad) {
          pr = 255; pg = 255; pb = 255;
        }
      }
      raw[off] = pr;
      raw[off + 1] = pg;
      raw[off + 2] = pb;
      raw[off + 3] = 255;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const idat = zlib.deflateSync(raw);
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const PURPLE = [0x3e, 0x08, 0x56];

const assets = {
  ICON_PNG: solidPng(29, 29, PURPLE, true),
  ICON_2X_PNG: solidPng(58, 58, PURPLE, true),
  ICON_3X_PNG: solidPng(87, 87, PURPLE, true),
  LOGO_PNG: solidPng(160, 50, PURPLE, false),
  LOGO_2X_PNG: solidPng(320, 100, PURPLE, false),
};

let out = `// Auto-generated placeholder Apple Wallet pass artwork (solid brand-purple
// squares with a simple centered mark for icons). Swap these for real
// merchant/business artwork once branding-per-pass is wired up — see
// lib/wallet/assets.ts.
//
// Regenerate with: node scripts/gen-wallet-assets.js

`;
for (const [name, buf] of Object.entries(assets)) {
  out += `export const ${name} = Buffer.from(\n  "${buf.toString("base64")}",\n  "base64"\n);\n\n`;
}

const path = require("path");
const outPath = process.argv[2] || path.join(__dirname, "..", "lib", "wallet", "assets.ts");
require("fs").writeFileSync(outPath, out);
console.log("wrote", outPath);
