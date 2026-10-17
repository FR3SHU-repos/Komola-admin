import type { LucideIcon } from "lucide-react";

export function PageHeader({ kicker, title, description, action }: { kicker: string; title: string; description: string; action?: React.ReactNode }) {
  return <div className="page-heading-row"><div><div className="page-kicker">{kicker}</div><h1 className="page-title">{title}</h1><p className="page-description">{description}</p></div>{action ? <div className="page-actions">{action}</div> : null}</div>;
}

export function MetricCard({ label, value, detail, icon: Icon }: { label: string; value: string | number; detail: string; icon: LucideIcon }) {
  return <article className="metric-card"><div className="metric-label"><span>{label}</span><span className="metric-icon"><Icon size={16} /></span></div><div className="metric-value">{value}</div><div className="metric-detail">{detail}</div></article>;
}

export function StatusBadge({ value }: { value: string | undefined }) {
  const normalized = (value ?? "unknown").toLowerCase().replace(/_/g, "-");
  return <span className={`status-badge status-${normalized}`}>{value?.replace(/_/g, " ") ?? "Unknown"}</span>;
}

export function LoadingState({ label = "Loading platform data…" }: { label?: string }) {
  return <div className="empty-state"><div><span className="loading-line" /><p>{label}</p></div></div>;
}

export function ErrorNotice({ message }: { message: string }) {
  return <div className="notice notice-danger" role="alert">{message}</div>;
}

export function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? "—" : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
