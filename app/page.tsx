import Link from "next/link";
import { ProjectEntry } from "@/components/ProjectEntry";
import { getResearchProjects } from "@/lib/projects";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Home() {
  const { projects } = await getResearchProjects();

  return (
    <>
      <section className="shell hero">
        <p className="eyebrow">Independent mathematical research</p>
        <h1>John Fairfax-Ball</h1>
        <p className="hero-deck">
          Research in combinatorics, number theory, computation and formal
          verification.
        </p>
        <p className="hero-copy">
          An open record of mathematical questions, computational
          investigations and proved results. Each project links to its
          underlying repository, with formal proofs, verification records
          and papers wherever available.
        </p>
        <Link className="primary-link" href="/research">
          Explore the research <span aria-hidden="true">→</span>
        </Link>
      </section>

      <section className="shell section-block" aria-labelledby="research-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Research catalogue</p>
            <h2 id="research-heading">Research projects</h2>
          </div>
          <Link href="/research">View research page →</Link>
        </div>
        {projects.length > 0 ? (
          <div className="project-list compact-project-list">
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
    </>
  );
}
