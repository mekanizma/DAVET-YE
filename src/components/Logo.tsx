"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale, useLp } from "@/i18n/provider";

export default function Logo({
  className = "",
  width = 132,
  priority = false,
}: {
  className?: string;
  width?: number;
  priority?: boolean;
}) {
  const locale = useLocale();
  const lp = useLp();
  return (
    <Link href={lp()} className={`logo ${className}`} aria-label={locale === "en" ? "Davetanisi home" : "Davetanisi ana sayfa"}>
      <Image
        src="/img/logo.webp"
        alt="Davetanisi"
        width={width}
        height={Math.round(width * 0.32)}
        priority={priority}
        unoptimized
        style={{ width, height: "auto" }}
      />
    </Link>
  );
}
