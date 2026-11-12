import type { CSSProperties } from "react";
import type { DesignLayer } from "@/data/designs";

function boxStyle(layer: DesignLayer): CSSProperties {
  const style: CSSProperties = {
    left: `${layer.x}%`,
    top: `${layer.y}%`,
    width: `${layer.w}%`,
    height: `${layer.h}%`,
    opacity: layer.opacity ?? 1,
  };
  if (layer.rotation) {
    style.transform = `rotate(${layer.rotation}deg)`;
    style.transformOrigin = "center center";
  }
  return style;
}

const CLIP: Record<string, string> = {
  diamond: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
  star: "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
  star4: "polygon(50% 0%, 62% 38%, 100% 50%, 62% 62%, 50% 100%, 38% 62%, 0% 50%, 38% 38%)",
  heart: "polygon(50% 92%, 8% 52%, 8% 34%, 22% 20%, 38% 20%, 50% 34%, 62% 20%, 78% 20%, 92% 34%, 92% 52%)",
  flower:
    "polygon(50% 0%, 62% 18%, 82% 12%, 78% 32%, 100% 42%, 80% 54%, 88% 74%, 68% 70%, 58% 90%, 50% 72%, 42% 90%, 32% 70%, 12% 74%, 20% 54%, 0% 42%, 22% 32%, 18% 12%, 38% 18%)",
};

function IconSvg({ name, color }: { name?: string; color: string }) {
  const stroke = color;
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke,
    strokeWidth: 1.4,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    width: "100%",
    height: "100%",
    "aria-hidden": true as const,
  };
  switch (name) {
    case "rings":
      return (
        <svg {...common}>
          <circle cx="9" cy="13" r="5.2" />
          <circle cx="15" cy="13" r="5.2" />
        </svg>
      );
    case "crown":
      return (
        <svg {...common}>
          <path d="M4 17h16l-1.2-8.5L14.5 12 12 5.5 9.5 12 5.2 8.5 4 17z" fill={stroke} stroke="none" />
          <path d="M4 17h16" />
        </svg>
      );
    case "rose":
      return (
        <svg {...common}>
          <circle cx="12" cy="11" r="3.2" />
          <path d="M12 7.2c2.2-2.4 5.8-1.4 5.8 1.6 0 3.4-3.4 5.6-5.8 7.4C9.6 14.4 6.2 12.2 6.2 8.8c0-3 3.6-4 5.8-1.6z" />
          <path d="M12 18.5v-2.2M10 20h4" />
        </svg>
      );
    case "wheat":
      return (
        <svg {...common}>
          <path d="M12 21V8" />
          <path d="M12 9c-2.4-1.2-4-1.2-5.2-.4M12 12c-2.6-1-4.2-.8-5.4.2M12 15c-2.4-.8-4-.4-5.2.6" />
          <path d="M12 9c2.4-1.2 4-1.2 5.2-.4M12 12c2.6-1 4.2-.8 5.4.2M12 15c2.4-.8 4-.4 5.2.6" />
          <path d="M12 6.5c0-2 1.4-3.5 1.4-3.5S15 4.5 15 6.5" />
        </svg>
      );
    case "tulipOttoman":
    case "tulip":
      return (
        <svg {...common}>
          <path d="M12 21v-7" />
          <path d="M12 14c-3.2-1.6-4.8-4.2-4.2-7.2C9.2 5.2 11 4.4 12 7c1-2.6 2.8-1.8 4.2-.2.6 3-1 5.6-4.2 7.2z" fill={stroke} stroke="none" />
          <path d="M8.5 18.5c2 .8 3.2.8 3.5.8s1.5 0 3.5-.8" />
        </svg>
      );
    case "sparkle":
      return (
        <svg {...common} fill={stroke} stroke="none">
          <path d="M12 2l1.4 6.2L20 10l-6.6 1.8L12 18l-1.4-6.2L4 10l6.6-1.8L12 2z" />
        </svg>
      );
    case "leaf":
    case "olive":
      return (
        <svg {...common}>
          <path d="M5 14c6-9 12-9 14-7-2 6-8 10-14 7z" />
          <path d="M7 15c3-2 7-4 10-5" />
        </svg>
      );
    default:
      return (
        <svg {...common} fill={stroke} stroke="none">
          <path d="M12 3l2.2 6.8H21l-5.4 4 2.1 6.7L12 16.8 6.3 20.5l2.1-6.7L3 9.8h6.8L12 3z" />
        </svg>
      );
  }
}

