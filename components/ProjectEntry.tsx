import Link from "next/link";
import type { ResearchProject } from "@/lib/projects";
import { Markdown } from "./Markdown";

export function ProjectEntry({ project }: { project: ResearchProject }) {
  const actions = [
    { label: "GitHub", url: project.github_url },
    project.palomar_url && { label: "Palomar", url: project.palomar_url },
    project.paper_url && { label: "Paper", url: project.paper_url },
    project.arxiv_url && { label: "arXiv", url: project.arxiv_url },
    project.doi && { label: "DOI", url: `https://doi.org/${project.doi}` },
    ...project.additional_links,
  ].filter(Boolean) as { label: string; url: string }[];

  return (
    <article className="project-entry" id={project.slug}>
      <div className="project-topline">
        <div>
          <p className="eyebrow">{project.year}</p>
          <h2>{project.title}</h2>
        </div>
        <span className="status">{project.status}</span>
      </div>

      <p className="project-headline">{project.headline}</p>
      <div className="prose project-description">
        <Markdown>{project.description}</Markdown>
        {project.summary && <Markdown>{project.summary}</Markdown>}
      </div>

      {project.topics.length > 0 && (
        <ul className="topic-list" aria-label="Research topics">
          {project.topics.map((topic) => (
            <li key={topic}>{topic}</li>
          ))}
        </ul>
      )}

      {(project.date ||
        project.formalisation_system ||
        project.verification_status ||
        project.palomar_id ||
        project.palomar_id ||
        project.arxiv_id ||
        project.doi) && (
        <dl className="project-details">
          {project.date && (
            <div>
              <dt>Date</dt>
              <dd>{project.date}</dd>
            </div>
          )}
          {project.formalisation_system && (
            <div>
              <dt>Formalisation</dt>
              <dd>{project.formalisation_system}</dd>
            </div>
          )}
          {project.verification_status && (
            <div>
              <dt>Verification</dt>
              <dd>{project.verification_status}</dd>
            </div>
          )}
          {project.palomar_id && (
            <div>
              <dt>Palomar</dt>
              <dd>{project.palomar_id}</dd>
            </div>
          )}
          {project.arxiv_id && (
            <div>
              <dt>arXiv</dt>
              <dd>{project.arxiv_id}</dd>
            </div>
          )}
          {project.doi && (
            <div>
              <dt>DOI</dt>
              <dd>{project.doi}</dd>
            </div>
          )}
        </dl>
      )}

      {project.authorship && <p className="attribution">{project.authorship}</p>}
      {project.original_problem_source && (
        <p className="attribution">Source attribution: {project.original_problem_source}</p>
      )}

      {actions.length > 0 && (
        <div className="project-actions" aria-label={`${project.title} links`}>
          {actions.map((action) => (
            <Link key={`${action.label}-${action.url}`} href={action.url}>
              {action.label} <span aria-hidden="true">↗</span>
            </Link>
          ))}
        </div>
      )}
    </article>
  );
}
