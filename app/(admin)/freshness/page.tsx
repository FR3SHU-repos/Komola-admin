"use client";

import { useEffect, useState } from "react";
import { Activity, Database, RefreshCw, Server, Wifi } from "lucide-react";
import { ErrorNotice, LoadingState, MetricCard, PageHeader, StatusBadge } from "@/shared/components/AdminPrimitives";
import { freshness, type FreshnessResult, type FreshnessSource } from "@/shared/lib/api/admin";

function number(value: unknown) { return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Number(value || 0)); }
function age(value: number) { if (value < 0) return "No watermark"; if (value < 60) return `${number(value)}s ago`; if (value < 3600) return `${number(value / 60)}m ago`; return `${number(value / 3600)}h ago`; }
function sourceIcon(source: string) { if (source === "postgres_pool") return Database; if (source === "redis_cache") return Wifi; if (source === "outbox") return Server; return Activity; }

export default function FreshnessPage() {
  const [result, setResult] = useState<FreshnessResult | null>(null); const [state, setState] = useState<"loading" | "ready" | "error">("loading"); const [error, setError] = useState("");
  async function load() { setState("loading"); setError(""); const response = await freshness(); if (!response.success || !response.data) { setError(response.message || "Freshness data could not be loaded"); setState("error"); return; } setResult(response.data); setState("ready"); }
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, []);
  const ingestion = result?.sources.find((item) => item.source === "analytics_ingestion"); const outbox = result?.sources.find((item) => item.source === "outbox"); const pool = result?.sources.find((item) => item.source === "postgres_pool");
  return <>
    <PageHeader kicker="Control-plane health" title="Data freshness and pipeline health" description="See whether analytics, event delivery, PostgreSQL, and Redis are live, delayed, partially available, or unavailable." action={<button className="secondary-button" onClick={() => void load()}><RefreshCw size={15} /> Refresh</button>} />
    <div className="notice notice-warning" style={{ marginTop: 24 }}><Activity size={16} /><span>Freshness is a point-in-time operational read. Redis counters are process-local and reset when the API restarts; no secrets or raw payloads are returned.</span></div>
    {state === "loading" && <div className="card" style={{ marginTop: 18 }}><LoadingState label="Checking data pipelines…" /></div>}{state === "error" && <div style={{ marginTop: 18 }}><ErrorNotice message={error} /></div>}{state === "ready" && result && <><div className="metric-grid" style={{ marginTop: 18 }}><MetricCard label="Analytics ingestion" value={ingestion?.status ?? "—"} detail={ingestion ? age(ingestion.lagSeconds) : "Unavailable"} icon={Activity} /><MetricCard label="Pending outbox" value={number(outbox?.metrics.pending)} detail={`${number(outbox?.metrics.stalled)} stalled retries`} icon={Server} /><MetricCard label="DB pool usage" value={`${number((Number(pool?.metrics.acquiredConnections || 0) / Math.max(Number(pool?.metrics.maxConnections || 1), 1)) * 100)}%`} detail={`${number(pool?.metrics.acquiredConnections)} / ${number(pool?.metrics.maxConnections)} acquired`} icon={Database} /></div><section className="card" style={{ marginTop: 18 }}><div className="card-title">Pipeline sources</div><p className="card-description">Generated {new Date(result.generatedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}.</p><div className="table-wrap"><table className="admin-table"><thead><tr><th>Source</th><th>Status</th><th>Freshness</th><th>Detail</th><th>Metrics</th></tr></thead><tbody>{result.sources.map((item: FreshnessSource) => { const Icon = sourceIcon(item.source); return <tr key={item.source}><td><Icon size={15} /> <strong>{item.source.replace(/_/g, " ")}</strong></td><td><StatusBadge value={item.status} /></td><td>{item.lastSuccessAt ? age(item.lagSeconds) : "—"}</td><td>{item.detail}</td><td className="caption">{Object.entries(item.metrics).slice(0, 4).map(([key, value]) => `${key}: ${String(value)}`).join(" · ")}</td></tr>; })}</tbody></table></div></section></>}
  </>;
}
