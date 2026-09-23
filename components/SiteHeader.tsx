import Link from "next/link";

const nav = [
  ["Home", "/"],
  ["Research", "/research"],
  ["About", "/about"],
  ["Contact", "/contact"],
] as const;

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Link className="wordmark" href="/">
          John Fairfax-Ball
        </Link>
        <nav aria-label="Primary navigation">
          <ul className="nav-list">
            {nav.map(([label, href]) => (
              <li key={href}>
                <Link href={href}>{label}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
