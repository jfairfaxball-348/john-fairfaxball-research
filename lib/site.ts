export const siteConfig = {
  name: "John Fairfax-Ball",
  title: "John Fairfax-Ball — Mathematical Research",
  description:
    "Independent mathematical research in discrete mathematics, computational mathematics and formal verification.",
  github: "https://github.com/jfairfaxball-348",
};

type SiteUrlEnvironment = {
  NEXT_PUBLIC_SITE_URL?: string;
  VERCEL_PROJECT_PRODUCTION_URL?: string;
  VERCEL_URL?: string;
};

function stripTrailingSlash(value: string) {
  return value.replace(/\/$/, "");
}

export function resolveSiteUrl(env: SiteUrlEnvironment) {
  const explicitUrl = env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicitUrl) {
    return stripTrailingSlash(explicitUrl);
  }

  const vercelHostname =
    env.VERCEL_PROJECT_PRODUCTION_URL?.trim() || env.VERCEL_URL?.trim();

  if (vercelHostname) {
    const url = /^https?:\/\//i.test(vercelHostname)
      ? vercelHostname
      : `https://${vercelHostname}`;
    return stripTrailingSlash(url);
  }

  return "http://localhost:3000";
}

export function getSiteUrl() {
  return resolveSiteUrl(process.env);
}
