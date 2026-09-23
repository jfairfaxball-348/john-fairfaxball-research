import Link from "next/link";
import { siteConfig } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="shell footer-inner">
        <p>© {new Date().getFullYear()} John Fairfax-Ball</p>
        <p>
          <Link href={siteConfig.github}>GitHub</Link>
        </p>
      </div>
    </footer>
  );
}
