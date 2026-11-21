/**
 * Génère le favicon et les icônes PWA depuis public/brand/lumio-icon.svg.
 *
 * Usage :  node --experimental-strip-types scripts/generate-icons.ts
 *
 * Sorties dans public/ :
 *   favicon.svg            (copie de l'icône, lien dans index.html)
 *   icons/icon-192.png     (PWA)
 *   icons/icon-512.png     (PWA)
 *   icons/icon-maskable-512.png (PWA maskable : fond plein, prisme à ~80 %)
 *   icons/apple-touch-icon.png  (180×180)
 */
import { chromium } from "@playwright/test";
import * as fs from "node:fs";
import * as path from "node:path";

const FRONTEND = path.resolve(import.meta.dirname, "..");
const PUBLIC = path.join(FRONTEND, "public");
const ICON = path.join(PUBLIC, "brand", "lumio-icon.svg");
const OUT = path.join(PUBLIC, "icons");

async function rasterize(browser: Awaited<ReturnType<typeof chromium.launch>>, file: string, size: number, html: string) {
  const page = await (await browser.newContext({ viewport: { width: size, height: size }, deviceScaleFactor: 1 })).newPage();
  await page.setContent(html);
  await page.waitForTimeout(200);
  await page.screenshot({ path: file, omitBackground: true });
  await page.context().close();
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  fs.copyFileSync(ICON, path.join(PUBLIC, "favicon.svg"));

  const svg = fs.readFileSync(ICON, "utf8");
  const dataUrl = "data:image/svg+xml;base64," + Buffer.from(svg).toString("base64");

  const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM_PATH || undefined });
  // Icône sur fond transparent (le SVG a déjà sa tuile arrondie)
  const htmlIcon = (size: number) =>
    `<body style="margin:0"><img src="${dataUrl}" style="width:${size}px;height:${size}px;display:block"></body>`;
  // Maskable : tuile pleine + prisme à ~80 % (zone sûre ~80 % du diamètre)
  const htmlMaskable = (size: number) =>
    `<body style="margin:0;width:${size}px;height:${size}px;background:#F6F5FB">${svg.replace('viewBox="0 0 120 120" width="120" height="120"', `viewBox="14 14 92 92" width="${size}" height="${size}"`)}</body>`;

  await rasterize(browser, path.join(OUT, "icon-192.png"), 192, htmlIcon(192));
  await rasterize(browser, path.join(OUT, "icon-512.png"), 512, htmlIcon(512));
  await rasterize(browser, path.join(OUT, "icon-maskable-512.png"), 512, htmlMaskable(512));
  await rasterize(browser, path.join(OUT, "apple-touch-icon.png"), 180, htmlIcon(180));
  await browser.close();
  console.log("Icônes générées dans", OUT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
