// Generates favicon.ico + PWA/home-screen icon files from the WalletOS
// brand source in public/brand/.
// Regenerate with: node scripts/gen-app-icons.mjs

import sharp from "sharp";
import path from "node:path";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const brand = path.join(root, "public", "brand");
const iconsOut = path.join(root, "public", "icons");
const appIcon = path.join(brand, "app-icon-light.png");

const specs = [
  { name: "icon-192.png", size: 192 },
  { name: "icon-512.png", size: 512 },
  { name: "icon-maskable-512.png", size: 512 },
  { name: "apple-touch-icon.png", size: 180 },
];

for (const spec of specs) {
  await sharp(appIcon).resize(spec.size, spec.size).png().toFile(path.join(iconsOut, spec.name));
  console.log("wrote", spec.name);
}

function buildIco(images) {
  const count = images.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(count, 4);

  let offset = 6 + count * 16;
  const dirEntries = [];
  const dataParts = [];
  for (const img of images) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(img.size, 0); // width (0 means 256, our sizes are <256)
    entry.writeUInt8(img.size, 1); // height
    entry.writeUInt8(0, 2); // color palette
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(img.data.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += img.data.length;
    dirEntries.push(entry);
    dataParts.push(img.data);
  }
  return Buffer.concat([header, ...dirEntries, ...dataParts]);
}

const fav16 = await sharp(path.join(brand, "favicon-16.png")).resize(16, 16).png().toBuffer();
const fav32 = await sharp(path.join(brand, "favicon-32.png")).resize(32, 32).png().toBuffer();

const ico = buildIco([
  { size: 16, data: fav16 },
  { size: 32, data: fav32 },
]);
await fs.writeFile(path.join(root, "app", "favicon.ico"), ico);
console.log("wrote app/favicon.ico");
