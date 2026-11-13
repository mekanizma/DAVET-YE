"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** Marketing chrome stays off the invitation studio so the steps match the original flow. */
export default function SiteFrame({
  header,
  footer,
  banner,
  children,
}: {
  header: ReactNode;
  footer: ReactNode;
  banner: ReactNode;
  children: ReactNode;
}) {
  const path = usePathname() || "";
  if (/^\/(tr|en)\/davetiye-olustur/.test(path)) {
    return <div className="studio-root">{children}</div>;
  }
  return (
    <div className="site">
      {header}
      <main id="main" tabIndex={-1}>{children}</main>
      {footer}
      {banner}
    </div>
  );
}
