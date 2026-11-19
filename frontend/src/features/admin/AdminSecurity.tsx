import { useEffect, useState } from "react";

import { apiGet, apiPost, apiDelete } from "@/api/client";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Input } from "@/components/Input";
import { Notice } from "@/components/Notice";

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
  const [confirming, setConfirming] = useState(false);
  const [disableOpen, setDisableOpen] = useState(false);

  useEffect(() => {
    apiGet<{ enabled: boolean }>("/api/admin/totp/status")
      .then((data) => setTotpEnabled(data.enabled))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleStartSetup() {
    try {
      const data = await apiPost<{ secret: string; uri: string }>("/api/admin/totp/setup");
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
    setConfirming(true);
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
    } finally {
      setConfirming(false);
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
        <p className="animate-pulse text-body text-foreground-muted">Chargement...</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mx-auto max-w-3xl">
        <h2 className="mb-6 text-heading font-bold text-foreground">Sécurité du compte</h2>

        <Card className="max-w-xl">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <h3 className="text-subheading font-semibold text-foreground">
              Authentification à deux facteurs (TOTP)
            </h3>
            {totpEnabled ? <Badge variant="success">Activée</Badge> : <Badge variant="info">Désactivée</Badge>}
          </div>

          {totpEnabled ? (
            <div>
              <div className="mb-4">
                <Notice variant="success">TOTP activé. Un code sera demandé à chaque connexion.</Notice>
              </div>
              <Button variant="danger" onClick={() => setDisableOpen(true)}>
                Désactiver le TOTP
              </Button>
            </div>
          ) : showSetup ? (
            <div className="space-y-4">
              <p className="text-body leading-body text-foreground-muted">
                Scannez ce code dans votre application d'authentification (Google Authenticator,
                Authy, etc.) :
              </p>

              <div className="rounded-input border border-border bg-surface-alt p-3">
                <p className="break-all font-mono text-small text-foreground">{setupSecret}</p>
              </div>

              <details>
                <summary className="cursor-pointer text-tiny text-foreground-muted hover:text-foreground focus:outline-none focus-visible:shadow-focus">
                  Afficher l'URI otpauth
                </summary>
                <p className="mt-1 break-all rounded-input bg-surface-alt p-2 font-mono text-tiny text-foreground-muted">
                  {setupUri}
                </p>
              </details>

              <Input
                id="totp-code"
                label="Code de vérification"
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={confirmCode}
                onChange={(e) => setConfirmCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="123456"
              />

              {setupError && <Notice variant="error">{setupError}</Notice>}

              <div className="flex flex-wrap gap-2">
                <Button onClick={handleConfirm} loading={confirming} disabled={confirmCode.length !== 6}>
                  Confirmer l'activation
                </Button>
                <Button variant="secondary" onClick={() => setShowSetup(false)}>
                  Annuler
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <p className="mb-4 text-body leading-body text-foreground-muted">
                Ajoutez une couche de sécurité supplémentaire avec un code temporaire généré par
                votre application d'authentification.
              </p>
              <Button onClick={handleStartSetup}>Activer le TOTP</Button>
              {setupError && (
                <div className="mt-3">
                  <Notice variant="error">{setupError}</Notice>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>

      <ConfirmDialog
        open={disableOpen}
        onClose={() => setDisableOpen(false)}
        onConfirm={handleDisable}
        title="Désactiver le TOTP ?"
        message="La double authentification sera désactivée : un code ne sera plus demandé à la connexion."
        confirmLabel="Désactiver"
        danger
      />
    </AdminLayout>
  );
}
