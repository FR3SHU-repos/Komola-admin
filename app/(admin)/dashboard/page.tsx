"use client";

import Link from "next/link";
import { Activity, Building2, CircleAlert, Globe2, ShieldCheck, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { adminApi, type Location, type Organization, type PrivacyRequest } from "@/shared/lib/api/admin";
import { ErrorNotice, LoadingState, MetricCard, PageHeader, StatusBadge, formatDate } from "@/shared/components/AdminPrimitives";

export default function DashboardPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [privacy, setPrivacy] = useState<PrivacyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    void Promise.all([adminApi.organizations(), adminApi.locations(), adminApi.privacyRequests()]).then(([orgResult, locationResult, privacyResult]) => {
      const failed = [orgResult, locationResult, privacyResult].find((result) => !result.success);
      if (failed) setError(failed.message);
      setOrganizations(orgResult.data?.items ?? []);
      setLocations(locationResult.data?.items ?? []);
      setPrivacy(privacyResult.data?.items ?? []);
      setLoading(false);
    });
  }, []);

  const active = organizations.filter((item) => item.status === "active").length;
  const pending = organizations.filter((item) => item.status === "submitted" || item.status === "pending").length;
  const openPrivacy = privacy.filter((item) => item.status === "submitted" || item.status === "in_review").length;

  return <>
    <PageHeader kicker="Platform pulse" title="Good morning, admin" description="A governed view of the KOMOLA network. Actions below are routed through the platform-admin API and recorded by the backend." action={<span className="pill"><Activity size={13} /> Live API-backed view</span>} />
    {error ? <div style={{ marginTop: 22 }}><ErrorNotice message={error} /></div> : null}
    <div className="metric-grid">
      <MetricCard label="Organizations" value={loading ? "—" : organizations.length} detail={`${active} active · ${pending} awaiting review`} icon={Building2} />
      <MetricCard label="Enabled localities" value={loading ? "—" : locations.filter((item) => item.enabled).length} detail={`${locations.length} platform locations configured`} icon={Globe2} />
      <MetricCard label="Privacy queue" value={loading ? "—" : openPrivacy} detail="Submitted or in-review requests" icon={ShieldCheck} />
      <MetricCard label="Protected surface" value="API" detail="No direct database access from admin UI" icon={Users} />
    </div>
    <div className="section-grid">
      <section className="card"><div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}><div><div className="card-title">Recent organization activity</div><p className="card-description">Seller, Farmer, FPO, Brand, Retailer, and Rewardor organizations currently known to the platform.</p></div><Link className="secondary-button" href="/organizations">View all</Link></div>{loading ? <div style={{ marginTop: 18 }}><LoadingState /></div> : organizations.length === 0 ? <div style={{ marginTop: 18 }}><div className="empty-state"><div><Building2 size={24} /><p>No organizations found.</p></div></div></div> : <div className="table-wrap"><table className="admin-table"><thead><tr><th>Organization</th><th>Type</th><th>Status</th><th>Created</th></tr></thead><tbody>{organizations.slice(0, 6).map((item) => <tr key={item.id}><td><strong>{item.displayName ?? item.name ?? "Unnamed organization"}</strong><div style={{ color: "var(--muted)", fontSize: 11, marginTop: 3 }}>{item.id.slice(0, 8)}…</div></td><td>{item.type ?? item.sellerType ?? "—"}</td><td><StatusBadge value={item.status} /></td><td>{formatDate(item.createdAt)}</td></tr>)}</tbody></table></div>}</section>
      <section className="card"><div className="card-title">Operations needing attention</div><p className="card-description">Review queues before changing user or platform state.</p><div className="feature-list"><Link className="feature-row" href="/privacy"><div><strong><CircleAlert size={15} style={{ verticalAlign: "-3px", marginRight: 6 }} />Privacy operations</strong><p>{openPrivacy ? `${openPrivacy} request${openPrivacy === 1 ? "" : "s"} awaiting review` : "No open privacy requests"}</p></div><span className="pill">Open <span aria-hidden="true">→</span></span></Link><Link className="feature-row" href="/organizations"><div><strong><Building2 size={15} style={{ verticalAlign: "-3px", marginRight: 6 }} />Organization access</strong><p>{pending ? `${pending} organization${pending === 1 ? "" : "s"} need review` : "No pending applications"}</p></div><span className="pill">Review <span aria-hidden="true">→</span></span></Link><Link className="feature-row" href="/analytics"><div><strong><Activity size={15} style={{ verticalAlign: "-3px", marginRight: 6 }} />Global analytics</strong><p>View sales, reward, locality, and platform-health aggregates.</p></div><span className="pill">Open <span aria-hidden="true">→</span></span></Link></div></section>
    </div>
  </>;
}
