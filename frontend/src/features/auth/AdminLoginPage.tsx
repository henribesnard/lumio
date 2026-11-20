import { useState } from "react";

import { useNavigate } from "react-router-dom";

import { useAuth } from "./AuthContext";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Logo } from "@/components/Logo";
import { Notice } from "@/components/Notice";

import type { ApiError } from "@/api/client";

export function AdminLoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totp, setTotp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [needsTotp, setNeedsTotp] = useState(false);

  // Redirect if already logged in
  if (user?.role === "admin") {
    navigate("/admin", { replace: true });
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password, totp || undefined);
      navigate("/admin", { replace: true });
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr?.error?.code === "totp_required") {
        setNeedsTotp(true);
        setError("Code TOTP requis.");
      } else {
        setError(apiErr?.error?.message || "Erreur de connexion.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      data-theme="admin"
      className="flex min-h-screen items-center justify-center bg-background p-4"
    >
      <div className="w-full max-w-md rounded-card bg-surface p-8 shadow-card">
        <div className="mb-6 flex justify-center">
          <Logo height={44} />
        </div>
        <h1 className="mb-6 text-center text-heading font-bold text-foreground">
          Administration Lumio
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="email"
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />

          <Input
            id="password"
            label="Mot de passe"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />

          {needsTotp && (
            <Input
              id="totp"
              label="Code TOTP"
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={totp}
              onChange={(e) => setTotp(e.target.value)}
              autoFocus
              placeholder="123456"
            />
          )}

          {error && <Notice variant="error">{error}</Notice>}

          <Button type="submit" loading={loading} className="w-full" size="lg">
            {loading ? "Connexion..." : "Se connecter"}
          </Button>
        </form>
      </div>
    </div>
  );
}
