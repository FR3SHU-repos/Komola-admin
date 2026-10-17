"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, RefreshCw, ShieldAlert } from "lucide-react";
import { ErrorNotice, LoadingState, PageHeader, StatusBadge } from "@/shared/components/AdminPrimitives";
import { reconciliation, type ReconciliationIssue, type ReconciliationResult } from "@/shared/lib/api/admin";

const limit = 25;
const types = ["", "sales", "payments", "inventory", "rewards", "outbox"];

function number(value: number) { return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(value || 0); }

export default function ReconciliationPage() {
  const [type, setType] = useState("");
  const [severity, setSeverity] = useState("");
  const [offset, setOffset] = useState(0);
  const [result, setResult] = useState<ReconciliationResult | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");

  async function load(nextOffset = offset) {
    setState("loading");
    setError("");
    const response = await reconciliation({ type, severity, limit, offset: nextOffset });
    if (!response.success || !response.data) {
      setError(response.message || "Reconciliation checks could not be loaded");
      setState("error");
      return;
    }
    setOffset(nextOffset);
    setResult(response.data);
    setState("ready");
  }

  useEffect(() => { void load(0); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const meta = result?.meta;
  const totalPages = meta?.totalPages ?? 0;
  const page = totalPages ? Math.floor((meta?.offset ?? offset) / (meta?.limit ?? limit)) + 1 : 1;

  return <>
    <PageHeader kicker="Control integrity" title="Reconciliation" description="Find mismatches between transactional records, projections, inventory ledgers, reward settlements, and delivery queues." action={<button className="secondary-button" onClick={() => void load(offset)}><RefreshCw size={15} /> Refresh</button>} />
    <div className="notice notice-warning" style={{ marginTop: 24 }}><ShieldAlert size={16} /><span>Read-only checks run through the platform-admin Go API. Reference IDs are operational identifiers; buyer identity and raw payloads are deliberately excluded.</span></div>
    <div className="metric-grid" style={{ marginTop: 18 }}>
      <Metric label="Open checks" value={number(result?.summary.total ?? 0)} detail="All currently detected issues" icon={AlertTriangle} />
      <Metric label="Critical" value={number(result?.summary.critical ?? 0)} detail="Needs investigation first" icon={ShieldAlert} />
      <Metric label="Warnings" value={number(result?.summary.warning ?? 0)} detail="Operational follow-up" icon={AlertTriangle} />
      <Metric label="Status" value={result ? "Checked" : "Pending"} detail="Latest read-only scan" icon={CheckCircle2} />
    </div>
    <section className="card" style={{ marginTop: 18 }}>
      <div className="operations-filters"><select className="select" aria-label="Filter reconciliation type" value={type} onChange={(event) => setType(event.target.value)}><option value="">All check types</option>{types.filter(Boolean).map((item) => <option key={item} value={item}>{item[0].toUpperCase() + item.slice(1)}</option>)}</select><select className="select" aria-label="Filter reconciliation severity" value={severity} onChange={(event) => setSeverity(event.target.value)}><option value="">All severities</option><option value="critical">Critical</option><option value="warning">Warning</option></select><button className="primary-button" onClick={() => void load(0)}>Apply filters</button></div>
      {state === "loading" && <LoadingState label="Running reconciliation checks…" />}
      {state === "error" && <ErrorNotice message={error} />}
      {state === "ready" && result && <>
        {result.items.length ? <div className="table-wrap"><table className="admin-table"><thead><tr><th>Type</th><th>Severity</th><th>Reference</th><th>Finding</th><th>Occurred</th></tr></thead><tbody>{result.items.map((item) => <IssueRow key={`${item.issueType}-${item.referenceId}-${item.occurredAt}`} item={item} />)}</tbody></table></div> : <div className="empty-state" style={{ marginTop: 18 }}>No reconciliation issues match these filters.</div>}
        {totalPages > 1 && <div className="pagination-row"><span className="caption">Page {page} of {totalPages} · {number(meta?.total ?? 0)} checks</span><div className="pagination-actions"><button className="secondary-button" disabled={page <= 1} onClick={() => void load(Math.max(0, offset - limit))}><ChevronLeft size={15} /> Previous</button><button className="secondary-button" disabled={page >= totalPages} onClick={() => void load(offset + limit)}>Next <ChevronRight size={15} /></button></div></div>}
      </>}
    </section>
  </>;
}

function Metric({ label, value, detail, icon: Icon }: { label: string; value: string; detail: string; icon: typeof AlertTriangle }) {
  return <article className="metric-card"><div className="metric-label"><span>{label}</span><span className="metric-icon"><Icon size={16} /></span></div><div className="metric-value">{value}</div><div className="metric-detail">{detail}</div></article>;
}

function IssueRow({ item }: { item: ReconciliationIssue }) {
  return <tr><td><StatusBadge value={item.issueType} /></td><td><StatusBadge value={item.severity} /></td><td><span className="caption">{item.referenceId}</span></td><td>{item.description}</td><td>{new Date(item.occurredAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</td></tr>;
}
