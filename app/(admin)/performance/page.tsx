"use client";

import { useEffect, useState } from "react";
import { LineChart, RefreshCw, Store, Trophy } from "lucide-react";
import { ErrorNotice, formatDate, LoadingState, MetricCard, PageHeader, StatusBadge } from "@/shared/components/AdminPrimitives";
import { rewardorPerformance, sellerPerformance, type RewardorPerformance, type SellerPerformance } from "@/shared/lib/api/admin";

type View = "sellers" | "rewardors";
function number(value: number) { return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(value || 0); }
function money(value: number) { return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format((value || 0) / 100); }

export default function PerformancePage() {
  const [view, setView] = useState<View>("sellers");
  const [days, setDays] = useState(30);
  const [search, setSearch] = useState("");
  const [result, setResult] = useState<{ items: (SellerPerformance | RewardorPerformance)[]; summary?: { organizations: number; days: number }; meta?: { total?: number } } | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");

  async function load() {
    setState("loading"); setError("");
    const response = view === "sellers" ? await sellerPerformance({ days, search, limit: 100 }) : await rewardorPerformance({ days, search, limit: 100 });
    if (!response.success || !response.data) { setError(response.message || "Performance data could not be loaded"); setState("error"); return; }
    setResult(response.data as typeof result); setState("ready");
  }
  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  useEffect(() => { void load(); }, [view, days]);

  return <>
    <PageHeader kicker="Performance intelligence" title="Seller and Rewardor performance" description="Compare platform organizations using transaction, referral, campaign, and claim aggregates without exposing buyer identity." action={<button className="secondary-button" onClick={() => void load()}><RefreshCw size={15} /> Refresh</button>} />
    <div className="notice notice-warning" style={{ marginTop: 24 }}><LineChart size={16} /><span>Metrics are read-only and calculated for the selected period. Referral and reward totals are aggregate organization facts.</span></div>
    <section className="card" style={{ marginTop: 18 }}><div className="operations-toolbar"><div className="tab-row"><button className={`tab-button ${view === "sellers" ? "active" : ""}`} onClick={() => setView("sellers")}><Store size={15} /> Sellers</button><button className={`tab-button ${view === "rewardors" ? "active" : ""}`} onClick={() => setView("rewardors")}><Trophy size={15} /> Rewardors</button></div><div className="operations-filters"><input className="text-input" placeholder="Search organization" value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void load(); }} /><select className="select" value={days} onChange={(event) => setDays(Number(event.target.value))}><option value={7}>7 days</option><option value={30}>30 days</option><option value={90}>90 days</option><option value={365}>365 days</option><option value={1825}>5 years</option></select><button className="primary-button" onClick={() => void load()}>Apply</button></div></div>
      {state === "loading" && <LoadingState label="Loading organization performance…" />}{state === "error" && <ErrorNotice message={error} />}{state === "ready" && result && <>{<div className="metric-grid" style={{ marginTop: 18 }}><MetricCard label={view === "sellers" ? "Seller organizations" : "Rewardor organizations"} value={number(result.summary?.organizations ?? result.meta?.total ?? 0)} detail={`${days}-day organization view`} icon={view === "sellers" ? Store : Trophy} /><MetricCard label="Rows loaded" value={number(result.items.length)} detail="Bounded read model" icon={LineChart} /></div>}{view === "sellers" ? <SellerTable items={result.items as SellerPerformance[]} /> : <RewardorTable items={result.items as RewardorPerformance[]} />}</>}
    </section>
  </>;
}

function SellerTable({ items }: { items: SellerPerformance[] }) { return items.length ? <div className="table-wrap"><table className="admin-table"><thead><tr><th>Seller</th><th>Type</th><th>Transactions</th><th>Gross</th><th>Refunds / voids</th><th>Products</th><th>Referrals</th><th>Last sale</th></tr></thead><tbody>{items.map((item) => <tr key={item.organizationId}><td><strong>{item.sellerName}</strong><div className="caption">{number(item.locations)} locations · {item.status}</div></td><td><StatusBadge value={item.sellerType} /></td><td>{number(item.transactions)}</td><td>{money(item.grossMinor)}</td><td>{number(item.refunds)} / {number(item.voids)}</td><td>{number(item.products)}</td><td>{number(item.linkedBuyers)} linked · {number(item.referralCoins)} coins</td><td>{formatDate(item.lastTransactionAt)}</td></tr>)}</tbody></table></div> : <div className="empty-state">No seller performance data found.</div>; }
function RewardorTable({ items }: { items: RewardorPerformance[] }) { return items.length ? <div className="table-wrap"><table className="admin-table"><thead><tr><th>Rewardor</th><th>Campaigns</th><th>Claims</th><th>Approved</th><th>Redeemed</th><th>Points claimed</th><th>Settled / released</th><th>Last activity</th></tr></thead><tbody>{items.map((item) => <tr key={item.organizationId}><td><strong>{item.organizationName}</strong><div className="caption">{item.status} · {number(item.publishedCampaigns)} published</div></td><td>{number(item.campaigns)}</td><td>{number(item.claims)}</td><td>{number(item.approvedClaims)}</td><td>{number(item.redeemedClaims)}</td><td>{number(item.pointsClaimed)}</td><td>{number(item.pointsSettled)} / {number(item.pointsReleased)}</td><td>{formatDate(item.lastActivityAt)}</td></tr>)}</tbody></table></div> : <div className="empty-state">No Rewardor performance data found.</div>; }
