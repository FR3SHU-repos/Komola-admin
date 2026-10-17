"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Boxes, Coins, MapPin, PackageSearch, ShoppingCart, Users } from "lucide-react";
import { ErrorNotice, formatDate, LoadingState, MetricCard, PageHeader, StatusBadge } from "@/shared/components/AdminPrimitives";
import { inventoryCategoryDetails, type InventoryCategoryDetails } from "@/shared/lib/api/admin";

function number(value: number) { return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(value || 0); }
function money(value: number) { return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format((value || 0) / 100); }
function dateTime(value?: string) { if (!value) return "—"; const date = new Date(value); return Number.isNaN(date.valueOf()) ? "—" : date.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }); }
function compactAddress(locationName: string, locality: string, state: string) {
  const location = locationName.trim();
  const localityValue = locality.trim();
  const stateValue = state.trim();
  const same = (left: string, right: string) => left.localeCompare(right, undefined, { sensitivity: "accent" }) === 0;
  const parts = [same(location, localityValue) ? "" : localityValue, same(localityValue, stateValue) || same(location, stateValue) ? "" : stateValue].filter(Boolean);
  return parts.join(", ") || "Locality unavailable";
}

export default function CategoryDetailPage() {
  const params = useParams<{ category: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const slug = params.category;
  const requestedDays = Number(searchParams.get("days") || 30);
  const days = [7, 30, 90, 365].includes(requestedDays) ? requestedDays : 30;
  const [result, setResult] = useState<InventoryCategoryDetails | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setState("loading");
    inventoryCategoryDetails({ category: slug, days, limit: 100 }).then((response) => {
      if (!active) return;
      if (!response.success || !response.data) { setError(response.message || "Category sales could not be loaded"); setState("error"); return; }
      setResult(response.data);
      setState("ready");
    }).catch(() => { if (active) { setError("Category sales could not be loaded"); setState("error"); } });
    return () => { active = false; };
  }, [days, slug]);

  return <>
    <div className="detail-back"><Link href={`/inventory?days=${days}`}><ArrowLeft size={15} /> Back to inventory analytics</Link></div>
    <PageHeader kicker="Category drill-down" title={result?.category.name || decodeURIComponent(slug)} description="Trace completed sales behind this category. Buyer contacts are masked and locality is shown without a full address." action={<div className="page-actions"><label className="period-label" htmlFor="category-period">Period</label><select id="category-period" className="select" value={days} onChange={(event) => router.replace(`/inventory/categories/${encodeURIComponent(slug)}?days=${event.target.value}`)}><option value={7}>7 days</option><option value={30}>30 days</option><option value={90}>90 days</option><option value={365}>365 days</option></select></div>} />
    {state === "loading" && <LoadingState label="Loading category sales…" />}
    {state === "error" && <ErrorNotice message={error} />}
    {state === "ready" && result && <>
      <div className="notice notice-warning" style={{ marginTop: 24 }}><PackageSearch size={16} /><span>Showing completed sales from the last {days} days. Linked buyers can be opened from their masked identity; unlinked customers are labelled separately.</span></div>
      <div className="metric-grid" style={{ marginTop: 18 }}><MetricCard label="Gross sales" value={money(result.category.grossMinor)} detail={`${number(result.category.transactions)} completed transactions`} icon={Coins} /><MetricCard label="Products" value={number(result.category.products)} detail={`${number(result.category.quantity)} units sold`} icon={Boxes} /><MetricCard label="Sellers" value={number(result.category.sellers)} detail="Organizations selling this category" icon={ShoppingCart} /><MetricCard label="Linked buyers" value={number(result.category.buyers)} detail={`Last sale ${formatDate(result.category.lastSaleAt)}`} icon={Users} /></div>
      <section className="card" style={{ marginTop: 18 }}><div className="card-title">Sales in {result.category.name}</div><p className="card-description">Each row is a sold product line with seller, locality, masked buyer, value, and purchase date/time.</p>{result.items.length ? <div className="table-wrap"><table className="admin-table"><thead><tr><th>Product</th><th>Seller</th><th>Where</th><th>Buyer</th><th>Amount</th><th>Purchased</th></tr></thead><tbody>{result.items.map((item) => <tr key={`${item.saleId}-${item.productId}-${item.sku}`}><td><strong>{item.productName}</strong><div className="caption">{item.quantity} {item.unit} · {item.sku}</div></td><td><strong>{item.sellerName}</strong><div className="caption">{item.sellerType}</div></td><td><span className="table-inline"><MapPin size={13} />{item.locationName}</span><div className="caption">{compactAddress(item.locationName, item.locality, item.state)}</div></td><td>{item.buyerLinked && item.buyerId ? <Link className="table-link" href={`/buyers/${item.buyerId}`}>{item.buyerName}</Link> : <strong>{item.buyerName}</strong>}<div className="caption">{item.buyerPhoneMasked} · {item.buyerEmailMasked}</div></td><td><strong>{money(item.lineTotalMinor)}</strong><div className="caption">₹{(item.unitPriceMinor / 100).toFixed(2)} / unit</div></td><td><strong>{dateTime(item.purchasedAt)}</strong><div className="caption"><StatusBadge value={item.status} /> · {item.receiptNumber}</div></td></tr>)}</tbody></table></div> : <div className="empty-state">No completed sales were found for this category in the selected period.</div>}</section>
    </>}
  </>;
}
