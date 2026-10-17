"use client";
import { useEffect, useState } from "react";
import { FileClock, RefreshCw } from "lucide-react";
import { ErrorNotice, LoadingState, PageHeader } from "@/shared/components/AdminPrimitives";
import { auditEvents, type AdminAuditEvent, type OperationsList } from "@/shared/lib/api/admin";
export default function AuditPage() {
  const [result, setResult] = useState<OperationsList<AdminAuditEvent> | null>(null); const [state, setState] = useState<"loading" | "ready" | "error">("loading"); const [error, setError] = useState("");
  async function load() { setState("loading"); const response = await auditEvents({ limit: 100 }); if (!response.success || !response.data) { setError(response.message || "Audit log could not be loaded"); setState("error"); return; } setResult(response.data); setState("ready"); }
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, []);
  return <><PageHeader kicker="Governance" title="Admin audit log" description="Review platform actions recorded by the Go API without exposing raw before/after payloads." action={<button className="secondary-button" onClick={() => void load()}><RefreshCw size={15} /> Refresh</button>} /><div className="notice notice-warning" style={{ marginTop: 24 }}><FileClock size={16} /><span>Read-only operational trail. Sensitive identity access is recorded separately and values are intentionally minimized.</span></div><section className="card" style={{ marginTop: 18 }}>{state === "loading" && <LoadingState label="Loading audit events…" />}{state === "error" && <ErrorNotice message={error} />}{state === "ready" && result && (result.items.length ? <div className="table-wrap"><table className="admin-table"><thead><tr><th>When</th><th>Actor</th><th>Action</th><th>Entity</th><th>Organization</th><th>Request</th></tr></thead><tbody>{result.items.map((item) => <tr key={item.id}><td>{new Date(item.occurredAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</td><td>{item.actor}</td><td>{item.action}</td><td><strong>{item.entityType}</strong><div className="caption">{item.entityId}</div></td><td>{item.organization}</td><td className="caption">{item.requestId || "—"}</td></tr>)}</tbody></table></div> : <div className="empty-state">No audit events found.</div>)}</section></>;
}
