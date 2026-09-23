import Link from "next/link";
import { ProjectEntry } from "@/components/ProjectEntry";
import { featuredProjects } from "@/lib/projects";

export default function Home() {
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
        <div className="project-list compact-project-list">
          {featuredProjects.slice(0, 3).map((project) => (
            <ProjectEntry key={project.slug} project={project} />
          ))}
        </div>
      </section>
    </>
  );
}
