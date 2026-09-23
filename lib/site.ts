export const siteConfig = {
  name: "John Fairfax-Ball",
  title: "John Fairfax-Ball — Mathematical Research",
  description:
    "Independent mathematical research in discrete mathematics, computational mathematics and formal verification.",
  github: "https://github.com/jfairfaxball-348",
};

export function getSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}
