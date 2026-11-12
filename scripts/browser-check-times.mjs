import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const BASE = process.env.TIMES_CHECK_BASE || "http://127.0.0.1:3001";
const dir = path.join(ROOT, "src/data/times");
const slugs = fs
  .readdirSync(dir)
  .filter((f) => f.endsWith(".json") && !f.startsWith("_"))
  .map((f) => f.replace(/\.json$/, ""))
  .sort();

const fails = [];
for (const slug of slugs) {
  const design = JSON.parse(fs.readFileSync(path.join(dir, `${slug}.json`), "utf8"));
  const title = design.title || slug;
  const pages = design.payload?.design?.pages || [];
  const pageNames = pages.map((p) => p.name || p.id).join(" | ");
  const res = await fetch(`${BASE}/times/sablon/${slug}`);
  const html = await res.text();
  const hasTitle = html.includes(title);
  const ok = res.ok && hasTitle && pages.length === 4;
  console.log(`${ok ? "OK" : "FAIL"} ${slug} · ${title} · pages=${pages.length} · ${pageNames}`);
  if (!ok) fails.push(slug);
}

console.log(`\nchecked=${slugs.length} fail=${fails.length}`);
if (fails.length) {
  console.log("FAILS:", fails.join(", "));
  process.exitCode = 1;
}
