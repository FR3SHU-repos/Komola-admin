"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Coins, MapPin, Phone, Receipt, ShoppingCart, Store } from "lucide-react";
import { ErrorNotice, formatDate, LoadingState, MetricCard, PageHeader, StatusBadge } from "@/shared/components/AdminPrimitives";
import { operationBuyer, operationBuyerInsights, type AdminBuyerDetail, type BuyerInsights, type BuyerPurchase } from "@/shared/lib/api/admin";

function number(value: number) { return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(value || 0); }
function money(minor: number) { return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format((minor || 0) / 100); }
const PURCHASES_PER_PAGE = 10;

function PurchaseRow({ item }: { item: BuyerPurchase }) {
  return <article className="purchase-card"><div className="purchase-card-head"><div><div className="purchase-date">{formatDate(item.purchasedAt)}</div><strong>{item.receiptNumber}</strong><div className="caption">{item.items.length} product line{item.items.length === 1 ? "" : "s"}</div></div><div style={{ textAlign: "right" }}><strong className="purchase-total">{money(item.totalMinor)}</strong><StatusBadge value={item.status} /></div></div><div className="purchase-context"><span><Store size={14} />{item.sellerName}</span><span><MapPin size={14} />{[item.locationName, item.locality].filter(Boolean).join(" · ") || "Location unavailable"}</span></div><div className="purchase-items">{item.items.length ? item.items.map((line, index) => <div className="purchase-line" key={`${line.sku}-${index}`}><span><strong>{line.name}</strong><small>{line.sku || "SKU unavailable"} · {line.quantity} {line.unit}</small></span><strong>{money(line.lineTotalMinor)}</strong></div>) : <span className="caption">No sale-line detail was retained for this receipt.</span>}</div>{item.address ? <div className="purchase-address">Purchased at: {item.address}</div> : null}</article>;
}

function InsightList({ items, empty = "No history yet." }: { items: { label: string; value: string; detail?: string }[]; empty?: string }) {
  return items.length ? <div className="insight-list">{items.map((item) => <div className="insight-item" key={`${item.label}-${item.value}`}><span><strong>{item.label}</strong>{item.detail ? <small>{item.detail}</small> : null}</span><strong>{item.value}</strong></div>)}</div> : <div className="empty-state">{empty}</div>;
}

function CategoryInsightList({ personId, items }: { personId: string; items: BuyerInsights["categoryFrequency"] }) {
  return items.length ? <div className="insight-list">{items.map((item) => <Link className="insight-item insight-item-link" href={`/buyers/${personId}/footprint/categories?category=${encodeURIComponent(item.category)}`} key={item.category}><span><strong>{item.category}</strong><small>{item.purchaseCount} purchases · {item.quantity} units · {item.averageDaysBetween.toFixed(1)}d gap</small></span><strong>{item.sharePct.toFixed(0)}%</strong><ArrowRight size={15} /></Link>)}</div> : <div className="empty-state">No purchase categories yet.</div>;
}

function BuyerTimingHeatmap({ timing }: { timing: BuyerInsights["timing"] }) {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const cells = new Map((timing.heatmap ?? []).map((cell) => [`${cell.day}-${cell.hour}`, cell]));
  const maxPurchases = Math.max(1, ...(timing.heatmap ?? []).map((cell) => cell.purchases));
  const activeHours = [...timing.byHour].sort((a, b) => b.purchases - a.purchases).slice(0, 5);
  return <><div className="heatmap-scroll"><div className="heatmap"><div className="heatmap-header"><span />{Array.from({ length: 24 }, (_, hour) => <span key={hour}>{hour % 3 === 0 ? String(hour).padStart(2, "0") : ""}</span>)}</div>{days.map((day, dayIndex) => <div className="heatmap-row" key={day}><strong>{day.slice(0, 3)}</strong>{Array.from({ length: 24 }, (_, hour) => { const cell = cells.get(`${dayIndex + 1}-${hour}`); const intensity = cell ? 0.12 + (cell.purchases / maxPurchases) * 0.88 : 0.04; return <span className="heatmap-cell" key={hour} title={`${day}, ${hour}:00–${(hour + 1) % 24}:00 · ${cell?.purchases ?? 0} purchases`} style={{ backgroundColor: `rgb(255 87 51 / ${intensity})` }} />; })}</div>)}</div></div><div className="heatmap-legend"><span>Less activity</span><i /><i /><i /><i /><span>More activity</span></div><div className="caption" style={{ marginTop: 18 }}>Most active hours</div><InsightList items={activeHours.map((item) => ({ label: item.label, value: `${item.sharePct.toFixed(0)}%`, detail: `${item.purchases} purchases` }))} empty="No purchase timing available." /></>;
}

