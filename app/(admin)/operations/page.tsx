"use client";

import { useEffect, useMemo, useState } from "react";
import { Boxes, Calculator, Coins, RefreshCw, Search, ShoppingCart, Store, Users } from "lucide-react";
import { ErrorNotice, formatDate, LoadingState, MetricCard, PageHeader, StatusBadge } from "@/shared/components/AdminPrimitives";
import {
  operationProducts,
  operationCategories,
  operationRegisters,
  operationLocations,
  operationSellers,
  operationWallets,
  operationsSummary,
  type AdminRegister,
  type AdminBusinessLocation,
  type AdminSeller,
  type BuyerWallet,
  type ListedProduct,
  type OperationsList,
  type OperationsSummary,
  type ProductCategory,
} from "@/shared/lib/api/admin";

type View = "sellers" | "products" | "registers" | "locations" | "wallets";

const views: { id: View; label: string }[] = [
  { id: "sellers", label: "Seller performance" },
  { id: "products", label: "Listed products" },
  { id: "registers", label: "Registers" },
  { id: "locations", label: "Business locations" },
  { id: "wallets", label: "Buyer wallets" },
];

function number(value: number) { return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(value || 0); }
function money(minor: number) { return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format((minor || 0) / 100); }

function Metric({ label, value, detail, icon: Icon }: { label: string; value: string | number; detail: string; icon: typeof Store }) {
  return <MetricCard label={label} value={value} detail={detail} icon={Icon} />;
}

function Empty({ message }: { message: string }) { return <div className="empty-state">{message}</div>; }

export default function OperationsPage() {
  const [view, setView] = useState<View>("sellers");
  const [days, setDays] = useState(30);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [summary, setSummary] = useState<OperationsSummary | null>(null);
  const [items, setItems] = useState<OperationsList<AdminSeller | ListedProduct | AdminRegister | AdminBusinessLocation | BuyerWallet> | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");

  async function load(nextView = view, nextSearch = search, nextCategory = category) {
    setState("loading");
    setError("");
    const summaryResult = await operationsSummary(days);
    const categoryResult = nextView === "products" ? await operationCategories() : null;
    const listResult = nextView === "sellers"
      ? await operationSellers({ search: nextSearch, limit: 50, days })
      : nextView === "products"
        ? await operationProducts({ search: nextSearch, category: nextCategory, limit: 50 })
        : nextView === "registers"
          ? await operationRegisters({ search: nextSearch, limit: 50 })
          : nextView === "locations"
            ? await operationLocations({ search: nextSearch, limit: 50 })
            : await operationWallets({ search: nextSearch, limit: 50 });
    if (!summaryResult.success || !summaryResult.data || !listResult.success || !listResult.data || (categoryResult && (!categoryResult.success || !categoryResult.data))) {
      setError(summaryResult.message || listResult.message || "Operations data could not be loaded");
      setState("error");
      return;
    }
    setSummary(summaryResult.data);
    if (categoryResult?.data) setCategories(categoryResult.data.items);
    setItems(listResult.data as OperationsList<AdminSeller | ListedProduct | AdminRegister | AdminBusinessLocation | BuyerWallet>);
    setState("ready");
  }

  useEffect(() => { void load(); }, [view, days]); // eslint-disable-line react-hooks/exhaustive-deps

  const title = useMemo(() => views.find((item) => item.id === view)?.label ?? "Operations", [view]);

  return <>
    <PageHeader kicker="Operational visibility" title="Platform operations" description="See what sellers have listed, how their POS activity is moving, and the current Komola Coin wallet projections." action={<button className="secondary-button" onClick={() => void load()}><RefreshCw size={15} /> Refresh</button>} />
    <div className="notice notice-warning" style={{ marginTop: 24 }}><ShoppingCart size={16} /><span>Read-only platform-admin data. Buyer contact details are masked; wallet values come from the transactional reward-account projection.</span></div>
    <div className="metric-grid" style={{ marginTop: 18 }}>
      <Metric label="Sellers" value={number(summary?.sellers ?? 0)} detail="Active or suspended seller organizations" icon={Store} />
      <Metric label="Listed products" value={number(summary?.listedProducts ?? 0)} detail="Draft and active catalogue products" icon={Boxes} />
      <Metric label="Active registers" value={number(summary?.activeRegisters ?? 0)} detail="POS registers across sellers" icon={Calculator} />
      <Metric label="Business locations" value={number(summary?.businessLocations ?? 0)} detail="Seller operating locations" icon={Store} />
      <Metric label="Transactions" value={number(summary?.periodTransactions ?? 0)} detail={`${days}-day completed sales`} icon={ShoppingCart} />
      <Metric label="Gross sales" value={money(summary?.periodGrossMinor ?? 0)} detail={`${days}-day completed-sale value`} icon={Coins} />
      <Metric label="Buyer wallets" value={number(summary?.walletHolders ?? 0)} detail={`${number(summary?.totalAvailableCoins ?? 0)} available coins`} icon={Users} />
    </div>
    <section className="card" style={{ marginTop: 18 }}>
      <div className="operations-toolbar"><div className="tab-row">{views.map((item) => <button key={item.id} className={`tab-button ${view === item.id ? "active" : ""}`} onClick={() => { setSearch(""); setCategory(""); setView(item.id); }}>{item.label}</button>)}</div><div className="operations-filters"><div className="search-field"><Search size={15} /><input aria-label={`Search ${title}`} value={search} placeholder={`Search ${title.toLowerCase()}`} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void load(view, search, category); }} /></div>{view === "products" && <select className="select" aria-label="Filter products by category" value={category} onChange={(event) => { setCategory(event.target.value); void load(view, search, event.target.value); }}><option value="">All categories</option>{categories.map((item) => <option key={item.slug} value={item.slug}>{item.name} ({number(item.productCount)})</option>)}</select>}{view === "sellers" && <select className="select" value={days} onChange={(event) => setDays(Number(event.target.value))}><option value={30}>30 days</option><option value={90}>90 days</option><option value={365}>365 days</option></select>}<button className="primary-button" onClick={() => void load(view, search, category)}>Search</button></div></div>
      {state === "loading" && <LoadingState label="Loading platform operations…" />}
      {state === "error" && <ErrorNotice message={error} />}
      {state === "ready" && items && <div className="table-wrap"><div className="card-title" style={{ margin: "18px 0 12px" }}>{title}</div>{view === "sellers" && <SellerTable items={items.items as AdminSeller[]} />}{view === "products" && <><CategorySummary items={categories} selected={category} onSelect={(slug) => { setCategory(slug); void load("products", search, slug); }} /><div className="product-results-heading"><strong>{category ? `Products in ${categories.find((item) => item.slug === category)?.name ?? category}` : "All products"}</strong><span>{items.meta?.total ?? items.items.length} products</span></div><ProductTable items={items.items as ListedProduct[]} /></>}{view === "registers" && <RegisterTable items={items.items as AdminRegister[]} />}{view === "locations" && <LocationTable items={items.items as AdminBusinessLocation[]} />}{view === "wallets" && <WalletTable items={items.items as BuyerWallet[]} />}</div>}
    </section>
  </>;
}

