import assert from "node:assert/strict";
import test from "node:test";
import { decodeProjectMetadataResponse, projectMetadataSchema } from "./research-metadata.ts";

const validMetadata = {
  schema_version: 1,
  title: "Example project",
  slug: "example-project",
  status: "Active research",
  headline: "A bounded example used only for schema tests.",
  year: 2026,
  description: "A description with inline mathematics such as $x^2$.",
  topics: ["Graph theory"],
  github_url: "https://github.com/example/example-project",
  featured: true,
};

test("valid metadata parses and applies optional defaults", () => {
  const parsed = projectMetadataSchema.parse(validMetadata);
  assert.deepEqual(parsed.additional_links, []);
  assert.equal(parsed.featured, true);
});

test("explicit nulls are accepted for absent optional scalar fields", () => {
  const parsed = projectMetadataSchema.parse({
    ...validMetadata,
    palomar_id: null,
    palomar_url: null,
    paper_url: null,
    arxiv_id: null,
    arxiv_url: null,
    doi: null,
    formalisation_system: null,
    verification: null,
    attribution: null,
    original_source: null,
  });
  assert.equal(parsed.paper_url, null);
  assert.equal(parsed.verification, null);
});

test("a missing metadata file is a controlled missing result", async () => {
  const result = await decodeProjectMetadataResponse(
    "example/example-project",
    new Response("", { status: 404 }),
  );

  if (result.kind === "missing") {
    assert.match(result.diagnostic.message, /meta_data_for_website\.json/);
  } else {
    assert.fail(`Expected missing metadata result, received ${result.kind}`);
  }
});

test("malformed optional fields are reported as invalid metadata", async () => {
  const result = await decodeProjectMetadataResponse(
    "example/example-project",
    Response.json({ ...validMetadata, palomar_url: "not-a-url" }),
  );

  if (result.kind === "invalid") {
    assert.match(result.diagnostic.message, /palomar_url/);
  } else {
    assert.fail(`Expected invalid metadata result, received ${result.kind}`);
  }
});

test("invalid JSON is reported deliberately", async () => {
  const result = await decodeProjectMetadataResponse(
    "example/example-project",
    new Response("{not-json", { status: 200, headers: { "content-type": "application/json" } }),
  );

  if (result.kind === "invalid") {
    assert.match(result.diagnostic.message, /not valid JSON/);
  } else {
    assert.fail(`Expected invalid metadata result, received ${result.kind}`);
  }
});
