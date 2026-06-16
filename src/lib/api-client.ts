/**
 * API Client - automatically handles backend URL for Capacitor/PWA environments.
 *
 * - In server-side rendering (Next.js): uses relative URLs
 * - In Capacitor/PWA (client-side, no server): uses NEXT_PUBLIC_API_URL
 * - The backend URL can also be configured in settings
 */

let _apiBaseUrl = "";

export function setApiBaseUrl(url: string) {
  _apiBaseUrl = url;
}

export function getApiBaseUrl(): string {
  if (_apiBaseUrl) return _apiBaseUrl;

  // Check env var (baked at build time for Capacitor)
  if (typeof window !== "undefined") {
    const envUrl = process.env.NEXT_PUBLIC_API_URL;
    if (envUrl) return envUrl.replace(/\/$/, "");

    // Check localStorage (user can override at runtime)
    try {
      const stored = localStorage.getItem("api-base-url");
      if (stored) return stored.replace(/\/$/, "");
    } catch {
      // localStorage not available
    }
  }

  // Fallback: relative URL (works on the Next.js server)
  return "";
}

export async function apiFetch<T = unknown>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const base = getApiBaseUrl();
  const url = `${base}${path}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }

  return res.json();
}

// Convenience methods
export const api = {
  get: <T = unknown>(path: string) => apiFetch<T>(path),

  post: <T = unknown>(path: string, body?: unknown) =>
    apiFetch<T>(path, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T = unknown>(path: string, body?: unknown) =>
    apiFetch<T>(path, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: <T = unknown>(path: string, body?: unknown) =>
    apiFetch<T>(path, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T = unknown>(path: string) =>
    apiFetch<T>(path, { method: "DELETE" }),
};
