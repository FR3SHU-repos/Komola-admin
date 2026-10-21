"use client";

import { RefreshCw, ShieldAlert } from "lucide-react";
import { useCallback } from "react";
import {
  ErrorNotice,
  LoadingState,
  PageHeader,
  StatusBadge,
} from "@/shared/components/AdminPrimitives";
import { useAsyncPage } from "@/shared/hooks/useAsyncPage";
import {
  fraudSignals,
  type AdminSignal,
  type AdminSignalResult,
} from "@/shared/lib/api/admin";

const fallbackMessage = "Fraud signals could not be loaded";

export default function FraudPage() {
  const load = useCallback(
    (signal: AbortSignal) => fraudSignals({ limit: 100 }, { signal }),
    [],
  );
  const {
    data: result,
    state,
    error,
    refresh,
  } = useAsyncPage<AdminSignalResult<AdminSignal>>(
    load,
    "fraud-signals",
    fallbackMessage,
  );

  return (
    <>
      <PageHeader
        kicker="Trust and safety"
        title="Fraud and abuse signals"
        description="Investigate unusual patterns; these are review signals, not automatic findings of fraud."
        action={
          <button className="secondary-button" onClick={refresh}>
            <RefreshCw size={15} /> Refresh
          </button>
        }
      />
      <div className="notice notice-warning" style={{ marginTop: 24 }}>
        <ShieldAlert size={16} />
        <span>
          Signals use aggregate seller, referral, sale, and campaign activity.
          Buyer identity and contact details are not shown.
        </span>
      </div>
      <div className="metric-grid" style={{ marginTop: 18 }}>
        <Metric label="Signals" value={result?.summary.total ?? 0} />
        <Metric label="Critical" value={result?.summary.critical ?? 0} />
        <Metric label="Warnings" value={result?.summary.warning ?? 0} />
      </div>
      <section className="card" style={{ marginTop: 18 }}>
        {state === "loading" && (
          <LoadingState label="Scanning abuse indicators…" />
        )}
        {state === "error" && <ErrorNotice message={error} />}
        {state === "ready" && result && <SignalTable result={result} />}
      </section>
    </>
  );
}

function SignalTable({ result }: { result: AdminSignalResult<AdminSignal> }) {
  if (!result.items.length)
    return <div className="empty-state">No review signals detected.</div>;
  return (
    <div className="table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Severity</th>
            <th>Signal</th>
            <th>Subject</th>
            <th>Review reason</th>
            <th>When</th>
          </tr>
        </thead>
        <tbody>
          {result.items.map((item) => (
            <tr key={`${item.signalType}-${item.referenceId}`}>
              <td>
                <StatusBadge value={item.severity} />
              </td>
              <td>{item.signalType.replace(/_/g, " ")}</td>
              <td>
                <strong>{item.subject}</strong>
                <div className="caption">{item.referenceId}</div>
              </td>
              <td>{item.description}</td>
              <td>
                {new Date(item.occurredAt).toLocaleString("en-IN", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <article className="metric-card">
      <div className="metric-label">
        <span>{label}</span>
        <span className="metric-icon">
          <ShieldAlert size={16} />
        </span>
      </div>
      <div className="metric-value">{value.toLocaleString("en-IN")}</div>
      <div className="metric-detail">Current read-only scan</div>
    </article>
  );
}
