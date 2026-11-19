/**
 * Lumio — captures d'écran de design (mode maquette).
 *
 * Usage :
 *   1. Démarrer le frontend en mode maquette :
 *        cd frontend && VITE_USE_MOCKS=true npm run dev
 *   2. Lancer les captures :
 *        node --experimental-strip-types scripts/screenshots.ts [--filter <motif>] [--base <url>]
 *
 * Les captures sont écrites dans docs/design/screenshots/.
 * Certaines états sont produits par interception réseau (page.route) :
 * ils ne modifient aucune donnée du dépôt.
 */
import { chromium, type Browser, type Page, type Route } from "@playwright/test";
import * as fs from "node:fs";
import * as path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..", "..");
const OUT_DIR = path.join(ROOT, "docs", "design", "screenshots");
const BASE = argValue("--base") ?? process.env.BASE_URL ?? "http://localhost:3100";
const FILTER = argValue("--filter");

function argValue(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

/* ---------- viewports ---------- */
const VP = {
  tabletPortrait: { width: 768, height: 1024 }, // enfants, tablette portrait
  tabletLandscape: { width: 1024, height: 768 }, // enfants, tablette paysage
  desktop: { width: 1440, height: 900 }, // admin
  mobile: { width: 390, height: 844 }, // accueil + chat mobile
} as const;
type VpName = keyof typeof VP;

/* ---------- helpers ---------- */
async function shot(
  browser: Browser,
  name: string,
  vp: VpName,
  url: string,
  opts: {
    run?: (page: Page) => Promise<void>;
    routes?: ((page: Page) => Promise<void>)[];
    fullPage?: boolean;
  } = {},
) {
  if (FILTER && !name.includes(FILTER)) return;
  const ctx = await browser.newContext({ viewport: VP[vp], locale: "fr-FR" });
  const page = await ctx.newPage();
  for (const r of opts.routes ?? []) await r(page);
  await page.goto(BASE + url, { waitUntil: "networkidle" });
  if (opts.run) await opts.run(page);
  await page.waitForTimeout(350);
  const file = path.join(OUT_DIR, `${name}.png`);
  await page.screenshot({ path: file, fullPage: opts.fullPage ?? false });
  console.log("  ✓", name);
  await ctx.close();
}

/** Intercepte une requête API et renvoie un JSON (état de démo). */
function mockJson(route: string, body: unknown, status = 200) {
  return async (page: Page) => {
    await page.route(`**${route}`, (r: Route) =>
      r.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) }),
    );
  };
}

/** Flux de connexion enfant (profil Léa, PIN 5678) en cliquant dans l'UI. */
async function kidLogin(page: Page, prenom = "Léa", pin = "5678") {
  await page.goto(BASE + "/select", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: new RegExp(prenom) }).first().click();
  await page.waitForURL(/\/pin\//);
  for (const d of pin) {
    await page.getByRole("button", { name: d, exact: true }).click();
    await page.waitForTimeout(120);
  }
  await page.waitForURL(/\/chat/, { timeout: 8000 });
}

/** Flux de connexion admin. */
async function adminLogin(page: Page) {
  await page.goto(BASE + "/admin/login", { waitUntil: "networkidle" });
  await page.getByLabel(/email/i).fill("parent@exemple.fr");
  await page.getByLabel(/mot de passe/i).fill("motdepasse-demo");
  await page.getByRole("button", { name: /se connecter/i }).click();
  await page.waitForURL(/\/admin$/, { timeout: 8000 });
}

