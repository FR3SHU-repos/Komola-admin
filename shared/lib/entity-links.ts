export function sellerSnapshotHref(organizationId: string) {
  return `/organizations/seller-${encodeURIComponent(organizationId)}`;
}

export function categoryDetailHref(categorySlug: string, days?: number) {
  const query = days ? `?days=${days}` : "";
  return `/inventory/categories/${encodeURIComponent(categorySlug)}${query}`;
}

export function buyerCategoryHref(personId: string, category: string) {
  return `/buyers/${encodeURIComponent(personId)}/footprint/categories?category=${encodeURIComponent(category)}`;
}
