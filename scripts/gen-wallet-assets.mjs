// Regenerates the Apple Wallet pass fallback artwork (icon tile + top-left
// logo shown on every issued pass) from the WalletOS brand source in
// public/brand/, embedded as base64 buffers in lib/wallet/assets.ts.
// Regenerate with: node scripts/gen-wallet-assets.mjs

import sharp from "sharp";
import path from "node:path";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const brand = path.join(root, "public", "brand");

const iconSrc = path.join(brand, "app-icon-light.png");
const logoSrc = path.join(brand, "monochrome-white-transparent.png");

const icon1x = await sharp(iconSrc).resize(29, 29).png().toBuffer();
const icon2x = await sharp(iconSrc).resize(58, 58).png().toBuffer();
const icon3x = await sharp(iconSrc).resize(87, 87).png().toBuffer();
const logo1x = await sharp(logoSrc).resize({ width: 160, height: 50, fit: "inside" }).png().toBuffer();
const logo2x = await sharp(logoSrc).resize({ width: 320, height: 100, fit: "inside" }).png().toBuffer();

const b64 = (buf) => buf.toString("base64");

const content = `// Apple Wallet pass fallback artwork — WalletOS's own icon tile and
// top-left wordmark shown on every issued pass, generated from the brand
// source in public/brand/.
//
// Regenerate with: node scripts/gen-wallet-assets.mjs

export const ICON_PNG = Buffer.from(
  "${b64(icon1x)}",
  "base64"
);

export const ICON_2X_PNG = Buffer.from(
  "${b64(icon2x)}",
  "base64"
);

export const ICON_3X_PNG = Buffer.from(
  "${b64(icon3x)}",
  "base64"
);

export const LOGO_PNG = Buffer.from(
  "${b64(logo1x)}",
  "base64"
);

export const LOGO_2X_PNG = Buffer.from(
  "${b64(logo2x)}",
  "base64"
);
`;

await fs.writeFile(path.join(root, "lib", "wallet", "assets.ts"), content);
console.log("wrote lib/wallet/assets.ts");
