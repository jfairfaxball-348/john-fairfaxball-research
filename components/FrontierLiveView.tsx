"use client";

import { useEffect, useState } from "react";
import type { LiveView, OfflineReason } from "@/lib/frontier-live";
import { retainLatestReport } from "@/lib/frontier-live-display";

const offlineNotes: Record<OfflineReason, string> = {
  not_configured: "The verification machine is not publishing live status at the moment.",
  unreachable: "The latest live update could not be fetched.",
  invalid: "The verification machine sent a status this page could not read.",
  stale: "Live updates are delayed. This does not establish whether the verification machine is online.",
};

/** Groups digits in threes with thin spaces, matching the tally above. */
function group(value: number | bigint) {
  return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, "\u202f");
}

function offset(value: string, base: string) {
  return `B + ${group(BigInt(value) - BigInt(base))}`;
}

function time(value: string) {
  const formatted = new Date(value).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "UTC",
  });
  return `${formatted} UTC`;
}

function Meter({ value, max, label }: { value: number; max: number; label: string }) {
  const percent = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div
      className="meter"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
    >
      <span style={{ width: `${percent}%` }} />
    </div>
  );
}

export function FrontierLiveView({
  initialView,
  base,
  pollIntervalMs,
}: {
  initialView: LiveView;
  base: string | null;
  pollIntervalMs: number;
}) {
  const [view, setView] = useState(initialView);

  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      if (document.hidden) return;
      try {
        const response = await fetch("/api/frontier/live", { cache: "no-store" });
        if (response.ok && !cancelled) {
          const incoming = (await response.json()) as LiveView;
          setView((previous) => retainLatestReport(previous, incoming));
        } else if (!cancelled) {
          setView((previous) => retainLatestReport(previous, { mode: "offline", checkedAt: new Date().toISOString(), reason: "unreachable", lastSeen: null }));
        }
      } catch {
        if (!cancelled) setView((previous) => retainLatestReport(previous, { mode: "offline", checkedAt: new Date().toISOString(), reason: "unreachable", lastSeen: null }));
      }
    };
    const timer = window.setInterval(poll, pollIntervalMs);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [pollIntervalMs]);

  const report = view.status;
  const latest = report?.recent_batches.reduce<(typeof report.recent_batches)[number] | undefined>(
    (best, batch) => batch.status !== "refused" && (!best || batch.number > best.number) ? batch : best, undefined);
  const describe = (value: string) => (base ? offset(value, base) : value);
  const pillLabel = view.mode === "live" ? `Live: ${view.status.state}` : report ? "Updates delayed" : "Live updates unavailable";

  return (
    <div className="live-panel" aria-live="polite">
      <div className="live-topline">
        <span className={`live-pill ${view.mode === "live" ? `is-${view.status.state}` : "is-offline"}`}>
          <span className="live-dot" aria-hidden="true" />
          {pillLabel}
        </span>
        <span className="live-checked">Last checked {time(view.checkedAt)}</span>
      </div>

      {view.mode === "offline" && (
        <p className="live-note">
          {offlineNotes[view.reason]}
          {view.lastSeen && <> Last report: {new Date(view.lastSeen).toUTCString()}.</>} The last reported details remain below;
          the verified tally above changes after separate verified publication.
        </p>
      )}
      {view.mode === "live" && report?.message && <p className="live-note">{report.message}</p>}

      <div className={`live-grid ${report ? "" : "is-placeholder"}`}>
        <div className="live-card">
          <p className="live-label">Latest batch checked</p>
          {latest ? (
            <>
              <p className="live-value">Batch {latest.number}</p>
              <p className="live-sub" title={`[${latest.start}, ${latest.end})`}>
                {describe(latest.start)} to {describe(latest.end)}
              </p>
              <p className="live-sub">
                {group(latest.width)} integers · {time(latest.finished_at)}
              </p>
            </>
          ) : (
            <p className="live-value muted">—</p>
          )}
        </div>

        <div className="live-card">
          <p className="live-label">This session</p>
          {report?.session ? (
            <>
              <p className="live-value">
                {group(report.session.completed)} / {group(report.session.requested)}
              </p>
              <Meter value={report.session.completed} max={report.session.requested} label="Session progress" />
              <p className="live-sub">integers requested in the current run</p>
            </>
          ) : (
            <p className="live-value muted">—</p>
          )}
        </div>
      </div>

      <p className="live-footnote">
        Live status is informational. Only batches that have been verified and published count towards the tally.
      </p>
    </div>
  );
}
