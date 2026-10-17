import { request, requestDownload, type ApiResult } from "./client";

export interface AdminBootstrap {
  user?: { id?: string; name?: string; email?: string; role?: string; orgType?: string };
  capabilities?: { availableExperiences?: string[] };
}

export interface Organization {
  id: string;
  name?: string;
  displayName?: string;
  legalName?: string;
  type?: string;
  sellerType?: string;
  status?: string;
  rejectionReason?: string;
  createdAt?: string;
  contact?: Record<string, unknown>;
}

export interface Location {
  id: string;
  code: string;
  name: string;
  timezone: string;
  status: string;
  enabled: boolean;
}

export interface PrivacyRequest {
  id: string;
  requestType: string;
  details: string;
  status: string;
  createdAt: string;
  dueAt?: string;
  assignedTo?: string;
  identityVerifiedAt?: string;
  responseNote?: string;
  person?: { id?: string; displayName?: string; email?: string; phone?: string };
}

export interface Paginated<T> { items: T[]; meta?: { total?: number; totalPages?: number; page?: number; limit?: number } }

export interface AdminOverview {
  periodDays: number;
  periodGranularity?: "day" | "week" | "month" | "year";
  periodLabel?: string;
  activeOrganizations: number;
  pendingOrganizations: number;
  enabledLocations: number;
  periodSales: number;
  periodGrossMinor: number;
  periodClaims: number;
  periodPoints: number;
  openPrivacyRequests: number;
  pendingOutboxEvents: number;
  analyticsFacts: number;
  generatedAt: string;
}

export interface SalesAnalytics {
  periodDays: number;
  periodGranularity?: "day" | "week" | "month" | "year";
  periodLabel?: string;
  completedSales: number;
  grossMinor: number;
  averageSaleMinor: number;
  refundedSales: number;
  voidedSales: number;
  saleLines: number;
  series: { date: string; sales: number; grossMinor: number }[];
  topOrganizations: { id: string; name: string; sales: number; grossMinor: number }[];
  topProducts: { name: string; quantity: number; grossMinor: number; saleLines: number }[];
}

export interface RewardAnalytics {
  periodDays: number;
  periodGranularity?: "day" | "week" | "month" | "year";
  periodLabel?: string;
  claims: number;
  approved: number;
  delivered: number;
  confirmed: number;
  cancelled: number;
  conversionRate: number;
  pointsClaimed: number;
  settledPoints: number;
  coinsIssued: number;
  coinsRedeemed: number;
  coinsReversed: number;
  publishedCampaigns: number;
  series: { date: string; claims: number; points: number }[];
  topCampaigns: { id: string; title: string; claims: number; points: number; status: string }[];
}

export interface OperationsSummary {
  periodDays: number;
  listedProducts: number;
  activeRegisters: number;
  businessLocations: number;
  sellers: number;
  walletHolders: number;
  periodTransactions: number;
  periodGrossMinor: number;
  totalAvailableCoins: number;
}

export interface ListedProduct {
  id: string;
  name: string;
  organizationId: string;
  organizationName: string;
  category: string;
  categorySlug: string;
  status: string;
  variantCount: number;
  skuCount: number;
  createdAt: string;
}

export interface ProductCategory {
  name: string;
  slug: string;
  productCount: number;
  sellerCount: number;
}

export interface AdminRegister {
  id: string;
  code: string;
  name: string;
  organizationId: string;
  organizationName: string;
  locationName: string;
  terminalId: string;
  status: string;
  openShift: string;
  lastOpenedAt: string;
  createdAt: string;
}

export interface AdminBusinessLocation {
  id: string;
  code: string;
  name: string;
  organizationId: string;
  organizationName: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  timezone: string;
  status: string;
  createdAt: string;
}

export interface AdminSeller {
  organizationId: string;
  sellerName: string;
  sellerType: string;
  status: string;
  products: number;
  registers: number;
  transactions: number;
  grossMinor: number;
  locations: number;
  lastTransactionAt: string;
}

