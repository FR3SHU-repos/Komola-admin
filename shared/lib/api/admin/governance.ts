import { request, requestDownload, type ApiResult } from "../client";
import { adminListQuery } from "./query";
import type { AdminAlert, AdminAuditEvent, AdminSignal, AdminSignalResult } from "./types";

export function auditEvents(params: { search?: string; action?: string; entityType?: string; limit?: number; offset?: number } = {}, init: RequestInit = {}): Promise<ApiResult<import("./types").OperationsList<AdminAuditEvent>>> { return request(`admin/audit-events${adminListQuery(params)}`, init); }
export function alerts(params: { severity?: string; limit?: number; offset?: number } = {}, init: RequestInit = {}): Promise<ApiResult<AdminSignalResult<AdminAlert>>> { return request(`admin/alerts${adminListQuery(params)}`, init); }
export function fraudSignals(params: { type?: string; severity?: string; limit?: number; offset?: number } = {}, init: RequestInit = {}): Promise<ApiResult<AdminSignalResult<AdminSignal>>> { return request(`admin/fraud-signals${adminListQuery(params)}`, init); }
export function downloadAdminExport(report: "sales" | "sellers" | "products" | "wallets", params: { limit?: number; days?: number } = {}) { return requestDownload(`admin/exports/${report}${adminListQuery(params)}`); }
