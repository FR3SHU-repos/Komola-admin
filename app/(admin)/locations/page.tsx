"use client";

import { useEffect, useState } from "react";
import { Archive, Edit3, Globe2, Plus, RefreshCw, Save, X } from "lucide-react";
import { adminApi, type Location } from "@/shared/lib/api/admin";
import { ErrorNotice, LoadingState, PageHeader, StatusBadge } from "@/shared/components/AdminPrimitives";

type LocationForm = { code: string; name: string; timezone: string; status: "enabled" | "disabled" };
const emptyForm: LocationForm = { code: "", name: "", timezone: "Asia/Kolkata", status: "disabled" };

export default function LocationsPage() {
  const [items, setItems] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Location | null>(null);
  const [form, setForm] = useState<LocationForm>(emptyForm);

  async function load() {
    setLoading(true); setError("");
    const result = await adminApi.locations();
    if (!result.success) setError(result.message);
    setItems(result.data?.items ?? []);
    setLoading(false);
  }
  useEffect(() => { void load(); }, []);

  function openCreate() { setEditing(null); setForm(emptyForm); setFormOpen(true); setError(""); setMessage(""); }
  function openEdit(item: Location) { setEditing(item); setForm({ code: item.code, name: item.name, timezone: item.timezone, status: item.status === "enabled" ? "enabled" : "disabled" }); setFormOpen(true); setError(""); setMessage(""); }
  function closeForm() { setEditing(null); setForm(emptyForm); setFormOpen(false); }

  async function save() {
    setBusy(editing?.id ?? "new"); setError(""); setMessage("");
    const result = editing ? await adminApi.editLocation(editing.id, form) : await adminApi.createLocation(form);
    if (!result.success) setError(result.message); else { setMessage(editing ? `${form.name} was updated.` : `${form.name} was created.`); closeForm(); await load(); }
    setBusy("");
  }

  async function toggle(item: Location) {
    const status = item.enabled ? "disabled" : "enabled";
    if (!window.confirm(`${status === "enabled" ? "Enable" : "Disable"} ${item.name}? This affects onboarding and location-filtered offers.`)) return;
    setBusy(item.id); setError(""); setMessage("");
    const result = await adminApi.updateLocation(item.id, status);
    if (!result.success) setError(result.message); else { setMessage(`${item.name} is now ${status}.`); await load(); }
    setBusy("");
  }

  async function archive(item: Location) {
    if (!window.confirm(`Archive ${item.name}? It will be disabled while historical sales, claims, and analytics remain preserved.`)) return;
    setBusy(item.id); setError(""); setMessage("");
    const result = await adminApi.deleteLocation(item.id);
    if (!result.success) setError(result.message); else { setMessage(`${item.name} was archived and disabled.`); await load(); }
    setBusy("");
  }

  return <>
    <PageHeader kicker="Geography control" title="Platform locations" description="Create, edit, enable, disable, and safely archive the localities where KOMOLA accepts seller, buyer, and Rewardor activity." action={<div className="action-row"><button className="secondary-button" onClick={() => void load()} disabled={loading}><RefreshCw size={14} /> Refresh</button><button className="primary-button" onClick={openCreate}><Plus size={14} /> Add location</button></div>} />
    <div className="notice notice-warning" style={{ marginTop: 24 }}><Globe2 size={16} /><span>Archiving is non-destructive: it disables the locality for future onboarding and discovery while preserving historical references.</span></div>
    {message ? <div className="notice notice-success" style={{ marginTop: 14 }}>{message}</div> : null}
    {error ? <div style={{ marginTop: 14 }}><ErrorNotice message={error} /></div> : null}
    {formOpen ? <section className="card" style={{ marginTop: 18 }}><div className="page-heading-row"><div><div className="card-title">{editing ? "Edit location" : "Add location"}</div><p className="card-description">Location codes must be lowercase and use letters, numbers, and hyphens.</p></div><button className="icon-button" onClick={closeForm} aria-label="Close location form"><X size={16} /></button></div><div className="location-form-grid"><label className="form-label">Code<input className="text-input" value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} placeholder="e.g. visakhapatnam" disabled={Boolean(editing)} /></label><label className="form-label">Name<input className="text-input" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="e.g. Visakhapatnam" /></label><label className="form-label">Timezone<input className="text-input" value={form.timezone} onChange={(event) => setForm({ ...form, timezone: event.target.value })} placeholder="Asia/Kolkata" /></label><label className="form-label">Initial status<select className="select" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as LocationForm["status"] })}><option value="disabled">Disabled</option><option value="enabled">Enabled</option></select></label></div><div className="action-row" style={{ marginTop: 18 }}><button className="primary-button" onClick={() => void save()} disabled={busy !== "" || !form.code || !form.name || !form.timezone}><Save size={14} /> {busy ? "Saving…" : editing ? "Save changes" : "Create location"}</button><button className="secondary-button" onClick={closeForm} disabled={busy !== ""}>Cancel</button></div></section> : null}
    <div className="card" style={{ marginTop: 18 }}>{loading ? <LoadingState /> : items.length === 0 ? <div className="empty-state"><div><Globe2 size={25} /><p>No platform locations configured.</p></div></div> : <div className="table-wrap" style={{ marginTop: 0 }}><table className="admin-table"><thead><tr><th>Locality</th><th>Code</th><th>Timezone</th><th>Status</th><th>Control</th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td><strong>{item.name}</strong></td><td>{item.code}</td><td>{item.timezone}</td><td><StatusBadge value={item.status} /></td><td><div className="action-row"><button className="secondary-button" onClick={() => openEdit(item)} disabled={busy === item.id}><Edit3 size={13} /> Edit</button><button className={item.enabled ? "danger-button" : "primary-button"} onClick={() => void toggle(item)} disabled={busy === item.id}>{item.enabled ? "Disable" : "Enable"}</button><button className="danger-button" onClick={() => void archive(item)} disabled={busy === item.id}><Archive size={13} /> Archive</button></div></td></tr>)}</tbody></table></div>}</div>
  </>;
}
