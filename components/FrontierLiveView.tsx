"use client";

import { useEffect, useState } from "react";
import type { LiveView, OfflineReason } from "@/lib/frontier-live";

const offlineNotes: Record<OfflineReason, string> = {
  not_configured: "The verification machine is not publishing live status at the moment.",
  unreachable: "The verification machine could not be reached.",
  invalid: "The verification machine sent a status this page could not read.",
  stale: "The verification machine has not reported recently.",
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
        if (response.ok && !cancelled) setView((await response.json()) as LiveView);
      } catch {
        // Keep the last view; the next poll retries.
      }
    };
    const timer = window.setInterval(poll, pollIntervalMs);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [pollIntervalMs]);

  const live = view.mode === "live" ? view.status : null;
  const describe = (value: string) => (base ? offset(value, base) : value);
  const pillLabel = live ? `Live: ${live.state}` : "Working offline";

  return (
    <div className="live-panel" aria-live="polite">
      <div className="live-topline">
        <span className={`live-pill ${live ? `is-${live.state}` : "is-offline"}`}>
          <span className="live-dot" aria-hidden="true" />
          {pillLabel}
        </span>
        <span className="live-checked">Last checked {time(view.checkedAt)}</span>
      </div>

      {view.mode === "offline" && (
        <p className="live-note">
          {offlineNotes[view.reason]}
          {view.lastSeen && <> Last report: {new Date(view.lastSeen).toUTCString()}.</>} No live updates are shown;
          the verified tally above is updated each time a checked batch is published.
        </p>
      )}
      {live?.message && <p className="live-note">{live.message}</p>}

      <div className={`live-grid ${live ? "" : "is-placeholder"}`}>
        <div className="live-card">
          <p className="live-label">Current batch</p>
          {live?.current_batch ? (
            <>
              <p className="live-value">Batch {live.current_batch.number}</p>
              <p className="live-sub" title={`[${live.current_batch.start}, ${live.current_batch.end})`}>
                {describe(live.current_batch.start)} to {describe(live.current_batch.end)}
              </p>
              <Meter
                value={live.current_batch.processed}
                max={live.current_batch.width}
                label="Current batch progress"
              />
              <p className="live-sub">
                {group(live.current_batch.processed)} of{" "}
                {group(live.current_batch.width)} integers checked
              </p>
            </>
          ) : (
            <p className="live-value muted">—</p>
          )}
        </div>

        <div className="live-card">
          <p className="live-label">This session</p>
          {live?.session ? (
            <>
              <p className="live-value">
                {group(live.session.completed)} / {group(live.session.requested)}
              </p>
              <Meter value={live.session.completed} max={live.session.requested} label="Session progress" />
              <p className="live-sub">integers requested in the current run</p>
            </>
          ) : (
            <p className="live-value muted">—</p>
          )}
        </div>
      </div>

      <div className={`live-card live-recent ${live ? "" : "is-placeholder"}`}>
        <p className="live-label">Recently finished batches</p>
        {live && live.recent_batches.length > 0 ? (
          <ol className="live-batches">
            {live.recent_batches.map((batch) => (
              <li key={batch.number} title={`[${batch.start}, ${batch.end})`}>
                <span>Batch {batch.number}</span>
                <span>{group(batch.width)} integers</span>
                <span className={`live-batch-status is-${batch.status}`}>{batch.status}</span>
                <span>{time(batch.finished_at)}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="live-sub">Nothing to show while the machine is offline.</p>
        )}
      </div>

      <p className="live-footnote">
        Live status is informational. Only batches that have been verified and published count towards the tally.
      </p>
    </div>
  );
}
