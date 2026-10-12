import type { LiveView } from "./frontier-live.ts";

/** Keep last reported details through a failed poll, without extending freshness. */
export function retainLatestReport(previous: LiveView, incoming: LiveView): LiveView {
  const previousStatus = previous.status;
  const incomingStatus = incoming.status;
  const status = previousStatus && (!incomingStatus || Date.parse(previousStatus.updated_at) > Date.parse(incomingStatus.updated_at))
    ? previousStatus : incomingStatus;
  if (!status) return incoming;
  if (incoming.mode === "live") return { ...incoming, status };
  if (incoming.reason !== "not_configured" && Date.parse(incoming.checkedAt) - Date.parse(status.updated_at) <= 5 * 60 * 1000) {
    return { mode: "live", checkedAt: incoming.checkedAt, status };
  }
  return { ...incoming, lastSeen: status.updated_at, status };
}
