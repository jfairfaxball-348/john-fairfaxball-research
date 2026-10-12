import type { Metadata } from "next";
import Link from "next/link";
import { FrontierLiveView } from "@/components/FrontierLiveView";
import { Markdown } from "@/components/Markdown";
import { getLiveView, LIVE_POLL_INTERVAL_MS } from "@/lib/frontier-live";
import { type FrontierProgress, getFrontierProgress, groupDigits } from "@/lib/frontier-progress";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Collatz frontier",
  description:
    "A running tally of consecutive integers checked for the Collatz conjecture just beyond the reported verification frontier.",
  alternates: { canonical: "/collatz" },
};

const introduction = `
Take any positive whole number. If it is even, halve it; if it is odd, multiply by three and add one. Repeat. The **Collatz conjecture** says that every starting number eventually reaches 1. Nobody has proved it, but computers have checked enormous ranges: every number below $2^{71} \\approx 2.36 \\times 10^{21}$ has been verified in peer-reviewed work, and a long-running distributed project reports progress somewhat beyond that.

This project starts at that reported edge and checks the **next consecutive integers**, in batches, on a single machine. Because every smaller number is already known to reach 1, it is enough to show that each new number eventually falls below where it started. Most numbers are dismissed instantly by short, proved shortcuts; the rest have their trajectories computed exactly. Every batch produces a certificate that is checked and replayed independently before it counts.

Current runs continue sequentially in batches of **9,999 integers**, without a target quantity. A clean stop finishes the active batch before the verified results are published.
`;

const ruleLabels: Record<string, string> = {
  E2: "Even: halving at once gives a smaller number",
  Q4: "One more than a multiple of 4: falls below itself in two steps",
  P3: "Two more than a multiple of 3: reached from a smaller number",
  M9: "Four more than a multiple of 9: reached from a smaller number in three steps",
  "S2K4-03": "Three more than a multiple of 16: falls below itself in four steps",
  EXPLICIT: "Everything else: trajectory computed exactly",
};

/** Renders labels such as "2^71" with a superscript exponent. */
function Power({ label }: { label: string }) {
  const [mantissa, exponent] = label.split("^");
  return exponent ? (
    <>
      {mantissa}
      <sup>{exponent}</sup>
    </>
  ) : (
    <>{label}</>
  );
}

function relative(value: string, base: string) {
  return `B + ${groupDigits(BigInt(value) - BigInt(base))}`;
}

