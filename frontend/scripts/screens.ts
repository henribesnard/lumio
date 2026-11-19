/**
 * Catalogue des écrans × états × viewports à capturer / auditer.
 * Utilisé par scripts/screenshots.ts et scripts/axe.ts.
 */
import type { Page } from "@playwright/test";
import {
  SAFETY_TEXT,
  adminLogin,
  kidLogin,
  kidLoginTo,
  mockApi,
  spaGoto,
  sseFromText,
  type MockSpec,
  type VpName,
} from "./lib.ts";

export interface ShotDef {
  name: string;
  vp: VpName;
  url: string;
  /** URL de départ avant run() (login) — par défaut url */
  startUrl?: string;
  run?: (page: Page) => Promise<void>;
  /** interceptions fetch injectées avant navigation (états de démo) */
  mocks?: MockSpec[];
  fullPage?: boolean;
  /** concentrer l'audit axe sur une zone si pertinent */
  axeSelector?: string;
}

export function buildShots(): ShotDef[] {
  const shots: ShotDef[] = [];
  const push = (s: ShotDef) => shots.push(s);

  /* ===== Prévisualisation design ===== */
  push({ name: "00-design-components", vp: "desktop", url: "/__design/components", fullPage: true });

  /* ===== 1. Choix du profil ===== */
  push({ name: "01-select", vp: "tabletPortrait", url: "/select" });
  push({ name: "01-select-landscape", vp: "tabletLandscape", url: "/select" });
  push({ name: "01-select-mobile", vp: "mobile", url: "/select" });
  push({
    name: "01-select-untrusted-device",
    vp: "tabletPortrait",
    url: "/select",
    mocks: [
      {
        pattern: "/api/kid/profiles",
        status: 403,
        body: { error: { code: "untrusted_device", message: "Cet appareil n'est pas reconnu comme appareil familial." } },
      },
    ],
  });
  push({
    name: "01-select-error",
    vp: "tabletPortrait",
    url: "/select",
    mocks: [{ pattern: "/api/kid/profiles", status: 500, body: { error: { code: "server", message: "Erreur serveur." } } }],
  });
  push({
    name: "01-select-empty",
    vp: "tabletPortrait",
    url: "/select",
    mocks: [{ pattern: "/api/kid/profiles", body: [] }],
  });

  /* ===== 2. PIN ===== */
  push({
    name: "02-pin",
    vp: "tabletPortrait",
    url: "/pin/profile-lea",
    run: async (page) => {
      for (const d of ["5", "6"]) {
        await page.getByRole("button", { name: d, exact: true }).click();
        await page.waitForTimeout(100);
      }
    },
  });
  push({
    name: "02-pin-error",
    vp: "tabletPortrait",
    url: "/pin/profile-lea",
    run: async (page) => {
      for (const d of ["0", "0", "0", "0"]) {
        await page.getByRole("button", { name: d, exact: true }).click();
        await page.waitForTimeout(150);
      }
      await page.waitForTimeout(600);
    },
  });
  push({
    name: "02-pin-locked",
    vp: "tabletPortrait",
    url: "/pin/profile-ines",
    run: async (page) => {
      for (const d of ["1", "2", "3", "4"]) {
        await page.getByRole("button", { name: d, exact: true }).click();
        await page.waitForTimeout(150);
      }
      await page.waitForTimeout(600);
    },
    mocks: [
      {
        pattern: "/api/auth/kid/login",
        method: "POST",
        status: 429,
        body: { error: { code: "profile_locked", message: "Ton profil est bloqué pour le moment. Demande à un parent." } },
      },
    ],
  });

  /* ===== 3. Accueil enfant ===== */
  push({ name: "03-kid-home", vp: "tabletPortrait", url: "/chat", run: async (p) => void (await kidLogin(p)) });
  push({ name: "03-kid-home-landscape", vp: "tabletLandscape", url: "/chat", run: async (p) => void (await kidLogin(p)) });
  push({ name: "03-kid-home-mobile", vp: "mobile", url: "/chat", run: async (p) => void (await kidLogin(p)) });
  push({ name: "03-kid-home-9-14", vp: "tabletPortrait", url: "/chat", run: async (p) => void (await kidLogin(p, "Noah")) });
  push({
    name: "03-kid-home-hors-horaires",
    vp: "tabletPortrait",
    url: "/chat",
    run: async (p) => void (await kidLogin(p)),
    mocks: [{ pattern: "/api/kid/me", patch: { hors_plage_horaire: true } }],
  });
  push({
    name: "03-kid-home-quota-0",
    vp: "tabletPortrait",
    url: "/chat",
    run: async (p) => void (await kidLogin(p)),
    mocks: [{ pattern: "/api/kid/me", patch: { quota_messages_restant: 0 } }],
  });
  push({
    name: "03-kid-home-quota-low",
    vp: "tabletPortrait",
    url: "/chat",
    run: async (p) => void (await kidLogin(p)),
    mocks: [{ pattern: "/api/kid/me", patch: { quota_messages_restant: 2 } }],
  });
  push({
    name: "03-kid-home-empty-suggestions-6-8",
    vp: "tabletPortrait",
    url: "/chat",
    run: async (p) => void (await kidLogin(p, "Léa")),
    mocks: [{ pattern: "/api/kid/conversations", body: [] }],
  });
  push({
    name: "03-kid-home-empty-suggestions-9-14",
    vp: "tabletPortrait",
    url: "/chat",
    run: async (p) => void (await kidLogin(p, "Noah")),
    mocks: [{ pattern: "/api/kid/conversations", body: [] }],
  });

  /* ===== 4. Chat ===== */
  push({ name: "04-chat", vp: "tabletPortrait", url: "/chat/conv-lea-1", run: async (p) => void (await kidLoginTo(p, "conv-lea-1")) });
  push({
    name: "04-chat-landscape-9-14",
    vp: "tabletLandscape",
    url: "/chat/conv-noah-1",
    run: async (p) => void (await kidLoginTo(p, "conv-noah-1", "Noah")),
  });
  push({ name: "04-chat-mobile", vp: "mobile", url: "/chat/conv-lea-1", run: async (p) => void (await kidLoginTo(p, "conv-lea-1")) });
  push({
    name: "04-chat-9-14",
    vp: "tabletPortrait",
    url: "/chat/conv-ines-1",
    run: async (p) => void (await kidLoginTo(p, "conv-ines-1", "Inès")),
  });
  push({
    name: "04-chat-streaming",
    vp: "tabletPortrait",
    url: "/chat/conv-lea-1",
    run: async (p) => {
      await kidLoginTo(p, "conv-lea-1");
      await p.getByPlaceholder(/écrire|message/i).fill("Et 7 + 6 ?");
      await p.keyboard.press("Enter");
      await p.waitForTimeout(700);
    },
  });
  push({
    name: "04-chat-typing",
    vp: "tabletPortrait",
    url: "/chat/conv-lea-1",
    run: async (p) => {
      await kidLoginTo(p, "conv-lea-1");
      await p.getByPlaceholder(/écrire|message/i).fill("Dis-moi un indice");
      await p.keyboard.press("Enter");
      await p.waitForTimeout(150);
    },
  });
  push({
    name: "04-chat-safety-response",
    vp: "tabletPortrait",
    url: "/chat/conv-lea-1",
    run: async (p) => {
      await kidLoginTo(p, "conv-lea-1");
      await p.getByPlaceholder(/écrire|message/i).fill("je suis triste personne ne m'aime");
      await p.keyboard.press("Enter");
      await p.waitForTimeout(4500);
    },
    mocks: [
      {
        pattern: "/api/kid/conversations/[^/]+/messages",
        method: "POST",
        sse: sseFromText(SAFETY_TEXT, {
          safetyEvents: [{ type: "distress", severity: "critical" }],
        }),
      },
    ],
  });
  push({
    name: "04-chat-notice",
    vp: "tabletPortrait",
    url: "/chat/conv-lea-1",
    run: async (p) => {
      await kidLoginTo(p, "conv-lea-1");
      await p.getByPlaceholder(/écrire|message/i).fill("combien de messages il me reste ?");
      await p.keyboard.press("Enter");
      await p.waitForTimeout(1500);
    },
    mocks: [
      {
        pattern: "/api/kid/conversations/[^/]+/messages",
        method: "POST",
        sse: sseFromText("D'accord ! Qu'est-ce que tu aimerais réviser maintenant ?", {
          notice: "Il te reste 3 messages aujourd'hui. Profite-en bien !",
        }),
      },
    ],
  });

  /* ===== 7-14. Admin (login puis navigation SPA : un rechargement perd la session mock) ===== */
  const adminShot = (
    name: string,
    path: string,
    vp: VpName = "desktop",
    extraRun?: (p: Page) => Promise<void>,
    mocks?: MockSpec[],
  ) =>
    push({
      name,
      vp,
      url: path,
      startUrl: "/admin/login",
      mocks,
      run: async (p) => {
        await adminLogin(p);
        await spaGoto(p, path);
        if (extraRun) await extraRun(p);
      },
    });

  push({ name: "07-admin-login", vp: "desktop", url: "/admin/login" });
  push({
    name: "07-admin-login-totp",
    vp: "desktop",
    url: "/admin/login",
    run: async (page) => {
      await page.getByLabel(/email/i).fill("parent@exemple.fr");
      await page.getByLabel(/mot de passe/i).fill("motdepasse-demo");
      await page.getByRole("button", { name: /se connecter/i }).click();
      await page.waitForTimeout(600);
    },
    mocks: [
      {
        pattern: "/api/auth/admin/login",
        method: "POST",
        status: 401,
        times: 1,
        body: { error: { code: "totp_required", message: "Code TOTP requis." } },
      },
    ],
  });
  push({
    name: "07-admin-login-error",
    vp: "desktop",
    url: "/admin/login",
    run: async (page) => {
      await page.getByLabel(/email/i).fill("parent@exemple.fr");
      await page.getByLabel(/mot de passe/i).fill("mauvais");
      await page.getByRole("button", { name: /se connecter/i }).click();
      await page.waitForTimeout(600);
    },
    mocks: [
      {
        pattern: "/api/auth/admin/login",
        method: "POST",
        status: 401,
        body: { error: { code: "invalid_credentials", message: "Identifiants incorrects." } },
      },
    ],
  });

  adminShot("08-admin-dashboard", "/admin");
  adminShot("08-admin-dashboard-mobile", "/admin", "mobile");
  adminShot("09-admin-profiles", "/admin/profiles");
  adminShot("09-admin-profiles-create", "/admin/profiles", "desktop", async (p) => {
    await p.getByRole("button", { name: /nouveau profil/i }).click();
    await p.waitForTimeout(300);
  });
  adminShot("10-admin-profile-detail", "/admin/profiles/profile-lea");
  adminShot("10-admin-profile-comportement", "/admin/profiles/profile-lea", "desktop", async (p) => {
    await p.getByRole("tab", { name: /comportement/i }).click();
    await p.waitForTimeout(300);
  });
  adminShot("10-admin-profile-limites", "/admin/profiles/profile-lea", "desktop", async (p) => {
    await p.getByRole("tab", { name: /limites/i }).click();
    await p.waitForTimeout(300);
  });
  adminShot("10-admin-profile-prompt", "/admin/profiles/profile-lea", "desktop", async (p) => {
    await p.getByRole("tab", { name: /aperçu du prompt/i }).click();
    await p.waitForTimeout(600);
  });
  adminShot("10-admin-profile-conversations", "/admin/profiles/profile-lea", "desktop", async (p) => {
    await p.getByRole("tab", { name: /conversations/i }).click();
    await p.waitForTimeout(300);
  });
  adminShot("10-admin-profile-danger", "/admin/profiles/profile-lea", "desktop", async (p) => {
    await p.getByRole("tab", { name: /zone dangereuse/i }).click();
    await p.waitForTimeout(300);
  });
  adminShot("11-admin-conversation", "/admin/conversations/conv-lea-1");
  adminShot("12-admin-safety", "/admin/safety");
  adminShot("12-admin-safety-all", "/admin/safety", "desktop", async (p) => {
    await p.getByRole("button", { name: /toutes/i }).click();
    await p.waitForTimeout(400);
  });
  adminShot("13-admin-devices", "/admin/devices");

  /* ===== 14. Sécurité du compte (TOTP) ===== */
  adminShot("14-admin-security", "/admin/security");
  adminShot("14-admin-security-setup", "/admin/security", "desktop", async (p) => {
    await p.getByRole("button", { name: /activer le totp/i }).click();
    await p.waitForTimeout(400);
  });
  adminShot(
    "14-admin-security-setup-error",
    "/admin/security",
    "desktop",
    async (p) => {
      await p.getByRole("button", { name: /activer le totp/i }).click();
      await p.waitForTimeout(400);
      await p.getByLabel(/code de vérification/i).fill("000000");
      await p.getByRole("button", { name: /confirmer/i }).click();
      await p.waitForTimeout(500);
    },
    [
      {
        pattern: "/api/admin/totp/confirm",
        method: "POST",
        status: 400,
        body: { error: { code: "invalid_code", message: "Code invalide." } },
      },
    ],
  );
  adminShot("14-admin-security-enabled", "/admin/security", "desktop", undefined, [
    { pattern: "/api/admin/totp/status", body: { enabled: true } },
  ]);

  return shots;
}
