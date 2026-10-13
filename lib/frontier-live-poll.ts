import type { LiveView } from "./frontier-live.ts";

/** One bounded request at a time, with no state updates after disposal. */
export function createLivePoller({
  visible, publish, fetchView, timeoutMs = 10_000,
}: {
  visible: () => boolean;
  publish: (view: LiveView) => void;
  fetchView: (signal: AbortSignal) => Promise<LiveView>;
  timeoutMs?: number;
}) {
  let disposed = false;
  let controller: AbortController | null = null;
  const unavailable = (): LiveView => ({ mode: "offline", checkedAt: new Date().toISOString(), reason: "unreachable", lastSeen: null });
  return {
    async poll() {
      if (disposed) return;
      // Tick freshness even while hidden or waiting on a request.
      publish(unavailable());
      if (!visible() || controller) return;
      controller = new AbortController();
      const request = controller;
      const timer = setTimeout(() => request.abort(), timeoutMs);
      try {
        const incoming = await fetchView(request.signal);
        if (!disposed && !request.signal.aborted) publish(incoming);
      } catch {
        if (!disposed) publish(unavailable());
      } finally {
        clearTimeout(timer);
        controller = null;
      }
    },
    dispose() {
      disposed = true;
      controller?.abort();
    },
  };
}
