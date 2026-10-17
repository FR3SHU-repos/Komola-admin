"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowUpRight, BarChart3, Building2, Coins, Database, MapPin, ShoppingCart } from "lucide-react";
import { PageHeader, StatusBadge } from "@/shared/components/AdminPrimitives";
import { adminOverview, locations, rewardAnalytics, salesAnalytics, type AdminOverview, type AnalyticsGranularity, type Location, type RewardAnalytics, type SalesAnalytics } from "@/shared/lib/api/admin";
import { analyticsBucketLabel, analyticsPeriods } from "@/shared/lib/analytics";
import { sellerSnapshotHref } from "@/shared/lib/entity-links";

const details: Record<string, { title: string; description: string; icon: typeof ShoppingCart }> = {
  "gross-sales": { title: "Gross sales", description: "Completed-sale value across the platform for the selected reporting view.", icon: ShoppingCart },
  "sales-volume": { title: "Sales volume", description: "Completed transaction counts grouped by the selected reporting bucket.", icon: BarChart3 },
  "average-sale": { title: "Average sale", description: "Average completed-sale value and the sale-line activity behind it.", icon: BarChart3 },
  "organizations": { title: "Organizations by sales", description: "The leading seller organizations by completed transactions and gross value.", icon: Building2 },
  "products": { title: "Product movement", description: "Products contributing the most completed-sale value in the selected period.", icon: ShoppingCart },
  "reward-claims": { title: "Reward claims", description: "Reward-claim activity and its progression through the fulfillment flow.", icon: Coins },
  "reward-points": { title: "Reward points claimed", description: "Points claimed, settled, issued, redeemed, and reversed across the platform.", icon: Coins },
  "claim-conversion": { title: "Claim conversion", description: "The relationship between claims and confirmed reward outcomes.", icon: Coins },
  "campaigns": { title: "Campaigns by claims", description: "Reward campaigns ranked by claim activity without exposing buyer identity.", icon: Coins },
  "active-organizations": { title: "Active organizations", description: "Platform organizations currently available for operational activity.", icon: Building2 },
  localities: { title: "Enabled localities", description: "Locations enabled for KOMOLA onboarding and discovery.", icon: MapPin },
  "pending-outbox": { title: "Pending outbox", description: "Events awaiting publication and the related platform health signals.", icon: Database },
  "platform-health": { title: "Platform health", description: "Privacy-safe operational signals for queues, organizations, and consented analytics facts.", icon: Database },
};

function money(minor: number) { return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format((minor || 0) / 100); }
function number(value: number) { return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(value || 0); }

function DetailMetric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <div className="metric-card"><div className="metric-label">{label}</div><div className="metric-value">{value}</div><div className="metric-detail">{detail}</div></div>;
}

function Series({ title, items, granularity, valueLabel }: { title: string; items: { date: string; value: number }[]; granularity: AnalyticsGranularity; valueLabel: string }) {
  const maximum = Math.max(...items.map((item) => item.value), 1);
  return <section className="card"><div className="card-title">{title}</div><p className="card-description">{valueLabel} by {granularity} bucket.</p><div className="bar-list">{items.map((item) => <div className="bar-row" key={item.date}><span className="bar-label">{analyticsBucketLabel(item.date, granularity)}</span><span className="bar-track"><span className="bar-fill" style={{ width: `${Math.max(2, (item.value / maximum) * 100)}%` }} /></span><span className="bar-value">{number(item.value)}</span></div>)}</div></section>;
}