export interface SellerSnapshot {
  seller: { id: string; name: string; legalName: string; sellerType: string; status: string; taxRegistrationNumber: string; currencyCode: string; timezone: string; contact: Record<string, unknown>; createdAt: string; updatedAt: string };
  summary: { days: number; products: number; activeProducts: number; variants: number; skus: number; locations: number; registers: number; availableUnits: number; stockValueMinor: number; lowStockItems: number; outOfStockItems: number; transactions: number; grossMinor: number; refunds: number; voids: number; linkedBuyers: number; referralCoins: number; referralGrossMinor: number; lastSaleAt: string };
  locations: { id: string; code: string; name: string; status: string; timezone: string; address: Record<string, unknown>; locality: string }[];
  registers: { id: string; code: string; name: string; location: string; status: string; openShift: string; lastOpenedAt: string; createdAt: string }[];
  products: { id: string; name: string; category: string; categorySlug: string; variant: string; sku: string; unit: string; status: string; prices: { priceList: string; location: string; amountMinor: number; compareAtMinor?: number; active: boolean }[] }[];
  stock: { productId: string; productName: string; category: string; sku: string; unit: string; location: string; available: number; reserved: number; unitCostMinor: number; stockValueMinor: number; status: string }[];
  sales: { topProducts: { name: string; quantity: number; sales: number; grossMinor: number; lastSaleAt: string }[]; topCategories: { name: string; quantity: number; sales: number; grossMinor: number; lastSaleAt: string }[]; recent: { id: string; receiptNumber: string; status: string; totalMinor: number; location: string; buyerName: string; purchasedAt: string }[] };
  referrals: { id: string; code: string; buyerName: string; status: string; awardedCoins: number; eligibleAmountMinor: number }[];
}

export interface BuyerWallet {
  personId: string;
  buyerName: string;
  contactMasked: string;
  status: string;
  availableCoins: number;
  pendingCoins: number;
  reservedCampaignCoins: number;
  lifetimeEarnedCoins: number;
  lifetimeRedeemedCoins: number;
  reversedCoins: number;
  updatedAt: string;
}

export interface AdminBuyer {
  personId: string;
  buyerName: string;
  phoneMasked: string;
  emailMasked: string;
  buyerCode: string;
  locationName: string;
  status: string;
  purchases: number;
  totalSpentMinor: number;
  sellers: number;
  locations: number;
  availableCoins: number;
  lastPurchaseAt: string;
  createdAt: string;
}

export interface BuyerPurchaseItem {
  sku: string;
  name: string;
  category: string;
  quantity: string;
  unit: string;
  unitPriceMinor: number;
  lineTotalMinor: number;
}

export interface BuyerPurchase {
  id: string;
  receiptNumber: string;
  status: string;
  totalMinor: number;
  purchasedAt: string;
  sellerId: string;
  sellerName: string;
  sellerType: string;
  locationName: string;
  locality: string;
  address: string;
  items: BuyerPurchaseItem[];
}

export interface AdminBuyerDetail {
  person: {
    id: string;
    displayName: string;
    status: string;
    phone: string;
    email: string;
    buyerCode: string;
    locationName: string;
    locationCode: string;
    timezone: string;
    createdAt: string;
    updatedAt: string;
  };
  wallet: BuyerWallet;
  summary: {
    purchases: number;
    totalSpentMinor: number;
    products: number;
    sellers: number;
    locations: number;
    lastPurchaseAt: string;
  };
  purchases: BuyerPurchase[];
}

export interface BuyerInsights {
  summary: { purchases: number; averageBasketValueMinor: number; firstPurchaseAt: string; lastPurchaseAt: string };
  repeatProducts: { productName: string; category: string; brand: string; purchaseCount: number; quantity: number; averageDaysBetween: number; lastBoughtAt: string }[];
  preferredBrands: { brand: string; purchaseCount: number; lineCount: number; spendMinor: number }[];
  categoryFrequency: { category: string; purchaseCount: number; sharePct: number; quantity: number; averageDaysBetween: number; lastBoughtAt: string }[];
  frequentlyTogether: { productA: string; productB: string; basketsTogether: number }[];
  timing: { timezone: string; byDay: { label: string; purchases: number; sharePct: number }[]; byHour: { label: string; purchases: number; sharePct: number }[]; heatmap: { day: number; hour: number; purchases: number; sharePct: number }[] };
  priceSensitivity: { discountedPurchases: number; fullPricePurchases: number; discountedSharePct: number; averageDiscountMinor: number; averageDiscountRatePct: number };
  reorderCycle: { averageDays: number; medianDays: number; purchases: number };
  offerAttribution: { available: boolean; message: string };
}

export interface RewardorCampaign {
  id: string;
  slug: string;
  title: string;
  description: string;
  campaignType: string;
  rewardType: string;
  points: number;
  totalClaimsAllowed: number;
  perBuyerLimit: number;
  timerEnabled: boolean;
  startsAt?: string;
  endsAt?: string;
  imageUrl?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  locationCode: string;
  locationName: string;
  rewardorId: string;
  rewardorName: string;
  rewardorLegalName?: string;
  approvalMode: string;
  claims: number;
  pointsClaimed: number;
}

