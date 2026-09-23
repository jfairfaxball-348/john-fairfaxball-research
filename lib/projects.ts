import { z } from "zod";

export const projectStatuses = [
  "Exploratory",
  "Active research",
  "Proof complete",
  "Formalisation in progress",
  "Formally verified",
  "Palomar verified",
  "Preprint",
  "Published",
  "Archived",
  "Discontinued",
] as const;

const linkSchema = z.object({
  label: z.string().min(1),
  url: z.url(),
});

const projectSchema = z.object({
  title: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  status: z.enum(projectStatuses),
  headline: z.string().min(1),
  year: z.number().int().min(2000).max(2100),
  description: z.string().min(1),
  summary: z.string().optional(),
  topics: z.array(z.string().min(1)).default([]),
  githubUrl: z.url().optional(),
  palomarId: z.string().optional(),
  palomarUrl: z.url().optional(),
  paperUrl: z.url().optional(),
  arxivId: z.string().optional(),
  arxivUrl: z.url().optional(),
  doi: z.string().optional(),
  formalisationSystem: z.string().optional(),
  verification: z.string().optional(),
  attribution: z.string().optional(),
  originalSource: z.string().optional(),
  featured: z.boolean().default(false),
  links: z.array(linkSchema).default([]),
});

export type ResearchProject = z.infer<typeof projectSchema>;

const rawProjects = [
  {
    title: "Fischer Zero-Forcing Counterexample",
    slug: "fischer-zero-forcing-counterexample",
    status: "Palomar verified",
    headline: "A Lean 4 formalisation of Mikko Fischer's explicit 24-vertex counterexample.",
    year: 2026,
    description:
      "The formalisation verifies that Fischer's graph has independence number $\\alpha(H)=9$ and zero-forcing number $Z(H)=11$, establishing the stated counterexample in Lean 4. The underlying graph and mathematical counterexample are due to Mikko Fischer; this project is the formalisation and verification work.",
    topics: ["Graph theory", "Zero forcing", "Formal verification"],
    githubUrl: "https://github.com/jfairfaxball-348/Fischer-Zero-Forcing-Counterexample",
    palomarId: "PALOMAR-2026-09-20-000009",
    palomarUrl:
      "https://palomar-registry.org/entry.html?id=PALOMAR-2026-09-20-000009&version=1",
    formalisationSystem: "Lean 4",
    verification: "Registered and independently verified by the Palomar Registry.",
    attribution:
      "Counterexample: Mikko Fischer. Lean 4 formalisation and verification: John Fairfax-Ball.",
    featured: true,
  },
  {
    title: "TreeStack",
    slug: "treestack",
    status: "Active research",
    headline: "Active research project.",
    year: 2026,
    description: "Active research project. Full project summary forthcoming.",
    topics: ["Discrete mathematics"],
    githubUrl:
      "https://github.com/jfairfaxball-348/TreeStack-Structural-Certificates-for-Stacking-on-Trees",
    featured: true,
  },
  {
    title: "Petersen",
    slug: "petersen",
    status: "Active research",
    headline: "Active research project.",
    year: 2026,
    description: "Active research project. Full project summary forthcoming.",
    topics: ["Graph theory"],
    githubUrl: "https://github.com/jfairfaxball-348/Petersen-Zero-Forcing",
    featured: true,
  },
] satisfies unknown[];

export const projects: ResearchProject[] = z.array(projectSchema).parse(rawProjects);

export const featuredProjects = projects.filter((project) => project.featured);
