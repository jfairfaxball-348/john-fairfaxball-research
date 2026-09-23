import Link from "next/link";
import type { ResearchProject } from "@/lib/projects";
import { Markdown } from "./Markdown";

export function ProjectEntry({ project }: { project: ResearchProject }) {
  const actions = [
    project.githubUrl && { label: "GitHub", url: project.githubUrl },
    project.palomarUrl && { label: "Palomar", url: project.palomarUrl },
    project.paperUrl && { label: "Paper", url: project.paperUrl },
    project.arxivUrl && { label: "arXiv", url: project.arxivUrl },
    ...project.links,
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
      </div>

      {project.topics.length > 0 && (
        <ul className="topic-list" aria-label="Research topics">
          {project.topics.map((topic) => (
            <li key={topic}>{topic}</li>
          ))}
        </ul>
      )}

      {(project.formalisationSystem || project.verification || project.palomarId) && (
        <dl className="project-details">
          {project.formalisationSystem && (
            <div>
              <dt>Formalisation</dt>
              <dd>{project.formalisationSystem}</dd>
            </div>
          )}
          {project.verification && (
            <div>
              <dt>Verification</dt>
              <dd>{project.verification}</dd>
            </div>
          )}
          {project.palomarId && (
            <div>
              <dt>Palomar</dt>
              <dd>{project.palomarId}</dd>
            </div>
          )}
        </dl>
      )}

      {project.attribution && <p className="attribution">{project.attribution}</p>}

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
