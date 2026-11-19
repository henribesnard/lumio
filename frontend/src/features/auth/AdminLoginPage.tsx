import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
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
    <div data-theme="admin" className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-card bg-surface p-8 shadow-card">
        <h1 className="mb-6 text-center text-heading font-bold text-foreground">
          Administration Lumio
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-small font-medium text-foreground">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full rounded-input border border-border bg-surface px-3 py-2 text-body text-foreground outline-none focus:border-accent focus:ring-1 focus:ring-accent"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-small font-medium text-foreground">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full rounded-input border border-border bg-surface px-3 py-2 text-body text-foreground outline-none focus:border-accent focus:ring-1 focus:ring-accent"
            />
          </div>

          {needsTotp && (
            <div>
              <label htmlFor="totp" className="mb-1 block text-small font-medium text-foreground">
                Code TOTP
              </label>
              <input
                id="totp"
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={totp}
                onChange={(e) => setTotp(e.target.value)}
                autoFocus
                className="w-full rounded-input border border-border bg-surface px-3 py-2 text-body text-foreground outline-none focus:border-accent focus:ring-1 focus:ring-accent"
              />
            </div>
          )}

          {error && (
            <div className="rounded-input bg-danger/10 px-3 py-2 text-small text-danger">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-button bg-primary px-4 py-3 text-body font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>
      </div>
    </div>
  );
}
