/**
 * Helpers partagés par les scripts de vérification design (screenshots, axe).
 *
 * Note : en mode maquette, MSW intercepte via un service worker, que
 * page.route() ne peut pas surcharger. Les états de démo sont donc injectés
 * en surchargeant window.fetch via addInitScript (avant tout script de page).
 */
import type { Page } from "@playwright/test";

export const BASE = argValue("--base") ?? process.env.BASE_URL ?? "http://localhost:3100";

export function argValue(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

/* ---------- viewports ---------- */
export const VP = {
  tabletPortrait: { width: 768, height: 1024 }, // enfants, tablette portrait
  tabletLandscape: { width: 1024, height: 768 }, // enfants, tablette paysage
  desktop: { width: 1440, height: 900 }, // admin
  mobile: { width: 390, height: 844 }, // accueil + chat mobile
} as const;
export type VpName = keyof typeof VP;

/* ---------- specs d'interception (sérialisables) ---------- */
export interface MockSpec {
  /** motif RegExp sur l'URL (ex. "/api/kid/profiles") */
  pattern: string;
  /** réponse JSON complète */
  body?: unknown;
  status?: number;
  /** fusionne ce patch dans la réponse réelle (qui passe par MSW) */
  patch?: Record<string, unknown>;
  /** remplace la réponse par un flux SSE pré-construit */
  sse?: string;
  /** méthodes concernées (défaut: toutes) */
  method?: string;
  /** nombre de fois où la règle s'applique (défaut: illimité) */
  times?: number;
}

export function mockApi(page: Page, specs: MockSpec[]) {
  return page.addInitScript((s) => {
    const orig = window.fetch.bind(window);
    const counts = new Map<number, number>();
    window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      const method = (init?.method ?? "GET").toUpperCase();
      for (let i = 0; i < s.length; i++) {
        const spec = s[i];
        if (spec.method && spec.method.toUpperCase() !== method) continue;
        if (!new RegExp(spec.pattern).test(url)) continue;
        if (spec.times !== undefined) {
          const n = counts.get(i) ?? 0;
          if (n >= spec.times) continue;
          counts.set(i, n + 1);
        }
        if (spec.patch) {
          return orig(input, init).then(async (resp) => {
            try {
              const body = await resp.json();
              return new Response(JSON.stringify({ ...body, ...spec.patch }), {
                status: resp.status,
                headers: { "Content-Type": "application/json" },
              });
            } catch {
              return resp;
            }
          });
        }
        if (spec.sse) {
          const payload = spec.sse;
          const stream = new ReadableStream<Uint8Array>({
            async start(controller) {
              const enc = new TextEncoder();
              for (const chunk of payload.split("\n\n")) {
                controller.enqueue(enc.encode(chunk + "\n\n"));
                await new Promise((r) => setTimeout(r, 25));
              }
              controller.close();
            },
          });
          return Promise.resolve(
            new Response(stream, { status: spec.status ?? 200, headers: { "Content-Type": "text/event-stream" } }),
          );
        }
        return Promise.resolve(
          new Response(JSON.stringify(spec.body), {
            status: spec.status ?? 200,
            headers: { "Content-Type": "application/json" },
          }),
        );
      }
      return orig(input, init);
    };
  }, specs);
}

/** Construit un payload SSE (événements token/done) à partir d'un texte. */
export function sseFromText(
  text: string,
  opts: { notice?: string; safetyEvents?: unknown[] } = {},
): string {
  const parts: string[] = [];
  if (opts.notice) parts.push(`event: notice\ndata: ${JSON.stringify({ message: opts.notice })}`);
  for (const w of text.split(" ")) {
    parts.push(`event: token\ndata: ${JSON.stringify({ text: w + " " })}`);
  }
  parts.push(
    `event: done\ndata: ${JSON.stringify({
      full_text: text,
      message_id: "msg-demo-1",
      safety_events: opts.safetyEvents ?? [],
      tokens_in: 120,
      tokens_out: 40,
    })}`,
  );
  return parts.join("\n\n");
}

/* ---------- flux de connexion (en cliquant dans l'UI) ---------- */
export async function kidLogin(page: Page, prenom = "Léa", pin = "5678") {
  await page.goto(BASE + "/select", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: new RegExp(prenom) }).first().click();
  await page.waitForURL(/\/pin\//);
  for (const d of pin) {
    await page.getByRole("button", { name: d, exact: true }).click();
    await page.waitForTimeout(120);
  }
  await page.waitForURL(/\/chat/, { timeout: 8000 });
}

/**
 * Navigation SPA sans rechargement (un rechargement perd la session mock MSW,
 * dont les handlers vivent dans le contexte de la page).
 */
export async function spaGoto(page: Page, url: string) {
  await page.evaluate((u) => {
    window.history.pushState({}, "", u);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }, url);
  await page.waitForTimeout(400);
}

/** Connexion enfant puis navigation SPA vers une conversation. */
export async function kidLoginTo(page: Page, conversationId: string, prenom = "Léa", pin = "5678") {
  await kidLogin(page, prenom, pin);
  await spaGoto(page, `/chat/${conversationId}`);
}

export async function adminLogin(page: Page) {
  await page.goto(BASE + "/admin/login", { waitUntil: "networkidle" });
  await page.getByLabel(/email/i).fill("parent@exemple.fr");
  await page.getByLabel(/mot de passe/i).fill("motdepasse-demo");
  await page.getByRole("button", { name: /se connecter/i }).click();
  await page.waitForURL(/\/admin$/, { timeout: 8000 });
}

/** Réponse de sécurité (démo) : flux SSE calme avec 119 / 3018. */
export const SAFETY_TEXT =
  "Je suis là pour t'aider. Si tu te sens en danger ou mal, parle tout de suite à un adulte de confiance. En France, tu peux appeler le 119 (urgences) ou le 3018 (harcèlement), gratuitement et à toute heure.";
