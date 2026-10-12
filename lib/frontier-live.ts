import { z } from "zod";

/**
 * Live status of the local verification machine (see docs/frontier-live-status.md).
 *
 * The optional CEML sidecar publishes to a dedicated public status branch.
 * Live status is informational only: the verified tally comes solely from the
 * published progress record in the research repository.
 */
export const FRONTIER_LIVE_SCHEMA_VERSION = 1 as const;
export const LIVE_STALE_AFTER_MS = 5 * 60 * 1000;
export const LIVE_POLL_INTERVAL_MS = 15 * 1000;
export const DEFAULT_FRONTIER_LIVE_STATUS_URL =
  "https://raw.githubusercontent.com/jfairfaxball-348/CEML/live-status/frontier_live_status.json";

const bigInteger = z.string().regex(/^(0|[1-9][0-9]*)$/);
const timestamp = z.iso.datetime({ offset: true });

export const liveStates = ["running", "idle", "paused", "stopped", "error"] as const;

export const frontierLiveStatusSchema = z
  .object({
    schema_version: z.literal(FRONTIER_LIVE_SCHEMA_VERSION),
    state: z.enum(liveStates),
    updated_at: timestamp,
    message: z.string().max(280).nullable().optional(),
    current_batch: z
      .object({
        number: z.number().int().positive(),
        start: bigInteger,
        end: bigInteger,
        width: z.number().int().positive(),
        processed: z.number().int().min(0),
        started_at: timestamp.nullable().optional(),
      })
      .strict()
      .refine((batch) => batch.processed <= batch.width, { message: "processed exceeds batch width" })
      .nullable()
      .optional(),
    session: z
      .object({
        requested: z.number().int().positive(),
        completed: z.number().int().min(0),
        started_at: timestamp.nullable().optional(),
      })
      .strict()
      .nullable()
      .optional(),
    recent_batches: z
      .array(
        z
          .object({
            number: z.number().int().positive(),
            start: bigInteger,
            end: bigInteger,
            width: z.number().int().positive(),
            status: z.enum(["committed", "verified", "refused"]),
            finished_at: timestamp,
          })
          .strict(),
      )
      .max(20)
      .default([]),
  })
  .strict();

export type FrontierLiveStatus = z.infer<typeof frontierLiveStatusSchema>;

export type OfflineReason = "not_configured" | "unreachable" | "invalid" | "stale";

export type LiveView =
  | { mode: "live"; checkedAt: string; status: FrontierLiveStatus }
  | { mode: "offline"; checkedAt: string; reason: OfflineReason; lastSeen: string | null };

export function resolveLiveView(payload: unknown, now: Date): LiveView {
  const checkedAt = now.toISOString();
  const parsed = frontierLiveStatusSchema.safeParse(payload);
  if (!parsed.success) {
    return { mode: "offline", checkedAt, reason: "invalid", lastSeen: null };
  }

  const age = now.getTime() - Date.parse(parsed.data.updated_at);
  if (age > LIVE_STALE_AFTER_MS) {
    return { mode: "offline", checkedAt, reason: "stale", lastSeen: parsed.data.updated_at };
  }

  return { mode: "live", checkedAt, status: parsed.data };
}

type LiveEnvironment = {
  FRONTIER_LIVE_STATUS_URL?: string;
  FRONTIER_LIVE_STATUS_TOKEN?: string;
};

/** Fetched server-side so the machine's address never reaches the browser. */
export async function getLiveView(
  env: LiveEnvironment = {
    FRONTIER_LIVE_STATUS_URL: process.env.FRONTIER_LIVE_STATUS_URL,
    FRONTIER_LIVE_STATUS_TOKEN: process.env.FRONTIER_LIVE_STATUS_TOKEN,
  },
  now = () => new Date(),
): Promise<LiveView> {
  const configured = env.FRONTIER_LIVE_STATUS_URL;
  const source = configured === undefined ? DEFAULT_FRONTIER_LIVE_STATUS_URL : configured.trim();
  const url = source ? `${source}${source.includes("?") ? "&" : "?"}fresh=${now().getTime()}` : "";
  if (!url) {
    return { mode: "offline", checkedAt: now().toISOString(), reason: "not_configured", lastSeen: null };
  }

  const token = env.FRONTIER_LIVE_STATUS_TOKEN?.trim();
  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) {
      return { mode: "offline", checkedAt: now().toISOString(), reason: "unreachable", lastSeen: null };
    }
    return resolveLiveView(await response.json(), now());
  } catch {
    return { mode: "offline", checkedAt: now().toISOString(), reason: "unreachable", lastSeen: null };
  }
}
