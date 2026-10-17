"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, MapPin, Receipt, Store } from "lucide-react";
import { ErrorNotice, LoadingState, PageHeader, StatusBadge } from "@/shared/components/AdminPrimitives";
import { operationBuyer, type AdminBuyerDetail, type BuyerPurchase } from "@/shared/lib/api/admin";
import { buyerCategoryHref, sellerSnapshotHref } from "@/shared/lib/entity-links";

const PURCHASES_PER_PAGE = 10;

function money(minor: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format((minor || 0) / 100);
}

function dateTime(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? "—" : date.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

function quantity(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(parsed) : value;
}

function containsCategoryPair(item: BuyerPurchase, categoryA: string, categoryB: string) {
  const categories = new Set(item.items.map((line) => line.category).filter(Boolean));
  return categories.has(categoryA) && categories.has(categoryB);
}

function PurchaseCard({ personId, item, categoryA, categoryB }: { personId: string; item: BuyerPurchase; categoryA: string; categoryB: string }) {
  return <article className="purchase-card"><div className="purchase-card-head"><div><div className="purchase-date">{dateTime(item.purchasedAt)}</div><strong>{item.receiptNumber}</strong><div className="caption">{item.items.length} product line{item.items.length === 1 ? "" : "s"}</div></div><div style={{ textAlign: "right" }}><strong className="purchase-total">{money(item.totalMinor)}</strong><StatusBadge value={item.status} /></div></div><div className="purchase-context"><span><Store size={14} /><Link className="table-link" href={sellerSnapshotHref(item.sellerId)}>{item.sellerName}</Link></span><span><MapPin size={14} />{[item.locationName, item.locality].filter(Boolean).join(" · ") || "Location unavailable"}</span></div><div className="purchase-items">{item.items.map((line, index) => <div className="purchase-line" key={`${line.sku}-${index}`}><span><strong>{line.name}</strong><small>{line.category ? <Link className="table-link" href={buyerCategoryHref(personId, line.category)}>{line.category}</Link> : null}{line.category ? " · " : ""}{line.sku || "SKU unavailable"} · {quantity(line.quantity)} {line.unit}{line.category === categoryA || line.category === categoryB ? " · matched category" : ""}</small></span><strong>{money(line.lineTotalMinor)}</strong></div>)}</div>{item.address ? <div className="purchase-address">Purchased at: {item.address}</div> : null}</article>;
}

export default function BuyerCategoryPairPage() {
  const params = useParams<{ personId: string }>();
  const searchParams = useSearchParams();
  const categoryA = searchParams.get("categoryA") || "";
  const categoryB = searchParams.get("categoryB") || "";
  const [detail, setDetail] = useState<AdminBuyerDetail | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    let active = true;
    operationBuyer(params.personId).then((response) => {
      if (!active) return;
      if (!response.success || !response.data) {
        setError(response.message || "Category-pair purchases could not be loaded");
        setState("error");
        return;
      }
      setDetail(response.data);
      setState("ready");
    }).catch(() => {
      if (active) {
        setError("Category-pair purchases could not be loaded");
        setState("error");
      }
    });
    return () => { active = false; };
  }, [params.personId]);

  const purchases = useMemo(() => detail && categoryA && categoryB ? detail.purchases.filter((item) => containsCategoryPair(item, categoryA, categoryB)) : [], [categoryA, categoryB, detail]);
  const pageCount = Math.max(1, Math.ceil(purchases.length / PURCHASES_PER_PAGE));
  const currentPage = Math.min(page, pageCount);
  const visiblePurchases = purchases.slice((currentPage - 1) * PURCHASES_PER_PAGE, currentPage * PURCHASES_PER_PAGE);
  const totalSpend = purchases.reduce((sum, item) => sum + item.totalMinor, 0);
  const categoriesValid = Boolean(categoryA && categoryB && categoryA !== categoryB);

  if (state === "loading") return <><div className="detail-back"><Link href={`/buyers/${params.personId}`}><ArrowLeft size={15} /> Back to buyer profile</Link></div><LoadingState label="Loading category-pair transactions…" /></>;
  if (state === "error" || !detail) return <><div className="detail-back"><Link href={`/buyers/${params.personId}`}><ArrowLeft size={15} /> Back to buyer profile</Link></div><ErrorNotice message={error || "Category-pair purchases could not be loaded"} /></>;

  return <><div className="detail-back"><Link href={`/buyers/${params.personId}`}><ArrowLeft size={15} /> Back to buyer profile</Link></div><PageHeader kicker="Purchase footprint" title={categoriesValid ? `${categoryA} + ${categoryB}` : "Categories bought together"} description={`${detail.person.displayName} · Completed receipts containing both categories.`} action={<Link className="secondary-button" href={`/buyers/${params.personId}`}>Buyer profile</Link>} /><div className="notice notice-warning" style={{ marginTop: 24 }}><Receipt size={16} /><span>Read-only platform-admin view. Each receipt below is a basket where both categories were purchased together; buyer identity remains protected by the admin data policy.</span></div>{!categoriesValid ? <ErrorNotice message="Choose two different categories from the buyer profile to view matching transactions." /> : <><div className="metric-grid" style={{ marginTop: 18 }}><div className="metric-card"><span className="metric-label">Matching baskets</span><strong className="metric-value">{purchases.length}</strong><span className="metric-detail">Completed receipts</span></div><div className="metric-card"><span className="metric-label">Matched spend</span><strong className="metric-value">{money(totalSpend)}</strong><span className="metric-detail">Total value in these baskets</span></div><div className="metric-card"><span className="metric-label">Categories</span><strong className="metric-value">2</strong><span className="metric-detail">{categoryA} and {categoryB}</span></div></div><section className="card" style={{ marginTop: 18 }}><div className="card-title">Purchase transactions</div><p className="card-description">What was bought, who sold it, where it was purchased, and the exact date and time.</p>{purchases.length ? <><div className="purchase-list-scroll"><div className="purchase-list">{visiblePurchases.map((item) => <PurchaseCard key={item.id} personId={params.personId} item={item} categoryA={categoryA} categoryB={categoryB} />)}</div></div><div className="purchase-pagination"><span>Showing {(currentPage - 1) * PURCHASES_PER_PAGE + 1}–{Math.min(currentPage * PURCHASES_PER_PAGE, purchases.length)} of {purchases.length} transactions</span><div className="pagination-actions"><button className="secondary-button" disabled={currentPage === 1} onClick={() => setPage(Math.max(1, currentPage - 1))}><ChevronLeft size={15} /> Previous</button><strong>Page {currentPage} of {pageCount}</strong><button className="secondary-button" disabled={currentPage === pageCount} onClick={() => setPage(Math.min(pageCount, currentPage + 1))}>Next <ChevronRight size={15} /></button></div></div></> : <div className="empty-state">No completed receipt contains both categories in the loaded purchase history.</div>}</section></>}</>;
}
