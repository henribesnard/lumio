/**
 * API client with CSRF token handling.
 */

function getCsrfToken(): string | null {
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith("lumio_csrf="));
  return match ? match.split("=")[1] : null;
}

export interface ApiError {
  error: { code: string; message: string };
}

export async function apiFetch<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const csrf = getCsrfToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(csrf ? { "X-CSRF-Token": csrf } : {}),
    ...(options.headers as Record<string, string>),
  };

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "same-origin",
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({
      error: { code: "unknown", message: "Erreur inconnue" },
    }))) as ApiError;
    throw body;
  }

  if (response.status === 204) return undefined as T;
  return response.json();
}

export function apiGet<T>(url: string): Promise<T> {
  return apiFetch(url, { method: "GET" });
}

export function apiPost<T>(url: string, body?: unknown): Promise<T> {
  return apiFetch(url, {
    method: "POST",
    body: body ? JSON.stringify(body) : undefined,
  });
}

export function apiPatch<T>(url: string, body: unknown): Promise<T> {
  return apiFetch(url, { method: "PATCH", body: JSON.stringify(body) });
}

export function apiPut<T>(url: string, body: unknown): Promise<T> {
  return apiFetch(url, { method: "PUT", body: JSON.stringify(body) });
}

export function apiDelete(url: string): Promise<void> {
  return apiFetch(url, { method: "DELETE" });
}
