/**
 * Lumio — captures d'écran de design (mode maquette).
 *
 * Usage :
 *   1. Démarrer le frontend en mode maquette :
 *        cd frontend && VITE_USE_MOCKS=true npm run dev -- --port 3200
 *   2. Lancer les captures :
 *        node --experimental-strip-types scripts/screenshots.ts [--filter <motif>] [--base <url>]
 *
 * Les captures sont écrites dans docs/design/screenshots/.
 * Certains états sont produits par interception réseau (page.route) :
 * ils ne modifient aucune donnée du dépôt.
 */
import { chromium } from "@playwright/test";
import * as fs from "node:fs";
import * as path from "node:path";
import { BASE, VP, argValue, mockApi } from "./lib.ts";
import { buildShots } from "./screens.ts";

const ROOT = path.resolve(import.meta.dirname, "..", "..");
const OUT_DIR = path.join(ROOT, "docs", "design", "screenshots");
const FILTER = argValue("--filter");

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  console.log(`Captures vers ${OUT_DIR} (base ${BASE})`);
  const shots = buildShots().filter((s) => !FILTER || s.name.includes(FILTER));
  for (const s of shots) {
    const ctx = await browser.newContext({ viewport: VP[s.vp], locale: "fr-FR" });
    const page = await ctx.newPage();
    if (s.mocks) await mockApi(page, s.mocks);
    await page.goto(BASE + (s.startUrl ?? s.url), { waitUntil: "networkidle" });
    if (s.run) await s.run(page);
    await page.waitForTimeout(350);
    await page.screenshot({ path: path.join(OUT_DIR, `${s.name}.png`), fullPage: s.fullPage ?? false });
    console.log("  ✓", s.name);
    await ctx.close();
  }
  await browser.close();
  console.log("Terminé.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
