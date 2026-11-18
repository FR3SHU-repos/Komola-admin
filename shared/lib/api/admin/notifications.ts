import { request, type ApiResult } from "../client";

export type NotificationCampaign = { id: string; title: string; body: string; category: string; audience: string; targetPlatform: "all" | "ios" | "android"; deepLink: string; scheduledAt: string; status: string; createdAt: string; sentAt: string; recipients: number; delivered: number };
export type NotificationCampaignInput = { title: string; body: string; category: "marketing" | "product_update" | "reminder"; audience: "all" | "buyers" | "sellers"; targetPlatform: "all" | "ios" | "android"; deepLink: string; scheduledAt: string };
export function notificationCampaigns(): Promise<ApiResult<{ items: NotificationCampaign[] }>> { return request("admin/notification-campaigns"); }
export function createNotificationCampaign(body: NotificationCampaignInput): Promise<ApiResult<{ id: string }>> { return request("admin/notification-campaigns", { method: "POST", body: JSON.stringify(body) }); }
export function sendNotificationCampaign(id: string) { return request<{ id: string; status: string }>(`admin/notification-campaigns/${encodeURIComponent(id)}/send`, { method: "POST" }); }
export function cancelNotificationCampaign(id: string) { return request<{ id: string; status: string }>(`admin/notification-campaigns/${encodeURIComponent(id)}/cancel`, { method: "POST" }); }
