# John Fairfax-Ball Research

Public-facing research website for John Fairfax-Ball. GitHub repositories remain the technical source of truth for each research project; this site is the readable presentation layer for active research, completed results, formal verification, Palomar records, code, papers and future preprints.

## Stack

- Next.js (App Router)
- TypeScript
- React
- repository-native TypeScript project data validated with Zod
- `react-markdown` + `remark-math` + KaTeX for mathematical notation
- plain global CSS for a lightweight, maintainable visual system
- no database, authentication, CMS or backend service

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Quality checks:

```bash
npm run lint
npm run typecheck
npm run build
```

## Site structure

- `/` — concise home page and selected work
- `/research` — canonical catalogue of all research projects
- `/about` — short research biography/programme description
- `/contact` — direct contact and profile links

Research outputs are attributes of projects rather than separate top-level sections.

## Research data

Projects live in `lib/projects.ts`. Each project is validated at build time with Zod. The schema supports:

- title and stable slug
- status and headline
- year
- Markdown description with inline/display mathematics
- topics
- GitHub repository
- Palomar ID and URL
- paper URL
- arXiv ID and URL
- DOI
- formalisation system
- verification note
- attribution/original source
- featured flag
- additional links

Optional fields simply do not render when absent.

### Adding a project

Add one object to `rawProjects` in `lib/projects.ts`:

```ts
{
  title: "Example project",
  slug: "example-project",
  status: "Active research",
  headline: "A short factual headline.",
  year: 2026,
  description: "A concise description. Mathematics such as $x^2+y^2=z^2$ is supported.",
  topics: ["Graph theory"],
  githubUrl: "https://github.com/...",
}
```

Malformed metadata fails during development/build rather than silently breaking the UI.

### Updating status or outputs

Update the same canonical project record as the work matures. For example, add `palomarId` and `palomarUrl` after registry verification, or `arxivId` and `arxivUrl` once a preprint exists. Do not duplicate the project into separate “results” or “publications” data.

## Publishing workflow

1. edit research data/content;
2. commit changes;
3. push to GitHub;
4. Vercel rebuilds and deploys automatically.

This repository is the content management system.

## Vercel deployment

1. In Vercel, create a new project and import `jfairfaxball-348/john-fairfaxball-research`.
2. Vercel should auto-detect Next.js; no custom build command is required.
3. Set `NEXT_PUBLIC_SITE_URL` to the deployed production URL, including `https://` and with no trailing slash. This is used by metadata, `robots.txt` and `sitemap.xml`.
4. Deploy.

No secrets are required for the site itself.

## Custom domain later

When a custom domain is purchased, attach it in the Vercel project settings and update `NEXT_PUBLIC_SITE_URL` to the canonical domain. No code architecture change should be necessary.

## Static assets

Place static images, icons or downloadable public files in `public/`. The bootstrap deliberately avoids decorative imagery so the research remains the focus.

## Current project records

- Fischer Zero-Forcing Counterexample — Lean 4 formalisation, Palomar verified
- TreeStack — active research; public summary intentionally minimal pending authoritative project copy
- Petersen — active research; public summary intentionally minimal pending authoritative project copy
