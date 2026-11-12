/**
 * Generates src/data/themes.json from the reference capture (docs/reference-captures/temalar-a11y.txt)
 * plus enrichment (colors from the local covers, tags, openings, event types, ...).
 * Run: node scripts/gen-themes.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const a11y = fs.readFileSync(path.join(ROOT, "docs/reference-captures/temalar-a11y.txt"), "utf8");
const coverFiles = new Set(fs.readdirSync(path.join(ROOT, "public/img/davetiye/covers")));
const heroFiles = new Set(fs.readdirSync(path.join(ROOT, "public/img/davetiye")));

const FEATURED = ["akdeniz-masali", "guz-masali", "barok-kapi", "tavuslu-cini", "opera-gecesi", "bordo-muhur"];

const fold = (s) =>
  s
    .toLocaleLowerCase("tr")
    .replace(/ç/g, "c").replace(/ğ/g, "g").replace(/ı/g, "i").replace(/ö/g, "o").replace(/ş/g, "s").replace(/ü/g, "u")
    .replace(/â/g, "a").replace(/î/g, "i").replace(/û/g, "u");

/* ---------- parse the capture ---------- */
const optionTags = [];
{
  const sec = a11y.split('combobox "Etiket":')[1]?.split('combobox "Sırala:"')[0] ?? "";
  for (const m of sec.matchAll(/option "([^"]+)"/g)) if (m[1] !== "Tüm etiketler") optionTags.push(m[1]);
}

const parsed = [];
for (const block of a11y.split(/\n\s+- article:/).slice(1)) {
  const slug = block.match(/\/url: \/tr\/temalar\/([a-z0-9-]+)/)?.[1];
  const title = block.match(/heading "([^"]+)" \[level=3\]/)?.[1];
  const price = block.match(/text: ([0-9.]+) TL ([0-9.]+) TL/);
  const badge = block.match(/text: (Öne çıkan|Yeni)\b/)?.[1];
  if (!slug || !title || !price) continue;
  parsed.push({
    slug,
    title,
    price: Number(price[1].replace(/\./g, "")),
    compareAt: Number(price[2].replace(/\./g, "")),
    badge: badge === "Öne çıkan" ? "featured" : badge === "Yeni" ? "new" : undefined,
  });
}
if (parsed.length !== 56) throw new Error(`expected 56 themes, parsed ${parsed.length}`);

/* ---------- enrichment tables ---------- */
const OPENING_OVERRIDES = {
  "akdeniz-masali": "curtain",
  "guz-masali": "envelope",
  "barok-kapi": "door",
  "tavuslu-cini": "door",
  "opera-gecesi": "curtain",
  "bordo-muhur": "seal",
  "siyah-inci": "seal",
  "zumrut-yesili-cocukluk-aski": "door",
};
function openingFor(slug) {
  if (OPENING_OVERRIDES[slug]) return OPENING_OVERRIDES[slug];
  if (/muhur|madalyon/.test(slug)) return "seal";
  if (/kapi|kemer|kapisi|avlusu|terasi|sutun|koprusu/.test(slug)) return "door";
  if (/perde|dantel|tul|opera/.test(slug)) return "curtain";
  return "envelope";
}
const OPENING_TAG = { door: "kapı açılışı", curtain: "perde açılışı", seal: "altın mühür", envelope: "zarf açılışı" };
const OPENING_PHRASE = {
  door: "Kapı Açılışı",
  curtain: "Perde Açılışı",
  seal: "Mühürlü Açılış",
  envelope: "Zarf Açılışı",
};

const KINA_HINTS = /kaftan|kina|saray|osmanli|elhamra|altin-hilal|cini|yelpaze|zumrut|lale|ege|nil|hus|yaldizli/;

const EYEBROWS = {
  "guz-masali": "Sonbahar Romantizmi ve Animasyonlu Gelin Arabası Eşliğinde Dijital Davetiye",
  "akdeniz-masali": "Zarif Tül Perde Açılışı ve Akdeniz Manzarası Eşliğinde Dijital Davetiye",
  "zumrut-yesili-cocukluk-aski": "Kabartmalı Zümrüt Kapak Açılışı ve Çocukluk Aşkı Rölyefleri Eşliğinde Dijital Davetiye",
  "siyah-inci": "Mühürlü Antrasit Zarf Açılışı ve Siyah Kabartma Sayfalar Eşliğinde Dijital Davetiye",
  "bahar-yolu": "Doğanın Uyanışı ve Çiçek Açan Yeni Bir Başlangıç Eşliğinde Dijital Davetiye",
  "barok-kapi": "Kabartmalı Barok Kapı Açılışı ve Altın Detaylar Eşliğinde Dijital Davetiye",
  "tavuslu-cini": "Tavus Kuşu Motifli Çini Kapı Açılışı Eşliğinde Dijital Davetiye",
  "opera-gecesi": "Kadife Sahne Perdesi Açılışı ve Altın Saçaklar Eşliğinde Dijital Davetiye",
  "bordo-muhur": "Bordo Mühür Açılışı ve Couture Detaylar Eşliğinde Dijital Davetiye",
};

