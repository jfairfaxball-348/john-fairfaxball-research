import type { Metadata } from "next";
import { ProjectEntry } from "@/components/ProjectEntry";
import { getResearchProjects } from "@/lib/projects";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Research",
  description:
    "Research projects by John Fairfax-Ball, including mathematical results, computational work, Lean formalisation and linked papers.",
  alternates: { canonical: "/research" },
};

export default async function ResearchPage() {
  const { projects } = await getResearchProjects();

  return (
    <section className="shell page-block">
      <header className="page-intro">
        <p className="eyebrow">Research catalogue</p>
        <h1>Research</h1>
        <p>
          Current and completed mathematical projects, ordered by their
          recorded public milestones. Each entry distinguishes the research
          stage from its verification and publication record; the linked
          repositories contain the technical details.
        </p>
      </header>

      {projects.length > 0 ? (
        <div className="project-list">
          {projects.map((project) => (
            <ProjectEntry key={project.slug} project={project} />
          ))}
        </div>
      ) : (
        <div className="prose">
          <p>The research catalogue is temporarily unavailable.</p>
        </div>
      )}
    </section>
  );
}
