/**
 * Lumio — navigation clavier complète sur PIN, chat et édition de profil (mode maquette).
 *
 * Usage :
 *   node --experimental-strip-types scripts/keyboard.ts [--base <url>]
 *
 * Vérifie :
 *  - chaque étape atteignable au Tab est focalisable et a un focus visible (box-shadow) ;
 *  - le PIN se saisit entièrement au clavier (chiffres + retour arrière + envoi) ;
 *  - le chat s'utilise au clavier (saisie + Entrée pour envoyer) ;
 *  - les onglets du profil admin s'activent au clavier (Entrée/Espace).
 */
import { chromium, type Page } from "@playwright/test";
import { BASE, adminLogin, spaGoto } from "./lib.ts";

let failures = 0;

function check(name: string, ok: boolean, detail = "") {
  if (ok) {
    console.log(`  ✓ ${name}`);
  } else {
    failures++;
    console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

/** Le focus est-il visible (box-shadow non nulle) sur l'élément actif ? */
async function focusVisible(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    if (!el || el === document.body) return false;
    const cs = getComputedStyle(el);
    return cs.boxShadow !== "none" && cs.outlineStyle !== "none";
  });
}

async function activeDesc(page: Page): Promise<string> {
  return page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    if (!el) return "(rien)";
    const role = el.getAttribute("role");
    const label =
      el.getAttribute("aria-label") ||
      (el.textContent ?? "").trim().slice(0, 40) ||
      el.tagName.toLowerCase();
    return `${el.tagName.toLowerCase()}${role ? `[role=${role}]` : ""}[${label}]`;
  });
}

async function pinFlow(page: Page) {
  console.log("Écran PIN (6-8) :");
  await page.goto(BASE + "/select", { waitUntil: "networkidle" });
  // Choisir Léa au clavier
  const lea = page.getByRole("button", { name: /léa/i });
  await lea.focus();
  check("profil focalisable", (await activeDesc(page)).includes("button"));
  check("focus visible (sélection)", await focusVisible(page));
  await page.keyboard.press("Enter");
  await page.waitForURL(/\/pin/, { timeout: 8000 });

  // Bouton Effacer au clavier : 2 chiffres, efface, efface
  for (const d of ["9", "9"]) {
    await page.getByRole("button", { name: d, exact: true }).focus();
    await page.keyboard.press("Enter");
    await page.waitForTimeout(120);
  }
  let status = await page.getByRole("status").getAttribute("aria-label");
  check("2 chiffres saisis au clavier", status?.startsWith("2") ?? false, status ?? "");
  const clear = page.getByRole("button", { name: /effacer/i });
  await clear.focus();
  check("bouton Effacer focalisable + focus visible", await focusVisible(page));
  await page.keyboard.press("Enter");
  await page.waitForTimeout(120);
  status = await page.getByRole("status").getAttribute("aria-label");
  check("Effacer → 1 chiffre", status?.startsWith("1") ?? false, status ?? "");
  await clear.focus();
  await page.keyboard.press("Enter");
  await page.waitForTimeout(120);
  status = await page.getByRole("status").getAttribute("aria-label");
  check("Effacer → 0 chiffre", status?.startsWith("0") ?? false, status ?? "");

  // Saisie complète du PIN au clavier : focus sur chaque chiffre + Entrée
  for (const d of ["5", "6", "7", "8"]) {
    const btn = page.getByRole("button", { name: d, exact: true });
    await btn.focus();
    check(`bouton ${d} focus visible`, await focusVisible(page));
    await page.keyboard.press("Enter");
    await page.waitForTimeout(150);
  }
  await page.waitForURL(/\/chat/, { timeout: 8000 });
  check("PIN saisi au clavier (focus + Entrée) → connexion", true);
}

async function chatFlow(page: Page) {
  console.log("Écran chat :");
  // Déjà connecté comme enfant (pinFlow) : navigation SPA directe
  await spaGoto(page, "/chat/conv-lea-1");
  await page.waitForTimeout(500);

  const input = page.getByRole("textbox", { name: /message/i });
  await input.focus();
  check("zone de saisie focalisable", (await activeDesc(page)).includes("textbox") || (await page.evaluate(() => document.activeElement?.getAttribute("contenteditable") === "true" || document.activeElement?.tagName === "TEXTAREA" || document.activeElement?.tagName === "INPUT")));
  check("focus visible (chat)", await focusVisible(page));
  await page.keyboard.type("3 + 5 = ?");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(800);
  const sent = await page.getByText("3 + 5 = ?").count();
  check("Entrée envoie le message", sent > 0);
}

async function adminProfileFlow(page: Page) {
  console.log("Édition profil admin :");
  await adminLogin(page);
  await spaGoto(page, "/admin/profiles/profile-lea");
  await page.waitForTimeout(500);

  // Parcours au Tab (clavier réel) jusqu'aux onglets, puis activation au clavier
  let desc = "";
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press("Tab");
    desc = await activeDesc(page);
    if (desc.includes("tab")) break;
  }
  check("onglet atteint au Tab", desc.includes("tab"), desc);
  check("focus visible (onglet)", await focusVisible(page));

  // Tab jusqu'à l'onglet « Comportement de l'agent », puis activation avec Entrée
  desc = "";
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press("Tab");
    desc = await activeDesc(page);
    if (desc.includes("role=tab") && /comportement/i.test(desc)) break;
  }
  check("onglet Comportement atteint au Tab", desc.includes("role=tab") && /comportement/i.test(desc), desc);
  await page.keyboard.press("Enter");
  await page.waitForTimeout(300);
  const consignes = page.getByLabel(/consignes/i);
  check("onglet activé au clavier (Tab + Entrée)", (await consignes.count()) === 1);

  // Tab jusqu'au champ consignes
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press("Tab");
    desc = await activeDesc(page);
    if (desc.toLowerCase().includes("textarea")) break;
  }
  check("champ consignes atteint au Tab", desc.toLowerCase().includes("textarea"), desc);
  check("focus visible (consignes)", await focusVisible(page));

  // Tab en avant depuis le champ : l'ordre de tabulation avance
  await page.keyboard.press("Tab");
  const after = await activeDesc(page);
  check("ordre de tabulation en avant fonctionne", after !== "(rien)" && after !== desc, `${desc} → ${after}`);

  // Le bouton Enregistrer est atteignable au clavier
  let saveDesc = "";
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press("Tab");
    saveDesc = await activeDesc(page);
    if (/enregistrer/i.test(saveDesc)) break;
  }
  check("bouton Enregistrer atteint au Tab", /enregistrer/i.test(saveDesc), saveDesc);
  check("focus visible (enregistrer)", await focusVisible(page));
}

async function main() {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 768, height: 1024 }, locale: "fr-FR" });
  const page = await ctx.newPage();
  page.setDefaultTimeout(15000);

  await pinFlow(page);
  await chatFlow(page);
  await adminProfileFlow(page);

  await browser.close();
  if (failures > 0) {
    console.error(`ÉCHEC: ${failures} vérification(s) clavier en échec.`);
    process.exit(1);
  }
  console.log("OK: navigation clavier complète sur PIN, chat et édition de profil.");
}

await main();
