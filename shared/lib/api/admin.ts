import { request, type ApiResult } from "./client";

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

function operationQuery(params: { search?: string; category?: string; limit?: number; offset?: number; days?: number } = {}) {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.category) query.set("category", params.category);
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
export function adminOverview(days = 30): Promise<ApiResult<AdminOverview>> { return request(`admin/overview?days=${days}`); }
export function salesAnalytics(days = 30): Promise<ApiResult<SalesAnalytics>> { return request(`admin/analytics/sales?days=${days}`); }
export function rewardAnalytics(days = 30): Promise<ApiResult<RewardAnalytics>> { return request(`admin/analytics/rewards?days=${days}`); }
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
export function operationProducts(params: { search?: string; category?: string; limit?: number; offset?: number } = {}): Promise<ApiResult<OperationsList<ListedProduct> & { category?: string }>> { return request(`admin/operations/products${operationQuery(params)}`); }
export function operationRegisters(params: { search?: string; limit?: number; offset?: number } = {}): Promise<ApiResult<OperationsList<AdminRegister>>> { return request(`admin/operations/registers${operationQuery(params)}`); }
export function operationLocations(params: { search?: string; limit?: number; offset?: number } = {}): Promise<ApiResult<OperationsList<AdminBusinessLocation>>> { return request(`admin/operations/locations${operationQuery(params)}`); }
export function operationSellers(params: { search?: string; limit?: number; offset?: number; days?: number } = {}): Promise<ApiResult<OperationsList<AdminSeller>>> { return request(`admin/operations/sellers${operationQuery(params)}`); }
export function operationWallets(params: { search?: string; limit?: number; offset?: number } = {}): Promise<ApiResult<OperationsList<BuyerWallet>>> { return request(`admin/operations/wallets${operationQuery(params)}`); }

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
  operationWallets,
};
