import type { OrnamentKind, ParticleKind } from "@/data/invitationStyles";

/** Section divider — one distinct glyph per ornament kind. */
export function Divider({ kind }: { kind: OrnamentKind }) {
  const common = {
    className: "iv-divider",
    width: 150,
    height: 22,
    viewBox: "0 0 150 22",
    "aria-hidden": true,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.2,
    strokeLinecap: "round" as const,
  };
  switch (kind) {
    case "leaf":
      return (
        <svg {...common}>
          <path d="M6 11h48M96 11h48" opacity=".6" />
          <path d="M75 3c8 0 12 5 12 8s-4 8-12 8c-2-3-3-5-3-8s1-5 3-8z" fill="currentColor" stroke="none" opacity=".9" />
          <path d="M75 4v15" stroke="var(--iv-paper)" />
        </svg>
      );
    case "wave":
      return (
        <svg {...common}>
          <path d="M4 11c6-6 12 6 18 0s12 6 18 0 12 6 18 0M92 11c6-6 12 6 18 0s12 6 18 0 12 6 18 0" opacity=".7" />
          <circle cx="75" cy="11" r="3" fill="currentColor" stroke="none" />
        </svg>
      );
    case "baroque":
      return (
        <svg {...common}>
          <path d="M4 11h40c6 0 8-6 14-6s6 5 3 7-6 0-4-3M146 11h-40c-6 0-8-6-14-6s-6 5-3 7 6 0 4-3" opacity=".8" />
          <path d="M75 3l4 8-4 8-4-8z" fill="currentColor" stroke="none" />
        </svg>
      );
    case "tile":
      return (
        <svg {...common}>
          <path d="M6 11h44M100 11h44" opacity=".6" />
          {[0, 1, 2].map((i) => (
            <path key={i} d={`M${61 + i * 14} 11l6-6 6 6-6 6z`} fill={i === 1 ? "currentColor" : "none"} />
          ))}
        </svg>
      );
    case "stage":
      return (
        <svg {...common}>
          <path d="M6 11h54M90 11h54" opacity=".7" />
          <path d="M75 2l2.6 6.2 6.6.5-5 4.3 1.6 6.5L75 16l-5.8 3.5 1.6-6.5-5-4.3 6.6-.5z" fill="currentColor" stroke="none" />
        </svg>
      );
    case "wax":
      return (
        <svg {...common}>
          <path d="M6 11h52M92 11h52" opacity=".6" />
          <circle cx="75" cy="11" r="7" fill="currentColor" stroke="none" opacity=".9" />
          <circle cx="75" cy="11" r="4" stroke="var(--iv-paper)" />
        </svg>
      );
    case "floral":
      return (
        <svg {...common}>
          <path d="M6 11h52M92 11h52" opacity=".6" />
          {[0, 72, 144, 216, 288].map((a) => (
            <ellipse key={a} cx="75" cy="6.5" rx="2.6" ry="4.5" transform={`rotate(${a} 75 11)`} fill="currentColor" stroke="none" opacity=".85" />
          ))}
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <path d="M6 11h58M86 11h58" opacity=".6" />
          <circle cx="75" cy="11" r="2.4" fill="currentColor" stroke="none" />
        </svg>
      );
  }
}

/** Ambient, purely decorative particles. Positions are deterministic (no hydration drift). */
export function Particles({ kind }: { kind: ParticleKind }) {
  if (kind === "none") return null;
  const n = kind === "leaves" ? 16 : kind === "petals" ? 14 : kind === "sparkles" ? 22 : kind === "dust" ? 18 : 6;
  return (
    <div className={`iv-particles iv-particles--${kind}`} aria-hidden="true">
      {Array.from({ length: n }, (_, i) => {
        const left = (i * 37 + 11) % 100;
        const delay = -((i * 53) % 90) / 10;
        const dur = 9 + ((i * 29) % 70) / 10;
        const size = 10 + ((i * 17) % 14);
        const hue = i % 3;
        return (
          <span
            key={i}
            data-h={hue}
            style={{
              left: `${left}%`,
              ...(kind === "sparkles" || kind === "dust" ? { top: `${(i * 47 + 5) % 92}%` } : {}),
              animationDelay: `${delay}s`,
              animationDuration: `${dur}s`,
              width: kind === "ripples" ? `${60 + i * 28}px` : size,
              height: kind === "ripples" ? `${60 + i * 28}px` : size,
            }}
          />
        );
      })}
    </div>
  );
}
