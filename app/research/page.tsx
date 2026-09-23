import type { Metadata } from "next";
import { ProjectEntry } from "@/components/ProjectEntry";
import { getResearchProjects } from "@/lib/projects";

export const metadata: Metadata = {
  title: "Research",
  description: "Research projects by John Fairfax-Ball, including formal verification and reproducible mathematical work.",
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
          A single catalogue of active and completed projects. Status labels describe mathematical and verification maturity; linked repositories contain the technical record.
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
          <p>No project metadata is currently available from the approved research repositories.</p>
        </div>
      )}
    </section>
  );
}
