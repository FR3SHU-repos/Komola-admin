"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, BarChart3, Building2, Coins, Database, LockKeyhole, MapPin, ShoppingCart } from "lucide-react";
import { PageHeader } from "@/shared/components/AdminPrimitives";
import { adminOverview, rewardAnalytics, salesAnalytics, type AdminOverview, type RewardAnalytics, type SalesAnalytics } from "@/shared/lib/api/admin";

const periods = [7, 30, 90] as const;

function money(minor: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format((minor || 0) / 100);
}

function number(value: number) { return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(value || 0); }

function Metric({ label, value, detail, Icon }: { label: string; value: string; detail: string; Icon: typeof Activity }) {
  return <div className="metric-card"><div className="metric-label"><span>{label}</span><span className="metric-icon"><Icon size={16} /></span></div><div className="metric-value">{value}</div><div className="metric-detail">{detail}</div></div>;
}

function BarSeries({ title, items }: { title: string; items: { label: string; value: number }[] }) {
  const maximum = Math.max(...items.map((item) => item.value), 1);
  return <section className="card"><div className="card-title">{title}</div><p className="card-description">Daily activity for the selected period.</p><div className="bar-list">{items.map((item) => <div className="bar-row" key={item.label}><span className="bar-label">{item.label}</span><span className="bar-track"><span className="bar-fill" style={{ width: `${Math.max(2, (item.value / maximum) * 100)}%` }} /></span><span className="bar-value">{number(item.value)}</span></div>)}</div>{items.length === 0 && <div className="empty-state" style={{ marginTop: 18 }}>No activity in this period.</div>}</section>;
}

