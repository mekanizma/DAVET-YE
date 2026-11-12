import fs from "node:fs";
import path from "node:path";

const root = "d:/davetiye";
const themes = JSON.parse(fs.readFileSync(path.join(root, "src/data/themes.json"), "utf8"));
const slugs = themes.map((t) => t.slug);
const stageDir = path.join(root, "src/data/stages");
const publicDir = path.join(root, "public");
fs.mkdirSync(stageDir, { recursive: true });

const ORIGIN = "https://davetiyemgo.com";
const fontsCss = [];

function walkStrings(node, out) {
  if (typeof node === "string") {
    if (node.startsWith("/uploads/") || node.startsWith("/img/") || node.startsWith("/fonts/")) out.add(node.split("?")[0]);
    return;
  }
  if (Array.isArray(node)) {
    for (const x of node) walkStrings(x, out);
    return;
  }
  if (node && typeof node === "object") {
    for (const v of Object.values(node)) walkStrings(v, out);
  }
}

function localPath(urlPath) {
  if (urlPath.startsWith("/uploads/")) {
    const file = urlPath.split("/").pop();
    return `/media/uploads/${file}`;
  }
  return urlPath;
}

function rewrite(node) {
  if (typeof node === "string") {
    if (node.startsWith("/uploads/") || node.startsWith("/img/") || node.startsWith("/fonts/")) {
      const clean = node.split("?")[0];
      return localPath(clean);
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

async function download(urlPath) {
  const destRel = localPath(urlPath).replace(/^\//, "");
  const dest = path.join(publicDir, destRel);
  if (fs.existsSync(dest) && fs.statSync(dest).size > 0) return "skip";
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  const res = await fetch(ORIGIN + urlPath);
  if (!res.ok) {
    console.warn("FAIL", res.status, urlPath);
    return "fail";
  }
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(dest, buf);
  return "ok";
}

async function pool(items, n, fn) {
  const q = [...items];
  const workers = Array.from({ length: n }, async () => {
    while (q.length) {
      const item = q.shift();
      await fn(item);
    }
  });
  await Promise.all(workers);
}

const assets = new Set();
let ok = 0;
const missing = [];

await pool(slugs, 4, async (slug) => {
  const url = `${ORIGIN}/onizleme/tema/${slug}`;
  const res = await fetch(url);
  if (!res.ok) {
    missing.push(slug);
    console.warn("page", res.status, slug);
    return;
  }
  const html = await res.text();
  const m = html.match(/id="stage-data">([\s\S]*?)<\/script>/);
  if (!m) {
    missing.push(slug);
    console.warn("no stage", slug);
    return;
  }
  const data = JSON.parse(m[1]);
  walkStrings(data, assets);
  for (const fm of html.matchAll(/\/fonts\/[a-z0-9._-]+\.woff2/gi)) assets.add(fm[0]);
  for (const fm of html.matchAll(/@font-face\{[^}]+\}/g)) {
    if (fm[0].includes("/fonts/")) fontsCss.push(fm[0]);
  }
  const rewritten = rewrite(data);
  fs.writeFileSync(path.join(stageDir, `${slug}.json`), JSON.stringify(rewritten));
  ok++;
  console.log("stage", slug);
});

const fontBlocks = [...new Set(fontsCss)].join("\n");
fs.writeFileSync(path.join(root, "src/app/styles/stage-fonts.css"), fontBlocks + "\n");

console.log("stages", ok, "assets", assets.size, "missing", missing.join(","));
let got = 0;
let failed = 0;
await pool([...assets], 6, async (urlPath) => {
  const r = await download(urlPath);
  if (r === "ok") {
    got++;
    if (got % 20 === 0) console.log("downloaded", got);
  } else if (r === "fail") failed++;
});
console.log("downloaded", got, "failed", failed, "skipped existing");
