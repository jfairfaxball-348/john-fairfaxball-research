import type { Metadata } from "next";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact John Fairfax-Ball by email or find his research on GitHub.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <section className="shell page-block narrow">
      <header className="page-intro">
        <p className="eyebrow">Correspondence</p>
        <h1>Get in touch</h1>
        <p>
          Questions about a result, corrections and research correspondence
          are welcome. You can email me directly or browse the open research
          repositories on GitHub.
        </p>
      </header>
      <div className="contact-rows">
        <div className="contact-row">
          <span>Email</span>
          <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>
        </div>
        <div className="contact-row">
          <span>GitHub</span>
          <a href={siteConfig.github}>github.com/jfairfaxball-348</a>
        </div>
      </div>
    </section>
  );
}
