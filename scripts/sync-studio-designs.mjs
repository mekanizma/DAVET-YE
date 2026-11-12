/**
 * Sync all KendinTasarla ready designs from davetiyemgo.com into local data + public assets.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const BASE = "https://davetiyemgo.com";
const OUT = path.join(ROOT, "src/data/studio-designs");
const INDEX = path.join(OUT, "index.json");
const PUBLIC = path.join(ROOT, "public");

fs.mkdirSync(OUT, { recursive: true });

function walkUrls(node, out = new Set()) {
  if (!node) return out;
  if (typeof node === "string") {
    const s = node.split("?")[0];
    if (/^\/(img|media|assets|fonts)\//.test(s)) out.add(s);
    return out;
  }
  if (Array.isArray(node)) {
    for (const x of node) walkUrls(x, out);
    return out;
  }
  if (typeof node === "object") {
    for (const v of Object.values(node)) walkUrls(v, out);
  }
  return out;
}

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

function summarizeDesign(design) {
  const page = design?.pages?.[0] || {};
  const canvasW = design.canvas?.width || 450;
  const canvasH = design.canvas?.height || 800;
  const els = (page.elements || []).filter((e) => !e.hidden);
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
        x: Math.round(((e.x || 0) / canvasW) * 1000) / 10,
        w: Math.round(((e.w || canvasW * 0.84) / canvasW) * 1000) / 10,
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
    cover,
    texts,
  };
}

async function download(rel) {
  const dest = path.join(PUBLIC, rel.replace(/^\//, "").replaceAll("/", path.sep));
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  if (fs.existsSync(dest) && fs.statSync(dest).size > 80) return "skip";
  const res = await fetch(new URL(rel, BASE));
  if (!res.ok) return `fail:${res.status}`;
  fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
  return "ok";
}

const bootPath = path.join(OUT, "_boot.json");
let boot = fs.existsSync(bootPath) ? JSON.parse(fs.readFileSync(bootPath, "utf8")) : null;
if (!boot?.templates) {
  const html = await (await fetch(`${BASE}/tr/tasarla`)).text();
  const bootIdx = html.indexOf('"mode":"customer"');
  let start = html.lastIndexOf("{", bootIdx);
  let depth = 0;
  let end = -1;
  for (let i = start; i < html.length; i++) {
    if (html[i] === "{") depth++;
    else if (html[i] === "}") {
      depth--;
      if (depth === 0) {
        end = i + 1;
        break;
      }
    }
  }
  boot = JSON.parse(html.slice(start, end));
  fs.writeFileSync(bootPath, JSON.stringify(boot, null, 2));
}

const metaBySlug = Object.fromEntries((boot.templates || []).map((t) => [t.slug, t]));
const catName = Object.fromEntries((boot.categories || []).map((c) => [c.key, c.name]));

console.log("Fetching designs…");
const api = await (await fetch(`${BASE}/tasarla/api/hazir-tasarimlar?dil=tr`)).json();
const items = api.items || [];
console.log("remote", items.length);

const assets = new Set();
const index = [];

for (const item of items) {
  const meta = metaBySlug[item.slug] || {};
  const design = item.design;
  const summary = summarizeDesign(design);
  walkUrls(design, assets);
  if (summary.cover) assets.add(summary.cover.split("?")[0]);

  const file = `${item.slug}.json`;
  fs.writeFileSync(
    path.join(OUT, file),
    JSON.stringify(
      {
        slug: item.slug,
        name: meta.name || item.slug,
        category: meta.category || "wedding",
        categoryLabel: catName[meta.category] || meta.category || "Nişan & Düğün",
        featured: Boolean(meta.featured),
        width: meta.width || design?.canvas?.width || 450,
        height: meta.height || design?.canvas?.height || 800,
        summary,
        design,
      },
      null,
      2,
    ),
  );

  index.push({
    id: item.slug,
    name: meta.name || item.slug,
    category: meta.category || "wedding",
    categoryLabel: catName[meta.category] || "Nişan & Düğün",
    featured: Boolean(meta.featured),
    width: meta.width || design?.canvas?.width || 450,
    height: meta.height || design?.canvas?.height || 800,
    bg: summary.bg,
    bg2: summary.bg2,
    ink: summary.ink,
    accent: summary.accent,
    cover: summary.cover,
    texts: summary.texts,
  });
}

index.sort((a, b) => Number(b.featured) - Number(a.featured) || a.name.localeCompare(b.name, "tr"));
fs.writeFileSync(INDEX, JSON.stringify({ at: new Date().toISOString(), total: index.length, categories: boot.categories || [], items: index }, null, 2));

console.log("Downloading", assets.size, "assets…");
let ok = 0;
let skip = 0;
let fail = 0;
for (const rel of [...assets].sort()) {
  try {
    const st = await download(rel);
    if (st === "ok") ok++;
    else if (st === "skip") skip++;
    else {
      fail++;
      console.log(" ", st, rel);
    }
  } catch (e) {
    fail++;
    console.log(" ", e.message, rel);
  }
}

console.log(`Synced designs=${index.length} assets ok=${ok} skip=${skip} fail=${fail}`);
console.log("index", INDEX);
