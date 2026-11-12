import type { ReactNode } from "react";

export default function SectionHead({
  eyebrow,
  title,
  lead,
  align = "center",
  as: Tag = "h2",
  id,
  heart = false,
  children,
}: {
  eyebrow?: string;
  title: ReactNode;
  lead?: ReactNode;
  align?: "center" | "left";
  as?: "h1" | "h2";
  id?: string;
  heart?: boolean;
  children?: ReactNode;
}) {
  return (
    <header className={`section-head section-head--${align}`}>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <Tag id={id} className="section-head__title">
        {title}
        {heart && (
          <svg className="section-head__heart" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" fill="none" stroke="currentColor" strokeWidth="1.6" />
          </svg>
        )}
      </Tag>
      {lead && <p className="section-head__lead">{lead}</p>}
      {children}
    </header>
  );
}

export function Ornament({ className = "" }: { className?: string }) {
  return (
    <svg className={`ornament ${className}`} width="120" height="18" viewBox="0 0 120 18" aria-hidden="true">
      <path d="M2 9h40M78 9h40" stroke="currentColor" strokeWidth="1" opacity=".7" />
      <path d="M60 2c2 3 2 5 0 7-2-2-2-4 0-7zm0 14c2-3 2-5 0-7-2 2-2 4 0 7zM54 9c3-2 5-2 6 0-1 2-3 2-6 0zm12 0c-3-2-5-2-6 0 1 2 3 2 6 0z" fill="currentColor" />
    </svg>
  );
}
