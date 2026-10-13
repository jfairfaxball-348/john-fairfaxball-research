import assert from "node:assert/strict";
import test from "node:test";
import { resolveLiveView, getLiveView, LIVE_STALE_AFTER_MS, DEFAULT_FRONTIER_LIVE_STATUS_URL } from "./frontier-live.ts";
import { decodeFrontierProgressResponse, groupDigits } from "./frontier-progress.ts";
import { retainLatestReport } from "./frontier-live-display.ts";
import { createLivePoller } from "./frontier-live-poll.ts";
import { decodeLiveView } from "./frontier-live.ts";

const base = "2392518188130438742016";

function progress(overrides: Record<string, unknown> = {}) {
  return {
    schema_version: 1,
    title: "Collatz frontier verification",
    protocol: "CEML-FRONTIER-2",
    run_id: "RUN1-example",
    updated: "2026-10-12",
    repository_url: "https://github.com/example/repo",
    record_url: "https://github.com/example/repo/blob/main/record.md",
    base: {
      value: base,
      kind: "operational",
      description: "Example base.",
      source_url: "https://example.org/",
      source_generated_at: "2026-10-11T11:29:26Z",
      observed_at: "2026-10-11T12:38:06Z",
    },
    peer_reviewed_bound: { value: "2361183241434822606848", label: "2^71", citation: "Example (2025)" },
    coverage: { start: base, end: "2392518188130438743600", integers: "1584" },
    unresolved: 0,
    genesis_digest: "a".repeat(64),
    latest_certificate_digest: "c".repeat(64),
    rule_counts: { E2: 792, EXPLICIT: 792 },
    batches: [
      { number: 1, start: base, end: "2392518188130438742160", width: 144, certificate_digest: "b".repeat(64) },
      {
        number: 2,
        start: "2392518188130438742160",
        end: "2392518188130438743600",
        width: 1440,
        certificate_digest: "c".repeat(64),
      },
    ],
    claim: "Example conditional claim.",
    ...overrides,
  };
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

test("accepts a valid contiguous progress record", async () => {
  const result = await decodeFrontierProgressResponse(json(progress()));
  assert.equal(result.kind, "ok");
});

test("reports a missing progress file", async () => {
  const result = await decodeFrontierProgressResponse(new Response("Not found", { status: 404 }));
  assert.equal(result.kind, "missing");
});

test("rejects invalid JSON", async () => {
  const result = await decodeFrontierProgressResponse(new Response("{", { status: 200 }));
  assert.equal(result.kind, "invalid");
});

test("rejects a gap between batches", async () => {
  const record = progress();
  record.batches[1].start = "2392518188130438742161";
  record.batches[1].width = 1439;
  const result = await decodeFrontierProgressResponse(json(record));
  assert.equal(result.kind, "invalid");
});

test("rejects a coverage count that disagrees with the interval", async () => {
  const result = await decodeFrontierProgressResponse(
    json(progress({ coverage: { start: base, end: "2392518188130438743600", integers: "1585" } })),
  );
  assert.equal(result.kind, "invalid");
});

test("groups large integers without losing precision", () => {
  assert.equal(groupDigits("2392518188130438742016"), "2 392 518 188 130 438 742 016");
  assert.equal(groupDigits(144), "144");
});

const now = new Date("2026-10-12T12:00:00Z");
const liveStatus = {
  schema_version: 1,
  state: "running",
  updated_at: "2026-10-12T11:59:50Z",
  current_batch: { number: 18, start: "2392518188130438958000", end: "2392518188130438972400", width: 14400, processed: 7200 },
  session: { requested: 100000, completed: 7200 },
  recent_batches: [],
};

test("shows a fresh valid live status", () => {
  assert.equal(resolveLiveView(liveStatus, now).mode, "live");
});

test("accepts continuous session progress without an invented target", () => {
  const view = resolveLiveView({ ...liveStatus, session: { requested: null, completed: 9999, mode: "continuous" } }, now);
  assert.equal(view.mode, "live");
  assert.equal(view.status?.session?.requested, null);
  assert.equal(view.status?.session?.completed, 9999);
});

test("treats a stale live status as offline", () => {
  const old = new Date(now.getTime() - LIVE_STALE_AFTER_MS - 1000).toISOString();
  const view = resolveLiveView({ ...liveStatus, updated_at: old }, now);
  assert.equal(view.mode, "offline");
  assert.equal(view.mode === "offline" && view.reason, "stale");
  assert.equal(view.status?.updated_at, old);
});

test("retains a fresh report through a transient failed poll", () => {
  const previous = resolveLiveView(liveStatus, now);
  const incoming = { mode: "offline" as const, checkedAt: now.toISOString(), reason: "unreachable" as const, lastSeen: null };
  const result = retainLatestReport(previous, incoming);
  assert.equal(result.mode, "live");
  assert.deepEqual(result.status, previous.status);
});

test("does not extend freshness when polls keep failing", () => {
  const previous = resolveLiveView(liveStatus, now);
  const later = new Date(now.getTime() + LIVE_STALE_AFTER_MS).toISOString();
  const result = retainLatestReport(previous, { mode: "offline", checkedAt: later, reason: "unreachable", lastSeen: null });
  assert.equal(result.mode, "offline");
  assert.equal(result.status?.updated_at, liveStatus.updated_at);
});

test("an older source response does not erase the latest batch or session", () => {
  const previous = resolveLiveView(liveStatus, now);
  const older = resolveLiveView({ ...liveStatus, updated_at: "2026-10-12T11:59:00Z", session: null }, now);
  const result = retainLatestReport(previous, older);
  assert.deepEqual(result.status?.session, liveStatus.session);
  assert.equal(result.status?.updated_at, liveStatus.updated_at);
});

test("explicitly disabling the live source is respected", () => {
  const previous = resolveLiveView(liveStatus, now);
  const result = retainLatestReport(previous, { mode: "offline", checkedAt: now.toISOString(), reason: "not_configured", lastSeen: null });
  assert.equal(result.mode, "offline");
});

test("treats a malformed live status as offline", () => {
  const view = resolveLiveView({ ...liveStatus, state: "exploding" }, now);
  assert.equal(view.mode === "offline" && view.reason, "invalid");
});

test("is offline when no live source is configured", async () => {
  const view = await getLiveView({ FRONTIER_LIVE_STATUS_URL: " " }, () => now);
  assert.equal(view.mode === "offline" && view.reason, "not_configured");
});

test("reads the public CEML live branch by default without a token", async () => {
  const original = globalThis.fetch;
  let requested = "";
  let authorization: string | null = null;
  let caching: RequestCache | undefined;
  globalThis.fetch = async (input, init) => {
    requested = String(input);
    authorization = new Headers(init?.headers).get("Authorization");
    caching = init?.cache;
    return new Response(JSON.stringify(liveStatus), { status: 200 });
  };
  try {
    const view = await getLiveView({}, () => now);
    assert.equal(view.mode, "live");
    assert.equal(requested, `${DEFAULT_FRONTIER_LIVE_STATUS_URL}?fresh=${now.getTime()}`);
    assert.equal(authorization, null);
    assert.equal(caching, "no-store");
  } finally {
    globalThis.fetch = original;
  }
});

test("rejects a future heartbeat rather than letting it remain fresh indefinitely", () => {
  const view = resolveLiveView({ ...liveStatus, updated_at: new Date(now.getTime() + 60_000).toISOString() }, now);
  assert.equal(view.mode === "offline" && view.reason, "invalid");
});

test("late cached live responses cannot reset stale status or last checked time", () => {
  const previous = resolveLiveView(liveStatus, now);
  const later = new Date(now.getTime() + LIVE_STALE_AFTER_MS + 1_000).toISOString();
  const stale = retainLatestReport(previous, { mode: "offline", checkedAt: later, reason: "unreachable", lastSeen: null });
  const result = retainLatestReport(stale, previous);
  assert.equal(result.mode, "offline");
  assert.equal(result.checkedAt, later);
  assert.equal(result.status?.updated_at, liveStatus.updated_at);
});

test("client receipt time expires an otherwise live cached response", () => {
  const previous = resolveLiveView(liveStatus, now);
  const later = new Date(now.getTime() + LIVE_STALE_AFTER_MS + 1_000).toISOString();
  assert.equal(retainLatestReport(previous, previous, later).mode, "offline");
});

test("malformed API envelopes are rejected before reaching the UI", () => {
  assert.throws(() => decodeLiveView({ mode: "live", checkedAt: "bad", status: liveStatus }));
  assert.throws(() => decodeLiveView({ hello: "world" }));
  assert.equal(decodeLiveView(resolveLiveView(liveStatus, now)).mode, "live");
});

test("only one browser poll runs at a time, and disposal prevents late updates", async () => {
  const updates: unknown[] = [];
  let calls = 0;
  let signal: AbortSignal | null = null;
  let finish!: (view: ReturnType<typeof resolveLiveView>) => void;
  const poller = createLivePoller({ visible: () => true, publish: (value) => updates.push(value), fetchView: async (value) => {
    calls++; signal = value;
    return await new Promise((resolve) => { finish = resolve; });
  } });
  const first = poller.poll();
  await poller.poll();
  assert.equal(calls, 1);
  const before = updates.length;
  poller.dispose();
  assert.equal((signal as AbortSignal | null)?.aborted, true);
  finish(resolveLiveView(liveStatus, now));
  await first;
  assert.equal(updates.length, before);
});

test("a hidden browser tab still expires freshness but makes no fetch", async () => {
  let checks = 0;
  const poller = createLivePoller({ visible: () => false, tick: () => checks++, publish: () => { throw new Error("no network failure was observed"); }, fetchView: async () => { throw new Error("should not fetch"); } });
  await poller.poll();
  assert.equal(checks, 1);
  poller.dispose();
});

test("a freshness tick never invents a network error while awaiting a successful request", async () => {
  const reports: string[] = [];
  let ticks = 0;
  const poller = createLivePoller({ visible: () => true, tick: () => ticks++, publish: (view) => reports.push(view.mode), fetchView: async () => resolveLiveView(liveStatus, now) });
  await poller.poll();
  assert.equal(ticks, 1);
  assert.deepEqual(reports, ["live"]);
  poller.dispose();
});

test("hung requests abort and a later poll can recover", async () => {
  let calls = 0;
  const poller = createLivePoller({ timeoutMs: 5, visible: () => true, publish: () => {}, fetchView: async (signal) => {
    calls++;
    if (calls > 1) return resolveLiveView(liveStatus, now);
    return await new Promise((_, reject) => signal.addEventListener("abort", () => reject(new Error("timeout")), { once: true }));
  } });
  await poller.poll();
  await poller.poll();
  assert.equal(calls, 2);
  poller.dispose();
});
