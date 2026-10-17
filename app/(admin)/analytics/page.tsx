"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Activity, ArrowUpRight, BarChart3, Building2, Coins, Database, LockKeyhole, MapPin, ShoppingCart } from "lucide-react";
import { PageHeader } from "@/shared/components/AdminPrimitives";
import { adminOverview, rewardAnalytics, salesAnalytics, type AdminOverview, type AnalyticsGranularity, type RewardAnalytics, type SalesAnalytics } from "@/shared/lib/api/admin";
import { analyticsBucketLabel, analyticsPeriods } from "@/shared/lib/analytics";
import { sellerSnapshotHref } from "@/shared/lib/entity-links";

function money(minor: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format((minor || 0) / 100);
}

function number(value: number) { return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(value || 0); }

function Metric({ label, value, detail, href, Icon }: { label: string; value: string; detail: string; href: string; Icon: typeof Activity }) {
  return <Link className="metric-card metric-card-link" href={href}><div className="metric-label"><span>{label}</span><span className="metric-icon"><Icon size={16} /></span></div><div className="metric-value">{value}</div><div className="metric-detail">{detail}</div><span className="card-link-hint">View details <ArrowUpRight size={13} /></span></Link>;
}

function BarSeries({ title, description, href, items }: { title: string; description: string; href: string; items: { label: string; value: number }[] }) {
  const maximum = Math.max(...items.map((item) => item.value), 1);
  return <Link className="card analytics-card-link" href={href}><div className="card-title">{title}</div><p className="card-description">{description}</p><div className="bar-list">{items.map((item) => <div className="bar-row" key={item.label}><span className="bar-label">{item.label}</span><span className="bar-track"><span className="bar-fill" style={{ width: `${Math.max(2, (item.value / maximum) * 100)}%` }} /></span><span className="bar-value">{number(item.value)}</span></div>)}</div>{items.length === 0 && <div className="empty-state" style={{ marginTop: 18 }}>No activity in this period.</div>}<span className="card-link-hint">Open detailed view <ArrowUpRight size={13} /></span></Link>;
}

