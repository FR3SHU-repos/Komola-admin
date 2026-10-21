import { request, type ApiResult } from "../client";
import type { AdminOverview, RewardAnalytics, SalesAnalytics } from "./types";

export type AnalyticsGranularity = "day" | "week" | "month" | "year";
export function adminOverview(days = 30, granularity?: AnalyticsGranularity): Promise<ApiResult<AdminOverview>> { return request(`admin/overview?days=${days}${granularity ? `&granularity=${granularity}` : ""}`); }
export function salesAnalytics(days = 30, granularity?: AnalyticsGranularity): Promise<ApiResult<SalesAnalytics>> { return request(`admin/analytics/sales?days=${days}${granularity ? `&granularity=${granularity}` : ""}`); }
export function rewardAnalytics(days = 30, granularity?: AnalyticsGranularity): Promise<ApiResult<RewardAnalytics>> { return request(`admin/analytics/rewards?days=${days}${granularity ? `&granularity=${granularity}` : ""}`); }
