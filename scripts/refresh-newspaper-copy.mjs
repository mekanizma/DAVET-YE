import fs from "node:fs";

const ORIGIN = "https://davetiyemgo.com";
const FILE = "src/data/newspapers.ts";

function decode(s) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
}

let src = fs.readFileSync(FILE, "utf8");
const slugs = [...src.matchAll(/slug: "([^"]+)"/g)].map((m) => m[1]);
const titles = [...src.matchAll(/title: "([^"]+)"/g)].map((m) => m[1]);

for (let i = 0; i < slugs.length; i++) {
  const slug = slugs[i];
  const title = titles[i];
  process.stdout.write(`${slug} `);
  const res = await fetch(`${ORIGIN}/tr/gazeteler/${slug}`, {
    headers: { "user-agent": "Mozilla/5.0" },
  });
  const html = await res.text();
  const h1 = html.search(/<h1[^>]*>/i);
  let description = "";
  let eyebrow = "";
  if (h1 >= 0) {
    const after = html.slice(h1, h1 + 10000);
    const ps = [...after.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
      .map((m) => decode(m[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()))
      .filter((t) => t.length > 40);
    description = ps[0] || "";
    const eyes = [...after.matchAll(/<(?:p|span|div)[^>]*class="[^"]*(?:eyebrow|kicker|lead|sub)[^"]*"[^>]*>([\s\S]*?)<\/(?:p|span|div)>/gi)]
      .map((m) => decode(m[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()))
      .filter((t) => t.length > 10 && t.length < 160);
    eyebrow = eyes[0] || "";
  }
  if (!description) {
    const md = html.match(/<meta\s+name="description"\s+content="([^"]+)"/i);
    description = md
      ? decode(md[1])
      : `${title} şablonuyla hikâyenizi manşete taşıyın. Dijital olarak sayfa çevirin veya A3/A2 bastırın.`;
  }
  description = description.replace(/…$/, "").trim();
  if (description.length > 520) description = `${description.slice(0, 517)}…`;
  if (!eyebrow) eyebrow = `${title} gazete şablonu`;

  const slugIdx = src.indexOf(`slug: "${slug}"`);
  if (slugIdx < 0) continue;
  const next = src.indexOf('slug: "', slugIdx + 10);
  const end = next < 0 ? src.length : next;
  let chunk = src.slice(slugIdx, end);
  chunk = chunk.replace(/eyebrow: "[\s\S]*?",\n/, `eyebrow: ${JSON.stringify(eyebrow)},\n`);
  chunk = chunk.replace(
    /description:\n\s*"[\s\S]*?",\n/,
    `description:\n      ${JSON.stringify(description)},\n`,
  );
  chunk = chunk.replace(
    /headline: "[\s\S]*?",\n/,
    `headline: ${JSON.stringify(title.toLocaleUpperCase("tr"))},\n`,
  );
  src = src.slice(0, slugIdx) + chunk + src.slice(end);
  await new Promise((r) => setTimeout(r, 80));
}

fs.writeFileSync(FILE, src);
console.log(`\ndone ${slugs.length}`);