function Tally({ progress }: { progress: FrontierProgress }) {
  const base = progress.base.value;
  const total = Number(progress.coverage.integers);
  const rules = Object.entries(progress.rule_counts);
  const largestRule = Math.max(...rules.map(([, count]) => count));

  return (
    <>
      <dl className="stat-grid">
        <div>
          <dt>Integers checked</dt>
          <dd>{groupDigits(progress.coverage.integers)}</dd>
        </div>
        <div>
          <dt>Batches completed</dt>
          <dd>{progress.batches.length}</dd>
        </div>
        <div>
          <dt>Unresolved</dt>
          <dd>{progress.unresolved}</dd>
        </div>
        <div>
          <dt>Last published</dt>
          <dd>{progress.updated}</dd>
        </div>
      </dl>

      <div className="frontier-numbers">
        <div>
          <p className="frontier-label">Starting point B (reported frontier)</p>
          <p className="frontier-value">{groupDigits(base)}</p>
        </div>
        <div>
          <p className="frontier-label">Current frontier: next integer to check</p>
          <p className="frontier-value">{groupDigits(progress.coverage.end)}</p>
          <p className="frontier-sub">{relative(progress.coverage.end, base)}</p>
        </div>
      </div>

      <figure className="figure">
        <figcaption>Checked interval, batch by batch (width proportional to size)</figcaption>
        <div className="batch-strip" role="img" aria-label={`${progress.batches.length} contiguous batches`}>
          {progress.batches.map((batch) => (
            <span
              key={batch.number}
              style={{ flexGrow: batch.width }}
              title={`Batch ${batch.number}: ${relative(batch.start, base)} to ${relative(batch.end, base)} (${groupDigits(batch.width)} integers)`}
            />
          ))}
        </div>
        <div className="strip-axis">
          <span>B</span>
          <span>{relative(progress.coverage.end, base)}</span>
        </div>
      </figure>

      <figure className="figure">
        <figcaption>How each integer was settled</figcaption>
        <ul className="rule-bars">
          {rules.map(([rule, count]) => (
            <li key={rule} title={`${rule}: ${groupDigits(count)} integers`}>
              <span className="rule-name">{ruleLabels[rule] ?? rule}</span>
              <span className="rule-track">
                <span style={{ width: `${(count / largestRule) * 100}%` }} />
              </span>
              <span className="rule-count">
                {groupDigits(count)} <span>({((count / total) * 100).toFixed(1)}%)</span>
              </span>
            </li>
          ))}
        </ul>
      </figure>

      <details className="batch-details">
        <summary>All {progress.batches.length} batches</summary>
        <div className="table-wrap">
          <table className="batch-table">
            <thead>
              <tr>
                <th scope="col">Batch</th>
                <th scope="col">From</th>
                <th scope="col">To (exclusive)</th>
                <th scope="col">Integers</th>
                <th scope="col">Certificate</th>
              </tr>
            </thead>
            <tbody>
              {progress.batches.map((batch) => (
                <tr key={batch.number}>
                  <td>{batch.number}</td>
                  <td title={batch.start}>{relative(batch.start, base)}</td>
                  <td title={batch.end}>{relative(batch.end, base)}</td>
                  <td>{groupDigits(batch.width)}</td>
                  <td title={batch.certificate_digest}>
                    <code>{batch.certificate_digest.slice(0, 12)}…</code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>

      <div className="prose claim">
        <p>
          <strong>What this does and does not show.</strong> {progress.claim}
        </p>
        <p>
          The starting point B is the{" "}
          <Link href={progress.base.source_url}>distributed project&rsquo;s reported bound ↗</Link>, observed{" "}
          {progress.base.observed_at.slice(0, 10)}. The peer-reviewed bound is{" "}
          <Power label={progress.peer_reviewed_bound.label} />, published by {progress.peer_reviewed_bound.citation}. Other projects may be checking the same range.
        </p>
        <p className="project-actions">
          <Link href={progress.record_url}>Full progress record ↗</Link>
          <Link href={progress.repository_url}>Repository ↗</Link>
        </p>
      </div>
    </>
  );
}

export default async function CollatzPage() {
  const [result, liveView] = await Promise.all([getFrontierProgress(), getLiveView()]);
  const progress = result.kind === "ok" ? result.progress : null;

  return (
    <section className="shell page-block">
      <header className="page-intro">
        <p className="eyebrow">Computational verification</p>
        <h1>Checking Collatz at the frontier</h1>
        <p>
          A running count of whole numbers, just beyond the edge of what has been verified, that have been confirmed to reach 1.
        </p>
      </header>

      <div className="prose frontier-intro">
        <Markdown>{introduction}</Markdown>
      </div>

      <section className="frontier-section" aria-labelledby="tally">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Verified so far</p>
            <h2 id="tally">The tally</h2>
          </div>
        </div>
        {progress ? (
          <Tally progress={progress} />
        ) : (
          <div className="prose">
            <p>The published progress record is temporarily unavailable. Please check back shortly.</p>
          </div>
        )}
      </section>

      <section className="frontier-section" aria-labelledby="live">
        <div className="section-heading">
          <div>
            <p className="eyebrow">The machine</p>
            <h2 id="live">Live view</h2>
          </div>
        </div>
        <FrontierLiveView
          initialView={liveView}
          base={progress?.base.value ?? null}
          pollIntervalMs={LIVE_POLL_INTERVAL_MS}
        />
      </section>
    </section>
  );
}
