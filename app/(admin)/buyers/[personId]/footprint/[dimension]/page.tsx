"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, MapPin, Receipt, Store } from "lucide-react";
import { ErrorNotice, formatDate, LoadingState, PageHeader, StatusBadge } from "@/shared/components/AdminPrimitives";
import { operationBuyer, type AdminBuyerDetail, type BuyerPurchase } from "@/shared/lib/api/admin";

type Dimension = "products" | "sellers" | "locations" | "categories";
type SummaryRow = { key: string; label: string; detail: string; purchases: number; quantity: number; spendMinor: number; lastPurchasedAt: string };

function money(minor: number) { return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format((minor || 0) / 100); }
function dateTime(value?: string) { if (!value) return "—"; const date = new Date(value); return Number.isNaN(date.valueOf()) ? "—" : date.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }); }
function quantity(value: string) { const parsed = Number(value); return Number.isFinite(parsed) ? new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(parsed) : value; }

function purchaseMatches(item: BuyerPurchase, dimension: Dimension, key: string, categoryFilter: string) {
  if (dimension === "sellers") return item.sellerId === key;
  if (dimension === "locations") return `${item.locationName}|${item.locality}` === key;
  if (dimension === "categories") return item.items.some((line) => line.category === categoryFilter);
  return item.items.some((line) => line.name === key);
}

function buildRows(purchases: BuyerPurchase[], dimension: Dimension, categoryFilter: string): SummaryRow[] {
  const groups = new Map<string, SummaryRow>();
  for (const purchase of purchases) {
    if (dimension === "products" || dimension === "categories") {
      for (const line of purchase.items) {
        if (dimension === "categories" && line.category !== categoryFilter) continue;
        const current = groups.get(line.name) ?? { key: line.name, label: line.name, detail: `${line.sku || "SKU unavailable"} · ${line.unit || "unit unavailable"}`, purchases: 0, quantity: 0, spendMinor: 0, lastPurchasedAt: purchase.purchasedAt };
        current.purchases += 1;
        current.quantity += Number(line.quantity) || 0;
        current.spendMinor += line.lineTotalMinor;
        if (purchase.purchasedAt > current.lastPurchasedAt) current.lastPurchasedAt = purchase.purchasedAt;
        groups.set(line.name, current);
      }
      continue;
    }
    const key = dimension === "sellers" ? purchase.sellerId : `${purchase.locationName}|${purchase.locality}`;
    const label = dimension === "sellers" ? purchase.sellerName : purchase.locationName || "Location unavailable";
    const detail = dimension === "sellers" ? purchase.sellerType : purchase.locality || purchase.address || "Locality unavailable";
    const current = groups.get(key) ?? { key, label, detail, purchases: 0, quantity: 0, spendMinor: 0, lastPurchasedAt: purchase.purchasedAt };
    current.purchases += 1;
    current.spendMinor += purchase.totalMinor;
    current.quantity += purchase.items.reduce((sum, line) => sum + (Number(line.quantity) || 0), 0);
    if (purchase.purchasedAt > current.lastPurchasedAt) current.lastPurchasedAt = purchase.purchasedAt;
    groups.set(key, current);
  }
  return [...groups.values()].sort((a, b) => b.spendMinor - a.spendMinor || b.purchases - a.purchases);
}

function PurchaseCard({ item }: { item: BuyerPurchase }) {
  return <article className="purchase-card"><div className="purchase-card-head"><div><div className="purchase-date">{dateTime(item.purchasedAt)}</div><strong>{item.receiptNumber}</strong><div className="caption">{item.items.length} product line{item.items.length === 1 ? "" : "s"}</div></div><div style={{ textAlign: "right" }}><strong className="purchase-total">{money(item.totalMinor)}</strong><StatusBadge value={item.status} /></div></div><div className="purchase-context"><span><Store size={14} />{item.sellerName}</span><span><MapPin size={14} />{[item.locationName, item.locality].filter(Boolean).join(" · ") || "Location unavailable"}</span></div><div className="purchase-items">{item.items.map((line, index) => <div className="purchase-line" key={`${line.sku}-${index}`}><span><strong>{line.name}</strong><small>{line.sku || "SKU unavailable"} · {quantity(line.quantity)} {line.unit}</small></span><strong>{money(line.lineTotalMinor)}</strong></div>)}</div></article>;
}

