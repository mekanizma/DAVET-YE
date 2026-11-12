import type { ReactNode } from "react";

export default function ContentPage({
  eyebrow,
  title,
  lead,
  draft,
  children,
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
  /** Mark legal texts as local placeholders */
  draft?: boolean;
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
        {draft && (
          <p className="alert alert--info" role="note">
            Bu sayfa bu yerel kopya için hazırlanmış örnek bir metindir; gerçek bir şirketin hukuki metni
            değildir ve bağlayıcılığı yoktur.
          </p>
        )}
        <div className="prose">{children}</div>
      </div>
    </section>
  );
}