export default function AnalyticsDetailPage() {
  const params = useParams<{ detail: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const slug = params.detail;
  const config = details[slug] ?? details["platform-health"];
  const requested = searchParams.get("granularity");
  const granularity = (requested === "week" || requested === "month" || requested === "year" ? requested : "month") as AnalyticsGranularity;
  const period = analyticsPeriods.find((item) => item.value === granularity) ?? analyticsPeriods[1];
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [sales, setSales] = useState<SalesAnalytics | null>(null);
  const [rewards, setRewards] = useState<RewardAnalytics | null>(null);
  const [localityItems, setLocalityItems] = useState<Location[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let active = true;
    setState("loading");
    Promise.all([adminOverview(period.days, granularity), salesAnalytics(period.days, granularity), rewardAnalytics(period.days, granularity)]).then(async ([overviewResult, salesResult, rewardsResult]) => {
      if (!active) return;
      if (!overviewResult.success || !salesResult.success || !rewardsResult.success || !overviewResult.data || !salesResult.data || !rewardsResult.data) { setState("error"); return; }
      setOverview(overviewResult.data);
      setSales(salesResult.data);
      setRewards(rewardsResult.data);
      if (slug === "localities") {
        const localityResult = await locations();
        if (localityResult.success && localityResult.data) setLocalityItems(localityResult.data.items);
      }
      setState("ready");
    }).catch(() => { if (active) setState("error"); });
    return () => { active = false; };
  }, [granularity, period.days, slug]);

  const salesSeries = useMemo(() => (sales?.series ?? []).map((item) => ({ date: item.date, value: item.sales })), [sales]);
  const rewardSeries = useMemo(() => (rewards?.series ?? []).map((item) => ({ date: item.date, value: item.claims })), [rewards]);
  const Icon = config.icon;

  return <>
    <div className="detail-back"><Link href={`/analytics?granularity=${granularity}`}><ArrowLeft size={15} /> Back to analytics</Link></div>
    <div className="page-heading-row"><PageHeader kicker="Analytics detail" title={config.title} description={config.description} /><div className="page-actions"><label className="period-label" htmlFor="detail-period">View</label><select id="detail-period" className="select" value={granularity} onChange={(event) => router.replace(`/analytics/${slug}?granularity=${event.target.value}`)}>{analyticsPeriods.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div></div>
    {state === "loading" && <div className="card" style={{ marginTop: 24 }}>Loading {period.label.toLowerCase()} detail…</div>}
    {state === "error" && <div className="notice notice-danger" style={{ marginTop: 24 }}>This analytics detail could not be loaded.</div>}
    {state === "ready" && overview && sales && rewards && <>
      <div className="detail-heading-icon"><Icon size={19} /><span>{period.description} · privacy-safe aggregate view</span></div>
      <div className="metric-grid">
        <DetailMetric label="Gross sales" value={money(sales.grossMinor)} detail={`${number(sales.completedSales)} completed sales`} />
        <DetailMetric label="Reward claims" value={number(rewards.claims)} detail={`${number(rewards.confirmed)} confirmed`} />
        <DetailMetric label="Average sale" value={money(sales.averageSaleMinor)} detail={`${number(sales.saleLines)} sale lines`} />
        <DetailMetric label="Claim conversion" value={`${rewards.conversionRate.toFixed(1)}%`} detail={`${number(rewards.delivered)} delivered`} />
      </div>
      {(slug === "gross-sales" || slug === "sales-volume" || slug === "average-sale") && <div className="detail-grid"><Series title="Sales trend" items={salesSeries} granularity={granularity} valueLabel="Completed sales" /><section className="card"><div className="card-title">Sales summary</div><div className="detail-list"><div><span>Gross sales</span><strong>{money(sales.grossMinor)}</strong></div><div><span>Refunded sales</span><strong>{number(sales.refundedSales)}</strong></div><div><span>Voided sales</span><strong>{number(sales.voidedSales)}</strong></div><div><span>Average sale</span><strong>{money(sales.averageSaleMinor)}</strong></div></div></section></div>}
      {(slug === "reward-claims" || slug === "reward-points" || slug === "claim-conversion") && <div className="detail-grid"><Series title="Reward trend" items={rewardSeries} granularity={granularity} valueLabel="Reward claims" /><section className="card"><div className="card-title">Reward summary</div><div className="detail-list"><div><span>Points claimed</span><strong>{number(rewards.pointsClaimed)}</strong></div><div><span>Settled points</span><strong>{number(rewards.settledPoints)}</strong></div><div><span>Coins issued</span><strong>{number(rewards.coinsIssued)}</strong></div><div><span>Coins redeemed</span><strong>{number(rewards.coinsRedeemed)}</strong></div><div><span>Coins reversed</span><strong>{number(rewards.coinsReversed)}</strong></div></div></section></div>}
      {slug === "organizations" && <section className="card"><div className="card-title">Top organizations by sales</div><p className="card-description">Seller organizations ranked by completed-sale value.</p><div className="table-wrap"><table className="admin-table"><thead><tr><th>Organization</th><th>Sales</th><th>Gross</th></tr></thead><tbody>{sales.topOrganizations.map((item) => <tr key={item.id}><td><Link className="table-link" href={sellerSnapshotHref(item.id)}>{item.name} <ArrowUpRight size={13} /></Link></td><td>{number(item.sales)}</td><td>{money(item.grossMinor)}</td></tr>)}</tbody></table></div></section>}
      {slug === "products" && <section className="card"><div className="card-title">Product movement</div><p className="card-description">Products ranked by completed-sale value.</p><div className="table-wrap"><table className="admin-table"><thead><tr><th>Product</th><th>Quantity</th><th>Lines</th><th>Gross</th></tr></thead><tbody>{sales.topProducts.map((item) => <tr key={item.name}><td>{item.name}</td><td>{item.quantity.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</td><td>{number(item.saleLines)}</td><td>{money(item.grossMinor)}</td></tr>)}</tbody></table></div></section>}
      {slug === "campaigns" && <section className="card"><div className="card-title">Top campaigns by claims</div><p className="card-description">Campaign activity without buyer-level identity.</p><div className="table-wrap"><table className="admin-table"><thead><tr><th>Campaign</th><th>Claims</th><th>Points</th><th>Status</th></tr></thead><tbody>{rewards.topCampaigns.map((item) => <tr key={item.id}><td>{item.title}</td><td>{number(item.claims)}</td><td>{number(item.points)}</td><td><StatusBadge value={item.status} /></td></tr>)}</tbody></table></div></section>}
      {slug === "localities" && <section className="card"><div className="card-title">Enabled localities</div><p className="card-description">Locations currently enabled for platform activity.</p><div className="table-wrap"><table className="admin-table"><thead><tr><th>Name</th><th>Code</th><th>Timezone</th><th>Status</th></tr></thead><tbody>{localityItems.map((item) => <tr key={item.id}><td>{item.name}</td><td>{item.code}</td><td>{item.timezone}</td><td><StatusBadge value={item.status} /></td></tr>)}</tbody></table></div></section>}
      {(slug === "active-organizations" || slug === "pending-outbox" || slug === "platform-health") && <section className="card"><div className="card-title">Platform health signals</div><p className="card-description">These controls intentionally expose aggregates only; raw buyer identity and event payloads remain outside this view.</p><div className="detail-list"><div><span>Active organizations</span><strong>{number(overview.activeOrganizations)}</strong></div><div><span>Pending organizations</span><strong>{number(overview.pendingOrganizations)}</strong></div><div><span>Enabled localities</span><strong>{number(overview.enabledLocations)}</strong></div><div><span>Pending outbox events</span><strong>{number(overview.pendingOutboxEvents)}</strong></div><div><span>Open privacy requests</span><strong>{number(overview.openPrivacyRequests)}</strong></div><div><span>Consented analytics facts</span><strong>{number(overview.analyticsFacts)}</strong></div></div></section>}
      <Link className="detail-secondary-link" href={`/analytics?granularity=${granularity}`}>Return to all analytics <ArrowUpRight size={14} /></Link>
    </>}
  </>;
}
