/**
 * Vérifie que prefers-reduced-motion coupe les animations (chat, réussite).
 * Usage : node --experimental-strip-types scripts/motion.ts  (serveur maquette lancé)
 */
import { chromium } from "@playwright/test";
import { VP, kidLoginTo } from "./lib.ts";

async function main() {
  const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM_PATH || undefined });
  let failures = 0;
  for (const reducedMotion of ["reduce", "no-preference"] as const) {
    const ctx = await browser.newContext({ viewport: VP.tabletLandscape, locale: "fr-FR", reducedMotion });
    const page = await ctx.newPage();
    await kidLoginTo(page, "conv-lea-1");
    await page.waitForTimeout(500);
    const durations = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>(".msg-in, .animate-bounce, .prism-rays > *")].map(
        (el) => parseFloat(getComputedStyle(el).animationDuration) || 0,
      ),
    );
    const max = Math.max(0, ...durations);
    const ok = reducedMotion === "reduce" ? max <= 0.001 : max > 0.1;
    if (!ok) failures++;
    console.log(`  ${ok ? "✓" : "✗"} ${reducedMotion}: ${durations.length} éléments animés, durée max ${max}s`);
    await ctx.close();
  }
  await browser.close();
  if (failures) {
    console.error("ÉCHEC : prefers-reduced-motion n'est pas respecté.");
    process.exit(1);
  }
  console.log("OK : animations coupées si mouvement réduit.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