function BuyerInsightsPanel({ personId, insights }: { personId: string; insights: BuyerInsights | null }) {
  if (!insights) return <section className="card" style={{ marginTop: 18 }}><div className="card-title">Buying patterns</div><p className="card-description">The privacy-safe purchase signals could not be loaded for this buyer.</p><ErrorNotice message="Buying-pattern insights are temporarily unavailable." /></section>;
  const { summary, repeatProducts, preferredBrands, categoryFrequency, frequentlyTogether, timing, priceSensitivity, reorderCycle, offerAttribution } = insights;
  return <section className="card" style={{ marginTop: 18 }}><div className="card-title">Buying patterns</div><p className="card-description">Directional signals from completed purchases. Categories and brands depend on the product catalog metadata available at the time of analysis.</p><div className="insight-grid">
    <div className="insight-panel"><div className="card-title">Average basket value</div><div className="insight-big">{money(summary.averageBasketValueMinor)}</div><div className="caption">Across {number(summary.purchases)} completed purchase{summary.purchases === 1 ? "" : "s"}</div><div className="detail-list" style={{ marginTop: 14 }}><div><span>First purchase</span><strong>{formatDate(summary.firstPurchaseAt)}</strong></div><div><span>Latest purchase</span><strong>{formatDate(summary.lastPurchaseAt)}</strong></div><div><span>Average reorder cycle</span><strong>{reorderCycle.purchases > 1 ? `${reorderCycle.averageDays.toFixed(1)} days` : "Not enough history"}</strong></div><div><span>Median reorder cycle</span><strong>{reorderCycle.purchases > 1 ? `${reorderCycle.medianDays.toFixed(1)} days` : "Not enough history"}</strong></div></div></div>
    <div className="insight-panel"><div className="card-title">Repeat grocery products</div><InsightList items={repeatProducts.map((item) => ({ label: item.productName, value: `${item.purchaseCount} purchases`, detail: `${item.category} · ${item.quantity} units · ${item.averageDaysBetween.toFixed(1)}d average gap` }))} empty="No product has been purchased more than once yet." /></div>
    <div className="insight-panel"><div className="card-title">Preferred brands</div><InsightList items={preferredBrands.map((item) => ({ label: item.brand, value: `${item.purchaseCount} purchases`, detail: `${item.lineCount} lines · ${money(item.spendMinor)}` }))} empty="Brand metadata is not available for this buyer's purchases." /></div>
    <div className="insight-panel"><div className="card-title">Category frequency</div><CategoryInsightList personId={personId} items={categoryFrequency} /></div>
    <div className="insight-panel"><div className="card-title">Products bought together</div><InsightList items={frequentlyTogether.map((item) => ({ label: `${item.productA} + ${item.productB}`, value: `${item.basketsTogether} baskets` }))} empty="Not enough multi-product baskets to identify a pair." /></div>
    <div className="insight-panel"><div className="card-title">When they buy</div><div className="caption">Local time zone: {timing.timezone}</div><BuyerTimingHeatmap timing={timing} /></div>
    <div className="insight-panel"><div className="card-title">Price sensitivity</div><div className="insight-big">{priceSensitivity.discountedSharePct.toFixed(0)}%</div><div className="caption">of completed baskets included a recorded discount</div><div className="detail-list" style={{ marginTop: 14 }}><div><span>Discounted purchases</span><strong>{number(priceSensitivity.discountedPurchases)}</strong></div><div><span>Full-price purchases</span><strong>{number(priceSensitivity.fullPricePurchases)}</strong></div><div><span>Average discount</span><strong>{money(priceSensitivity.averageDiscountMinor)}</strong></div><div><span>Average discount rate</span><strong>{priceSensitivity.averageDiscountRatePct.toFixed(1)}%</strong></div></div></div>
    <div className="insight-panel"><div className="card-title">Offer conversion</div><p className="card-description">{offerAttribution.message}</p><div className="notice notice-warning">Discount behavior is available above, but a specific offer cannot be credited without a sale-to-offer link.</div></div>
  </div></section>;
}