function SellerTable({ items }: { items: AdminSeller[] }) { return items.length ? <table className="admin-table"><thead><tr><th>Seller</th><th>Type</th><th>Products</th><th>Registers</th><th>Transactions</th><th>Gross</th><th>Last sale</th></tr></thead><tbody>{items.map((item) => <tr key={item.organizationId}><td><strong>{item.sellerName}</strong><div className="caption">{number(item.locations)} locations</div></td><td><StatusBadge value={item.sellerType} /></td><td>{number(item.products)}</td><td>{number(item.registers)}</td><td>{number(item.transactions)}</td><td>{money(item.grossMinor)}</td><td>{formatDate(item.lastTransactionAt)}</td></tr>)}</tbody></table> : <Empty message="No seller data found." />; }
function ProductTable({ items }: { items: ListedProduct[] }) { return items.length ? <table className="admin-table"><thead><tr><th>Product</th><th>Category</th><th>Seller</th><th>Status</th><th>Variants</th><th>SKUs</th><th>Listed</th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td><strong>{item.name}</strong><div className="caption">{item.id.slice(0, 8)}…</div></td><td>{item.category}</td><td>{item.organizationName}</td><td><StatusBadge value={item.status} /></td><td>{number(item.variantCount)}</td><td>{number(item.skuCount)}</td><td>{formatDate(item.createdAt)}</td></tr>)}</tbody></table> : <Empty message="No listed products found." />; }
function CategorySummary({ items, selected, onSelect }: { items: ProductCategory[]; selected: string; onSelect: (slug: string) => void }) { return items.length ? <div className="category-summary"><div className="card-title">Products by category</div><p className="card-description">Choose a category to see its products in the table below.</p><div className="category-chips"><button className={`category-chip ${selected === "" ? "selected" : ""}`} onClick={() => onSelect("")}><strong>All categories</strong><span>{number(items.reduce((total, item) => total + item.productCount, 0))} products</span></button>{items.map((item) => <button key={item.slug} className={`category-chip ${selected === item.slug ? "selected" : ""}`} onClick={() => onSelect(item.slug)}><strong>{item.name}</strong><span>{number(item.productCount)} products · {number(item.sellerCount)} sellers</span></button>)}</div></div> : null; }
function RegisterTable({ items }: { items: AdminRegister[] }) { return items.length ? <table className="admin-table"><thead><tr><th>Register</th><th>Seller</th><th>Locality</th><th>Status</th><th>Shift</th><th>Last opened</th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td><strong>{item.name}</strong><div className="caption">{item.code}</div></td><td>{item.organizationName}</td><td>{item.locationName}</td><td><StatusBadge value={item.status} /></td><td><StatusBadge value={item.openShift} /></td><td>{formatDate(item.lastOpenedAt)}</td></tr>)}</tbody></table> : <Empty message="No registers found." />; }
function LocationTable({ items }: { items: AdminBusinessLocation[] }) { return items.length ? <table className="admin-table"><thead><tr><th>Location</th><th>Seller</th><th>Address</th><th>PIN code</th><th>Status</th><th>Created</th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td><strong>{item.name}</strong><div className="caption">{item.code} · {item.timezone}</div></td><td>{item.organizationName}</td><td>{[item.line1, item.line2, item.city, item.state].filter(Boolean).join(", ") || "—"}</td><td>{item.postalCode || "—"}</td><td><StatusBadge value={item.status} /></td><td>{formatDate(item.createdAt)}</td></tr>)}</tbody></table> : <Empty message="No business locations found." />; }
function WalletTable({ items }: { items: BuyerWallet[] }) { return items.length ? <table className="admin-table"><thead><tr><th>Buyer</th><th>Available</th><th>Pending</th><th>Reserved</th><th>Lifetime earned</th><th>Redeemed</th><th>Updated</th></tr></thead><tbody>{items.map((item) => <tr key={item.personId}><td><strong>{item.buyerName}</strong><div className="caption">{item.contactMasked}</div></td><td>{number(item.availableCoins)}</td><td>{number(item.pendingCoins)}</td><td>{number(item.reservedCampaignCoins)}</td><td>{number(item.lifetimeEarnedCoins)}</td><td>{number(item.lifetimeRedeemedCoins)}</td><td>{formatDate(item.updatedAt)}</td></tr>)}</tbody></table> : <Empty message="No buyer wallets found." />; }