/* ---------- catalogue des captures ---------- */
async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  console.log(`Captures vers ${OUT_DIR} (base ${BASE})`);

  /* ===== Phase 1 — prévisualisation des pistes ===== */
  await shot(browser, "00-design-pistes", "desktop", "/__design", { fullPage: true });
  await shot(browser, "00-design-pistes-mobile", "mobile", "/__design", { fullPage: true });
  await shot(browser, "00-design-components", "desktop", "/__design/components", { fullPage: true });

  /* ===== Parcours enfant ===== */
  // 1. Choix du profil
  await shot(browser, "01-select", "tabletPortrait", "/select");
  await shot(browser, "01-select-landscape", "tabletLandscape", "/select");
  await shot(browser, "01-select-mobile", "mobile", "/select");
  await shot(browser, "01-select-untrusted-device", "tabletPortrait", "/select", {
    routes: [
      mockJson("/api/kid/profiles", {
        error: { code: "untrusted_device", message: "Cet appareil n'est pas reconnu comme appareil familial." },
      }, 403),
    ],
  });
  await shot(browser, "01-select-empty", "tabletPortrait", "/select", {
    routes: [mockJson("/api/kid/profiles", [])],
  });

  // 2. PIN
  await shot(browser, "02-pin", "tabletPortrait", "/pin/profile-lea", {
    run: async (page) => {
      for (const d of ["5", "6"]) {
        await page.getByRole("button", { name: d, exact: true }).click();
        await page.waitForTimeout(100);
      }
    },
  });
  await shot(browser, "02-pin-error", "tabletPortrait", "/pin/profile-lea", {
    run: async (page) => {
      for (const d of ["0", "0", "0", "0"]) {
        await page.getByRole("button", { name: d, exact: true }).click();
        await page.waitForTimeout(150);
      }
      await page.waitForTimeout(600);
    },
  });
  await shot(browser, "02-pin-locked", "tabletPortrait", "/pin/profile-ines", {
    run: async (page) => {
      for (const d of ["1", "2", "3", "4"]) {
        await page.getByRole("button", { name: d, exact: true }).click();
        await page.waitForTimeout(150);
      }
      await page.waitForTimeout(600);
    },
    routes: [
      async (page) => {
        await page.route("**/api/auth/kid/login", (r) =>
          r.fulfill({
            status: 429,
            contentType: "application/json",
            body: JSON.stringify({
              error: { code: "profile_locked", message: "Ton profil est bloqué pour le moment. Demande à un parent." },
            }),
          }),
        );
      },
    ],
  });

  // 3. Accueil enfant (liste des conversations)
  await shot(browser, "03-kid-home", "tabletPortrait", "/chat", {
    run: async (page) => kidLogin(page),
  });
  await shot(browser, "03-kid-home-landscape", "tabletLandscape", "/chat", {
    run: async (page) => kidLogin(page),
  });
  await shot(browser, "03-kid-home-mobile", "mobile", "/chat", {
    run: async (page) => kidLogin(page),
  });
  await shot(browser, "03-kid-home-6-8", "tabletPortrait", "/chat", {
    run: async (page) => kidLogin(page, "Léa"),
  });
  await shot(browser, "03-kid-home-hors-horaires", "tabletPortrait", "/chat", {
    run: async (page) => kidLogin(page),
    routes: [
      async (page) => {
        await page.route("**/api/kid/me", async (r) => {
          const resp = await r.fetch();
          const body = await resp.json();
          r.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ ...body, hors_plage_horaire: true }),
          });
        });
      },
    ],
  });
  await shot(browser, "03-kid-home-quota-0", "tabletPortrait", "/chat", {
    run: async (page) => kidLogin(page),
    routes: [
      async (page) => {
        await page.route("**/api/kid/me", async (r) => {
          const resp = await r.fetch();
          const body = await resp.json();
          r.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ ...body, quota_messages_restant: 0 }),
          });
        });
      },
    ],
  });
  await shot(browser, "03-kid-home-empty", "tabletPortrait", "/chat", {
    run: async (page) => kidLogin(page),
    routes: [mockJson("/api/kid/conversations", [])],
  });

  // 4. Chat
  await shot(browser, "04-chat", "tabletPortrait", "/chat/conv-lea-1", {
    run: async (page) => kidLogin(page),
  });
  await shot(browser, "04-chat-landscape-9-14", "tabletLandscape", "/chat/conv-noah-1", {
    run: async (page) => kidLogin(page, "Noah"),
  });
  await shot(browser, "04-chat-mobile", "mobile", "/chat/conv-lea-1", {
    run: async (page) => kidLogin(page),
  });
  await shot(browser, "04-chat-9-14", "tabletPortrait", "/chat/conv-ines-1", {
    run: async (page) => kidLogin(page, "Inès"),
  });
  // état « Lumio réfléchit » + streaming : on envoie un message et on capture pendant le stream
  await shot(browser, "04-chat-streaming", "tabletPortrait", "/chat/conv-lea-1", {
    run: async (page) => {
      await kidLogin(page);
      await page.getByPlaceholder(/écrire|message/i).fill("Et 7 + 6 ?");
      await page.keyboard.press("Enter");
      await page.waitForTimeout(700); // au milieu du stream
    },
  });
  await shot(browser, "04-chat-typing", "tabletPortrait", "/chat/conv-lea-1", {
    run: async (page) => {
      await kidLogin(page);
      await page.getByPlaceholder(/écrire|message/i).fill("Dis-moi un indice");
      await page.keyboard.press("Enter");
      await page.waitForTimeout(150); // indicateur de frappe
    },
  });
  // réponse de sécurité (démo via SSE intercepté)
  const safetySse = async (page: Page) => {
    await page.route("**/api/kid/conversations/*/messages", async (r) => {
      if (r.request().method() !== "POST") return r.continue();
      const text =
        "Je suis là pour t'aider. Si tu te sens en danger ou mal, parle tout de suite à un adulte de confiance. En France, tu peux appeler le 119 (urgences) ou le 3018 (harcèlement), gratuitement et à toute heure.";
      const enc = new TextEncoder();
      const words = text.split(" ");
      const stream = new ReadableStream({
        async start(controller) {
          for (const w of words) {
            controller.enqueue(enc.encode(`event: token\ndata: ${JSON.stringify({ text: w + " " })}\n\n`));
            await new Promise((res) => setTimeout(res, 30));
          }
          controller.enqueue(
            enc.encode(
              `event: done\ndata: ${JSON.stringify({ full_text: text, message_id: "msg-safe-1", safety_events: [], tokens_in: 120, tokens_out: 40 })}\n\n`,
            ),
          );
          controller.close();
        },
      });
      await r.fulfill({
        status: 200,
        contentType: "text/event-stream",
        body: stream as unknown as string,
      });
    });
  };
  await shot(browser, "04-chat-safety-response", "tabletPortrait", "/chat/conv-lea-1", {
    run: async (page) => {
      await kidLogin(page);
      await page.getByPlaceholder(/écrire|message/i).fill("je suis triste personne ne m'aime");
      await page.keyboard.press("Enter");
      await page.waitForTimeout(4500); // stream terminé
    },
    routes: [safetySse],
  });
  // avis système (notice SSE)
  await shot(browser, "04-chat-notice", "tabletPortrait", "/chat/conv-lea-1", {
    run: async (page) => {
      await kidLogin(page);
      await page.getByPlaceholder(/écrire|message/i).fill("combien de messages il me reste ?");
      await page.keyboard.press("Enter");
      await page.waitForTimeout(1200);
    },
    routes: [
      async (page) => {
        await page.route("**/api/kid/conversations/*/messages", async (r) => {
          if (r.request().method() !== "POST") return r.continue();
          const enc = new TextEncoder();
          const stream = new ReadableStream({
            async start(controller) {
              controller.enqueue(
                enc.encode(`event: notice\ndata: ${JSON.stringify({ message: "Il te reste 3 messages aujourd'hui. Profite-en bien !" })}\n\n`),
              );
              const text = "D'accord ! Qu'est-ce que tu aimerais réviser maintenant ?";
              for (const w of text.split(" ")) {
                controller.enqueue(enc.encode(`event: token\ndata: ${JSON.stringify({ text: w + " " })}\n\n`));
                await new Promise((res) => setTimeout(res, 40));
              }
              controller.enqueue(enc.encode(`event: done\ndata: ${JSON.stringify({ full_text: text, message_id: "m1" })}\n\n`));
              controller.close();
            },
          });
          await r.fulfill({ status: 200, contentType: "text/event-stream", body: stream as unknown as string });
        });
      },
    ],
  });

  /* ===== Parcours admin ===== */
  await shot(browser, "07-admin-login", "desktop", "/admin/login");
  await shot(browser, "07-admin-login-totp", "desktop", "/admin/login", {
    run: async (page) => {
      await page.getByLabel(/email/i).fill("parent@exemple.fr");
      await page.getByLabel(/mot de passe/i).fill("motdepasse-demo");
      await page.getByRole("button", { name: /se connecter/i }).click();
      await page.waitForTimeout(400);
      // simule l'apparition du champ TOTP via erreur totp_required
    },
    routes: [
      async (page) => {
        let first = true;
        await page.route("**/api/auth/admin/login", async (r) => {
          if (first) {
            first = false;
            return r.fulfill({
              status: 401,
              contentType: "application/json",
              body: JSON.stringify({ error: { code: "totp_required", message: "Code TOTP requis." } }),
            });
          }
          return r.continue();
        });
      },
    ],
  });
  await shot(browser, "07-admin-login-error", "desktop", "/admin/login", {
    run: async (page) => {
      await page.getByLabel(/email/i).fill("parent@exemple.fr");
      await page.getByLabel(/mot de passe/i).fill("mauvais");
      await page.getByRole("button", { name: /se connecter/i }).click();
      await page.waitForTimeout(600);
    },
    routes: [
      mockJson("/api/auth/admin/login", { error: { code: "invalid_credentials", message: "Identifiants incorrects." } }, 401),
    ],
  });
  await shot(browser, "08-admin-dashboard", "desktop", "/admin", { run: async (page) => adminLogin(page) });
  await shot(browser, "08-admin-dashboard-mobile", "mobile", "/admin", { run: async (page) => adminLogin(page) });
  await shot(browser, "09-admin-profiles", "desktop", "/admin/profiles", { run: async (page) => adminLogin(page) });
  await shot(browser, "10-admin-profile-detail", "desktop", "/admin/profiles/profile-lea", {
    run: async (page) => adminLogin(page),
  });
  await shot(browser, "10-admin-profile-edit", "desktop", "/admin/profiles/profile-lea", {
    run: async (page) => {
      await adminLogin(page);
      await page.getByRole("button", { name: /modifier/i }).click();
      await page.waitForTimeout(300);
    },
  });
  await shot(browser, "11-admin-conversation", "desktop", "/admin/conversations/conv-lea-1", {
    run: async (page) => adminLogin(page),
  });
  await shot(browser, "12-admin-safety", "desktop", "/admin/safety", { run: async (page) => adminLogin(page) });
  await shot(browser, "12-admin-safety-all", "desktop", "/admin/safety", {
    run: async (page) => {
      await adminLogin(page);
      await page.getByRole("button", { name: /toutes/i }).click();
      await page.waitForTimeout(400);
    },
  });
  await shot(browser, "13-admin-devices", "desktop", "/admin/devices", { run: async (page) => adminLogin(page) });

  await browser.close();
  console.log("Terminé.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
