import { request, type ApiResult } from "../client";
import type { AdminBootstrap, Location, Organization, Paginated, PrivacyRequest } from "./types";

let bootstrapCache: ApiResult<AdminBootstrap> | null = null;
let bootstrapRequest: Promise<ApiResult<AdminBootstrap>> | null = null;

export function adminBootstrap(init: RequestInit = {}): Promise<ApiResult<AdminBootstrap>> {
  if (bootstrapCache) return Promise.resolve(bootstrapCache);
  if (bootstrapRequest) return bootstrapRequest;
  bootstrapRequest = request<AdminBootstrap>("pos/bootstrap", init).then((result) => {
    if (result.success && result.data) bootstrapCache = result;
    return result;
  }).finally(() => { bootstrapRequest = null; });
  return bootstrapRequest;
}

export function clearAdminBootstrapCache() { bootstrapCache = null; }

export function organizations(status = "", type = "", init: RequestInit = {}): Promise<ApiResult<{ items: Organization[] }>> {
  const query = new URLSearchParams();
  if (status) query.set("status", status);
  if (type) query.set("type", type);
  const suffix = query.toString();
  return request(`admin/seller-applications${suffix ? `?${suffix}` : ""}`, init);
}
export function updateOrganization(id: string, decision: "Approved" | "Rejected" | "Suspended", reason = "") { return request<{ organizationId: string }>(`admin/seller-applications/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify({ decision, reason }) }); }
export function locations(init: RequestInit = {}): Promise<ApiResult<{ items: Location[] }>> { return request("admin/locations", init); }
export function createLocation(body: { code: string; name: string; timezone: string; status: "enabled" | "disabled" }) { return request<Location>("admin/locations", { method: "POST", body: JSON.stringify(body) }); }
export function editLocation(id: string, body: Partial<{ code: string; name: string; timezone: string; status: "enabled" | "disabled" }>) { return request<Location>(`admin/locations/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(body) }); }
export function updateLocation(id: string, status: "enabled" | "disabled") { return editLocation(id, { status }); }
export function deleteLocation(id: string) { return request<Location>(`admin/locations/${encodeURIComponent(id)}`, { method: "DELETE" }); }
export function privacyRequests(status = "", init: RequestInit = {}): Promise<ApiResult<Paginated<PrivacyRequest>>> { return request(`admin/privacy/requests?limit=50${status ? `&status=${encodeURIComponent(status)}` : ""}`, init); }
export function updatePrivacyRequest(id: string, body: { status?: string; identityVerified?: boolean; responseNote?: string; resolutionAction?: string }) { return request<{ id: string; status: string }>(`admin/privacy/requests/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(body) }); }
