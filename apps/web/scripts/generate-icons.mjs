import sharp from "sharp";
import { mkdirSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "..", "public");
mkdirSync(publicDir, { recursive: true });

const TEAL = "#175a6a";
const GOLD = "#d4c83a";

function icon512() {
  return `
  <svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <rect width="512" height="512" fill="${TEAL}"/>
    <path d="M256 146c-42.4 0-76.8 34.4-76.8 76.8 0 57.6 76.8 128 76.8 128s76.8-70.4 76.8-128c0-42.4-34.4-76.8-76.8-76.8Z" fill="#ffffff"/>
    <circle cx="256" cy="222.8" r="32" fill="${TEAL}"/>
    <circle cx="360" cy="352" r="16" fill="${GOLD}"/>
    <circle cx="382" cy="318" r="9" fill="${GOLD}" opacity="0.85"/>
  </svg>`;
}

async function main() {
  const svg = Buffer.from(icon512());

  await sharp(svg).resize(512, 512).png().toFile(path.join(publicDir, "icon-512.png"));
  await sharp(svg).resize(192, 192).png().toFile(path.join(publicDir, "icon-192.png"));
  await sharp(svg).resize(180, 180).png().toFile(path.join(publicDir, "apple-touch-icon.png"));
  await sharp(svg).resize(32, 32).png().toFile(path.join(publicDir, "favicon-32.png"));

  console.log("Icônes PWA générées : icon-512.png, icon-192.png, apple-touch-icon.png, favicon-32.png");
}

main();
