/**
 * Download theme opening videos (acilis.mp4) from the reference CDN.
 * Saves to public/img/davetiye/{slug}/acilis.mp4
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const themes = JSON.parse(fs.readFileSync(path.join(ROOT, "src/data/themes.json"), "utf8"));
const BASE = "https://davetiyemgo.com/img/davetiye";

const concurrency = 4;
let i = 0;
const queue = themes.map((t) => t.slug);

async function one(slug) {
  const url = `${BASE}/${slug}/acilis.mp4`;
  const dir = path.join(ROOT, "public/img/davetiye", slug);
  const dest = path.join(dir, "acilis.mp4");
  if (fs.existsSync(dest) && fs.statSync(dest).size > 10_000) {
    console.log("skip", slug);
    return "skip";
  }
  const res = await fetch(url);
  if (!res.ok) {
    console.log("miss", slug, res.status);
    return "miss";
  }
  fs.mkdirSync(dir, { recursive: true });
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(dest, buf);
  console.log("ok", slug, Math.round(buf.length / 1024) + "KB");
  return "ok";
}

async function worker() {
  const counts = { ok: 0, skip: 0, miss: 0 };
  while (i < queue.length) {
    const slug = queue[i++];
    const r = await one(slug);
    counts[r]++;
  }
  return counts;
}

const results = await Promise.all(Array.from({ length: concurrency }, () => worker()));
const totals = results.reduce(
  (a, b) => ({ ok: a.ok + b.ok, skip: a.skip + b.skip, miss: a.miss + b.miss }),
  { ok: 0, skip: 0, miss: 0 },
);
console.log("done", totals);