export interface OperationsList<T> {
  items: T[];
  meta?: { total?: number; totalPages?: number; limit?: number; offset?: number };
  periodDays?: number;
}

export interface ReconciliationIssue {
  issueType: string;
  severity: "critical" | "warning";
  referenceId: string;
  description: string;
  occurredAt: string;
}

export interface ReconciliationResult {
  items: ReconciliationIssue[];
  summary: { total: number; critical: number; warning: number };
  meta?: { total?: number; totalPages?: number; page?: number; limit?: number; offset?: number };
}

export interface AdminAuditEvent { id: string; organization: string; actor: string; action: string; entityType: string; entityId: string; requestId: string; occurredAt: string }
export interface AdminAlert { alertType: string; severity: "critical" | "warning"; referenceId: string; title: string; description: string; occurredAt: string }
export interface AdminSignal { signalType: string; severity: "critical" | "warning"; referenceId: string; subject: string; description: string; occurredAt: string }
export interface AdminSignalResult<T> { items: T[]; summary: { total: number; critical: number; warning: number }; meta?: { total?: number; totalPages?: number; page?: number; limit?: number; offset?: number } }
export interface SellerPerformance { organizationId: string; sellerName: string; sellerType: string; status: string; products: number; locations: number; transactions: number; grossMinor: number; refunds: number; voids: number; lastTransactionAt: string; linkedBuyers: number; referralCoins: number; referralGrossMinor: number }
export interface RewardorPerformance { organizationId: string; organizationName: string; status: string; campaigns: number; publishedCampaigns: number; pausedCampaigns: number; expiredCampaigns: number; archivedCampaigns: number; claims: number; approvedClaims: number; redeemedClaims: number; pointsClaimed: number; pointsSettled: number; pointsReleased: number; lastActivityAt: string }
export interface InventoryItem { productId: string; productName: string; category: string; categorySlug: string; sellerId: string; sellerName: string; locationName: string; sku: string; unit: string; available: number; unitCostMinor: number; status: string }
export interface InventoryMover { productId: string; productName: string; category: string; categorySlug: string; quantity: number; sales: number; grossMinor: number; lastSaleAt: string }
export interface InventoryCategory { category: string; categorySlug: string; quantity: number; sales: number; grossMinor: number; lastSaleAt: string }
export interface InventoryCategorySale { saleId: string; receiptNumber: string; status: string; productId: string; productName: string; sku: string; quantity: string; unit: string; unitPriceMinor: number; lineTotalMinor: number; sellerId: string; sellerName: string; sellerType: string; locationName: string; locality: string; state: string; buyerId?: string; buyerName: string; buyerPhoneMasked: string; buyerEmailMasked: string; buyerLinked: boolean; purchasedAt: string }
export interface InventoryCategoryDetails { category: { name: string; slug: string; days: number; products: number; sellers: number; buyers: number; transactions: number; quantity: number; grossMinor: number; lastSaleAt: string }; items: InventoryCategorySale[]; meta?: { total?: number; totalPages?: number; page?: number; limit?: number } }
export interface InventoryAnalytics { items: InventoryItem[]; topMovers: InventoryMover[]; topCategories: InventoryCategory[]; summary: { days: number; stockUnits: number; stockValueMinor: number; trackedSKUs: number; lowStockItems: number; outOfStockItems: number; movementUnits: number }; meta?: { total?: number; totalPages?: number; page?: number; limit?: number } }
export interface FreshnessSource { source: string; status: string; detail: string; lastSuccessAt: string; lagSeconds: number; metrics: Record<string, unknown> }
export interface FreshnessResult { generatedAt: string; sources: FreshnessSource[]; thresholds: Record<string, unknown>; partial: boolean }

function operationQuery(params: { search?: string; category?: string; location?: string; sellerType?: string; status?: string; limit?: number; offset?: number; days?: number } = {}) {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.category) query.set("category", params.category);
  if (params.location) query.set("location", params.location);
  if (params.sellerType) query.set("sellerType", params.sellerType);
  if (params.status) query.set("status", params.status);
  if (params.limit) query.set("limit", String(params.limit));
  if (params.offset) query.set("offset", String(params.offset));
  if (params.days) query.set("days", String(params.days));
  const value = query.toString();
  return value ? `?${value}` : "";
}

