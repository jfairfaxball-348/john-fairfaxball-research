"use client";

import { useEffect, useState } from "react";
import type { LiveView, OfflineReason } from "@/lib/frontier-live";
import { decodeLiveView } from "@/lib/frontier-live";
import { retainLatestReport } from "@/lib/frontier-live-display";
import { createLivePoller } from "@/lib/frontier-live-poll";

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
    const poller = createLivePoller({
      visible: () => !document.hidden,
      tick: () => setView((previous) => {
        if (!previous.status || previous.mode === "offline" && previous.reason === "not_configured") return previous;
        return retainLatestReport(previous, { mode: "offline", checkedAt: new Date().toISOString(), reason: "stale", lastSeen: previous.status.updated_at });
      }),
      publish: (incoming) => setView((previous) => retainLatestReport(previous, incoming, new Date().toISOString())),
      fetchView: async (signal) => {
        const response = await fetch(`/api/frontier/live?fresh=${Date.now()}`, { cache: "no-store", signal });
        if (!response.ok) throw new Error("Live feed unavailable");
        return decodeLiveView(await response.json());
      },
    });
    const refresh = () => { void poller.poll(); };
    refresh();
    const timer = window.setInterval(refresh, pollIntervalMs);
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("focus", refresh);
    window.addEventListener("online", refresh);
    return () => {
      poller.dispose();
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("online", refresh);
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
                {group(report.session.completed)}
              </p>
              <p className="live-sub">integers checked this session</p>
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
