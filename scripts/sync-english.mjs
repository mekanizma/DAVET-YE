/**
 * Pull the English invitation stages, newspaper readers, and cover photos
 * from davetiyemgo.com so /en matches that site one to one.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = "d:/davetiye";
const ORIGIN = "https://davetiyemgo.com";

function localAsset(urlPath) {
  const clean = urlPath.split("?")[0];
  if (clean.startsWith("/uploads/")) return `/media/uploads/${clean.split("/").pop()}`;
  return clean;
}

function rewrite(node) {
  if (typeof node === "string") {
    if (node.startsWith("/uploads/") || node.startsWith("/img/") || node.startsWith("/fonts/") || node.startsWith("/sounds/")) {
      return localAsset(node);
    }
    return node;
  }
  if (Array.isArray(node)) return node.map(rewrite);
  if (node && typeof node === "object") {
    const o = {};
    for (const [k, v] of Object.entries(node)) o[k] = rewrite(v);
    return o;
  }
  return node;
}

function collect(node, bag) {
  if (typeof node === "string") {
    if (node.startsWith("/uploads/") || node.startsWith("/img/") || node.startsWith("/fonts/") || node.startsWith("/sounds/") || node.startsWith("/media/")) {
      bag.add(node.split("?")[0]);
    }
    return;
  }
  if (Array.isArray(node)) {
    for (const item of node) collect(item, bag);
    return;
  }
  if (node && typeof node === "object") {
    for (const value of Object.values(node)) collect(value, bag);
  }
}

async function fetchText(url) {
  const res = await fetch(url, { headers: { "user-agent": "DavetiyemGoEnglishSync/1.0" } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.text();
}

async function download(urlPath) {
  const rel = localAsset(urlPath).replace(/^\//, "");
  const dest = path.join(ROOT, "public", rel);
  if (fs.existsSync(dest) && fs.statSync(dest).size > 0) return false;
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  const res = await fetch(ORIGIN + urlPath.split("?")[0], { headers: { "user-agent": "DavetiyemGoEnglishSync/1.0" } });
  if (!res.ok) {
    console.warn("asset", res.status, urlPath);
    return false;
  }
  fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
  return true;
}

async function pool(items, n, fn) {
  const q = [...items];
  await Promise.all(
    Array.from({ length: n }, async () => {
      while (q.length) await fn(q.shift());
    }),
  );
}

const stageDir = path.join(ROOT, "src/data/stages");
const stageEn = path.join(stageDir, "en");
fs.mkdirSync(stageEn, { recursive: true });
const slugs = fs.readdirSync(stageDir).filter((name) => name.endsWith(".json")).map((name) => name.replace(/\.json$/, ""));

const assets = new Set();
let stages = 0;
const stageMissing = [];

await pool(slugs, 4, async (slug) => {
  try {
    const html = await fetchText(`${ORIGIN}/onizleme/tema/${slug}?dil=en`);
    const m = html.match(/id="stage-data">([\s\S]*?)<\/script>/);
    if (!m) throw new Error("no stage-data");
    const data = JSON.parse(m[1]);
    collect(data, assets);
    fs.writeFileSync(path.join(stageEn, `${slug}.json`), JSON.stringify(rewrite(data)));
    stages += 1;
    console.log("stage", slug);
  } catch (err) {
    stageMissing.push(`${slug}: ${err.message}`);
    console.error("stage fail", slug, err.message);
  }
});

const newspapers = fs.readFileSync(path.join(ROOT, "src/data/newspapers.ts"), "utf8");
const paperSlugs = [...new Set([...newspapers.matchAll(/slug:\s*"([^"]+)"/g)].map((m) => m[1]))];
const timesEn = path.join(ROOT, "src/data/times/en");
fs.mkdirSync(timesEn, { recursive: true });

function extractReader(html) {
  const marker = 'id="times-reader-data"';
  const i = html.indexOf(marker);
  if (i < 0) throw new Error("times-reader-data missing");
  const gt = html.indexOf(">", i);
  const end = html.indexOf("</script>", gt);
  return JSON.parse(html.slice(gt + 1, end));
}

let papers = 0;
const paperMissing = [];
const covers = {};

await pool(paperSlugs, 3, async (slug) => {
  try {
    const html = await fetchText(`${ORIGIN}/times/sablon/${slug}?dil=en`);
    const data = rewrite(extractReader(html));
    collect(data, assets);
    fs.writeFileSync(path.join(timesEn, `${slug}.json`), JSON.stringify(data));
    papers += 1;
    console.log("paper", slug);
  } catch (err) {
    paperMissing.push(`${slug}: ${err.message}`);
    console.error("paper fail", slug, err.message);
  }

});

const listing = await fetchText(`${ORIGIN}/en/newspapers`);
for (const match of listing.matchAll(/\/img\/times\/([a-z0-9-]+)\/(kapak-[^"'\\\s]+?\.en\.jpg)/g)) {
  if (!covers[match[1]]) covers[match[1]] = `/img/times/${match[1]}/${match[2]}`;
}
for (const [slug, urlPath] of Object.entries(covers)) {
  await download(urlPath);
  console.log("cover", slug, urlPath);
}

let downloaded = 0;
await pool([...assets], 6, async (urlPath) => {
  if (urlPath.startsWith("/media/")) return;
  if (await download(urlPath)) downloaded += 1;
});

const coverFile = path.join(ROOT, "src/data/covers-en.json");
fs.writeFileSync(coverFile, JSON.stringify(covers, null, 2) + "\n");
console.log(`stages ${stages}/${slugs.length} papers ${papers}/${paperSlugs.length} covers ${Object.keys(covers).length} new assets ${downloaded}`);
if (stageMissing.length || paperMissing.length) {
  console.log("missing stages", stageMissing.join(" | "));
  console.log("missing papers", paperMissing.join(" | "));
  process.exitCode = 1;
}
