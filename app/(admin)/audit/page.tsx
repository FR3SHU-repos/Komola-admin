"use client";

import { FileClock, RefreshCw } from "lucide-react";
import { useCallback } from "react";
import { ErrorNotice, LoadingState, PageHeader } from "@/shared/components/AdminPrimitives";
import { useAsyncPage } from "@/shared/hooks/useAsyncPage";
import { auditEvents, type AdminAuditEvent, type OperationsList } from "@/shared/lib/api/admin";

export default function AuditPage() {
  const load = useCallback((signal: AbortSignal) => auditEvents({ limit: 100 }, { signal }), []);
  const { data: result, state, error, refresh } = useAsyncPage<OperationsList<AdminAuditEvent>>(load, "audit-events", "Audit log could not be loaded");

  return (
    <>
      <PageHeader kicker="Governance" title="Admin audit log" description="Review platform actions recorded by the Go API without exposing raw before/after payloads." action={<button className="secondary-button" onClick={refresh}><RefreshCw size={15} /> Refresh</button>} />
      <div className="notice notice-warning" style={{ marginTop: 24 }}><FileClock size={16} /><span>Read-only operational trail. Sensitive identity access is recorded separately and values are intentionally minimized.</span></div>
      <section className="card" style={{ marginTop: 18 }}>
        {state === "loading" && <LoadingState label="Loading audit events…" />}
        {state === "error" && <ErrorNotice message={error} />}
        {state === "ready" && result && <AuditTable result={result} />}
      </section>
    </>
  );
}

function AuditTable({ result }: { result: OperationsList<AdminAuditEvent> }) {
  if (!result.items.length) return <div className="empty-state">No audit events found.</div>;
  return <div className="table-wrap"><table className="admin-table"><thead><tr><th>When</th><th>Actor</th><th>Action</th><th>Entity</th><th>Organization</th><th>Request</th></tr></thead><tbody>{result.items.map((item) => <tr key={item.id}><td>{new Date(item.occurredAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</td><td>{item.actor}</td><td>{item.action}</td><td><strong>{item.entityType}</strong><div className="caption">{item.entityId}</div></td><td>{item.organization}</td><td className="caption">{item.requestId || "—"}</td></tr>)}</tbody></table></div>;
}
