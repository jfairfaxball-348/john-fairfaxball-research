# Collatz frontier page (`/collatz`)

The page has two independent data sources.

## 1. Verified tally (active)

Fetched server-side on every request, exactly like research metadata:

```text
jfairfaxball-348/CEML (main)
  -> frontier_progress_for_website.json   (derived from docs/RUN1_PROGRESS.md)
  -> lib/frontier-progress.ts             (Zod schema + contiguity/total checks)
  -> /collatz tally
```

The CEML repository owns that file and regenerates it with `tools/publication/website_progress.py` whenever a verified aggregate is published (see CEML `docs/WEBSITE_PUBLICATION.md`). The website never edits it. Large integers are decimal strings and are handled with `BigInt`. If the file is missing or fails validation, the page says the record is temporarily unavailable and logs a server diagnostic.

## 2. Live view (optional publisher)

The browser polls `/api/frontier/live` every 15 seconds while the tab is visible. By default the server reads `https://raw.githubusercontent.com/jfairfaxball-348/CEML/live-status/frontier_live_status.json`. A separate owner-authorised CEML sidecar reads local state and updates that public branch about once a minute. It never affects scientific execution or the verified tally. `FRONTIER_LIVE_STATUS_URL` overrides the default; an explicitly empty value disables it. No hosting secret, tunnel or inbound PC port is needed for the default source.

Polling also refreshes immediately on mount, tab visibility/focus and network
recovery. One request may be active at a time, with a ten-second browser timeout
and cancellation on component disposal. Freshness is checked even when hidden
or awaiting a response, using the heartbeat's original timestamp. Older/cached
responses cannot roll Last checked backwards or revive an expired report.
Payload envelopes are validated before updating React state; heartbeats more
than 30 seconds in the future are refused.

Both `/collatz` and the API use dynamic rendering with zero revalidation. Server
fetches specify `cache: no-store`, and upstream and browser URLs carry freshness
queries. API responses include browser and CDN `no-store` headers. No heartbeat
requires a website rebuild. These controls follow
[Next fetch semantics](https://nextjs.org/docs/app/api-reference/functions/fetch)
and [Vercel cache header precedence](https://vercel.com/docs/caching/cache-control-headers).

Production validation found browser/API responses were cache misses, but a new
GitHub raw-branch payload reached the production server several minutes after
the uploader and another region could read it. Cache bypass at our application
does not guarantee immediate upstream branch propagation. The 15-second polling
interval is therefore a refresh interval, not a delivery-time guarantee. Retained
reports keep their original heartbeat time and correctly become delayed; an age
check alone does not invent a network failure or override an explicitly disabled
source. The paused publisher remains paused during validation.

| Situation | Page shows |
| --- | --- |
| variable unset | use the public CEML live branch |
| variable explicitly empty | live updates unavailable; retained details are informational |
| feed unreachable, HTTP error or 5 s server timeout | retain a fresh previous report; otherwise updates delayed/unavailable |
| response fails the schema below | retain a fresh previous report; otherwise updates delayed/unavailable |
| `updated_at` older than 5 minutes | Updates delayed, with last batch/session details and report time |
| fresh valid status | Latest batch checked and integers checked this session |

The fetch happens on the server, so the machine's address is never sent to visitors. If the endpoint needs protecting, set `FRONTIER_LIVE_STATUS_TOKEN`; it is sent as `Authorization: Bearer <token>`.

The panel shows Latest batch checked and This session; there is no current-batch viewer or list of recent batches. It retains last reported details through fetch failures. A fresh prior report may bridge a transient failure, but its actual `updated_at` still expires after five minutes. Delayed updates do not establish whether the PC is online. Live status is informational only. The tally counts only verified, published batches.

### Status format, schema version 1

```json
{
  "schema_version": 1,
  "state": "running",
  "updated_at": "2026-10-12T11:59:50Z",
  "message": null,
  "current_batch": {
    "number": 18,
    "start": "2392518188130438958000",
    "end": "2392518188130438972400",
    "width": 14400,
    "processed": 7200,
    "started_at": "2026-10-12T11:58:00Z"
  },
  "session": { "requested": 100000, "completed": 7200, "started_at": "2026-10-12T11:58:00Z" },
  "recent_batches": [
    {
      "number": 17,
      "start": "2392518188130438944400",
      "end": "2392518188130438958000",
      "width": 13600,
      "status": "committed",
      "finished_at": "2026-10-12T11:03:59Z"
    }
  ]
}
```

- `state`: `running`, `idle`, `paused`, `stopped` or `error`.
- `updated_at`, `started_at`, `finished_at`: ISO 8601 with a timezone.
- `start` / `end`: half-open interval as decimal strings; `processed` must not exceed `width`.
- `message`: optional, at most 280 characters, shown verbatim.
- `current_batch`, `session` and `message` may be `null` or omitted; `recent_batches` holds at most 20 entries.
- Unknown fields are rejected.

### Operating it

1. On the Windows machine, after signing into GitHub CLI, run `python C:\CEML\tools\publication\live.py start`. It registers a hidden Windows task running as the signed-in user with limited privileges, logon start and automatic one-minute recovery. Use `stop` to disable that task and stop live uploads; the scientific runner is unaffected. Only allowlisted aggregate fields leave the machine. Local paths, addresses, command lines, identifiers and credentials are excluded. The observer's checkpoint cursor is provisional and `committed` entries are informational local observations, not independent verification.
2. The website uses the public branch automatically. If the observer stops or cannot upload for five minutes, the last details remain visible with an Updates delayed label.

The status branch is separate from `main`, the immutable scientific chain and the aggregate publication PRs. Heartbeats do not trigger website deployments. The end-of-run CEML command `python C:\CEML\tools\publication\publish.py` performs full verification and publishes the authoritative aggregate and website feed separately.

### Continuous sessions

The owner may use `python C:/CEML/tools/operator/run_frontier.py start` without a quantity, checking sequential 9999-wide batches. The same command with `stop` in a second terminal finishes the current batch before exit and publishing. The accepted chain still ends at 256 batches. Live session `mode` can be `continuous`, with `requested: null`; the panel always displays only integers checked this session, with no target quantity or percentage. Requested totals remain accepted in legacy finite payloads for compatibility but are not displayed. No session metadata changes the published verified tally.
