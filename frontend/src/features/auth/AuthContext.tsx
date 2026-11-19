import {
  createContext,
  useContext,
  useCallback,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/api/client";
import type { AuthMeResponse } from "@/api/types";

interface AuthState {
  user: AuthMeResponse | null;
  loading: boolean;
  login: (email: string, password: string, totp?: string) => Promise<void>;
  kidLogin: (profileId: string, pin: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthMeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const qc = useQueryClient();

  const refresh = useCallback(async () => {
    try {
      const me = await apiGet<AuthMeResponse>("/api/auth/me");
      setUser(me);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(
    async (email: string, password: string, totp?: string) => {
      await apiPost("/api/auth/admin/login", {
        email,
        password,
        totp_code: totp || null,
      });
      await refresh();
    },
    [refresh],
  );

  const kidLogin = useCallback(
    async (profileId: string, pin: string) => {
      await apiPost("/api/auth/kid/login", {
        profile_id: profileId,
        pin,
      });
      await refresh();
    },
    [refresh],
  );

  const logout = useCallback(async () => {
    await apiPost("/api/auth/logout");
    setUser(null);
    qc.clear();
  }, [qc]);

  return (
    <AuthContext.Provider value={{ user, loading, login, kidLogin, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
