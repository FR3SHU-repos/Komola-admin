export type ApiErrorKind = "aborted" | "authentication" | "authorization" | "client" | "network" | "server" | "timeout" | "invalid_response";

export interface ApiError {
  kind: ApiErrorKind;
  status: number;
  code?: string;
  requestId?: string;
  retryable: boolean;
}

export interface ApiResult<T> {
  success: boolean;
  message: string;
  data: T | null;
  status: number;
  code?: string;
  error?: ApiError;
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
    try {
      const { data: { session } } = await (await import("@/shared/lib/supabase/auth-client")).createAuthBrowserClient().auth.refreshSession();
      if (session?.access_token) {
        headers.set("Authorization", `Bearer ${session.access_token}`);
        response = await fetch(`/api/v1/${path.replace(/^\/+/, "")}`, { ...init, headers, credentials: "include", cache: "no-store" });
      }
    } catch {
      // Keep the original 401 so callers retain the authentication diagnostic.
    }
  }
  return response;
}

function responseRequestId(response: Response): string | undefined {
  return response.headers.get("x-request-id") ?? response.headers.get("x-correlation-id") ?? undefined;
}

function responseError(response: Response, code?: string): ApiError {
  if (response.status === 401) return { kind: "authentication", status: response.status, code, requestId: responseRequestId(response), retryable: false };
  if (response.status === 403) return { kind: "authorization", status: response.status, code, requestId: responseRequestId(response), retryable: false };
  if (response.status >= 500) return { kind: "server", status: response.status, code, requestId: responseRequestId(response), retryable: true };
  if (response.status >= 400) return { kind: "client", status: response.status, code, requestId: responseRequestId(response), retryable: false };
  return { kind: "invalid_response", status: response.status, code, requestId: responseRequestId(response), retryable: true };
}

function exceptionError(error: unknown): ApiError {
  const name = error instanceof DOMException ? error.name : error instanceof Error ? error.name : "";
  if (name === "AbortError") return { kind: "aborted", status: 0, retryable: false };
  if (name === "TimeoutError") return { kind: "timeout", status: 0, retryable: true };
  return { kind: "network", status: 0, retryable: true };
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
    error: response.ok && value.success === true ? undefined : responseError(response, value.code),
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
    const diagnostic = exceptionError(error);
    const message = diagnostic.kind === "aborted" ? "Request was cancelled." : diagnostic.kind === "timeout" ? "Request timed out." : "Unable to reach the admin API.";
    return { success: false, message, data: null, status: 0, error: diagnostic };
  }
}

export async function requestDownload(path: string): Promise<{ success: boolean; blob: Blob | null; filename?: string; message?: string; error?: ApiError }> {
  try {
    const response = await authorizedFetch(path, { headers: { Accept: "text/csv" } });
    if (!response.ok) {
      let message = `Export failed (${response.status})`;
      let code: string | undefined;
      try { const body = await response.json() as { message?: string; code?: string }; message = body.message ?? message; code = body.code; } catch { /* non-json response */ }
      return { success: false, blob: null, message, error: responseError(response, code) };
    }
    const disposition = response.headers.get("Content-Disposition") ?? "";
    const filename = disposition.match(/filename="?([^";]+)"?/i)?.[1];
    return { success: true, blob: await response.blob(), filename };
  } catch (error) {
    const diagnostic = exceptionError(error);
    const message = diagnostic.kind === "aborted" ? "Request was cancelled." : diagnostic.kind === "timeout" ? "Request timed out." : "Unable to reach the admin API.";
    return { success: false, blob: null, message, error: diagnostic };
  }
}
