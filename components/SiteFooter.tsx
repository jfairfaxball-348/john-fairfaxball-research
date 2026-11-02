import Link from "next/link";
import { siteConfig } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="shell footer-inner">
        <p>© {new Date().getFullYear()} John Fairfax-Ball</p>
        <p className="footer-links">
          <Link href={siteConfig.github}>GitHub</Link>
          <Link href={`mailto:${siteConfig.email}`}>Email</Link>
        </p>
      </div>
    </footer>
  );
}
