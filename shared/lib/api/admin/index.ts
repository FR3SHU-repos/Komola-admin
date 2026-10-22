export * from "./types";
export * from "./access";
export * from "./analytics";
export * from "./operations";
export * from "./governance";

import { adminBootstrap, createLocation, deleteLocation, editLocation, locations, organizations, privacyRequests, updateLocation, updateOrganization, updatePrivacyRequest } from "./access";
import { adminOverview, rewardAnalytics, salesAnalytics } from "./analytics";
import { alerts, auditEvents, downloadAdminExport, fraudSignals } from "./governance";
import { freshness, inventoryAnalytics, inventoryCategoryDetails, operationBuyer, operationBuyerInsights, operationBuyers, operationCategories, operationLocations, operationProducts, operationRegisters, operationSellers, operationWallets, operationsSummary, reconciliation, rewardorCampaigns, rewardorPerformance, sellerPerformance, sellerSnapshot } from "./operations";

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
