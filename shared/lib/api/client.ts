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

async function authorizedFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = await bearer();
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  let response = await fetch(`/api/v1/${path.replace(/^\/+/, "")}`, { ...init, headers, credentials: "include", cache: "no-store" });
  if (response.status === 401) {
    const { data: { session } } = await (await import("@/shared/lib/supabase/auth-client")).createAuthBrowserClient().auth.refreshSession();
    if (session?.access_token) {
      headers.set("Authorization", `Bearer ${session.access_token}`);
      response = await fetch(`/api/v1/${path.replace(/^\/+/, "")}`, { ...init, headers, credentials: "include", cache: "no-store" });
    }
  }
  return response;
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
    const headers = new Headers(init.headers);
    headers.set("Accept", "application/json");
    if (init.body) headers.set("Content-Type", "application/json");
    const response = await authorizedFetch(path, { ...init, headers });
    return normalize<T>(response);
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Network error", data: null, status: 0 };
  }
}

export async function requestDownload(path: string): Promise<{ success: boolean; blob: Blob | null; filename?: string; message?: string }> {
  try {
    const response = await authorizedFetch(path, { headers: { Accept: "text/csv" } });
    if (!response.ok) {
      let message = `Export failed (${response.status})`;
      try { const body = await response.json() as { message?: string }; message = body.message ?? message; } catch { /* non-json response */ }
      return { success: false, blob: null, message };
    }
    const disposition = response.headers.get("Content-Disposition") ?? "";
    const filename = disposition.match(/filename="?([^";]+)"?/i)?.[1];
    return { success: true, blob: await response.blob(), filename };
  } catch (error) {
    return { success: false, blob: null, message: error instanceof Error ? error.message : "Network error" };
  }
}