export default function AnalyticsPage() {
  const [days, setDays] = useState<(typeof periods)[number]>(30);
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [sales, setSales] = useState<SalesAnalytics | null>(null);
  const [rewards, setRewards] = useState<RewardAnalytics | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([adminOverview(days), salesAnalytics(days), rewardAnalytics(days)]).then(([overviewResult, salesResult, rewardsResult]) => {
      if (!active) return;
      if (!overviewResult.success || !salesResult.success || !rewardsResult.success || !overviewResult.data || !salesResult.data || !rewardsResult.data) {
        setError(overviewResult.message || salesResult.message || rewardsResult.message || "Analytics could not be loaded");
        setState("error");
        return;
      }
      setOverview(overviewResult.data);
      setSales(salesResult.data);
      setRewards(rewardsResult.data);
      setState("ready");
    }).catch(() => { if (active) { setError("Analytics could not be loaded"); setState("error"); } });
    return () => { active = false; };
  }, [days]);

  const salesBars = useMemo(() => (sales?.series ?? []).filter((item) => item.sales > 0).map((item) => ({ label: item.date.slice(5), value: item.sales })), [sales]);
  const rewardBars = useMemo(() => (rewards?.series ?? []).filter((item) => item.claims > 0).map((item) => ({ label: item.date.slice(5), value: item.claims })), [rewards]);

  return <>
    <div className="page-heading-row"><PageHeader kicker="Measurement layer" title="Platform analytics" description="Privacy-safe operational aggregates across KOMOLA sales, rewards, organizations, and platform health." /><div className="page-actions"><label className="period-label" htmlFor="analytics-period">Period</label><select id="analytics-period" className="select" value={days} onChange={(event) => { setState("loading"); setDays(Number(event.target.value) as (typeof periods)[number]); }}>{periods.map((period) => <option key={period} value={period}>{period} days</option>)}</select></div></div>
    <div className="notice notice-warning" style={{ marginTop: 24 }}><LockKeyhole size={16} /><span>Aggregates are served by platform-admin Go API endpoints. Buyer identity, phone numbers, and raw claim details are intentionally excluded; analytics facts are counted only from consent-gated operational events.</span></div>
    {state === "loading" && <div className="card" style={{ marginTop: 18 }}><div className="card-title">Loading analytics…</div><p className="card-description">Calculating the {days}-day platform view.</p></div>}
    {state === "error" && <div className="notice notice-danger" style={{ marginTop: 18 }}><Activity size={16} /><span>{error}</span></div>}
    {state === "ready" && overview && sales && rewards && <>
      <div className="metric-grid"><Metric label="Gross sales" value={money(overview.periodGrossMinor)} detail={`${number(sales.completedSales)} completed sales`} Icon={ShoppingCart} /><Metric label="Reward claims" value={number(overview.periodClaims)} detail={`${number(rewards.confirmed)} confirmed`} Icon={Coins} /><Metric label="Active organizations" value={number(overview.activeOrganizations)} detail={`${number(overview.pendingOrganizations)} pending review`} Icon={Building2} /><Metric label="Enabled localities" value={number(overview.enabledLocations)} detail={`${number(overview.analyticsFacts)} consented facts`} Icon={MapPin} /><Metric label="Average sale" value={money(sales.averageSaleMinor)} detail={`${number(sales.saleLines)} sale lines`} Icon={BarChart3} /><Metric label="Reward points claimed" value={number(rewards.pointsClaimed)} detail={`${number(rewards.settledPoints)} settled`} Icon={Coins} /><Metric label="Claim conversion" value={`${rewards.conversionRate.toFixed(1)}%`} detail={`${number(rewards.delivered)} delivered`} Icon={Activity} /><Metric label="Pending outbox" value={number(overview.pendingOutboxEvents)} detail={`${number(overview.openPrivacyRequests)} open privacy requests`} Icon={Database} /></div>
      <div className="section-grid"><BarSeries title="Sales volume" items={salesBars} /><BarSeries title="Reward claims" items={rewardBars} /></div>
      <div className="section-grid"><section className="card"><div className="card-title">Top organizations by sales</div><p className="card-description">Completed transactions in the selected period.</p><div className="table-wrap"><table className="admin-table"><thead><tr><th>Organization</th><th>Sales</th><th>Gross</th></tr></thead><tbody>{sales.topOrganizations.map((item) => <tr key={item.id}><td>{item.name}</td><td>{number(item.sales)}</td><td>{money(item.grossMinor)}</td></tr>)}</tbody></table>{sales.topOrganizations.length === 0 && <div className="empty-state">No completed sales in this period.</div>}</div></section><section className="card"><div className="card-title">Top campaigns by claims</div><p className="card-description">Campaign activity without buyer-level identity.</p><div className="table-wrap"><table className="admin-table"><thead><tr><th>Campaign</th><th>Claims</th><th>Points</th></tr></thead><tbody>{rewards.topCampaigns.map((item) => <tr key={item.id}><td>{item.title}</td><td>{number(item.claims)}</td><td>{number(item.points)}</td></tr>)}</tbody></table>{rewards.topCampaigns.length === 0 && <div className="empty-state">No campaigns in this period.</div>}</div></section></div>
      <section className="card" style={{ marginTop: 18 }}><div className="card-title">Product movement</div><p className="card-description">Top products by completed-sale value. Product names are operational dimensions, not customer identity.</p><div className="table-wrap"><table className="admin-table"><thead><tr><th>Product</th><th>Quantity</th><th>Lines</th><th>Gross</th></tr></thead><tbody>{sales.topProducts.map((item) => <tr key={item.name}><td>{item.name}</td><td>{item.quantity.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</td><td>{number(item.saleLines)}</td><td>{money(item.grossMinor)}</td></tr>)}</tbody></table>{sales.topProducts.length === 0 && <div className="empty-state">No product sales in this period.</div>}</div></section>
      <section className="card" style={{ marginTop: 18 }}><div className="card-title">Next control-plane phase</div><p className="card-description">The global aggregate layer is now live. Audited organization drill-downs, admin audit-event search, and dedicated POS/Rewardor operations can be added without weakening the platform data boundary.</p></section>
    </>}
  </>;
}
