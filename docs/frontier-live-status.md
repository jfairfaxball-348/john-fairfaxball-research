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

## 2. Live view (scaffolding; currently offline)

The browser polls `/api/frontier/live` every 15 seconds while the tab is visible. That route reads the server-only environment variable `FRONTIER_LIVE_STATUS_URL`:

| Situation | Page shows |
| --- | --- |
| variable unset (current state) | **Working offline** |
| machine unreachable, HTTP error or 5 s timeout | Working offline |
| response fails the schema below | Working offline |
| `updated_at` older than 5 minutes | Working offline, with the last report time |
| fresh valid status | Live panel: current batch, session progress, recent batches |

The fetch happens on the server, so the machine's address is never sent to visitors. If the endpoint needs protecting, set `FRONTIER_LIVE_STATUS_TOKEN`; it is sent as `Authorization: Bearer <token>`.

Live status is informational only. The tally counts only verified, published batches.

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

### Turning it on later

1. On the machine, run a small read-only sidecar that writes this JSON from local run state and serves it over HTTPS (for example through a tunnel). It must stay separate from the CEML runner; see CEML `docs/WEBSITE_PUBLICATION.md` for the constraints. It must not publish machine names, paths or other private identifiers.
2. In Vercel, set `FRONTIER_LIVE_STATUS_URL` (and optionally `FRONTIER_LIVE_STATUS_TOKEN`) and redeploy.

No website code change is needed.
