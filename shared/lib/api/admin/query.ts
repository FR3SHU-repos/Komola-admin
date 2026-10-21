export function operationQuery(params: { search?: string; category?: string; location?: string; sellerType?: string; status?: string; limit?: number; offset?: number; days?: number } = {}) {
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

export function adminListQuery(params: Record<string, string | number | undefined> = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => { if (value !== undefined && value !== "") query.set(key, String(value)); });
  const value = query.toString();
  return value ? `?${value}` : "";
}