export default function BuyerDetailPage() {
  const params = useParams<{ personId: string }>();
  const [detail, setDetail] = useState<AdminBuyerDetail | null>(null);
  const [insights, setInsights] = useState<BuyerInsights | null>(null);
  const [purchasePage, setPurchasePage] = useState(1);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setPurchasePage(1);
    void Promise.all([operationBuyer(params.personId), operationBuyerInsights(params.personId)]).then(([response, insightResponse]) => {
      if (!active) return;
      if (!response.success || !response.data) { setError(response.message || "Buyer profile could not be loaded"); setState("error"); return; }
      setDetail(response.data);
      setInsights(insightResponse.success ? insightResponse.data || null : null);
      setState("ready");
    });
    return () => { active = false; };
  }, [params.personId]);

  if (state === "loading") return <><div className="detail-back"><Link href="/buyers"><ArrowLeft size={15} /> Back to buyers</Link></div><LoadingState label="Loading buyer profile and purchase history…" /></>;
  if (state === "error" || !detail) return <><div className="detail-back"><Link href="/buyers"><ArrowLeft size={15} /> Back to buyers</Link></div><ErrorNotice message={error || "Buyer profile could not be loaded"} /></>;

  const { person, wallet, summary, purchases } = detail;
  const purchasePageCount = Math.max(1, Math.ceil(purchases.length / PURCHASES_PER_PAGE));
  const currentPurchasePage = Math.min(purchasePage, purchasePageCount);
  const visiblePurchases = purchases.slice((currentPurchasePage - 1) * PURCHASES_PER_PAGE, currentPurchasePage * PURCHASES_PER_PAGE);
  return <>
    <div className="detail-back"><Link href="/buyers"><ArrowLeft size={15} /> Back to buyers</Link></div>
    <PageHeader kicker="Buyer profile" title={person.displayName} description="Identity, wallet projection, and purchase history across the KOMOLA network." action={<StatusBadge value={person.status} />} />
    <div className="notice notice-warning" style={{ marginTop: 24 }}><Phone size={16} /><span>Protected personal data. Phone and email are shown only on this platform-admin detail view. Do not export or share them outside the approved support or governance purpose.</span></div>
    <section className="profile-card" style={{ marginTop: 18 }}><div className="profile-identity"><span className="profile-avatar">{person.displayName.slice(0, 1).toUpperCase()}</span><div><div className="profile-name">{person.displayName}</div><div className="caption">{person.buyerCode || "No buyer code"} · Joined {formatDate(person.createdAt)}</div></div></div><div className="profile-fields"><div><span>Phone</span><strong>{person.phone || "Not provided"}</strong></div><div><span>Email</span><strong>{person.email || "Not provided"}</strong></div><div><span>Komola locality</span><strong>{person.locationName || "Not set"}</strong><small>{person.locationCode || ""}</small></div><div><span>Timezone</span><strong>{person.timezone || "—"}</strong></div></div></section>
    <div className="metric-grid" style={{ marginTop: 18 }}><MetricCard label="Purchases" value={number(summary.purchases)} detail="Completed purchase transactions" icon={ShoppingCart} /><MetricCard label="Total spent" value={money(summary.totalSpentMinor)} detail="Completed-sale value" icon={Receipt} /><MetricCard label="Sellers" value={number(summary.sellers)} detail="Seller organizations purchased from" icon={Store} /><MetricCard label="Available coins" value={number(wallet.availableCoins)} detail={`${number(wallet.lifetimeEarnedCoins)} lifetime earned`} icon={Coins} /></div>
    <div className="detail-grid" style={{ marginTop: 18 }}><section className="card"><div className="card-title">Wallet snapshot</div><p className="card-description">Current reward-account projection for this buyer.</p><div className="detail-list"><div><span>Available coins</span><strong>{number(wallet.availableCoins)}</strong></div><div><span>Pending coins</span><strong>{number(wallet.pendingCoins)}</strong></div><div><span>Reserved for rewards</span><strong>{number(wallet.reservedCampaignCoins)}</strong></div><div><span>Lifetime earned</span><strong>{number(wallet.lifetimeEarnedCoins)}</strong></div><div><span>Lifetime redeemed</span><strong>{number(wallet.lifetimeRedeemedCoins)}</strong></div><div><span>Last updated</span><strong>{formatDate(wallet.updatedAt)}</strong></div></div></section><section className="card"><div className="card-title">Purchase footprint</div><p className="card-description">Click a dimension to inspect the underlying products and receipts.</p><div className="detail-list"><Link className="detail-link-row" href={`/buyers/${person.id}/footprint/products`}><span><strong>Product types</strong><small>See every product bought and its receipts</small></span><span className="detail-link-value">{number(summary.products)} <ArrowRight size={15} /></span></Link><Link className="detail-link-row" href={`/buyers/${person.id}/footprint/sellers`}><span><strong>Seller organizations</strong><small>See who sold to this buyer and when</small></span><span className="detail-link-value">{number(summary.sellers)} <ArrowRight size={15} /></span></Link><Link className="detail-link-row" href={`/buyers/${person.id}/footprint/locations`}><span><strong>Purchase locations</strong><small>See where each purchase was made</small></span><span className="detail-link-value">{number(summary.locations)} <ArrowRight size={15} /></span></Link><div><span>Last purchase</span><strong>{formatDate(summary.lastPurchaseAt)}</strong></div></div></section></div>
    <BuyerInsightsPanel personId={person.id} insights={insights} />
    <section className="card" style={{ marginTop: 18 }}><div className="card-title">Purchase transactions</div><p className="card-description">What was bought, when, from whom, and at which seller location. Historical receipts remain available for operational insight.</p>{purchases.length ? <><div className="purchase-list-scroll"><div className="purchase-list">{visiblePurchases.map((item) => <PurchaseRow key={item.id} item={item} />)}</div></div><div className="purchase-pagination"><span>Showing {(currentPurchasePage - 1) * PURCHASES_PER_PAGE + 1}–{Math.min(currentPurchasePage * PURCHASES_PER_PAGE, purchases.length)} of {purchases.length} transactions</span><div className="pagination-actions"><button className="secondary-button" disabled={currentPurchasePage === 1} onClick={() => setPurchasePage(Math.max(1, currentPurchasePage - 1))}><ChevronLeft size={15} /> Previous</button><strong>Page {currentPurchasePage} of {purchasePageCount}</strong><button className="secondary-button" disabled={currentPurchasePage === purchasePageCount} onClick={() => setPurchasePage(Math.min(purchasePageCount, currentPurchasePage + 1))}>Next <ChevronRight size={15} /></button></div></div></> : <div className="empty-state">No purchase transactions are linked to this buyer yet.</div>}</section>
  </>;
}
