/**
 * Pull newspaper covers + catalog from davetiyemgo.com and rewrite local data.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ORIGIN = "https://davetiyemgo.com";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "public", "img", "times");
const DATA_FILE = path.join(ROOT, "src", "data", "newspapers.ts");

/** From live /tr/gazeteler listing (Nov 2026). */
const LIST = [
  { slug: "ask-bulteni", title: "Aşk Bülteni", price: 990, compareAt: 1290, file: "kapak-gopost-v3.jpg" },
  { slug: "sonunda-evleniyorlar", title: "Sonunda Evleniyorlar", price: 990, compareAt: 1290, file: "kapak-gopost-v3.jpg" },
  { slug: "ask-kazandi", title: "Aşk Kazandı", price: 990, compareAt: 1290, file: "kapak-gopost-v3.jpg" },
  { slug: "evleniyoruz", title: "Evleniyoruz", price: 990, compareAt: 1290, file: "kapak-gopost-v3.jpg" },
  { slug: "kolaj-gazetesi", title: "Kolaj Gazetesi", price: 990, compareAt: 1290, file: "kapak-gopost-v3.jpg" },
  { slug: "yolculuk-gazetesi", title: "Yolculuk Gazetesi", price: 990, compareAt: 1290, file: "kapak-gopost-v3.jpg" },
  { slug: "manset-gazetesi", title: "Manşet Gazetesi", price: 990, compareAt: 1290, file: "kapak-gopost-v3.jpg" },
  { slug: "altin-cag", title: "Altın Çağ", price: 990, compareAt: 1290, file: "kapak-gopost-v3.jpg" },
  { slug: "askin-manseti", title: "Aşkın Manşeti", price: 990, compareAt: 1290, file: "kapak-gopost-v3.jpg" },
  { slug: "balayi-postasi", title: "Balayı Postası", price: 990, compareAt: 1290, file: "kapak-gopost-v3.jpg" },
  { slug: "bulmaca-eki", title: "Bulmaca Eki", price: 990, compareAt: 1290, file: "kapak-gopost-v3.jpg" },
  { slug: "gunun-manseti", title: "Günün Manşeti", price: 990, compareAt: 1290, file: "kapak-gopost-v3.jpg" },
  { slug: "nisan-haberi", title: "Nişan Haberi", price: 990, compareAt: 1290, file: "kapak-gopost-v3.jpg" },
  { slug: "pazar-eki", title: "Pazar Eki", price: 990, compareAt: 1290, file: "kapak-gopost-v3.jpg" },
  { slug: "roportaj-ozel", title: "Röportaj Özel", price: 990, compareAt: 1290, file: "kapak-gopost-v3.jpg" },
  { slug: "sayilarla-biz", title: "Sayılarla Biz", price: 990, compareAt: 1290, file: "kapak-gopost-v3.jpg" },
  { slug: "son-dakika", title: "Son Dakika", price: 990, compareAt: 1290, file: "kapak-gopost-v3.jpg" },
  { slug: "omurluk-hikaye", title: "Ömürlük Hikâye", price: 990, compareAt: 1290, file: "kapak-gopost-v4.jpg" },
  { slug: "tarihi-kaydet", title: "Tarihi Kaydet", price: 990, compareAt: 1290, file: "kapak-gopost-v3.jpg" },
  { slug: "yalin-haber", title: "Yalın Haber", price: 990, compareAt: 1290, file: "kapak-gopost-v3.jpg" },
  { slug: "yildonumu-ozel", title: "Yıldönümü Özel", price: 990, compareAt: 1290, file: "kapak-gopost-v3.jpg" },
  { slug: "dogum-gunu-gecesi", title: "Doğum Günü Gecesi", price: 990, compareAt: 1290, file: "kapak-gopost-v4.jpg" },
  { slug: "buyuk-lansman", title: "Büyük Lansman", price: 1090, compareAt: 1490, file: "kapak-gopost-v3.jpg" },
  { slug: "muzigin-kalbi", title: "Müziğin Kalbi", price: 1090, compareAt: 1490, file: "kapak-gopost-v3.jpg" },
  { slug: "mezuniyet-gunu", title: "Mezuniyet Günü", price: 990, compareAt: 1390, file: "kapak-gopost-v3.jpg" },
  { slug: "yeni-yila-merhaba", title: "Yeni Yıla Merhaba", price: 1090, compareAt: 1490, file: "kapak-gopost-v3.jpg" },
  { slug: "yaz-gecesi", title: "Yaz Gecesi", price: 1090, compareAt: 1490, file: "kapak-gopost-v3.jpg" },
  { slug: "sezonun-lansmani", title: "Sezonun Lansmanı", price: 1090, compareAt: 1490, file: "kapak-gopost-v3.jpg" },
  { slug: "acilis-haberi", title: "Açılış Haberi", price: 1090, compareAt: 1490, file: "kapak-gopost-v3.jpg" },
  { slug: "bekarliga-veda", title: "Bekârlığa Veda", price: 1090, compareAt: 1490, file: "kapak-gopost-v3.jpg" },
  { slug: "disko-gecesi", title: "Disko Gecesi", price: 1090, compareAt: 1490, file: "kapak-gopost-v3.jpg" },
  { slug: "dogdugun-gun", title: "Doğduğun Gün", price: 990, compareAt: 1490, file: "kapak-gopost-v3.jpg" },
  { slug: "mezunlar-yilligi", title: "Mezunlar Yıllığı", price: 990, compareAt: 1490, file: "kapak-gopost-v3.jpg" },
  { slug: "odul-gecesi", title: "Ödül Gecesi", price: 1090, compareAt: 1490, file: "kapak-gopost-v3.jpg" },
];

