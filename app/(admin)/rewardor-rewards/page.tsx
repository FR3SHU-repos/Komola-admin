"use client";

import { Gift, RefreshCw, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { ErrorNotice, formatDate, LoadingState, MetricCard, PageHeader, StatusBadge } from "@/shared/components/AdminPrimitives";
import { adminApi, type RewardorCampaign } from "@/shared/lib/api/admin";

function number(value: number) { return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(value || 0); }

export default function RewardorRewardsPage() {
  const [items, setItems] = useState<RewardorCampaign[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [campaignType, setCampaignType] = useState("");
  const [total, setTotal] = useState(0);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");

  async function load(nextSearch = search) {
    setState("loading");
    setError("");
    const result = await adminApi.rewardorCampaigns({ search: nextSearch, status, campaignType, limit: 100 });
    if (!result.success || !result.data) {
      setError(result.message || "Rewardor rewards could not be loaded");
      setState("error");
      return;
    }
    setItems(result.data.items);
    setTotal(result.data.meta?.total ?? result.data.items.length);
    setState("ready");
  }

  useEffect(() => { void load(); }, [status, campaignType]); // eslint-disable-line react-hooks/exhaustive-deps

  const published = items.filter((item) => item.status === "published").length;
  const claims = items.reduce((sum, item) => sum + item.claims, 0);
  const pointsClaimed = items.reduce((sum, item) => sum + item.pointsClaimed, 0);

  return <>
    <PageHeader kicker="Rewardor marketplace" title="Rewardor rewards" description="See the reward campaigns published by onboarded Rewardors, including their status, locality, point value, and claim activity." action={<button className="secondary-button" onClick={() => void load()} disabled={state === "loading"}><RefreshCw size={15} /> Refresh</button>} />
    <div className="notice notice-warning" style={{ marginTop: 24 }}><Gift size={16} /><span>Read-only platform-admin view. Paused, expired, and archived campaigns remain visible for operational history.</span></div>
    <div className="metric-grid" style={{ marginTop: 18 }}>
      <MetricCard label="Reward campaigns" value={number(total)} detail="Matching Rewardor campaigns" icon={Gift} />
      <MetricCard label="Published" value={number(published)} detail="Published in the current result set" icon={Gift} />
      <MetricCard label="Claims" value={number(claims)} detail="Claims on the current result set" icon={Gift} />
      <MetricCard label="Points claimed" value={number(pointsClaimed)} detail="Points attached to those claims" icon={Gift} />
    </div>
    <section className="card" style={{ marginTop: 18 }}>
      <div className="operations-filters" style={{ marginTop: 0 }}>
        <div className="search-field"><Search size={15} /><input aria-label="Search Rewardor rewards" value={search} placeholder="Search reward, Rewardor, or locality" onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void load(search); }} /></div>
        <select className="select" aria-label="Filter rewards by status" value={status} onChange={(event) => setStatus(event.target.value)}><option value="">All statuses</option><option value="published">Published</option><option value="draft">Draft</option><option value="paused">Paused</option><option value="expired">Expired</option><option value="archived">Archived</option></select>
        <select className="select" aria-label="Filter rewards by campaign type" value={campaignType} onChange={(event) => setCampaignType(event.target.value)}><option value="">All reward types</option><option value="product">Product</option><option value="offer">Offer</option><option value="online_cashback">Online cashback</option></select>
        <button className="primary-button" onClick={() => void load(search)}>Search</button>
      </div>
      {state === "loading" && <LoadingState label="Loading Rewardor rewards…" />}
      {state === "error" && <ErrorNotice message={error} />}
      {state === "ready" && (items.length ? <div className="table-wrap"><table className="admin-table"><thead><tr><th>Reward</th><th>Rewardor</th><th>Locality</th><th>Status</th><th>Points</th><th>Claims</th><th>Created</th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td><strong>{item.title}</strong><div className="caption">{item.campaignType.replace("_", " ")} · {item.rewardType.replace("_", " ")}</div></td><td><strong>{item.rewardorName}</strong>{item.rewardorLegalName ? <div className="caption">{item.rewardorLegalName}</div> : null}</td><td>{item.locationName}<div className="caption">{item.locationCode}</div></td><td><StatusBadge value={item.status} /></td><td>{number(item.points)}<div className="caption">per claim</div></td><td>{number(item.claims)} / {number(item.totalClaimsAllowed)}<div className="caption">{number(item.pointsClaimed)} points claimed</div></td><td>{formatDate(item.createdAt)}</td></tr>)}</tbody></table></div> : <div className="empty-state">No Rewardor rewards match these filters.</div>)}
    </section>
  </>;
}
