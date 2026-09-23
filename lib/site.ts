export const siteConfig = {
  name: "John Fairfax-Ball",
  title: "John Fairfax-Ball — Mathematical Research",
  description:
    "Independent mathematical research in discrete mathematics, computational mathematics and formal verification.",
  github: "https://github.com/jfairfaxball-348",
};

export function getSiteUrl() {
  const explicitUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  const siteUrl = explicitUrl ?? (vercelUrl ? `https://${vercelUrl}` : "http://localhost:3000");
  return siteUrl.replace(/\/$/, "");
}
