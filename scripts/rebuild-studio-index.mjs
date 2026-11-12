/**
 * Rebuild studio-designs/index.json summaries from local design JSON files
 * (preserves newlines, letter-spacing, boxes, shapes/lines/images; no network).
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "src/data/studio-designs");
const INDEX = path.join(OUT, "index.json");
const boot = JSON.parse(fs.readFileSync(path.join(OUT, "_boot.json"), "utf8"));

function textOf(el) {
  return String(el?.text || el?.label || "")
    .replace(/\\n/g, "\n")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function mapFont(fontName = "") {
  const f = String(fontName || "");
  if (/script|brush|hand|vibes|allura|alex|parisienne|pinyon|sacramento|ephesis|monte carlo|birthstone|mea culpa|imperial|italianno|corinthia|arizonia|yellowtail|windsong|waterfall|engagement|send flowers|bonheur|carattere|ballet|beau rivage|allison|charm|dancing|norican|petit formal|luxurious|ingrid|style script|playball|amatic/i.test(f)) {
    return "script";
  }
  if (/bebas|league spartan|oswald|limelight|aboreto/i.test(f)) {
    return "condensed";
  }
  if (/cinzel|playfair|abril|yeseva|gloock|rozha|poiret|dm serif|gilda|forum|italiana|marcellus/i.test(f)) {
    return "display";
  }
  if (/cormorant|fraunces|libre|garamond|eb garamond|lora|spectral|bodoni|crimson|cardo|castoro|bellefair|old standard|sorts mill|unna/i.test(f)) {
    return "serif";
  }
  return "body";
}

function pct(n, total) {
  return Math.round(((n || 0) / total) * 1000) / 10;
}

function summarizeDesign(design) {
  const page = design?.pages?.[0] || {};
  const canvasW = design.canvas?.width || 450;
  const canvasH = design.canvas?.height || 800;
  const els = (page.elements || []).filter((e) => !e.hidden);

  const layers = [];
  for (const e of els) {
    if (e.type === "text" || e.type === "field") continue;
    const base = {
      x: pct(e.x, canvasW),
      y: pct(e.y, canvasH),
      w: pct(e.w, canvasW),
      h: pct(e.h, canvasH),
      opacity: typeof e.opacity === "number" ? e.opacity : 1,
      rotation: e.rotation || 0,
    };
    if (e.type === "shape") {
      layers.push({
        ...base,
        type: "shape",
        shape: e.shape || "rect",
        fill: e.fill || e.style?.fill || "transparent",
        stroke: e.stroke || e.style?.stroke || null,
        strokeWidth: pct(e.strokeWidth || 0, canvasW),
        radius: pct(e.radius || 0, canvasW),
      });
    } else if (e.type === "line") {
      layers.push({
        ...base,
        type: "line",
        stroke: e.stroke || e.style?.stroke || e.fill || "#000",
        // keep visual thickness from element height on canvas
        strokeWidth: Math.max(0.15, pct(Math.max(e.h || 0, e.strokeWidth || 2), canvasH)),
      });
    } else if (e.type === "image" && (e.src || e.image)) {
      layers.push({
        ...base,
        type: "image",
        src: String(e.src || e.image).split("?")[0],
      });
    } else if (e.type === "icon") {
      layers.push({
        ...base,
        type: "icon",
        icon: e.icon || e.name || "sparkle",
        stroke: e.stroke || e.fill || e.style?.stroke || "#888",
      });
    }
  }

  const textEls = els.filter((e) => (e.type === "text" || e.type === "field") && textOf(e));
  const texts = textEls
    .slice()
    .sort((a, b) => (a.y || 0) - (b.y || 0) || (b.style?.size || 0) - (a.style?.size || 0))
    .map((e) => {
      const fontName = e.style?.font || e.font || "";
      const sizePx = e.style?.size || 16;
      const ls = e.style?.letterSpacing;
      const lh = e.style?.lineHeight;
      const weight = e.style?.weight || e.style?.fontWeight || null;
      return {
        text: textOf(e),
        y: Math.round((((e.y || 0) + (e.h || 0) / 2) / canvasH) * 1000) / 10,
        size: Math.max(1.8, Math.min(22, (sizePx / canvasW) * 100)),
        font: mapFont(fontName),
        color: e.style?.color || null,
        letterSpacing: typeof ls === "number" ? ls : 0,
        lineHeight: typeof lh === "number" ? lh : 1.25,
        x: pct(e.x, canvasW),
        w: pct(e.w || canvasW * 0.84, canvasW),
        align: e.style?.align || e.align || "center",
        weight: weight ? Number(weight) || weight : null,
      };
    });

  const cover =
    page.backgroundImage ||
    design.background?.image ||
    els.find((e) => e.type === "image" && (e.src || e.image))?.src ||
    els.find((e) => e.type === "image" && (e.src || e.image))?.image ||
    null;
  const palette = Array.isArray(design.colors) ? design.colors : [];
  const ink =
    texts.find((t) => t.font === "script" && t.color)?.color ||
    palette.find((c) => c && c.toLowerCase() !== (design.background?.color || "").toLowerCase() && !/^#fff/i.test(c)) ||
    "#3b2a14";
  const accent =
    texts.find((t) => t.font === "display" && t.color)?.color ||
    palette.find((c) => c && c !== ink && !/^#f/i.test(c)) ||
    "#b8894e";

  return {
    bg: design.background?.color || page.background || "#f7efe1",
    bg2: palette[4] || palette[0] || design.background?.color || "#efe4d2",
    ink,
    accent,
    cover: page.backgroundImage || design.background?.image || null,
    layers,
    texts,
  };
}

const files = fs
  .readdirSync(OUT)
  .filter((f) => f.endsWith(".json") && f !== "index.json" && !f.startsWith("_"));

const index = [];
let nl = 0;
let layerN = 0;

for (const file of files) {
  const raw = JSON.parse(fs.readFileSync(path.join(OUT, file), "utf8"));
  const design = raw.design;
  if (!design) continue;
  const summary = summarizeDesign(design);
  raw.summary = summary;
  fs.writeFileSync(path.join(OUT, file), JSON.stringify(raw, null, 2));

  nl += summary.texts.filter((t) => t.text.includes("\n")).length;
  layerN += summary.layers.length;

  index.push({
    id: raw.slug || file.replace(/\.json$/, ""),
    name: raw.name || raw.slug,
    category: raw.category || "wedding",
    categoryLabel: raw.categoryLabel || "Nişan & Düğün",
    featured: Boolean(raw.featured),
    width: raw.width || design?.canvas?.width || 450,
    height: raw.height || design?.canvas?.height || 800,
    bg: summary.bg,
    bg2: summary.bg2,
    ink: summary.ink,
    accent: summary.accent,
    cover: summary.cover,
    layers: summary.layers,
    texts: summary.texts,
  });
}

index.sort((a, b) => Number(b.featured) - Number(a.featured) || a.name.localeCompare(b.name, "tr"));
fs.writeFileSync(
  INDEX,
  JSON.stringify(
    {
      at: new Date().toISOString(),
      total: index.length,
      categories: boot.categories || [],
      items: index,
    },
    null,
    2,
  ),
);

console.log(`rebuilt ${index.length} designs; multilineTexts=${nl}; layers=${layerN}`);
