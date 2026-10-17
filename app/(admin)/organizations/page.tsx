"use client";

import { Building2, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { adminApi, type Organization } from "@/shared/lib/api/admin";
import { ErrorNotice, LoadingState, PageHeader, StatusBadge, formatDate } from "@/shared/components/AdminPrimitives";

export default function OrganizationsPage() {
  const [items, setItems] = useState<Organization[]>([]);
  const [filter, setFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    setLoading(true); setError("");
    const result = await adminApi.organizations(filter, typeFilter);
    if (!result.success) setError(result.message);
    setItems(result.data?.items ?? []);
    setLoading(false);
  }
  useEffect(() => { void load(); }, [filter, typeFilter]);

  async function decide(item: Organization, decision: "Approved" | "Rejected" | "Suspended") {
    const reason = decision === "Approved" ? "" : window.prompt(`Reason for ${decision.toLowerCase()} this organization:`, item.rejectionReason ?? "") ?? "";
    if (decision !== "Approved" && !reason.trim()) return;
    if (!window.confirm(`${decision} ${item.displayName ?? item.name ?? "this organization"}?`)) return;
    setBusy(item.id); setMessage(""); setError("");
    const result = await adminApi.updateOrganization(item.id, decision, reason);
    if (!result.success) setError(result.message); else { setMessage("Organization access updated."); await load(); }
    setBusy("");
  }

  return <><PageHeader kicker="Access governance" title={typeFilter === "Rewardor" ? "Onboarded Rewardors" : "Organizations"} description="Review seller and Rewardor organizations. The Go API verifies platform-admin access and applies the status transition server-side." action={<button className="secondary-button" onClick={() => void load()} disabled={loading}><RefreshCw size={14} /> Refresh</button>} />
    <div className="card" style={{ marginTop: 28 }}><div className="filter-row" style={{ marginTop: 0 }}><select className="select" aria-label="Filter organization type" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}><option value="">All organization types</option><option value="Rewardor">Rewardors</option><option value="Farmer">Farmers</option><option value="FPO">FPOs</option><option value="Retailer">Retailers</option><option value="Brand">Brands</option></select><select className="select" aria-label="Filter organizations by status" value={filter} onChange={(event) => setFilter(event.target.value)}><option value="">All statuses</option><option value="active">Active</option><option value="rejected">Rejected</option><option value="suspended">Suspended</option></select>{message ? <span className="notice notice-success" style={{ padding: "9px 12px" }}>{message}</span> : null}{error ? <div style={{ flex: 1 }}><ErrorNotice message={error} /></div> : null}</div>{loading ? <div style={{ marginTop: 18 }}><LoadingState /></div> : items.length === 0 ? <div style={{ marginTop: 18 }}><div className="empty-state"><div><Building2 size={25} /><p>No organizations match this filter.</p></div></div></div> : <div className="table-wrap"><table className="admin-table"><thead><tr><th>Organization</th><th>Type</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td><strong>{item.displayName ?? item.name ?? "Unnamed organization"}</strong><div style={{ color: "var(--muted)", fontSize: 11, marginTop: 3 }}>{item.legalName ?? item.id}</div></td><td>{item.type ?? item.sellerType ?? "—"}</td><td><StatusBadge value={item.status} />{item.rejectionReason ? <div style={{ color: "var(--muted)", fontSize: 11, marginTop: 5 }}>{item.rejectionReason}</div> : null}</td><td>{formatDate(item.createdAt)}</td><td><div className="action-row">{item.status !== "Approved" ? <button className="primary-button" onClick={() => void decide(item, "Approved")} disabled={busy === item.id}>Approve</button> : null}{item.status !== "Rejected" ? <button className="danger-button" onClick={() => void decide(item, "Rejected")} disabled={busy === item.id}>Reject</button> : null}{item.status !== "Suspended" ? <button className="secondary-button" onClick={() => void decide(item, "Suspended")} disabled={busy === item.id}>Suspend</button> : null}</div></td></tr>)}</tbody></table></div>}</div>
  </>;
}
