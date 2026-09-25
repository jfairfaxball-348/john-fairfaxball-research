import { z } from "zod";

export const RESEARCH_METADATA_FILENAME = "meta_data_for_website.json";
export const RESEARCH_METADATA_SCHEMA_VERSION = 1 as const;

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

const additionalLinkSchema = z
  .object({
    label: z.string().min(1),
    url: z.url(),
  })
  .strict();

const optionalText = z.string().min(1).nullable().optional();
const optionalUrl = z.url().nullable().optional();

export const projectMetadataSchema = z
  .object({
    schema_version: z.literal(RESEARCH_METADATA_SCHEMA_VERSION),
    title: z.string().min(1),
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    status: z.string().min(1).max(120),
    headline: z.string().min(1),
    year: z.number().int().min(1900).max(2100),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
    description: z.string().min(1),
    summary: optionalText,
    topics: z.array(z.string().min(1)).default([]),
    github_url: z.url().refine((url) => url.startsWith("https://github.com/"), {
      message: "github_url must be an https://github.com/ URL",
    }),
    palomar_id: optionalText,
    palomar_url: optionalUrl,
    paper_url: optionalUrl,
    arxiv_id: optionalText,
    arxiv_url: optionalUrl,
    doi: z.string().min(1).max(255).regex(/^10\.\d{4,9}\/\S+$/).nullable().optional(),
    formalisation_system: optionalText,
    verification: optionalText,
    attribution: optionalText,
    original_source: optionalText,
    featured: z.boolean().default(false),
    additional_links: z.array(additionalLinkSchema).default([]),
  })
  .strict();

export type ResearchProject = z.infer<typeof projectMetadataSchema>;

export type MetadataDiagnosticKind = "missing" | "invalid" | "fetch_error";

export type MetadataDiagnostic = {
  repository: string;
  kind: MetadataDiagnosticKind;
  message: string;
};

export type MetadataDecodeResult =
  | { kind: "ok"; project: ResearchProject }
  | { kind: MetadataDiagnosticKind; diagnostic: MetadataDiagnostic };

function issueSummary(error: z.ZodError) {
  return error.issues
    .map((issue) => {
      const path = issue.path.length > 0 ? issue.path.map(String).join(".") : "metadata";
      return `${path}: ${issue.message}`;
    })
    .join("; ");
}

export async function decodeProjectMetadataResponse(
  repository: string,
  response: Response,
): Promise<MetadataDecodeResult> {
  if (response.status === 404) {
    return {
      kind: "missing",
      diagnostic: {
        repository,
        kind: "missing",
        message: `${RESEARCH_METADATA_FILENAME} was not found`,
      },
    };
  }

  if (!response.ok) {
    return {
      kind: "fetch_error",
      diagnostic: {
        repository,
        kind: "fetch_error",
        message: `GitHub metadata request failed with HTTP ${response.status}`,
      },
    };
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    return {
      kind: "invalid",
      diagnostic: {
        repository,
        kind: "invalid",
        message: `${RESEARCH_METADATA_FILENAME} is not valid JSON`,
      },
    };
  }

  const parsed = projectMetadataSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      kind: "invalid",
      diagnostic: {
        repository,
        kind: "invalid",
        message: `Metadata failed schema validation: ${issueSummary(parsed.error)}`,
      },
    };
  }

  return { kind: "ok", project: parsed.data };
}
