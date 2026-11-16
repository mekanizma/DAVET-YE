import type { ReactNode } from "react";

export default async function ContentPage({
  eyebrow,
  title,
  lead,
  children,
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
  children: ReactNode;
}) {
  return (
    <section className="section section--tight">
      <div className="wrap wrap--sm">
        <header className="page-title">
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h1>{title}</h1>
          {lead && <p>{lead}</p>}
        </header>
        <div className="prose">{children}</div>
      </div>
    </section>
  );
}
