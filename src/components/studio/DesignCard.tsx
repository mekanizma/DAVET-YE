import type { CSSProperties } from "react";
import { RATIOS, type DesignState, type FontKind } from "@/data/designs";
import StudioLayers from "./StudioLayers";

/** Studio invite fonts — match davetiyemgo.com Cinzel / Great Vibes / Cormorant. */
const FONT_VAR: Record<FontKind, string> = {
  script: "var(--dc-font-script)",
  display: "var(--dc-font-display)",
  condensed: "var(--dc-font-condensed)",
  serif: "var(--dc-font-serif)",
  body: "var(--dc-font-body)",
};

/** Purely presentational card preview. Sizes are in cqw so the card scales to any container. */
export default function DesignCard({
  design,
  watermark = false,
  watermarkLabel,
  selected,
  className = "",
}: {
  design: DesignState;
  watermark?: boolean;
  watermarkLabel?: string;
  selected?: string | null;
  className?: string;
}) {
  const r = RATIOS[design.ratio];
  const hasCover = Boolean(design.cover);
  const layers = design.layers || [];
  const style = {
    aspectRatio: `${r.w} / ${r.h}`,
    background: hasCover
      ? `center / cover no-repeat url(${JSON.stringify(design.cover)}), linear-gradient(165deg, ${design.bg}, ${design.bg2})`
      : `linear-gradient(165deg, ${design.bg}, ${design.bg2})`,
    color: design.ink,
    ["--dc-accent" as string]: design.accent,
  } as CSSProperties;

  return (
    <div
      className={`dcard dcard--${design.frame}${hasCover ? " dcard--cover" : ""}${layers.length ? " dcard--layers" : ""} ${className}`}
      style={style}
      data-ratio={design.ratio}
    >
      {layers.length ? <StudioLayers layers={layers} /> : null}
      {hasCover ? <span className="dcard__veil" aria-hidden="true" /> : null}
      {design.frame !== "none" && <span className="dcard__frame" aria-hidden="true" />}
      {design.frame === "ornate" && (
        <>
          <span className="dcard__corner dcard__corner--tl" aria-hidden="true" />
          <span className="dcard__corner dcard__corner--tr" aria-hidden="true" />
          <span className="dcard__corner dcard__corner--bl" aria-hidden="true" />
          <span className="dcard__corner dcard__corner--br" aria-hidden="true" />
        </>
      )}
      {design.blocks.map((b) => {
        if (!b.text.trim()) return null;
        const hasBox = typeof b.x === "number" && typeof b.w === "number" && b.w > 0;
        const blockStyle: CSSProperties = {
          top: `${b.y}%`,
          fontSize: `${b.size}cqw`,
          fontFamily: FONT_VAR[b.font],
          color: b.color || (b.tone === "accent" ? design.accent : design.ink),
          letterSpacing: `${b.letterSpacing ?? 0}em`,
          lineHeight: b.lineHeight ?? 1.25,
          textAlign: b.align || "center",
          fontWeight: (b.weight as CSSProperties["fontWeight"]) || (b.font === "display" ? 600 : b.font === "condensed" ? 400 : undefined),
          textTransform: b.font === "condensed" ? "uppercase" : undefined,
          whiteSpace: "pre-line",
          overflowWrap: "break-word",
          wordBreak: "normal",
        };
        if (hasBox) {
          blockStyle.left = `${b.x}%`;
          blockStyle.width = `${b.w}%`;
          blockStyle.right = "auto";
        }
        return (
          <p
            key={b.id}
            data-block={b.id}
            className={`dcard__block${selected === b.id ? " is-selected" : ""}${hasBox ? " dcard__block--boxed" : ""}`}
            style={blockStyle}
          >
            {b.text}
          </p>
        );
      })}
      {watermark && (
        <span className="dcard__wm" aria-hidden="true">
          {watermarkLabel || "ÖRNEK · Davetanisi"}
        </span>
      )}
    </div>
  );
}
