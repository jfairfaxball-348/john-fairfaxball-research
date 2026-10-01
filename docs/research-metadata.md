# Research metadata contract

Each approved research repository owns the public metadata used by this website. The website repository is the aggregator and presentation layer.

## Required file

- Filename: `meta_data_for_website.json`
- Location: repository root on the registered branch (currently `main`)
- Encoding: UTF-8 JSON
- Current contract version: `"schema_version": 1`
- Content: public, website-safe metadata only. Do not include private notes, credentials, API keys, machine paths, unpublished internal state, or other sensitive data.

## Catalogue rule

A repository is visible only when both conditions are true:

1. it contains a valid root-level `meta_data_for_website.json`; and
2. it is explicitly listed in `lib/research-repositories.ts`.

The registry is deliberate rather than automatic, but it should mirror the set of projects intentionally tagged for publication. A tagged public research repository should not be left out of the registry.

## Version 1 schema

Required fields:

| Field | Type | Meaning |
| --- | --- | --- |
| `schema_version` | integer | Must be exactly `1`. |
| `title` | string | Public project title. |
| `slug` | string | Lowercase letters/numbers with single hyphens between segments. Must be unique across the website registry. |
| `status` | enum string | One current public research stage from the controlled vocabulary below. |
| `headline` | string | Short factual one-line description. |
| `year` | integer | Project/result year. |
| `date` | `YYYY-MM-DD` string | Public catalogue date used for newest-to-oldest ordering. Use the date of the relevant public milestone or current stage change consistently. |
| `description` | string | Main public description; Markdown and mathematical notation are supported. |
| `github_url` | URL | Public `https://github.com/...` repository URL. |

Optional fields:

| Field | Type | Meaning |
| --- | --- | --- |
| `summary` | string or `null` | Longer optional summary; Markdown and mathematical notation are supported. |
| `topics` | string array | Public subject tags. Defaults to `[]`. |
| `palomar_id` | string or `null` | Palomar Registry identifier. |
| `palomar_url` | URL or `null` | Palomar entry URL. |
| `paper_url` | URL or `null` | Paper or manuscript URL. |
| `arxiv_id` | string or `null` | arXiv identifier. |
| `arxiv_url` | URL or `null` | arXiv abstract/preprint URL. |
| `doi` | string or `null` | DOI, for example `10.1234/example.5678`. |
| `formalisation_system` | string or `null` | For example `Lean 4`. |
| `verification` | string or `null` | Concise factual verification note. |
| `attribution` | string or `null` | Public authorship/contribution statement: who supplied the underlying mathematics and what this project contributed. |
| `original_source` | string or `null` | Bibliographic or research-context text for the prior/original work on which the project builds. Prefer a human-readable citation rather than a bare URL. |
| `featured` | boolean | Retained metadata flag; the current Home page displays all registered projects. Defaults to `false`. |
| `additional_links` | array | Extra links as objects with required `label` and `url` strings. Defaults to `[]`. |

Unknown fields are rejected. Optional scalar fields may be omitted or set to `null` when they do not apply.

## Status vocabulary

The badge is deliberately a **single current stage**, not a list of achievements. Use exactly one of:

- `Exploratory`
- `Active research`
- `Proof complete`
- `Formalisation in progress`
- `Formally verified`
- `Palomar verified`
- `Paper prepared`
- `Awaiting arXiv`
- `arXiv preprint`
- `Published`
- `Blocked`
- `Archived`
- `Discontinued`

Put supporting milestones in the dedicated fields instead of concatenating them into the badge. For example, a project whose Lean proof and Palomar verification are complete but whose submitted manuscript is waiting for arXiv should use `Awaiting arXiv`, while the Lean and Palomar facts belong under `formalisation_system`, `verification`, `palomar_id` and `palomar_url`.

Because status values are deliberately controlled, wording such as `Preprint posted` should be normalized to the canonical `arXiv preprint` stage before committing the metadata file.

## Descriptions, attribution and prior work

Keep the public text layered and non-duplicative:

- `headline`: one sentence describing the result or question.
- `description`: a compact 2–4 sentence account of what the project establishes, what remains open, and any essential caveat.
- `verification`: what has actually been machine-checked, audited or externally verified.
- `attribution`: who supplied the original theorem/problem/data and what this repository contributes.
- `original_source`: the main prior/original research citation or a concise summary of the prior methodology when there is no single source.
- `additional_links`: links to original papers, prior-art audits or genuinely additional resources.

Do not repeat a dedicated URL in `additional_links`. The renderer also de-duplicates identical URLs defensively.

## Example

```json
{
  "schema_version": 1,
  "title": "Example finite graph project",
  "slug": "example-finite-graph-project",
  "status": "Palomar verified",
  "headline": "A bounded study of an example finite graph question.",
  "year": 2026,
  "date": "2026-09-23",
  "description": "We study the relation $x^2+y^2=z^2$ in a deliberately fictional example.",
  "topics": ["Graph theory", "Formal verification"],
  "github_url": "https://github.com/example/example-finite-graph-project",
  "formalisation_system": "Lean 4",
  "verification": "Machine-checked example verification.",
  "attribution": "Fictional example only.",
  "original_source": "Example Author, “Example source paper” (2026).",
  "paper_url": null,
  "featured": true,
  "additional_links": [
    {
      "label": "Original paper",
      "url": "https://example.org/background"
    }
  ]
}
```

## Mathematical notation

`description` and `summary` are rendered through Markdown with `remark-math` and KaTeX. Use `$...$` for inline mathematics and `$$...$$` for display mathematics. Keep JSON escaping in mind: a LaTeX backslash must be escaped as `\\` in JSON.

## Links

Use the dedicated fields for GitHub, Palomar, paper, arXiv and DOI when applicable. Put only genuinely additional public resources in `additional_links`.

## Adding a research repository

1. Add a valid root-level `meta_data_for_website.json` to the research repository.
2. Add its `owner/repository` identifier and branch to `lib/research-repositories.ts` in this website repository.
3. Run `npm run test:metadata`, `npm run lint`, `npm run typecheck` and `npm run build`.
4. Commit and push the website change.

The allow-list is deliberate. The website never discovers or publishes every repository on the GitHub account automatically.

## Validation and failure behaviour

Every fetched metadata document is parsed as JSON and validated with the Zod schema in `lib/research-metadata.ts` before it can render.

- A `404` for `meta_data_for_website.json` is treated as an expected missing-metadata condition.
- Invalid JSON or schema-invalid metadata is skipped and reported with the failing field(s).
- Unknown status text is rejected; the controlled stage vocabulary prevents display drift.
- Missing catalogue dates are rejected so newest-to-oldest ordering is deterministic.
- Other HTTP/network failures are skipped and reported as fetch diagnostics.
- Duplicate slugs are rejected at aggregation time.
- The site never fabricates titles, descriptions or research claims from repository names.

## Fetching and freshness

The Home and Research routes are request-time dynamic. The server fetches each registered root metadata file directly from `raw.githubusercontent.com` using `cache: "no-store"`, no Next.js revalidation cache, and a per-request query token that prevents the old fixed raw-GitHub URL from being reused by intermediary caches.

For an already-registered repository, the intended update path is therefore:

```text
edit meta_data_for_website.json
  -> push to main
  -> refresh the website
  -> current metadata is fetched and rendered
```

Do not add a fixed cache-version marker or timed page/data revalidation for research metadata. The catalogue is intentionally small, so request-time freshness is preferred over persistent caching.
