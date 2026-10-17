"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight, Coins, RefreshCw, Search, ShoppingCart, Users } from "lucide-react";
import { ErrorNotice, formatDate, LoadingState, MetricCard, PageHeader, StatusBadge } from "@/shared/components/AdminPrimitives";
import { operationBuyers, type AdminBuyer, type OperationsList } from "@/shared/lib/api/admin";

function number(value: number) { return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(value || 0); }
function money(minor: number) { return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format((minor || 0) / 100); }

export default function BuyersPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [result, setResult] = useState<OperationsList<AdminBuyer> | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");

  async function load() {
    setState("loading");
    setError("");
    const response = await operationBuyers({ search, status, limit: 100 });
    if (!response.success || !response.data) {
      setError(response.message || "Buyer directory could not be loaded");
      setState("error");
      return;
    }
    setResult(response.data);
    setState("ready");
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  useEffect(() => { void load(); }, [status]);

  const items = result?.items ?? [];
  const buyersWithPurchases = items.filter((item) => item.purchases > 0).length;
  const spend = items.reduce((total, item) => total + item.totalSpentMinor, 0);
  const coins = items.reduce((total, item) => total + item.availableCoins, 0);

  return <>
    <PageHeader kicker="People & activity" title="Buyer directory" description="Review buyer profiles and follow their purchase activity across sellers and localities." action={<button className="secondary-button" onClick={() => void load()}><RefreshCw size={15} /> Refresh</button>} />
    <div className="notice notice-warning" style={{ marginTop: 24 }}><Users size={16} /><span>Buyer identity and purchase history are restricted platform-admin data. Use this view for support, reconciliation, and governance only; list contacts are masked.</span></div>
    <div className="metric-grid" style={{ marginTop: 18 }}>
      <MetricCard label="Buyers" value={number(result?.meta?.total ?? 0)} detail="Buyer profiles matching the current filter" icon={Users} />
      <MetricCard label="With purchases" value={number(buyersWithPurchases)} detail="Loaded buyers with completed purchases" icon={ShoppingCart} />
      <MetricCard label="Loaded spend" value={money(spend)} detail="Completed-sale value in the loaded rows" icon={ShoppingCart} />
      <MetricCard label="Available coins" value={number(coins)} detail="Wallet projection in the loaded rows" icon={Coins} />
    </div>
    <section className="card" style={{ marginTop: 18 }}>
      <div className="operations-filters"><div className="search-field"><Search size={15} /><input aria-label="Search buyers" placeholder="Name, phone, email, or buyer ID" value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void load(); }} /></div><select className="select" aria-label="Filter buyers by status" value={status} onChange={(event) => setStatus(event.target.value)}><option value="">All statuses</option><option value="active">Active</option><option value="suspended">Suspended</option><option value="merged">Merged</option></select><button className="primary-button" onClick={() => void load()}>Search</button></div>
      {state === "loading" && <LoadingState label="Loading buyer profiles…" />}
      {state === "error" && <ErrorNotice message={error} />}
      {state === "ready" && (items.length ? <div className="table-wrap"><table className="admin-table"><thead><tr><th>Buyer</th><th>Contact</th><th>Purchases</th><th>Spend</th><th>Sellers</th><th>Wallet</th><th>Last purchase</th><th /></tr></thead><tbody>{items.map((item) => <tr key={item.personId}><td><strong>{item.buyerName}</strong><div className="caption">{item.buyerCode || item.personId.slice(0, 8) + "…"} · {item.locationName || "Location not set"}</div></td><td><div>{item.phoneMasked}</div><div className="caption">{item.emailMasked}</div></td><td>{number(item.purchases)}</td><td>{money(item.totalSpentMinor)}</td><td>{number(item.sellers)}</td><td>{number(item.availableCoins)} coins</td><td>{formatDate(item.lastPurchaseAt)}</td><td><Link className="table-link" href={`/buyers/${item.personId}`}>View <ArrowUpRight size={13} /></Link></td></tr>)}</tbody></table></div> : <div className="empty-state">No buyer profiles match this filter.</div>)}
    </section>
  </>;
}
