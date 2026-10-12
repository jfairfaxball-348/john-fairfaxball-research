import assert from "node:assert/strict";
import test from "node:test";
import { resolveLiveView, getLiveView, LIVE_STALE_AFTER_MS } from "./frontier-live.ts";
import { decodeFrontierProgressResponse, groupDigits } from "./frontier-progress.ts";

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

test("treats a stale live status as offline", () => {
  const old = new Date(now.getTime() - LIVE_STALE_AFTER_MS - 1000).toISOString();
  const view = resolveLiveView({ ...liveStatus, updated_at: old }, now);
  assert.equal(view.mode, "offline");
  assert.equal(view.mode === "offline" && view.reason, "stale");
});

test("treats a malformed live status as offline", () => {
  const view = resolveLiveView({ ...liveStatus, state: "exploding" }, now);
  assert.equal(view.mode === "offline" && view.reason, "invalid");
});

test("is offline when no live source is configured", async () => {
  const view = await getLiveView({ FRONTIER_LIVE_STATUS_URL: " " }, () => now);
  assert.equal(view.mode === "offline" && view.reason, "not_configured");
});
