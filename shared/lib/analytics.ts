import type { AnalyticsGranularity } from "./api/admin";

export const analyticsPeriods = [
  { value: "week", label: "Weekly", days: 84, description: "Last 12 weeks" },
  { value: "month", label: "Monthly", days: 365, description: "Last 12 months" },
  { value: "year", label: "Yearly", days: 1825, description: "Last 5 years" },
] as const satisfies ReadonlyArray<{ value: AnalyticsGranularity; label: string; days: number; description: string }>;

export function analyticsBucketLabel(value: string, granularity: AnalyticsGranularity) {
  if (granularity === "year") return value.slice(0, 4);
  const date = new Date(`${value}T00:00:00`);
  return new Intl.DateTimeFormat("en-IN", granularity === "month" ? { month: "short", year: "numeric" } : { month: "short", day: "numeric" }).format(date);
}
