import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description:
    "About John Fairfax-Ball: background, research interests and approach to independent mathematical research.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <section className="shell page-block narrow">
      <header className="page-intro">
        <p className="eyebrow">About me</p>
        <h1>Curiosity, computation and proof.</h1>
        <p>
          I&apos;m John Fairfax-Ball, an independent researcher based in the UK,
          working mainly in discrete mathematics, computational mathematics
          and formal verification.
        </p>
      </header>

      <div className="prose about-copy">
        <h2>Background</h2>
        <p>
          I have a BA (Hons) undergraduate degree. My mathematical research is
          self-directed, developed outside a conventional academic
          mathematics appointment.
        </p>

        <h2>Research interests</h2>
        <p>
          I&apos;m particularly interested in combinatorics, graph theory,
          number theory and probabilistic questions about finite structures.
          Recent projects have examined graph pebbling and stacking on trees,
          restricted binomial-coefficient greatest common divisors, and
          random greedy independent sets.
        </p>

        <h2>How I work</h2>
        <p>
          I like problems that can be approached from several directions:
          exact computation to explore examples or search for counterexamples,
          mathematical reasoning to explain the pattern, and formal proof in
          Lean 4 when it adds confidence. Code, arguments, papers and
          verification details are documented in the individual repositories.
        </p>
        <p>
          A computational experiment, a proved theorem, a machine-checked
          formalisation and a published paper are not interchangeable.
          The research catalogue distinguishes these stages, and links to
          the underlying evidence. A preprint or a verification registry
          record should not be mistaken for journal peer review.
        </p>

        <p className="about-actions">
          <Link href="/#research">Explore the research ↗</Link>
          <Link href={siteConfig.github}>View the GitHub profile ↗</Link>
          <Link href="/contact">Get in touch ↗</Link>
        </p>
      </div>
    </section>
  );
}
