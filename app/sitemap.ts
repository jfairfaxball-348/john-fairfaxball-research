import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  return ["", "/research", "/collatz", "/about", "/contact"].map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "/research" ? "weekly" : path === "/collatz" ? "daily" : "monthly",
    priority: path === "" ? 1 : path === "/research" || path === "/collatz" ? 0.9 : 0.6,
  }));
}
