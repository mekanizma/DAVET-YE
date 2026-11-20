"use client";

import icons from "@/data/stage-icons.json";

type IconSpec = { label?: string; path: string };
const ICON_SET = icons as Record<string, IconSpec>;

export default function ComponentIcon({
  name,
  stroke = "#c9a45a",
  strokeWidth = 1.5,
  size = 40,
}: {
  name?: string;
  stroke?: string;
  strokeWidth?: number;
  size?: number;
}) {
  if (!name) return null;
  const spec = ICON_SET[name];
  if (!spec?.path) {
    return (
      <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
        <rect x="4" y="4" width="16" height="16" rx="3" fill="none" stroke={stroke} strokeWidth={strokeWidth} />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" className="ns-comp__svg">
      <path
        d={spec.path}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function hasStageIcon(name?: string) {
  return !!(name && ICON_SET[name]?.path);
}
