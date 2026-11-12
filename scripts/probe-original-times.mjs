import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

const outDir = "tmp/original-times";
mkdirSync(outDir, { recursive: true });

async function fetchText(url) {
  const res = await fetch(url, { redirect: "follow" });
  const text = await res.text();
  return { status: res.status, url: res.url, text, headers: Object.fromEntries(res.headers) };
}

function extractAssets(html) {
  const assets = new Set();
  for (const m of html.matchAll(/\/assets\/[^"'\\\s>]+\.(?:js|css)/g)) assets.add(m[0]);
  for (const m of html.matchAll(/https:\/\/[^"'\\\s>]+\/assets\/[^"'\\\s>]+\.(?:js|css)/g)) assets.add(m[0]);
  return [...assets];
}

const pages = [
  "https://davetiyemgo.com/panel/giris?donus=%2Fpanel%2Ftimes%2Fbaslat%3Fsablon%3Dask-bulteni%26dil%3Dtr%26arayuz%3Dtr",
  "https://davetiyemgo.com/panel/times",
  "https://davetiyemgo.com/tr/gazeteler/ask-bulteni",
  "https://davetiyemgo.com/tr/times/ask-bulteni",
];

const summary = [];
for (const url of pages) {
  try {
    const { status, url: finalUrl, text } = await fetchText(url);
    const assets = extractAssets(text);
    const file = join(outDir, `${status}-${Buffer.from(url).toString("base64url").slice(0, 40)}.html`);
    writeFileSync(file, text);
    summary.push({ url, status, finalUrl, assetCount: assets.length, assets: assets.slice(0, 40), sample: text.slice(0, 500) });
  } catch (err) {
    summary.push({ url, error: String(err) });
  }
}

// Probe likely times studio chunks from Vite/Astro hashed builds via sitemap or known paths
const probes = [
  "/assets/times-reader.js",
  "/assets/times-reader.css",
  "/assets/times.js",
  "/assets/panel-times.js",
  "/assets/TimesStudio.js",
  "/_astro/",
];
for (const p of probes) {
  const url = `https://davetiyemgo.com${p}`;
  try {
    const res = await fetch(url, { method: "HEAD", redirect: "follow" });
    summary.push({ probe: url, status: res.status, finalUrl: res.url, type: res.headers.get("content-type") });
  } catch (err) {
    summary.push({ probe: url, error: String(err) });
  }
}

writeFileSync(join(outDir, "summary.json"), JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));