export default function BuyerFootprintPage() {
  const params = useParams<{ personId: string; dimension: string }>();
  const searchParams = useSearchParams();
  const dimension = (params.dimension === "sellers" || params.dimension === "locations" || params.dimension === "categories" ? params.dimension : "products") as Dimension;
  const categoryFilter = searchParams.get("category") || "";
  const [detail, setDetail] = useState<AdminBuyerDetail | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    operationBuyer(params.personId).then((response) => {
      if (!active) return;
      if (!response.success || !response.data) { setError(response.message || "Purchase footprint could not be loaded"); setState("error"); return; }
      setDetail(response.data); setState("ready");
    }).catch(() => { if (active) { setError("Purchase footprint could not be loaded"); setState("error"); } });
    return () => { active = false; };
  }, [params.personId]);

  const rows = useMemo(() => detail ? buildRows(detail.purchases, dimension, categoryFilter) : [], [detail, dimension, categoryFilter]);
  const title = dimension === "products" ? "Purchased products" : dimension === "categories" ? `Products in ${categoryFilter || "this category"}` : dimension === "sellers" ? "Seller purchase history" : "Purchase locations";
  const description = dimension === "products" ? "Products bought by this buyer, with quantities, spend, and the receipts behind each product." : dimension === "categories" ? "Products bought by this buyer in the selected category, with the receipts behind each product." : dimension === "sellers" ? "Seller organizations this buyer purchased from, with the matching receipts and products." : "Locations where this buyer completed purchases, with the matching receipts and products.";

  if (state === "loading") return <><div className="detail-back"><Link href={`/buyers/${params.personId}`}><ArrowLeft size={15} /> Back to buyer profile</Link></div><LoadingState label="Loading purchase footprint…" /></>;
  if (state === "error" || !detail) return <><div className="detail-back"><Link href={`/buyers/${params.personId}`}><ArrowLeft size={15} /> Back to buyer profile</Link></div><ErrorNotice message={error || "Purchase footprint could not be loaded"} /></>;

  return <><div className="detail-back"><Link href={`/buyers/${params.personId}`}><ArrowLeft size={15} /> Back to buyer profile</Link></div><PageHeader kicker="Purchase footprint" title={title} description={`${detail.person.displayName} · ${description}`} action={<Link className="secondary-button" href={`/buyers/${params.personId}`}>Buyer profile</Link>} /><div className="notice notice-warning" style={{ marginTop: 24 }}><Receipt size={16} /><span>Read-only platform-admin view. The receipt rows below show completed buyer transactions and retain the seller and location context needed for support and analysis.</span></div><div className="footprint-tabs"><Link className={dimension === "products" ? "active" : ""} href={`/buyers/${params.personId}/footprint/products`}>Products</Link><Link className={dimension === "sellers" ? "active" : ""} href={`/buyers/${params.personId}/footprint/sellers`}>Sellers</Link><Link className={dimension === "locations" ? "active" : ""} href={`/buyers/${params.personId}/footprint/locations`}>Locations</Link>{dimension === "categories" ? <span className="footprint-filter">Category: {categoryFilter || "Unknown"}</span> : null}</div><section className="card" style={{ marginTop: 18 }}><div className="card-title">{dimension === "products" || dimension === "categories" ? "Listed products bought" : dimension === "sellers" ? "Seller organizations" : "Purchase locations"}</div><p className="card-description">{rows.length} matching {dimension === "products" ? "product types" : dimension === "categories" ? `products in ${categoryFilter || "this category"}` : dimension === "sellers" ? "seller organizations" : "locations"} across {detail.purchases.length} completed receipts.</p>{rows.length ? <div className="table-wrap"><table className="admin-table"><thead><tr><th>{dimension === "products" || dimension === "categories" ? "Product" : dimension === "sellers" ? "Seller" : "Location"}</th><th>Purchases</th><th>Quantity</th><th>Spend</th><th>Last purchased</th></tr></thead><tbody>{rows.map((row) => <tr key={row.key}><td><strong>{row.label}</strong><div className="caption">{row.detail}</div></td><td>{row.purchases}</td><td>{quantity(String(row.quantity))}</td><td>{money(row.spendMinor)}</td><td>{dateTime(row.lastPurchasedAt)}</td></tr>)}</tbody></table></div> : <div className="empty-state">No matching purchases found.</div>}</section><section className="card" style={{ marginTop: 18 }}><div className="card-title">Matching purchase receipts</div><p className="card-description">Every receipt containing the selected footprint dimension.</p>{detail.purchases.filter((item) => rows.some((row) => purchaseMatches(item, dimension, row.key, categoryFilter))).length ? <div className="purchase-list">{detail.purchases.filter((item) => rows.some((row) => purchaseMatches(item, dimension, row.key, categoryFilter))).map((item) => <PurchaseCard key={item.id} item={item} />)}</div> : <div className="empty-state">No matching receipts found.</div>}</section></>;
}
