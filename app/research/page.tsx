import type { Metadata } from "next";
import { ProjectEntry } from "@/components/ProjectEntry";
import { projects } from "@/lib/projects";

export const metadata: Metadata = {
  title: "Research",
  description: "Research projects by John Fairfax-Ball, including formal verification and reproducible mathematical work.",
};

export default function ResearchPage() {
  return (
    <section className="shell page-block">
      <header className="page-intro">
        <p className="eyebrow">Research catalogue</p>
        <h1>Research</h1>
        <p>
          A single catalogue of active and completed projects. Status labels describe mathematical and verification maturity; linked repositories contain the technical record.
        </p>
      </header>

      <div className="project-list">
        {projects.map((project) => (
          <ProjectEntry key={project.slug} project={project} />
        ))}
      </div>
    </section>
  );
}
