/**
 * MSW handlers — demo data for design handoff mode.
 * VITE_USE_MOCKS=true npm run dev
 */
import { http, HttpResponse, delay } from "msw";
import { mockProfiles, mockConversations, mockMessages, mockSafetyEvents, mockDevices, mockStats, mockLearnerNotes } from "./data";

// Simulated auth state
let currentUser: { role: string; admin_id?: string; profile_id?: string; prenom?: string } | null = null;

export const handlers = [
  // ---- Health ----
  http.get("/api/health", () => HttpResponse.json({ status: "ok", version: "0.1.0" })),

  // ---- Auth ----
  http.post("/api/auth/admin/login", async ({ request }) => {
    await delay(300);
    currentUser = { role: "admin", admin_id: "admin-001" };
    return HttpResponse.json(currentUser, {
      headers: { "Set-Cookie": "lumio_csrf=mock-csrf-token; Path=/" },
    });
  }),

  http.post("/api/auth/kid/login", async ({ request }) => {
    await delay(300);
    const body = (await request.json()) as { profile_id: string; pin: string };
    const profile = mockProfiles.find((p) => p.id === body.profile_id);
    if (!profile) return HttpResponse.json({ error: { code: "not_found", message: "Profil introuvable." } }, { status: 404 });
    if (body.pin !== "5678") return HttpResponse.json({ error: { code: "invalid_pin", message: "Code PIN incorrect." } }, { status: 401 });
    currentUser = { role: "kid", profile_id: profile.id, prenom: profile.prenom };
    return HttpResponse.json(currentUser);
  }),

  http.post("/api/auth/logout", () => {
    currentUser = null;
    return HttpResponse.json({ status: "ok" });
  }),

  http.get("/api/auth/me", () => {
    if (!currentUser) return HttpResponse.json({ error: { code: "not_authenticated", message: "Non connecté." } }, { status: 401 });
    return HttpResponse.json(currentUser);
  }),

  // ---- Kid: profiles ----
  http.get("/api/kid/profiles", () => {
    return HttpResponse.json(
      mockProfiles.map((p) => ({ id: p.id, prenom: p.prenom, avatar: p.avatar, actif: p.actif })),
    );
  }),

  // ---- Kid: me ----
  http.get("/api/kid/me", () => {
    const profileId = currentUser?.profile_id;
    const profile = mockProfiles.find((p) => p.id === profileId);
    if (!profile) return HttpResponse.json({ error: { code: "not_found", message: "?" } }, { status: 401 });
    return HttpResponse.json({
      prenom: profile.prenom,
      avatar: profile.avatar,
      age: profile.age,
      quota_messages_jour: profile.quota_messages_jour,
      quota_messages_restant: profile.quota_messages_jour - 3,
      quota_tokens_restant: profile.quota_tokens_jour - 2000,
      hors_plage_horaire: false,
    });
  }),

  // ---- Kid: conversations ----
  http.get("/api/kid/conversations", () => {
    const profileId = currentUser?.profile_id;
    return HttpResponse.json(mockConversations.filter((c) => c.profile_id === profileId));
  }),

  http.post("/api/kid/conversations", async ({ request }) => {
    await delay(200);
    const body = (await request.json()) as { titre?: string };
    const conv = {
      id: `conv-new-${Date.now()}`,
      profile_id: currentUser?.profile_id || "",
      titre: body.titre || "Nouvelle conversation",
      archived: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockConversations.unshift(conv);
    return HttpResponse.json(conv, { status: 201 });
  }),

  // ---- Kid: messages ----
  http.get("/api/kid/conversations/:id/messages", ({ params }) => {
    const msgs = mockMessages.filter((m) => m.conversation_id === params.id);
    return HttpResponse.json(msgs);
  }),

  // ---- Kid: send message (SSE) ----
  http.post("/api/kid/conversations/:id/messages", async ({ request }) => {
    const body = (await request.json()) as { contenu: string };

    // Simulated SSE response
    const responseText = "Bonne question ! Qu'est-ce que tu sais déjà sur ce sujet ? Essaie de me dire ce qui te vient en tête, et on avancera ensemble.";
    const words = responseText.split(" ");
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        for (const word of words) {
          const data = JSON.stringify({ text: word + " " });
          controller.enqueue(encoder.encode(`event: token\ndata: ${data}\n\n`));
          await new Promise((r) => setTimeout(r, 50));
        }
        const doneData = JSON.stringify({
          full_text: responseText,
          message_id: `msg-${Date.now()}`,
          safety_events: [],
          tokens_in: 150,
          tokens_out: 30,
        });
        controller.enqueue(encoder.encode(`event: done\ndata: ${doneData}\n\n`));
        controller.close();
      },
    });

    return new HttpResponse(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
      },
    });
  }),

  // ---- Admin: profiles ----
  http.get("/api/admin/profiles", () => HttpResponse.json(mockProfiles)),

  http.get("/api/admin/profiles/:id", ({ params }) => {
    const profile = mockProfiles.find((p) => p.id === params.id);
    if (!profile) return HttpResponse.json({ error: { code: "not_found", message: "Introuvable." } }, { status: 404 });
    return HttpResponse.json(profile);
  }),

  http.patch("/api/admin/profiles/:id", async ({ params, request }) => {
    const body = await request.json();
    const profile = mockProfiles.find((p) => p.id === params.id);
    if (!profile) return HttpResponse.json({ error: { code: "not_found", message: "Introuvable." } }, { status: 404 });
    Object.assign(profile, body);
    return HttpResponse.json(profile);
  }),

  http.delete("/api/admin/profiles/:id", () => new HttpResponse(null, { status: 204 })),

  http.put("/api/admin/profiles/:id/pin", () => new HttpResponse(null, { status: 204 })),

  http.post("/api/admin/profiles/:id/unlock", () => new HttpResponse(null, { status: 204 })),

  http.get("/api/admin/profiles/:id/prompt-preview", ({ params }) => {
    return HttpResponse.json({ prompt: "Tu es Lumio, un tuteur bienveillant...\n[Prompt système complet pour ce profil]" });
  }),

  // ---- Admin: learner notes ----
  http.get("/api/admin/profiles/:id/learner-notes", ({ params }) => {
    return HttpResponse.json(mockLearnerNotes.filter((n) => n.profile_id === params.id));
  }),

  // ---- Admin: conversations ----
  http.get("/api/admin/profiles/:id/conversations", ({ params }) => {
    return HttpResponse.json(mockConversations.filter((c) => c.profile_id === params.id));
  }),

  http.get("/api/admin/conversations/:id/messages", ({ params }) => {
    return HttpResponse.json(mockMessages.filter((m) => m.conversation_id === params.id));
  }),

  // ---- Admin: safety events ----
  http.get("/api/admin/safety-events", ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    let events = mockSafetyEvents;
    if (status === "pending") events = events.filter((e) => !e.acknowledged_at);
    if (status === "acknowledged") events = events.filter((e) => !!e.acknowledged_at);
    return HttpResponse.json(events);
  }),

  http.post("/api/admin/safety-events/:id/ack", () => new HttpResponse(null, { status: 204 })),

  // ---- Admin: stats ----
  http.get("/api/admin/stats", () => HttpResponse.json(mockStats)),

  // ---- Admin: devices ----
  http.get("/api/admin/devices", () => HttpResponse.json(mockDevices)),

  http.post("/api/admin/devices", async ({ request }) => {
    const body = (await request.json()) as { label: string };
    const device = {
      id: `dev-${Date.now()}`,
      label: body.label,
      last_seen_at: null,
      expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      revoked_at: null,
      created_at: new Date().toISOString(),
    };
    return HttpResponse.json(device, { status: 201 });
  }),

  http.delete("/api/admin/devices/:id", () => new HttpResponse(null, { status: 204 })),

  // ---- Admin: export ----
  http.get("/api/admin/profiles/:id/export", ({ params }) => {
    return HttpResponse.json({
      prenom: "Léa",
      age: 7,
      niveau: "CP",
      conversations: [],
      learner_notes: [],
      exported_at: new Date().toISOString(),
    });
  }),

  // ---- Admin: TOTP ----
  http.get("/api/admin/totp/status", () => HttpResponse.json({ enabled: false })),
  http.post("/api/admin/totp/setup", () =>
    HttpResponse.json({
      secret: "JBSWY3DPEHPK3PXP",
      uri: "otpauth://totp/Lumio:admin@example.com?secret=JBSWY3DPEHPK3PXP&issuer=Lumio",
    }),
  ),
  http.post("/api/admin/totp/confirm", () => new HttpResponse(null, { status: 204 })),
  http.delete("/api/admin/totp", () => new HttpResponse(null, { status: 204 })),
];
