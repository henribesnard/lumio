import { useEffect, useState } from "react";
import { apiGet, apiPost, apiDelete } from "@/api/client";
import { AdminLayout } from "./AdminLayout";

export function AdminSecurity() {
  const [totpEnabled, setTotpEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  // Setup flow
  const [setupSecret, setSetupSecret] = useState("");
  const [setupUri, setSetupUri] = useState("");
  const [confirmCode, setConfirmCode] = useState("");
  const [setupError, setSetupError] = useState("");
  const [showSetup, setShowSetup] = useState(false);

  useEffect(() => {
    apiGet<{ enabled: boolean }>("/api/admin/totp/status")
      .then((data) => setTotpEnabled(data.enabled))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleStartSetup() {
    try {
      const data = await apiPost<{ secret: string; uri: string }>(
        "/api/admin/totp/setup",
      );
      setSetupSecret(data.secret);
      setSetupUri(data.uri);
      setShowSetup(true);
      setSetupError("");
    } catch {
      setSetupError("Erreur lors de la génération du secret.");
    }
  }

  async function handleConfirm() {
    setSetupError("");
    try {
      await apiPost("/api/admin/totp/confirm", {
        secret: setupSecret,
        code: confirmCode,
      });
      setTotpEnabled(true);
      setShowSetup(false);
      setConfirmCode("");
      setSetupSecret("");
      setSetupUri("");
    } catch {
      setSetupError("Code invalide. Réessayez.");
    }
  }

  async function handleDisable() {
    try {
      await apiDelete("/api/admin/totp");
      setTotpEnabled(false);
    } catch {
      // ignore
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="animate-pulse text-foreground-muted">Chargement...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <h2 className="mb-6 text-heading font-bold text-foreground">
        Sécurité du compte
      </h2>

      <div className="max-w-lg rounded-card bg-surface p-6 shadow-card">
        <h3 className="mb-2 text-subheading font-semibold text-foreground">
          Authentification à deux facteurs (TOTP)
        </h3>

        {totpEnabled ? (
          <div>
            <p className="mb-4 text-body text-success">
              TOTP activé. Un code sera demandé à chaque connexion.
            </p>
            <button
              onClick={handleDisable}
              className="rounded-button border border-danger px-4 py-2 text-small text-danger hover:bg-danger/10"
            >
              Désactiver le TOTP
            </button>
          </div>
        ) : showSetup ? (
          <div className="space-y-4">
            <p className="text-body text-foreground-muted">
              Scannez ce code dans votre application d'authentification (Google
              Authenticator, Authy, etc.) :
            </p>

            <div className="rounded-input bg-surface-alt p-3">
              <p className="break-all font-mono text-small text-foreground">
                {setupSecret}
              </p>
            </div>

            <p className="text-tiny text-foreground-muted">URI : {setupUri}</p>

            <div>
              <label
                htmlFor="totp-code"
                className="mb-1 block text-small font-medium text-foreground"
              >
                Code de vérification
              </label>
              <input
                id="totp-code"
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={confirmCode}
                onChange={(e) => setConfirmCode(e.target.value)}
                className="w-full rounded-input border border-border bg-surface px-3 py-2 text-body text-foreground outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                placeholder="123456"
              />
            </div>

            {setupError && (
              <p className="text-small text-danger">{setupError}</p>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleConfirm}
                disabled={confirmCode.length !== 6}
                className="rounded-button bg-primary px-4 py-2 text-small font-medium text-white hover:bg-primary-hover disabled:opacity-50"
              >
                Confirmer
              </button>
              <button
                onClick={() => setShowSetup(false)}
                className="rounded-button border border-border px-4 py-2 text-small text-foreground-muted hover:bg-surface-alt"
              >
                Annuler
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p className="mb-4 text-body text-foreground-muted">
              Ajoutez une couche de sécurité supplémentaire avec un code
              temporaire.
            </p>
            <button
              onClick={handleStartSetup}
              className="rounded-button bg-primary px-4 py-2 text-small font-medium text-white hover:bg-primary-hover"
            >
              Activer le TOTP
            </button>
            {setupError && (
              <p className="mt-2 text-small text-danger">{setupError}</p>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
