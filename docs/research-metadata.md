# Research metadata contract

Each approved research repository owns the public metadata used by this website. The website repository is only the aggregator and presentation layer.

## Required file

- Filename: `meta_data_for_website.json`
- Location: repository root on the registered branch (currently `main`)
- Encoding: UTF-8 JSON
- Current contract version: `"schema_version": 1`
- Content: public, website-safe metadata only. Do not include private notes, credentials, API keys, machine paths, unpublished internal state, or other sensitive data.

## Version 1 schema

Required fields:

| Field | Type | Meaning |
| --- | --- | --- |
| `schema_version` | integer | Must be exactly `1`. |
| `title` | string | Public project title. |
| `slug` | string | Lowercase letters/numbers with single hyphens between segments. Must be unique across the website registry. |
| `status` | enum | Research maturity status from the vocabulary below. |
| `headline` | string | Short factual one-line description. |
| `year` | integer | Project/result year. |
| `description` | string | Main public description; Markdown and mathematical notation are supported. |
| `github_url` | URL | Public `https://github.com/...` repository URL. |

Optional fields:

| Field | Type | Meaning |
| --- | --- | --- |
| `date` | `YYYY-MM-DD` string or `null` | Project start/public date used for newest-to-oldest ordering. If omitted, the site falls back to January 1 of `year`. |
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
| `attribution` | string or `null` | Public authorship/contribution and attribution statement. |
| `original_source` | string or `null` | Original problem, construction, conjecture, paper, or source attribution where relevant. |
| `featured` | boolean | Whether the project may appear in the selected work on Home. Defaults to `false`. |
| `additional_links` | array | Extra links as objects with required `label` and `url` strings. Defaults to `[]`. |

Unknown fields are rejected. Optional scalar fields may be omitted or set to `null` when they do not apply; the interface hides both absent and null fields.

## Status vocabulary

The allowed status values are:

- `Exploratory`
- `Active research`
- `Proof complete`
- `Formalisation in progress`
- `Formally verified`
- `Palomar verified`
- `Preprint`
- `Published`
- `Archived`
- `Discontinued`

Statuses describe research maturity; they are not promotional ratings.

## Example

This example is illustrative only and is not live project data:

```json
{
  "schema_version": 1,
  "title": "Example finite graph project",
  "slug": "example-finite-graph-project",
  "status": "Active research",
  "headline": "A bounded study of an example finite graph question.",
  "year": 2026,
  "date": "2026-09-23",
  "description": "We study the relation $x^2+y^2=z^2$ in a deliberately fictional example.",
  "summary": "Display mathematics is also supported: $$\\alpha(G) \\leq Z(G).$$",
  "topics": ["Graph theory", "Formal verification"],
  "github_url": "https://github.com/example/example-finite-graph-project",
  "formalisation_system": "Lean 4",
  "verification": "Machine-checked example verification.",
  "attribution": "Fictional example only.",
  "original_source": null,
  "paper_url": null,
  "featured": true,
  "additional_links": [
    {
      "label": "Background",
      "url": "https://example.org/background"
    }
  ]
}
```

## Mathematical notation

`description` and `summary` are rendered through Markdown with `remark-math` and KaTeX. Use `$...$` for inline mathematics and `$$...$$` for display mathematics. Keep the JSON escaping rules in mind: a LaTeX backslash must be escaped as `\\` in JSON.

## Links

Use the dedicated fields for GitHub, Palomar, paper, arXiv and DOI when applicable. Put only genuinely additional public resources in `additional_links`. A project need not populate every possible link.

## Adding a research repository

1. Add a valid root-level `meta_data_for_website.json` to the research repository.
2. Add only its `owner/repository` identifier and branch to `lib/research-repositories.ts` in this website repository.
3. Run `npm run test:metadata`, `npm run lint`, `npm run typecheck` and `npm run build`.
4. Commit and push the website change.

The allow-list is deliberate. The website never discovers or publishes every repository on the GitHub account automatically.

## Validation and failure behaviour

Every fetched metadata document is parsed as JSON and validated with the Zod schema in `lib/research-metadata.ts` before it can render.

- A `404` for `meta_data_for_website.json` is treated as an expected missing-metadata condition. That project is skipped and a clear server/build warning is emitted.
- Invalid JSON or schema-invalid metadata is skipped and a clear error diagnostic is emitted with the failing field(s).
- Other HTTP/network failures are skipped and reported as fetch diagnostics.
- Duplicate slugs are rejected at aggregation time.
- The site never fabricates titles, descriptions or research claims from repository names.

Automated tests cover successful parsing, missing metadata, malformed optional metadata and invalid JSON. CI runs those tests before the production build.

## Fetching, cache and revalidation

The App Router server components fetch the root metadata file directly from `raw.githubusercontent.com`. Visitors do not need client-side JavaScript to retrieve research records.

Each source fetch uses Next.js data-cache revalidation of 300 seconds (five minutes). The request URL also carries a small website cache-version marker so a stale historical response can be deliberately invalidated when ingestion behaviour changes. This means:

- a website-code push triggers the normal Vercel rebuild/deploy once the Vercel project is connected;
- a change to a research repository's `meta_data_for_website.json` does not need a cross-repository webhook;
- after the cached entry becomes stale, the next server request can refresh it from GitHub and subsequent requests use the refreshed data;
- a repository that was initially private or missing its metadata should normally become visible within about five minutes after the metadata becomes publicly accessible.

Public repositories require no GitHub token for this architecture.