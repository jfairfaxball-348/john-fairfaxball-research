# John Fairfax-Ball Research

Public-facing mathematics research website for John Fairfax-Ball. Each research repository remains the technical source of truth and owns its own website-facing metadata. This repository aggregates that validated metadata into a restrained, readable research index.

## Stack

- Next.js App Router
- TypeScript and React
- Zod validation
- `react-markdown`, `remark-math` and KaTeX
- plain global CSS
- GitHub Actions CI
- Vercel-ready deployment
- no database, CMS, authentication or bespoke backend

## Local development

```bash
npm ci
npm run dev
```

Open `http://localhost:3000`.

Run the full local verification set with:

```bash
npm run lint
npm run typecheck
npm run test:metadata
npm run build
```

## Site structure

- `/` — home page and selected/featured research
- `/research` — canonical catalogue of available research projects
- `/about` — short research biography/programme description
- `/contact` — public contact/profile links

Research outputs are attributes of projects rather than separate top-level Results, Publications or Formalisations sections.

## Research metadata architecture

The data flow is:

```text
approved research repository
  -> meta_data_for_website.json
  -> request-time server-side Next.js aggregator
  -> Zod validation
  -> Home / Research
```

The filename is exactly `meta_data_for_website.json` and the file belongs at the root of each participating research repository. The current contract is schema version 1.

The website contains no duplicate canonical copies of a project's title, status, description, attribution, Palomar record, paper or arXiv information.

Full field definitions, status values, a fictional example and failure behaviour are documented in [`docs/research-metadata.md`](docs/research-metadata.md).

## Explicit source registry

`lib/research-repositories.ts` is the small allow-list of repositories the website is permitted to ingest. It currently contains:

- `jfairfaxball-348/TreeStack-Structural-Certificates-for-Stacking-on-Trees`
- `jfairfaxball-348/pascal-minus-one`
- `jfairfaxball-348/Pascal-Extremes`
- `jfairfaxball-348/ProbStack-Random-Stacking-on-Trees`
- `jfairfaxball-348/Greedy-Uniformity-on-Trees`

Only repository identifiers and refs belong in that registry. Do not copy project content into it. New GitHub repositories are never auto-discovered.

## Adding a research project

1. Publish a valid root-level `meta_data_for_website.json` in the research repository.
2. Add that repository identifier and branch to `lib/research-repositories.ts`.
3. Run the validation and build commands above.
4. Commit and push the website change.

After a repository is on the allow-list, subsequent public metadata edits happen in that research repository, not here.

## Validation and missing metadata

`lib/research-metadata.ts` defines the strict versioned Zod contract. Fetched JSON must pass that contract before rendering.

A missing metadata file does not bring down the site: that repository is skipped and a clear server warning is emitted. Invalid JSON, invalid fields, non-404 fetch failures and duplicate slugs are also skipped with deliberate diagnostics. Nothing is inferred or fabricated from a repository name.

`npm run test:metadata` covers valid parsing, missing metadata, malformed optional fields and invalid JSON. CI runs it alongside lint, TypeScript and the production build.

## Server-side fetching and freshness

Metadata is fetched server-side from the approved public GitHub repositories on each request to the Home or Research page. These routes are explicitly dynamic, the Next.js fetch uses `cache: "no-store"`, and the raw GitHub URL carries a per-request freshness token so stale application/CDN metadata is not deliberately retained.

Therefore:

- website code change -> commit/push -> Vercel rebuild/deploy;
- research metadata change -> GitHub source file changes -> the next website request reads the current metadata;
- no manual cache-version bump, five-minute revalidation wait, cross-repository webhook or deploy hook is required.

This is intentionally optimized for a small catalogue of tiny JSON documents where correctness and freshness matter more than avoiding a handful of inexpensive public reads.

No private GitHub token is required for the current public-repository architecture.

## Vercel deployment

Once this repository is connected to Vercel, use the normal Git integration:

1. In Vercel, create/import the GitHub repository `jfairfaxball-348/john-fairfaxball-research`.
2. Keep the detected Next.js framework settings and default build/output settings.
3. Deploy the `main` branch to production.
4. Use the assigned `https://<project>.vercel.app` URL as the production URL.

The application can derive its metadata base from Vercel's production/deployment URL environment. `NEXT_PUBLIC_SITE_URL` remains an optional explicit canonical override; if used, set it to the full production `https://...vercel.app` URL with no trailing slash. No secret is required.

The production URL should be recorded here only after the first successful deployment; it must not be guessed.

## Custom domain later

A custom domain is intentionally out of scope. If one is added later, update the canonical URL configuration; the metadata aggregation architecture does not need to change.

## Repository hygiene

The lockfile is committed, `.gitignore` excludes generated/local artefacts, CI uses read-only repository contents permission, and no credentials are required by the current implementation.
