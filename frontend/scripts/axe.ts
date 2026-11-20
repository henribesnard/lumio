/**
 * Lumio — audit accessibilité axe-core sur chaque écran × état (mode maquette).
 *
 * Usage :
 *   node --experimental-strip-types scripts/axe.ts [--filter <motif>] [--base <url>]
 *
 * Tolérance : zéro violation « serious » ou « critical ».
 * Le rapport complet est écrit dans docs/design/axe-report.json.
 */
import { chromium } from "@playwright/test";
import { AxeBuilder } from "@axe-core/playwright";
import * as fs from "node:fs";
import * as path from "node:path";
import { BASE, VP, argValue, mockApi } from "./lib.ts";
import { buildShots } from "./screens.ts";

const ROOT = path.resolve(import.meta.dirname, "..", "..");
const OUT = path.join(ROOT, "docs", "design", "axe-report.json");
const FILTER = argValue("--filter");

async function main() {
  const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM_PATH || undefined });
  const report: Record<string, unknown> = {};
  let failures = 0;
  const shots = buildShots().filter((s) => !FILTER || s.name.includes(FILTER));
  console.log(`Audit axe sur ${shots.length} écrans (base ${BASE})`);
  for (const s of shots) {
    const ctx = await browser.newContext({ viewport: VP[s.vp], locale: "fr-FR" });
    const page = await ctx.newPage();
    if (s.mocks) await mockApi(page, s.mocks);
    await page.goto(BASE + (s.startUrl ?? s.url), { waitUntil: "networkidle" });
    if (s.run) await s.run(page);
    await page.waitForTimeout(400);
    const builder = new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]);
    if (s.axeSelector) builder.include(s.axeSelector);
    const results = await builder.analyze();
    const bad = results.violations.filter((v) => v.impact === "critical" || v.impact === "serious");
    report[s.name] = {
      url: BASE + s.url,
      violations: results.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, help: v.help })),
      seriousOrCritical: bad.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, help: v.help })),
    };
    if (bad.length > 0) {
      failures++;
      console.log(`  ✗ ${s.name}: ${bad.length} violation(s) serious/critical`);
      for (const v of bad) {
        console.log(`      - ${v.id} (${v.impact}) ×${v.nodes.length}: ${v.help}`);
        if (process.argv.includes("--verbose"))
          for (const n of v.nodes.slice(0, 8)) console.log(`          ${n.target.join(" ")} — ${n.failureSummary?.split("\n")[1] ?? ""}`);
      }
    } else {
      console.log(`  ✓ ${s.name} (${results.violations.length} violation(s) mineures)`);
    }
    await ctx.close();
  }
  await browser.close();
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify({ generatedAt: new Date().toISOString(), base: BASE, results: report }, null, 2));
  console.log(`Rapport: ${OUT}`);
  if (failures > 0) {
    console.error(`ÉCHEC: ${failures} écran(s) avec violations serious/critical.`);
    process.exit(1);
  }
  console.log("OK: zéro violation serious/critical.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
