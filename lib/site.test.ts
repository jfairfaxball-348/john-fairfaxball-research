import assert from "node:assert/strict";
import test from "node:test";
import { resolveSiteUrl } from "./site.ts";

test("uses the explicit canonical URL when populated", () => {
  assert.equal(
    resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: " https://research.example/ " }),
    "https://research.example",
  );
});

test("ignores blank Vercel production URL and falls back to VERCEL_URL", () => {
  assert.equal(
    resolveSiteUrl({
      NEXT_PUBLIC_SITE_URL: "",
      VERCEL_PROJECT_PRODUCTION_URL: "",
      VERCEL_URL: "john-fairfaxball-research-abc123.vercel.app",
    }),
    "https://john-fairfaxball-research-abc123.vercel.app",
  );
});

test("accepts a Vercel URL that already includes a scheme", () => {
  assert.equal(
    resolveSiteUrl({
      VERCEL_PROJECT_PRODUCTION_URL: "https://john-fairfaxball-research.vercel.app/",
    }),
    "https://john-fairfaxball-research.vercel.app",
  );
});

test("falls back to localhost when all configured URLs are blank", () => {
  assert.equal(
    resolveSiteUrl({
      NEXT_PUBLIC_SITE_URL: " ",
      VERCEL_PROJECT_PRODUCTION_URL: "",
      VERCEL_URL: " ",
    }),
    "http://localhost:3000",
  );
});
