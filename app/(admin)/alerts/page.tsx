"use client";

import { AlertTriangle, RefreshCw, ShieldAlert } from "lucide-react";
import { useCallback, useState } from "react";
import {
  ErrorNotice,
  LoadingState,
  PageHeader,
  StatusBadge,
} from "@/shared/components/AdminPrimitives";
import { useAsyncPage } from "@/shared/hooks/useAsyncPage";
import {
  alerts,
  type AdminAlert,
  type AdminSignalResult,
} from "@/shared/lib/api/admin";

const fallbackMessage = "Alerts could not be loaded";

export default function AlertsPage() {
  const [severity, setSeverity] = useState("");
  const load = useCallback(
    (signal: AbortSignal) => alerts({ severity, limit: 100 }, { signal }),
    [severity],
  );
  const {
    data: result,
    state,
    error,
    refresh,
  } = useAsyncPage<AdminSignalResult<AdminAlert>>(
    load,
    "alerts",
    fallbackMessage,
  );

  return (
    <>
      <PageHeader
        kicker="Operations"
        title="Operational alerts"
        description="Prioritize overdue privacy work, stalled delivery queues, and failed analytics ingestion."
        action={
          <button className="secondary-button" onClick={refresh}>
            <RefreshCw size={15} /> Refresh
          </button>
        }
      />
      <div className="metric-grid" style={{ marginTop: 18 }}>
        <Metric
          label="Open alerts"
          value={result?.summary.total ?? 0}
          icon={AlertTriangle}
        />
        <Metric
          label="Critical"
          value={result?.summary.critical ?? 0}
          icon={ShieldAlert}
        />
        <Metric
          label="Warnings"
          value={result?.summary.warning ?? 0}
          icon={AlertTriangle}
        />
      </div>
      <section className="card" style={{ marginTop: 18 }}>
        <div className="operations-filters">
          <select
            className="select"
            value={severity}
            onChange={(event) => setSeverity(event.target.value)}
          >
            <option value="">All severities</option>
            <option value="critical">Critical</option>
            <option value="warning">Warning</option>
          </select>
          <button className="primary-button" onClick={refresh}>
            Apply filters
          </button>
        </div>
        {state === "loading" && (
          <LoadingState label="Checking operational alerts…" />
        )}
        {state === "error" && <ErrorNotice message={error} />}
        {state === "ready" && result && <AlertTable result={result} />}
      </section>
    </>
  );
}

function AlertTable({ result }: { result: AdminSignalResult<AdminAlert> }) {
  if (!result.items.length)
    return (
      <div className="empty-state">
        No operational alerts match these filters.
      </div>
    );
  return (
    <div className="table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Severity</th>
            <th>Alert</th>
            <th>Description</th>
            <th>Reference</th>
            <th>When</th>
          </tr>
        </thead>
        <tbody>
          {result.items.map((item) => (
            <tr key={`${item.alertType}-${item.referenceId}`}>
              <td>
                <StatusBadge value={item.severity} />
              </td>
              <td>
                <strong>{item.title}</strong>
                <div className="caption">{item.alertType}</div>
              </td>
              <td>{item.description}</td>
              <td className="caption">{item.referenceId}</td>
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

function Metric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof AlertTriangle;
}) {
  return (
    <article className="metric-card">
      <div className="metric-label">
        <span>{label}</span>
        <span className="metric-icon">
          <Icon size={16} />
        </span>
      </div>
      <div className="metric-value">{value.toLocaleString("en-IN")}</div>
      <div className="metric-detail">Current read-only scan</div>
    </article>
  );
}