const DESCRIPTIONS = {
  "guz-masali":
    'Kızıl ve altın sarısı sonbahar yapraklarıyla kaplı büyüleyici bir orman yolunda, süslü gelin arabasının geçişi ve yapraklarla beliren "Biz Evleniyoruz" animasyonuyla misafirlerinizi masalsı bir yolculuğa davet edin.',
  "akdeniz-masali": "Dantel perdelerin ardından açılan Akdeniz manzarasıyla zarif ve aydınlık bir davetiye deneyimi.",
  "barok-kapi": "Kabartmalı barok kapı açılışıyla klasik ve görkemli bir karşılama.",
  "tavuslu-cini": "Tavus kuşu motifli çini desenleriyle geleneksel zarafet.",
  "opera-gecesi": "Kadife sahne perdeleri ve altın saçaklarla gala gecesi atmosferi.",
  "bordo-muhur": "Bordo kadife ve altın mühür detaylarıyla couture bir açılış.",
};

const COLOR_OVERRIDES = {
  "siyah-inci": { accent: "#2e3236", gold: "#c8a35b" },
};

/* ---------- colours from the cover ---------- */
function hslToHex(h, s, l) {
  h = ((h % 360) + 360) % 360;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const hex = (x) => Math.round(x * 255).toString(16).padStart(2, "0");
  return `#${hex(f(0))}${hex(f(8))}${hex(f(4))}`;
}
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  let h = 0, s = 0;
  if (d) {
    s = d / (1 - Math.abs(2 * l - 1));
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return [(h + 360) % 360, s, l];
}

async function colorsFor(file, slug) {
  const { data } = await sharp(file).resize(32, 32, { fit: "cover" }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  let sw = 0, sx = 0, sy = 0, sl = 0, ss = 0;
  for (let i = 0; i < data.length; i += 3) {
    const [h, s, l] = rgbToHsl(data[i], data[i + 1], data[i + 2]);
    const w = s * s * (1 - Math.abs(2 * l - 1)) + 0.001; // favour saturated, mid-light pixels
    sw += w;
    sx += Math.cos((h * Math.PI) / 180) * w;
    sy += Math.sin((h * Math.PI) / 180) * w;
    sl += l * w;
    ss += s * w;
  }
  let hue = ((Math.atan2(sy, sx) * 180) / Math.PI + 360) % 360;
  // No purple palettes: remap violet/magenta hues to rose / wine.
  if (hue >= 255 && hue <= 330) hue = 345;
  const sat = Math.min(0.62, Math.max(0.28, ss / sw));
  let accent = hslToHex(hue, sat, 0.34);
  let gold = "#b8894e";
  const o = COLOR_OVERRIDES[slug];
  if (o?.accent) accent = o.accent;
  if (o?.gold) gold = o.gold;
  return {
    accent,
    accentDeep: hslToHex(hue, Math.min(0.55, sat), 0.17),
    tint: hslToHex(hue, 0.35, 0.95),
    tint2: hslToHex(hue, 0.3, 0.89),
    gold,
  };
}

/* ---------- build ---------- */
function coverFor(slug) {
  for (const ext of ["webp", "jpg", "png"]) if (coverFiles.has(`${slug}.${ext}`)) return `/img/davetiye/covers/${slug}.${ext}`;
  throw new Error(`missing cover for ${slug}`);
}
function heroFor(slug) {
  for (const ext of ["webp", "jpg", "png"]) if (heroFiles.has(`${slug}-kapak.${ext}`)) return `/img/davetiye/${slug}-kapak.${ext}`;
  throw new Error(`missing hero cover for ${slug}`);
}

const themes = [];
for (const [i, p] of parsed.entries()) {
  const opening = openingFor(p.slug);
  const words = fold(p.title);
  const tagSet = new Set();
  for (const t of optionTags) {
    const ft = fold(t);
    if (ft === "animasyonlu davetiye") continue;
    if (ft.split(" ").every((w) => words.includes(w)) && ft.length > 2) tagSet.add(t);
  }
  if (optionTags.includes(OPENING_TAG[opening])) tagSet.add(OPENING_TAG[opening]);
  if (optionTags.includes("animasyonlu davetiye")) tagSet.add("animasyonlu davetiye");
  if (optionTags.includes("düğün davetiyesi")) tagSet.add("düğün davetiyesi");

  const eventTypes = ["nisan-dugun", "coklu"];
  if (KINA_HINTS.test(p.slug)) eventTypes.push("kina");

  const coverPath = coverFor(p.slug);
  const colors = await colorsFor(path.join(ROOT, "public", coverPath), p.slug);
  const featured = FEATURED.includes(p.slug);

  const t = {
    slug: p.slug,
    title: p.title,
    price: p.price,
    compareAt: p.compareAt,
    ...(p.badge ? { badge: p.badge } : {}),
    cover: coverPath,
    ...(featured ? { heroCover: heroFor(p.slug) } : {}),
    opening,
    featured,
    order: i,
    eventTypes,
    tags: [...tagSet].sort((a, b) => a.localeCompare(b, "tr")),
    eyebrow: EYEBROWS[p.slug] ?? `${OPENING_PHRASE[opening]} Eşliğinde Dijital Davetiye`,
    description:
      DESCRIPTIONS[p.slug] ??
      `${p.title} temalı dijital davetiye; ${OPENING_PHRASE[opening].toLocaleLowerCase("tr")} ile açılır, mobil uyumludur ve tek bağlantıyla paylaşılır.`,
    colors,
  };
  themes.push(t);
}

fs.writeFileSync(path.join(ROOT, "src/data/themes.json"), JSON.stringify(themes, null, 2) + "\n");
console.log("themes:", themes.length);
for (const s of FEATURED) {
  const t = themes.find((x) => x.slug === s);
  console.log(s, "→", t ? `${t.title} ${t.price}/${t.compareAt}` : "MISSING");
}
