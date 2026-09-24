import {
  decodeProjectMetadataResponse,
  type MetadataDiagnostic,
  RESEARCH_METADATA_FILENAME,
  type ResearchProject,
} from "@/lib/research-metadata";
import { researchRepositorySources, type ResearchRepositorySource } from "@/lib/research-repositories";

export type { ResearchProject } from "@/lib/research-metadata";

export const RESEARCH_METADATA_REVALIDATE_SECONDS = 5 * 60;
const RESEARCH_METADATA_CACHE_VERSION = "3";

function metadataUrl(source: ResearchRepositorySource) {
  return `https://raw.githubusercontent.com/${source.repository}/${source.ref}/${RESEARCH_METADATA_FILENAME}?website-cache=${RESEARCH_METADATA_CACHE_VERSION}`;
}

async function fetchProjectMetadata(source: ResearchRepositorySource) {
  let response: Response;

  try {
    response = await fetch(metadataUrl(source), {
      headers: { Accept: "application/json" },
      next: { revalidate: RESEARCH_METADATA_REVALIDATE_SECONDS },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown network error";
    return {
      kind: "fetch_error" as const,
      diagnostic: {
        repository: source.repository,
        kind: "fetch_error" as const,
        message: `Unable to fetch ${RESEARCH_METADATA_FILENAME}: ${message}`,
      },
    };
  }

  return decodeProjectMetadataResponse(source.repository, response);
}

function reportDiagnostics(diagnostics: MetadataDiagnostic[]) {
  for (const diagnostic of diagnostics) {
    const line = `[research metadata] ${diagnostic.repository}: ${diagnostic.message}`;
    if (diagnostic.kind === "missing") {
      console.warn(line);
    } else {
      console.error(line);
    }
  }
}

export async function getResearchProjects(): Promise<{
  projects: ResearchProject[];
  diagnostics: MetadataDiagnostic[];
}> {
  const results = await Promise.all(
    researchRepositorySources.map(async (source) => ({
      source,
      result: await fetchProjectMetadata(source),
    })),
  );
  const projects: ResearchProject[] = [];
  const diagnostics: MetadataDiagnostic[] = [];
  const seenSlugs = new Set<string>();

  for (const { source, result } of results) {
    if (result.kind !== "ok") {
      diagnostics.push(result.diagnostic);
      continue;
    }

    if (seenSlugs.has(result.project.slug)) {
      diagnostics.push({
        repository: source.repository,
        kind: "invalid",
        message: `Duplicate project slug \"${result.project.slug}\"`,
      });
      continue;
    }

    seenSlugs.add(result.project.slug);
    projects.push(result.project);
  }

  projects.sort((a, b) => {
    const aDate = a.date ?? `${a.year}-01-01`;
    const bDate = b.date ?? `${b.year}-01-01`;
    const dateOrder = bDate.localeCompare(aDate);
    return dateOrder !== 0 ? dateOrder : a.title.localeCompare(b.title);
  });

  reportDiagnostics(diagnostics);
  return { projects, diagnostics };
}