export default function AnalyticsPage() {
  const [granularity, setGranularity] = useState<AnalyticsGranularity>("month");
  const period = analyticsPeriods.find((item) => item.value === granularity) ?? analyticsPeriods[1];
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [sales, setSales] = useState<SalesAnalytics | null>(null);
  const [rewards, setRewards] = useState<RewardAnalytics | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([adminOverview(period.days, granularity), salesAnalytics(period.days, granularity), rewardAnalytics(period.days, granularity)]).then(([overviewResult, salesResult, rewardsResult]) => {
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
  }, [granularity, period.days]);

  const formatBucket = (value: string) => analyticsBucketLabel(value, granularity);
  const salesBars = useMemo(() => (sales?.series ?? []).filter((item) => item.sales > 0).map((item) => ({ label: formatBucket(item.date), value: item.sales })), [sales, granularity]);
  const rewardBars = useMemo(() => (rewards?.series ?? []).filter((item) => item.claims > 0).map((item) => ({ label: formatBucket(item.date), value: item.claims })), [rewards, granularity]);
  const query = `?granularity=${granularity}`;

  return <>
    <div className="page-heading-row"><PageHeader kicker="Measurement layer" title="Platform analytics" description="Privacy-safe operational aggregates across KOMOLA sales, rewards, organizations, and platform health." /><div className="page-actions"><label className="period-label" htmlFor="analytics-period">Sales view</label><select id="analytics-period" className="select" value={granularity} onChange={(event) => { setState("loading"); setGranularity(event.target.value as AnalyticsGranularity); }}>{analyticsPeriods.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div></div>
    <div className="notice notice-warning" style={{ marginTop: 24 }}><LockKeyhole size={16} /><span>Aggregates are served by platform-admin Go API endpoints. Buyer identity, phone numbers, and raw claim details are intentionally excluded; analytics facts are counted only from consent-gated operational events.</span></div>
    {state === "loading" && <div className="card" style={{ marginTop: 18 }}><div className="card-title">Loading analytics…</div><p className="card-description">Calculating the {period.label.toLowerCase()} platform view ({period.description.toLowerCase()}).</p></div>}
    {state === "error" && <div className="notice notice-danger" style={{ marginTop: 18 }}><Activity size={16} /><span>{error}</span></div>}
    {state === "ready" && overview && sales && rewards && <>
      <div className="metric-grid">
        <Metric label="Gross sales" value={money(overview.periodGrossMinor)} detail={`${number(sales.completedSales)} completed sales`} href={`/analytics/gross-sales${query}`} Icon={ShoppingCart} />
        <Metric label="Reward claims" value={number(overview.periodClaims)} detail={`${number(rewards.confirmed)} confirmed`} href={`/analytics/reward-claims${query}`} Icon={Coins} />
        <Metric label="Active organizations" value={number(overview.activeOrganizations)} detail={`${number(overview.pendingOrganizations)} pending review`} href="/analytics/active-organizations" Icon={Building2} />
        <Metric label="Enabled localities" value={number(overview.enabledLocations)} detail={`${number(overview.analyticsFacts)} consented facts`} href="/analytics/localities" Icon={MapPin} />
        <Metric label="Average sale" value={money(sales.averageSaleMinor)} detail={`${number(sales.saleLines)} sale lines`} href={`/analytics/average-sale${query}`} Icon={BarChart3} />
        <Metric label="Reward points claimed" value={number(rewards.pointsClaimed)} detail={`${number(rewards.settledPoints)} settled`} href={`/analytics/reward-points${query}`} Icon={Coins} />
        <Metric label="Claim conversion" value={`${rewards.conversionRate.toFixed(1)}%`} detail={`${number(rewards.delivered)} delivered`} href={`/analytics/claim-conversion${query}`} Icon={Activity} />
        <Metric label="Pending outbox" value={number(overview.pendingOutboxEvents)} detail={`${number(overview.openPrivacyRequests)} open privacy requests`} href="/analytics/pending-outbox" Icon={Database} />
      </div>
      <div className="section-grid"><BarSeries title="Sales volume" description={`${period.label} completed sales.`} href={`/analytics/sales-volume${query}`} items={salesBars} /><BarSeries title="Reward claims" description={`${period.label} reward claims.`} href={`/analytics/reward-claims${query}`} items={rewardBars} /></div>
      <div className="section-grid">
        <section className="card analytics-card-link"><div className="card-title">Top organizations by sales</div><p className="card-description">Completed transactions in the selected period.</p><div className="table-wrap"><table className="admin-table"><thead><tr><th>Organization</th><th>Sales</th><th>Gross</th></tr></thead><tbody>{sales.topOrganizations.map((item) => <tr key={item.id}><td><Link className="table-link" href={sellerSnapshotHref(item.id)}>{item.name} <ArrowUpRight size={13} /></Link></td><td>{number(item.sales)}</td><td>{money(item.grossMinor)}</td></tr>)}</tbody></table>{sales.topOrganizations.length === 0 && <div className="empty-state">No completed sales in this period.</div>}</div><Link className="card-link-hint" href={`/analytics/organizations${query}`}>Open organization details <ArrowUpRight size={13} /></Link></section>
        <Link className="card analytics-card-link" href={`/analytics/campaigns${query}`}><div className="card-title">Top campaigns by claims</div><p className="card-description">Campaign activity without buyer-level identity.</p><div className="table-wrap"><table className="admin-table"><thead><tr><th>Campaign</th><th>Claims</th><th>Points</th></tr></thead><tbody>{rewards.topCampaigns.map((item) => <tr key={item.id}><td>{item.title}</td><td>{number(item.claims)}</td><td>{number(item.points)}</td></tr>)}</tbody></table>{rewards.topCampaigns.length === 0 && <div className="empty-state">No campaigns in this period.</div>}</div><span className="card-link-hint">Open campaign details <ArrowUpRight size={13} /></span></Link>
      </div>
      <Link className="card analytics-card-link analytics-card-wide" style={{ marginTop: 18 }} href={`/analytics/products${query}`}><div className="card-title">Product movement</div><p className="card-description">Top products by completed-sale value. Product names are operational dimensions, not customer identity.</p><div className="table-wrap"><table className="admin-table"><thead><tr><th>Product</th><th>Quantity</th><th>Lines</th><th>Gross</th></tr></thead><tbody>{sales.topProducts.map((item) => <tr key={item.name}><td>{item.name}</td><td>{item.quantity.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</td><td>{number(item.saleLines)}</td><td>{money(item.grossMinor)}</td></tr>)}</tbody></table>{sales.topProducts.length === 0 && <div className="empty-state">No product sales in this period.</div>}</div><span className="card-link-hint">Open product details <ArrowUpRight size={13} /></span></Link>
      <Link className="card analytics-card-link analytics-card-wide" style={{ marginTop: 18 }} href="/analytics/platform-health"><div className="card-title">Platform health</div><p className="card-description">Operational queues and privacy-safe control-plane signals.</p><span className="card-link-hint">Open platform health details <ArrowUpRight size={13} /></span></Link>
    </>}
  </>;
}
