"use client";

import { Bell, CircleHelp, Plus, RefreshCw, Send, Smartphone, XCircle } from "lucide-react";
import { FormEvent, useCallback, useState } from "react";
import { ErrorNotice, LoadingState, PageHeader, StatusBadge } from "@/shared/components/AdminPrimitives";
import { useAsyncPage } from "@/shared/hooks/useAsyncPage";
import {
  cancelNotificationCampaign,
  createNotificationCampaign,
  notificationCampaigns,
  notificationDeviceCount,
  sendNotificationCampaign,
  type NotificationCampaign,
} from "@/shared/lib/api/admin";

type NotificationCategory = "marketing" | "product_update" | "reminder";
type NotificationAudience = "all" | "buyers" | "sellers";
type NotificationPlatform = "ios" | "android";

export default function NotificationsPage() {
  const load = useCallback((signal: AbortSignal) => notificationCampaigns(), []);
  const { data: result, state, error, refresh } = useAsyncPage<{ items: NotificationCampaign[] }>(load, "notification-campaigns", "Notification campaigns could not be loaded");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<NotificationCategory>("marketing");
  const [audience, setAudience] = useState<NotificationAudience>("all");
  const [targetPlatform, setTargetPlatform] = useState<NotificationPlatform>("ios");
  const [deepLink, setDeepLink] = useState("Dashboard");
  const [scheduledAt, setScheduledAt] = useState("");
  const [saving, setSaving] = useState(false);
  const [checkingPlatform, setCheckingPlatform] = useState<NotificationPlatform | null>(null);
  const [checkedPlatform, setCheckedPlatform] = useState<NotificationPlatform | null>(null);
  const [availableDevices, setAvailableDevices] = useState<number | null>(null);
  const [formError, setFormError] = useState("");

  async function checkDevices(platform: NotificationPlatform) {
    setTargetPlatform(platform);
    setCheckedPlatform(platform);
    setCheckingPlatform(platform);
    setAvailableDevices(null);
    setFormError("");

    const response = await notificationDeviceCount(platform, audience, category);
    if (!response.success || !response.data) setFormError(response.message);
    else setAvailableDevices(response.data.available);
    setCheckingPlatform(null);
  }

  function resetDeviceCheck() {
    setCheckedPlatform(null);
    setAvailableDevices(null);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setFormError("");
    const response = await createNotificationCampaign({ title, body, category, audience, targetPlatform, deepLink, scheduledAt: new Date(scheduledAt).toISOString() });
    if (!response.success) setFormError(response.message);
    else {
      setTitle("");
      setBody("");
      setScheduledAt("");
      resetDeviceCheck();
      refresh();
    }
    setSaving(false);
  }

  async function action(id: string, kind: "send" | "cancel") {
    const response = kind === "send" ? await sendNotificationCampaign(id) : await cancelNotificationCampaign(id);
    if (!response.success) setFormError(response.message);
    else refresh();
  }

  return (
    <>
      <PageHeader kicker="Engagement" title="Push notifications" description="Schedule product updates, reminders, and offers for signed-in buyers and sellers." action={<button className="secondary-button" onClick={refresh}><RefreshCw size={15} /> Refresh</button>} />
      <section className="card" style={{ marginTop: 18 }}>
        <div className="card-title"><Bell size={16} /> Create campaign</div>
        <p className="caption" style={{ marginTop: 8 }}>Create a draft, then use the send button to queue it. Apple devices receive the campaign through APNs via Firebase Cloud Messaging.</p>
        <form onSubmit={(event) => void submit(event)} className="operations-filters" style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 12 }}>
          <input className="text-input" placeholder="Title" value={title} onChange={(event) => setTitle(event.target.value)} required maxLength={120} />
          <input className="text-input" placeholder="Schedule (local time)" type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} required />
          <textarea className="text-input" placeholder="Message" value={body} onChange={(event) => setBody(event.target.value)} required maxLength={500} style={{ minHeight: 88, gridColumn: "1 / -1" }} />
          <select className="select" value={category} onChange={(event) => { setCategory(event.target.value as NotificationCategory); resetDeviceCheck(); }}><option value="marketing">Marketing</option><option value="product_update">Product update</option><option value="reminder">Reminder</option></select>
          <select className="select" value={audience} onChange={(event) => { setAudience(event.target.value as NotificationAudience); resetDeviceCheck(); }}><option value="all">Everyone</option><option value="buyers">Buyers</option><option value="sellers">Sellers</option></select>

          <div style={{ gridColumn: "1 / -1" }}>
            <div className="caption" style={{ marginBottom: 8 }}>Target devices</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 8 }}>
              <button className={targetPlatform === "ios" ? "primary-button" : "secondary-button"} type="button" onClick={() => void checkDevices("ios")} disabled={checkingPlatform !== null} aria-pressed={targetPlatform === "ios"} style={{ width: "100%" }}><Smartphone size={15} /> {checkingPlatform === "ios" ? "Checking iOS…" : "Check iOS devices"}</button>
              <button className={targetPlatform === "android" ? "primary-button" : "secondary-button"} type="button" onClick={() => void checkDevices("android")} disabled={checkingPlatform !== null} aria-pressed={targetPlatform === "android"} style={{ width: "100%" }}><Smartphone size={15} /> {checkingPlatform === "android" ? "Checking Android…" : "Check Android devices"}</button>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}><input className="text-input" placeholder="Deep link screen, e.g. BuyerWallet" value={deepLink} onChange={(event) => setDeepLink(event.target.value)} /></div>
          {availableDevices !== null && checkedPlatform !== null ? <div className="caption" style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: 6 }}><CircleHelp size={14} /> {availableDevices} eligible {checkedPlatform === "ios" ? "iOS" : "Android"} device{availableDevices === 1 ? "" : "s"} for this audience and preference.</div> : null}
          <button className="primary-button" type="submit" disabled={saving}><Plus size={15} /> {saving ? "Creating…" : `Create ${targetPlatform === "ios" ? "iOS" : "Android"} draft`}</button>
        </form>
        {formError ? <div style={{ marginTop: 12 }}><ErrorNotice message={formError} /></div> : null}
      </section>

      <section className="card" style={{ marginTop: 18 }}>
        {state === "loading" && <LoadingState label="Loading campaigns…" />}
        {state === "error" && <ErrorNotice message={error} />}
        {state === "ready" && result && <div className="table-wrap"><table className="admin-table"><thead><tr><th>Campaign</th><th>Audience</th><th>Devices</th><th>Schedule</th><th>Status</th><th>Delivery</th><th /></tr></thead><tbody>{result.items.map((item) => <tr key={item.id}><td><strong>{item.title}</strong><div className="caption">{item.category} · {item.body}</div></td><td>{item.audience}</td><td>{item.targetPlatform === "ios" ? "Apple / iOS" : item.targetPlatform === "android" ? "Android" : "All"}</td><td>{new Date(item.scheduledAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</td><td><StatusBadge value={item.status} /></td><td>{item.delivered} / {item.recipients}</td><td>{item.status === "draft" || item.status === "scheduled" ? <span style={{ display: "flex", gap: 6 }}><button className="icon-button" onClick={() => void action(item.id, "send")} title="Schedule now"><Send size={15} /></button><button className="icon-button" onClick={() => void action(item.id, "cancel")} title="Cancel"><XCircle size={15} /></button></span> : null}</td></tr>)}</tbody></table></div>}
      </section>
    </>
  );
}
