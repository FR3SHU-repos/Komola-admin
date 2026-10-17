export interface ApiResult<T> {
  success: boolean;
  message: string;
  data: T | null;
  status: number;
  code?: string;
}

async function bearer(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  try {
    const { data: { session } } = await (await import("@/shared/lib/supabase/auth-client")).createAuthBrowserClient().auth.getSession();
    return session?.access_token ?? null;
  } catch {
    return null;
  }
}

async function normalize<T>(response: Response): Promise<ApiResult<T>> {
  let body: unknown = null;
  try { body = await response.json(); } catch { /* non-json response */ }
  const value = (body ?? {}) as { success?: boolean; message?: string; data?: T; code?: string };
  return {
    success: response.ok && value.success === true,
    message: value.message ?? (response.ok ? "Success" : `Request failed (${response.status})`),
    data: (value.data ?? null) as T | null,
    status: response.status,
    code: value.code,
  };
}

export async function request<T>(path: string, init: RequestInit = {}): Promise<ApiResult<T>> {
  try {
    const token = await bearer();
    const headers = new Headers(init.headers);
    headers.set("Accept", "application/json");
    if (init.body) headers.set("Content-Type", "application/json");
    if (token) headers.set("Authorization", `Bearer ${token}`);
    let response = await fetch(`/api/v1/${path.replace(/^\/+/, "")}`, { ...init, headers, credentials: "include", cache: "no-store" });
    if (response.status === 401) {
      const { data: { session } } = await (await import("@/shared/lib/supabase/auth-client")).createAuthBrowserClient().auth.refreshSession();
      if (session?.access_token) {
        headers.set("Authorization", `Bearer ${session.access_token}`);
        response = await fetch(`/api/v1/${path.replace(/^\/+/, "")}`, { ...init, headers, credentials: "include", cache: "no-store" });
      }
    }
    return normalize<T>(response);
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Network error", data: null, status: 0 };
  }
}
