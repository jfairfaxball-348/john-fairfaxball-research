import type { LiveView } from "./frontier-live.ts";
import { LIVE_STALE_AFTER_MS } from "./frontier-live.ts";

/** Keep last reported details through a failed poll, without extending freshness. */
export function retainLatestReport(previous: LiveView, incoming: LiveView, observedAt = incoming.checkedAt): LiveView {
  const checkedAt = new Date(Math.max(Date.parse(previous.checkedAt), Date.parse(incoming.checkedAt), Date.parse(observedAt))).toISOString();
  const previousStatus = previous.status;
  const incomingStatus = incoming.status;
  const status = previousStatus && (!incomingStatus || Date.parse(previousStatus.updated_at) > Date.parse(incomingStatus.updated_at))
    ? previousStatus : incomingStatus;
  if (!status) return { ...incoming, checkedAt };
  const age = Date.parse(checkedAt) - Date.parse(status.updated_at);
  if (!(incoming.mode === "offline" && incoming.reason === "not_configured") && age <= LIVE_STALE_AFTER_MS && age >= -30_000) {
    return { mode: "live", checkedAt, status };
  }
  return { mode: "offline", checkedAt, reason: incoming.mode === "offline" ? incoming.reason : "stale", lastSeen: status.updated_at, status };
}