const PALETTE = [
  { paper: "#f3e8d8", ink: "#2a1d16", accent: "#b4566a" },
  { paper: "#f5ecdc", ink: "#221913", accent: "#0d3229" },
  { paper: "#f1e3cf", ink: "#2a1c14", accent: "#b4566a" },
  { paper: "#f6efe2", ink: "#13201c", accent: "#83592b" },
  { paper: "#efe5d4", ink: "#1d1b17", accent: "#0d3229" },
  { paper: "#f2e6d4", ink: "#241a14", accent: "#a5381b" },
];

function decodeHtml(s) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
}

async function fetchMeta(slug, title) {
  try {
    const res = await fetch(`${ORIGIN}/tr/gazeteler/${slug}`, {
      headers: { "user-agent": "Mozilla/5.0 DavetanisiSync/1.0" },
    });
    if (!res.ok) throw new Error(String(res.status));
    const html = await res.text();
    const desc =
      html.match(/<meta\s+name="description"\s+content="([^"]+)"/i)?.[1] ||
      html.match(/property="og:description"\s+content="([^"]+)"/i)?.[1] ||
      "";
    // eyebrow often appears as a short lead near h1
    const eyebrowMatch =
      html.match(/class="[^"]*eyebrow[^"]*"[^>]*>([^<]{8,120})</i) ||
      html.match(/<p class="[^"]*lead[^"]*"[^>]*>([^<]{12,160})</i);
    const eyebrow = eyebrowMatch?.[1]?.trim() || `${title} gazete şablonu`;
    return {
      eyebrow: decodeHtml(eyebrow).slice(0, 140),
      description: decodeHtml(desc).slice(0, 420) || `${title} şablonuyla hikâyenizi manşete taşıyın. Dijital olarak sayfa çevirin veya A3/A2 bastırın.`,
    };
  } catch {
    return {
      eyebrow: `${title} gazete şablonu`,
      description: `${title} şablonuyla hikâyenizi manşete taşıyın. Dijital olarak sayfa çevirin veya A3/A2 bastırın.`,
    };
  }
}

async function downloadCover(item) {
  const url = `${ORIGIN}/gorsel/640/img/times/${item.slug}/${item.file}`;
  const dest = path.join(OUT_DIR, `${item.slug}-kapak.jpg`);
  const res = await fetch(url, { headers: { "user-agent": "Mozilla/5.0 DavetanisiSync/1.0" } });
  if (!res.ok) throw new Error(`cover ${item.slug}: ${res.status} ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(dest, buf);
  return { bytes: buf.length, dest };
}

function esc(s) {
  return s.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$/g, "\\$");
}

function headlineOf(title) {
  return title
    .toLocaleUpperCase("tr")
    .replace(/İ/g, "I")
    .replace(/Ş/g, "S")
    .replace(/Ğ/g, "G")
    .replace(/Ü/g, "U")
    .replace(/Ö/g, "O")
    .replace(/Ç/g, "C")
    .replace(/Â/g, "A");
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const records = [];

  for (let i = 0; i < LIST.length; i++) {
    const item = LIST[i];
    process.stdout.write(`[${i + 1}/${LIST.length}] ${item.slug} … `);
    const cover = await downloadCover(item);
    const meta = await fetchMeta(item.slug, item.title);
    const tone = PALETTE[i % PALETTE.length];
    records.push({
      ...item,
      ...meta,
      ...tone,
      cover: `/img/times/${item.slug}-kapak.jpg`,
      headline: headlineOf(item.title),
      tagline: "Hikâyeniz manşette",
    });
    console.log(`ok (${cover.bytes}b)`);
    await new Promise((r) => setTimeout(r, 120));
  }

  const body = records
    .map((n) => {
      return `  {
    slug: ${JSON.stringify(n.slug)},
    title: ${JSON.stringify(n.title)},
    eyebrow: ${JSON.stringify(n.eyebrow)},
    description:
      ${JSON.stringify(n.description)},
    price: ${n.price},
    compareAt: ${n.compareAt},
    cover: ${JSON.stringify(n.cover)},
    headline: ${JSON.stringify(n.headline)},
    tagline: ${JSON.stringify(n.tagline)},
    paper: ${JSON.stringify(n.paper)},
    ink: ${JSON.stringify(n.ink)},
    accent: ${JSON.stringify(n.accent)},
  }`;
    })
    .join(",\n");

  const file = `export interface Newspaper {
  slug: string;
  title: string;
  eyebrow: string;
  description: string;
  price: number;
  compareAt: number;
  /** Yerel kapak görseli; yoksa CSS ile üretilen tipografik kapak kullanılır. */
  cover?: string;
  /** CSS kapak için manşet ve alt başlık */
  headline: string;
  tagline: string;
  paper: string;
  ink: string;
  accent: string;
}

export const NEWSPAPER_STYLES = [
  { id: "original", label: "Orijinal", filter: "none" },
  { id: "sepia", label: "Eski kâğıt", filter: "sepia(0.55) contrast(1.02)" },
  { id: "mono", label: "Siyah beyaz", filter: "grayscale(1) contrast(1.05)" },
] as const;

export type NewspaperStyleId = (typeof NEWSPAPER_STYLES)[number]["id"];

export const newspapers: Newspaper[] = [
${body},
];

export function getNewspaper(slug: string) {
  return newspapers.find((n) => n.slug === slug);
}
`;

  fs.writeFileSync(DATA_FILE, file, "utf8");
  console.log(`\nWrote ${records.length} newspapers → ${path.relative(ROOT, DATA_FILE)}`);
  console.log(`Covers in ${path.relative(ROOT, OUT_DIR)}`);
}

await main();
