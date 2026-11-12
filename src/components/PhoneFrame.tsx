import type { CSSProperties, ReactNode } from "react";

export default function PhoneFrame({
  children,
  className = "",
  style,
  label,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  label?: string;
}) {
  return (
    <div className={`phone ${className}`} style={style} role={label ? "group" : undefined} aria-label={label}>
      <span className="phone__island" aria-hidden="true" />
      <div className="phone__screen">{children}</div>
    </div>
  );
}
