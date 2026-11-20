/**
 * Captures de chaque type de support visuel dans les registres 6-8 et 9-14
 * (depuis /__design/components) → docs/design/screenshots/visuals/.
 * Usage : node --experimental-strip-types scripts/visual-shots.ts (serveur maquette lancé)
 */
import { chromium } from "@playwright/test";
import * as fs from "node:fs";
import * as path from "node:path";
import { BASE } from "./lib.ts";

const OUT = path.resolve(import.meta.dirname, "..", "..", "docs", "design", "screenshots", "visuals");

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM_PATH || undefined });
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 })).newPage();
  await page.goto(BASE + "/__design/components", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  for (const age of ["6-8", "9-14"]) {
    const samples = page.locator(`section[data-age="${age}"] .dp-sample`);
    const n = await samples.count();
    for (let i = 0; i < n; i++) {
      const s = samples.nth(i);
      const title = (await s.locator("h4").innerText()).trim();
      if (!/^(VisualAid|Feuille de Lumio)/i.test(title)) continue;
      const slug = title
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      await s.screenshot({ path: path.join(OUT, `${age}-${slug}.png`) });
      console.log("  ✓", age, title);
    }
  }
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
