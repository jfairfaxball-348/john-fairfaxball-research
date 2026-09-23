import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description: "About John Fairfax-Ball's independent mathematical research programme.",
};

export default function AboutPage() {
  return (
    <section className="shell page-block narrow">
      <header className="page-intro">
        <p className="eyebrow">About</p>
        <h1>Independent mathematical research</h1>
      </header>
      <div className="prose">
        <p>
          John Fairfax-Ball is an independent researcher working on small, concrete problems in discrete mathematics, computational mathematics and formal verification.
        </p>
        <p>
          The programme emphasises reproducible work: mathematical arguments are paired with code, finite certificates or Lean formalisation where those tools materially strengthen the result. Completed formal work may also be submitted for independent verification.
        </p>
        <p>
          A fuller biography and additional scholarly profiles will be added when there is appropriate source material to publish.
        </p>
        <p>
          <Link href={siteConfig.github}>GitHub profile ↗</Link>
        </p>
      </div>
    </section>
  );
}