export function adminBootstrap(): Promise<ApiResult<AdminBootstrap>> { return request("pos/bootstrap"); }
export function organizations(status = "", type = ""): Promise<ApiResult<{ items: Organization[] }>> {
  const query = new URLSearchParams();
  if (status) query.set("status", status);
  if (type) query.set("type", type);
  const suffix = query.toString();
  return request(`admin/seller-applications${suffix ? `?${suffix}` : ""}`);
}
export function updateOrganization(id: string, decision: "Approved" | "Rejected" | "Suspended", reason = "") {
  return request<{ organizationId: string }>(`admin/seller-applications/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify({ decision, reason }) });
}
export function locations(): Promise<ApiResult<{ items: Location[] }>> { return request("admin/locations"); }
export function createLocation(body: { code: string; name: string; timezone: string; status: "enabled" | "disabled" }) {
  return request<Location>("admin/locations", { method: "POST", body: JSON.stringify(body) });
}
export function editLocation(id: string, body: Partial<{ code: string; name: string; timezone: string; status: "enabled" | "disabled" }>) {
  return request<Location>(`admin/locations/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(body) });
}
export function updateLocation(id: string, status: "enabled" | "disabled") {
  return editLocation(id, { status });
}
export function deleteLocation(id: string) {
  return request<Location>(`admin/locations/${encodeURIComponent(id)}`, { method: "DELETE" });
}
export function privacyRequests(status = ""): Promise<ApiResult<Paginated<PrivacyRequest>>> {
  return request(`admin/privacy/requests?limit=50${status ? `&status=${encodeURIComponent(status)}` : ""}`);
}
export function updatePrivacyRequest(id: string, body: { status?: string; identityVerified?: boolean; responseNote?: string; resolutionAction?: string }) {
  return request<{ id: string; status: string }>(`admin/privacy/requests/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(body) });
}
export type AnalyticsGranularity = "day" | "week" | "month" | "year";

export function adminOverview(days = 30, granularity?: AnalyticsGranularity): Promise<ApiResult<AdminOverview>> {
  return request(`admin/overview?days=${days}${granularity ? `&granularity=${granularity}` : ""}`);
}
export function salesAnalytics(days = 30, granularity?: AnalyticsGranularity): Promise<ApiResult<SalesAnalytics>> {
  return request(`admin/analytics/sales?days=${days}${granularity ? `&granularity=${granularity}` : ""}`);
}
export function rewardAnalytics(days = 30, granularity?: AnalyticsGranularity): Promise<ApiResult<RewardAnalytics>> {
  return request(`admin/analytics/rewards?days=${days}${granularity ? `&granularity=${granularity}` : ""}`);
}
export function rewardorCampaigns(params: { search?: string; status?: string; campaignType?: string; limit?: number; offset?: number } = {}): Promise<ApiResult<OperationsList<RewardorCampaign>>> {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.status) query.set("status", params.status);
  if (params.campaignType) query.set("campaignType", params.campaignType);
  if (params.limit) query.set("limit", String(params.limit));
  if (params.offset) query.set("offset", String(params.offset));
  const suffix = query.toString();
  return request(`admin/reward-campaigns${suffix ? `?${suffix}` : ""}`);
}
export function operationsSummary(days = 30): Promise<ApiResult<OperationsSummary>> { return request(`admin/operations/summary?days=${days}`); }
export function operationCategories(): Promise<ApiResult<{ items: ProductCategory[] }>> { return request("admin/operations/categories"); }
export type OperationQuery = { search?: string; category?: string; location?: string; sellerType?: string; status?: string; limit?: number; offset?: number; days?: number };
export function operationProducts(params: OperationQuery = {}): Promise<ApiResult<OperationsList<ListedProduct> & { category?: string }>> { return request(`admin/operations/products${operationQuery(params)}`); }
export function operationRegisters(params: OperationQuery = {}): Promise<ApiResult<OperationsList<AdminRegister>>> { return request(`admin/operations/registers${operationQuery(params)}`); }
export function operationLocations(params: OperationQuery = {}): Promise<ApiResult<OperationsList<AdminBusinessLocation>>> { return request(`admin/operations/locations${operationQuery(params)}`); }
export function operationSellers(params: OperationQuery = {}): Promise<ApiResult<OperationsList<AdminSeller>>> { return request(`admin/operations/sellers${operationQuery(params)}`); }
export function sellerSnapshot(organizationId: string, days = 30): Promise<ApiResult<SellerSnapshot>> { return request(`admin/operations/sellers/${encodeURIComponent(organizationId)}/snapshot?days=${days}`); }
export function operationWallets(params: OperationQuery = {}): Promise<ApiResult<OperationsList<BuyerWallet>>> { return request(`admin/operations/wallets${operationQuery(params)}`); }
export function operationBuyers(params: { search?: string; status?: string; limit?: number; offset?: number } = {}): Promise<ApiResult<OperationsList<AdminBuyer>>> { return request(`admin/operations/buyers${adminListQuery(params)}`); }
export function operationBuyer(personId: string): Promise<ApiResult<AdminBuyerDetail>> { return request(`admin/operations/buyers/${encodeURIComponent(personId)}`); }
export function operationBuyerInsights(personId: string): Promise<ApiResult<BuyerInsights>> { return request(`admin/operations/buyers/${encodeURIComponent(personId)}/insights`); }
export function reconciliation(params: { type?: string; severity?: string; limit?: number; offset?: number } = {}): Promise<ApiResult<ReconciliationResult>> {
  const query = new URLSearchParams();
  if (params.type) query.set("type", params.type);
  if (params.severity) query.set("severity", params.severity);
  if (params.limit) query.set("limit", String(params.limit));
  if (params.offset) query.set("offset", String(params.offset));
  const suffix = query.toString();
  return request(`admin/reconciliation${suffix ? `?${suffix}` : ""}`);
}
function adminListQuery(params: { search?: string; action?: string; entityType?: string; type?: string; severity?: string; status?: string; sellerType?: string; location?: string; category?: string; days?: number; limit?: number; offset?: number } = {}) {
  const query = new URLSearchParams(); Object.entries(params).forEach(([key, value]) => { if (value !== undefined && value !== "") query.set(key, String(value)); }); const suffix = query.toString(); return suffix ? `?${suffix}` : "";
}
export function auditEvents(params: { search?: string; action?: string; entityType?: string; limit?: number; offset?: number } = {}): Promise<ApiResult<OperationsList<AdminAuditEvent>>> { return request(`admin/audit-events${adminListQuery(params)}`); }
export function alerts(params: { severity?: string; limit?: number; offset?: number } = {}): Promise<ApiResult<AdminSignalResult<AdminAlert>>> { return request(`admin/alerts${adminListQuery(params)}`); }
export function fraudSignals(params: { type?: string; severity?: string; limit?: number; offset?: number } = {}): Promise<ApiResult<AdminSignalResult<AdminSignal>>> { return request(`admin/fraud-signals${adminListQuery(params)}`); }
export function downloadAdminExport(report: "sales" | "sellers" | "products" | "wallets", params: { limit?: number; days?: number } = {}) { return requestDownload(`admin/exports/${report}${adminListQuery(params)}`); }
export function sellerPerformance(params: { days?: number; search?: string; location?: string; sellerType?: string; status?: string; limit?: number; offset?: number } = {}): Promise<ApiResult<OperationsList<SellerPerformance> & { summary?: { organizations: number; days: number } }>> { return request(`admin/performance/sellers${adminListQuery(params)}`); }
export function rewardorPerformance(params: { days?: number; search?: string; status?: string; limit?: number; offset?: number } = {}): Promise<ApiResult<OperationsList<RewardorPerformance> & { summary?: { organizations: number; days: number } }>> { return request(`admin/performance/rewardors${adminListQuery(params)}`); }
export function inventoryAnalytics(params: { days?: number; search?: string; category?: string; location?: string; sellerType?: string; limit?: number; offset?: number } = {}): Promise<ApiResult<InventoryAnalytics>> { return request(`admin/inventory/analytics${adminListQuery(params)}`); }
export function inventoryCategoryDetails(params: { category: string; days?: number; limit?: number; offset?: number }): Promise<ApiResult<InventoryCategoryDetails>> { return request(`admin/inventory/category-details${adminListQuery(params)}`); }
export function freshness(): Promise<ApiResult<FreshnessResult>> { return request("admin/freshness"); }

export const adminApi = {
  adminBootstrap,
  organizations,
  updateOrganization,
  locations,
  createLocation,
  editLocation,
  updateLocation,
  deleteLocation,
  privacyRequests,
  updatePrivacyRequest,
  adminOverview,
  salesAnalytics,
  rewardAnalytics,
  rewardorCampaigns,
  operationsSummary,
  operationProducts,
  operationCategories,
  operationRegisters,
  operationLocations,
  operationSellers,
  sellerSnapshot,
  operationWallets,
  operationBuyers,
  operationBuyer,
  operationBuyerInsights,
  reconciliation,
  auditEvents,
  alerts,
  fraudSignals,
  downloadAdminExport,
  sellerPerformance,
  rewardorPerformance,
  inventoryAnalytics,
  inventoryCategoryDetails,
  freshness,
};
