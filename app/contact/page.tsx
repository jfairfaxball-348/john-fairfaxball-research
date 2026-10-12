import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact John Fairfax-Ball by email.",
};

export default function ContactPage() {
  return (
    <section className="shell page-block narrow">
      <header className="page-intro">
        <p className="eyebrow">Contact</p>
        <h1>Contact</h1>
      </header>
      <div className="contact-row">
        <span>Email</span>
        <a href="mailto:jfairfaxball@gmail.com">jfairfaxball@gmail.com</a>
      </div>
    </section>
  );
}