function ShapeLayer({ layer }: { layer: Extract<DesignLayer, { type: "shape" }> }) {
  const shape = layer.shape || "rect";
  const strokeW = layer.strokeWidth ? `${Math.max(layer.strokeWidth, 0.12)}cqw` : 0;
  const hasFill = Boolean(layer.fill && layer.fill !== "transparent");
  const base = boxStyle(layer);

  if (shape === "ellipse" || shape === "circle") {
    return (
      <span
        className="dcard__layer dcard__layer--shape is-ellipse"
        style={{
          ...base,
          background: hasFill ? layer.fill : "transparent",
          borderColor: layer.stroke || "transparent",
          borderWidth: strokeW || undefined,
          borderStyle: strokeW ? "solid" : undefined,
          borderRadius: "50%",
        }}
        aria-hidden="true"
      />
    );
  }

  if (shape === "arch") {
    return (
      <span
        className="dcard__layer dcard__layer--shape is-arch"
        style={{
          ...base,
          background: hasFill ? layer.fill : "transparent",
          borderColor: layer.stroke || "transparent",
          borderWidth: strokeW || undefined,
          borderStyle: strokeW ? "solid" : undefined,
          borderBottomWidth: strokeW ? strokeW : undefined,
        }}
        aria-hidden="true"
      />
    );
  }

  if (shape === "speech") {
    return (
      <span
        className="dcard__layer dcard__layer--shape is-speech"
        style={{ ...base, background: hasFill ? layer.fill : "transparent" }}
        aria-hidden="true"
      />
    );
  }

  if (shape === "wave") {
    return (
      <span className="dcard__layer dcard__layer--shape is-wave" style={base} aria-hidden="true">
        <svg viewBox="0 0 100 20" preserveAspectRatio="none" width="100%" height="100%">
          <path d="M0 12 Q 12.5 0 25 12 T 50 12 T 75 12 T 100 12 V20 H0 Z" fill={layer.fill || "#ccc"} />
        </svg>
      </span>
    );
  }

  if (CLIP[shape]) {
    return (
      <span
        className={`dcard__layer dcard__layer--shape is-${shape}`}
        style={{
          ...base,
          background: hasFill ? layer.fill : layer.stroke || "#888",
          clipPath: CLIP[shape],
          WebkitClipPath: CLIP[shape],
        }}
        aria-hidden="true"
      />
    );
  }

  return (
    <span
      className="dcard__layer dcard__layer--shape"
      style={{
        ...base,
        background: hasFill ? layer.fill : "transparent",
        borderColor: layer.stroke || "transparent",
        borderWidth: strokeW || undefined,
        borderStyle: strokeW ? "solid" : undefined,
        borderRadius: `${layer.radius || 0}cqw`,
      }}
      aria-hidden="true"
    />
  );
}

export default function StudioLayers({ layers }: { layers: DesignLayer[] }) {
  return (
    <>
      {layers.map((layer, i) => {
        if (layer.type === "shape") return <ShapeLayer key={`l${i}`} layer={layer} />;
        if (layer.type === "line") {
          return (
            <span
              key={`l${i}`}
              className="dcard__layer dcard__layer--line"
              style={{
                ...boxStyle(layer),
                background: layer.stroke || "#000",
                height: `${Math.max(layer.strokeWidth || 0.35, 0.15)}%`,
              }}
              aria-hidden="true"
            />
          );
        }
        if (layer.type === "image") {
          return (
            <span
              key={`l${i}`}
              className="dcard__layer dcard__layer--image"
              style={{
                ...boxStyle(layer),
                backgroundImage: `url(${JSON.stringify(layer.src)})`,
              }}
              aria-hidden="true"
            />
          );
        }
        if (layer.type === "icon") {
          // Keep icons square: width is % of card width; height follows aspect-ratio.
          const style: CSSProperties = {
            left: `${layer.x}%`,
            top: `${layer.y}%`,
            width: `${layer.w}%`,
            height: "auto",
            aspectRatio: "1 / 1",
            opacity: layer.opacity ?? 1,
          };
          if (layer.rotation) {
            style.transform = `rotate(${layer.rotation}deg)`;
            style.transformOrigin = "center center";
          }
          return (
            <span key={`l${i}`} className="dcard__layer dcard__layer--icon" style={style} aria-hidden="true">
              <IconSvg name={layer.icon} color={layer.stroke || "#888"} />
            </span>
          );
        }
        return null;
      })}
    </>
  );
}
