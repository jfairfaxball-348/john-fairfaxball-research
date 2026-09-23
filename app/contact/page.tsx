import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact and scholarly profile links for John Fairfax-Ball.",
};

export default function ContactPage() {
  return (
    <section className="shell page-block narrow">
      <header className="page-intro">
        <p className="eyebrow">Contact</p>
        <h1>Contact</h1>
        <p>Direct contact details and scholarly profile links will be added here as they are made public.</p>
      </header>
      <div className="contact-row">
        <span>GitHub</span>
        <Link href={siteConfig.github}>jfairfaxball-348 ↗</Link>
      </div>
    </section>
  );
}
