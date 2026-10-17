"use client";

import { CheckCircle2, FileKey2, RefreshCw, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { adminApi, type PrivacyRequest } from "@/shared/lib/api/admin";
import { ErrorNotice, LoadingState, PageHeader, StatusBadge, formatDate } from "@/shared/components/AdminPrimitives";

const resolution: Record<string, string> = { access: "export_ready", correction: "correction_recorded", erasure: "anonymize_identity", grievance: "grievance_responded", nomination: "nomination_recorded" };

export default function PrivacyPage() {
  const [items, setItems] = useState<PrivacyRequest[]>([]);
  const [filter, setFilter] = useState("submitted");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    setLoading(true); setError("");
    const result = await adminApi.privacyRequests(filter);
    if (!result.success) setError(result.message);
    setItems(result.data?.items ?? []);
    setLoading(false);
  }
  useEffect(() => { void load(); }, [filter]);

  async function update(item: PrivacyRequest, body: Parameters<typeof adminApi.updatePrivacyRequest>[1], confirmText: string) {
    if (confirmText && !window.confirm(confirmText)) return;
    setBusy(item.id); setError(""); setMessage("");
    const result = await adminApi.updatePrivacyRequest(item.id, body);
    if (!result.success) setError(result.message); else { setMessage("Privacy request updated and recorded by the API."); await load(); }
    setBusy("");
  }

  return <><PageHeader kicker="Data rights governance" title="Privacy operations" description="Review, verify, and resolve access, correction, erasure, nomination, and grievance requests through the audited backend workflow." action={<button className="secondary-button" onClick={() => void load()} disabled={loading}><RefreshCw size={14} /> Refresh</button>} />
    <div className="notice notice-info" style={{ marginTop: 24 }}><ShieldCheck size={16} /><span>Erasure completion requires identity verification and the `anonymize_identity` resolution. Transaction facts are preserved only where the documented retention purpose requires them.</span></div>
    <div className="card" style={{ marginTop: 18 }}><div className="filter-row" style={{ marginTop: 0 }}><select className="select" aria-label="Filter privacy requests" value={filter} onChange={(event) => setFilter(event.target.value)}><option value="submitted">Submitted</option><option value="in_review">In review</option><option value="completed">Completed</option><option value="rejected">Rejected</option><option value="">All requests</option></select>{message ? <span className="notice notice-success" style={{ padding: "9px 12px" }}>{message}</span> : null}{error ? <div style={{ flex: 1 }}><ErrorNotice message={error} /></div> : null}</div>{loading ? <div style={{ marginTop: 18 }}><LoadingState /></div> : items.length === 0 ? <div style={{ marginTop: 18 }}><div className="empty-state"><div><FileKey2 size={25} /><p>No requests in this queue.</p></div></div></div> : <div className="table-wrap"><table className="admin-table"><thead><tr><th>Requester</th><th>Request</th><th>Submitted</th><th>Status</th><th>Actions</th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td><strong>{item.person?.displayName || "Redacted requester"}</strong><div style={{ color: "var(--muted)", fontSize: 11, marginTop: 4 }}>{item.person?.email || item.person?.phone || "Contact hidden"}</div></td><td><strong style={{ textTransform: "capitalize" }}>{item.requestType}</strong><div style={{ maxWidth: 260, color: "var(--muted)", fontSize: 11, lineHeight: 1.4, marginTop: 4 }}>{item.details}</div></td><td>{formatDate(item.createdAt)}<div style={{ color: "var(--muted)", fontSize: 11, marginTop: 4 }}>Due {formatDate(item.dueAt)}</div></td><td><StatusBadge value={item.status} />{item.identityVerifiedAt ? <div style={{ color: "var(--success)", fontSize: 10, marginTop: 5 }}>Identity verified</div> : null}</td><td><div className="action-row">{item.status === "submitted" ? <button className="secondary-button" onClick={() => void update(item, { status: "in_review" }, "Claim this privacy request for review?")} disabled={busy === item.id}>Claim</button> : null}{item.status === "in_review" && !item.identityVerifiedAt ? <button className="secondary-button" onClick={() => void update(item, { identityVerified: true }, "Confirm that the requester identity has been verified?")} disabled={busy === item.id}><CheckCircle2 size={14} /> Verify</button> : null}{item.status === "in_review" ? <button className="primary-button" onClick={() => void update(item, { status: "completed", identityVerified: true, resolutionAction: resolution[item.requestType] }, `Complete this ${item.requestType} request?`)} disabled={busy === item.id}>Complete</button> : null}</div></td></tr>)}</tbody></table></div>}</div>
  </>;
}
