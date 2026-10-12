import { z } from "zod";

export const FRONTIER_PROGRESS_FILENAME = "frontier_progress_for_website.json";
export const FRONTIER_PROGRESS_SCHEMA_VERSION = 1 as const;

export const frontierProgressSource = {
  repository: "jfairfaxball-348/CEML",
  ref: "main",
} as const;

// Integers in the verified range exceed Number.MAX_SAFE_INTEGER, so they are decimal strings.
const bigInteger = z.string().regex(/^(0|[1-9][0-9]*)$/);
const digest = z.string().regex(/^[0-9a-f]{64}$/);

const batchSchema = z
  .object({
    number: z.number().int().positive(),
    start: bigInteger,
    end: bigInteger,
    width: z.number().int().positive(),
    certificate_digest: digest,
  })
  .strict();

export const frontierProgressSchema = z
  .object({
    schema_version: z.literal(FRONTIER_PROGRESS_SCHEMA_VERSION),
    title: z.string().min(1),
    protocol: z.string().min(1),
    run_id: z.string().min(1),
    updated: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    repository_url: z.url(),
    record_url: z.url(),
    base: z
      .object({
        value: bigInteger,
        kind: z.string().min(1),
        description: z.string().min(1),
        source_url: z.url(),
        source_generated_at: z.string().min(1),
        observed_at: z.string().min(1),
      })
      .strict(),
    peer_reviewed_bound: z
      .object({
        value: bigInteger,
        label: z.string().min(1),
        citation: z.string().min(1),
      })
      .strict(),
    coverage: z.object({ start: bigInteger, end: bigInteger, integers: bigInteger }).strict(),
    unresolved: z.number().int().min(0),
    genesis_digest: digest,
    latest_certificate_digest: digest,
    rule_counts: z.record(z.string().min(1), z.number().int().min(0)),
    batches: z.array(batchSchema).min(1),
    claim: z.string().min(1),
  })
  .strict()
  .superRefine((data, ctx) => {
    const fail = (message: string) => ctx.addIssue({ code: "custom", message });
    const { batches, coverage } = data;

    if (coverage.start !== data.base.value || batches[0].start !== coverage.start) {
      fail("coverage must begin at the base");
    }
    if (batches[batches.length - 1].end !== coverage.end) {
      fail("coverage end must equal the final batch end");
    }
    if (BigInt(coverage.end) - BigInt(coverage.start) !== BigInt(coverage.integers)) {
      fail("coverage integer count disagrees with its interval");
    }
    if (batches[batches.length - 1].certificate_digest !== data.latest_certificate_digest) {
      fail("latest certificate digest must match the final batch");
    }
    batches.forEach((batch, index) => {
      if (batch.number !== index + 1) fail(`batch ${index + 1} is out of sequence`);
      if (BigInt(batch.end) - BigInt(batch.start) !== BigInt(batch.width)) {
        fail(`batch ${batch.number} width disagrees with its interval`);
      }
      if (index > 0 && batch.start !== batches[index - 1].end) {
        fail(`batch ${batch.number} is not contiguous with its predecessor`);
      }
    });
  });

export type FrontierProgress = z.infer<typeof frontierProgressSchema>;
export type FrontierBatch = z.infer<typeof batchSchema>;

export type FrontierProgressResult =
  | { kind: "ok"; progress: FrontierProgress }
  | { kind: "missing" | "invalid" | "fetch_error"; message: string };

export async function decodeFrontierProgressResponse(response: Response): Promise<FrontierProgressResult> {
  if (response.status === 404) {
    return { kind: "missing", message: `${FRONTIER_PROGRESS_FILENAME} was not found` };
  }
  if (!response.ok) {
    return { kind: "fetch_error", message: `Progress request failed with HTTP ${response.status}` };
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    return { kind: "invalid", message: `${FRONTIER_PROGRESS_FILENAME} is not valid JSON` };
  }

  const parsed = frontierProgressSchema.safeParse(payload);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `${issue.path.length > 0 ? issue.path.map(String).join(".") : "progress"}: ${issue.message}`)
      .join("; ");
    return { kind: "invalid", message: `Progress failed schema validation: ${issues}` };
  }

  return { kind: "ok", progress: parsed.data };
}

export async function getFrontierProgress(): Promise<FrontierProgressResult> {
  const { repository, ref } = frontierProgressSource;
  const url = `https://raw.githubusercontent.com/${repository}/${ref}/${FRONTIER_PROGRESS_FILENAME}?fresh=${Date.now()}`;

  let result: FrontierProgressResult;
  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json", "Cache-Control": "no-cache", Pragma: "no-cache" },
      cache: "no-store",
    });
    result = await decodeFrontierProgressResponse(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown network error";
    result = { kind: "fetch_error", message: `Unable to fetch ${FRONTIER_PROGRESS_FILENAME}: ${message}` };
  }

  if (result.kind !== "ok") {
    console.error(`[frontier progress] ${repository}: ${result.message}`);
  }
  return result;
}

/** Groups digits in threes with thin spaces, e.g. 2 392 518 188. */
export function groupDigits(value: string | bigint | number) {
  return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}
