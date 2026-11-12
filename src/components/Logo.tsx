import Image from "next/image";
import Link from "next/link";

export default function Logo({
  className = "",
  width = 132,
  priority = false,
}: {
  className?: string;
  width?: number;
  priority?: boolean;
}) {
  return (
    <Link href="/tr" className={`logo ${className}`} aria-label="Davetanisi ana sayfa">
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
