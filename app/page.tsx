import Link from "next/link";
import { ProjectEntry } from "@/components/ProjectEntry";
import { getResearchProjects } from "@/lib/projects";

export default async function Home() {
  const { projects } = await getResearchProjects();
  const homepageProjects = projects;

  return (
    <>
      <section className="shell hero">
        <p className="eyebrow">Independent researcher</p>
        <h1>John Fairfax-Ball</h1>
        <p className="hero-deck">
          Independent mathematical research in discrete mathematics, computational mathematics and formal verification.
        </p>
        <p className="hero-copy">
          This site collects active projects, completed results, formal proofs and independently verified artefacts. Technical repositories remain the source of truth; this is the readable research index.
        </p>
        <Link className="primary-link" href="/research">
          View research <span aria-hidden="true">→</span>
        </Link>
      </section>

      <section className="shell section-block" aria-labelledby="selected-research">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Selected work</p>
            <h2 id="selected-research">Research</h2>
          </div>
          <Link href="/research">All projects →</Link>
        </div>
        {homepageProjects.length > 0 ? (
          <div className="project-list compact-project-list">
            {homepageProjects.map((project) => (
              <ProjectEntry key={project.slug} project={project} />
            ))}
          </div>
        ) : (
          <div className="prose">
            <p>Research project metadata will appear here as it is published by the approved research repositories.</p>
          </div>
        )}
      </section>
    </>
  );
}
