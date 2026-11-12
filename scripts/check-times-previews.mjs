import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const BASE = process.env.TIMES_CHECK_BASE || "http://127.0.0.1:3001";
const slugs = [
  ...new Set(
    [...fs.readFileSync(path.join(ROOT, "src/data/newspapers.ts"), "utf8").matchAll(/slug:\s*"([^"]+)"/g)].map(
      (m) => m[1],
    ),
  ),
];

function walk(value, bag = new Set()) {
  if (typeof value === "string") {
    if (value.startsWith("/") && !value.startsWith("//")) bag.add(value.split("?")[0]);
    return bag;
  }
  if (Array.isArray(value)) {
    for (const item of value) walk(item, bag);
    return bag;
  }
  if (value && typeof value === "object") {
    for (const item of Object.values(value)) walk(item, bag);
  }
  return bag;
}

const assetPrefixes = ["/img/", "/fonts/", "/sounds/", "/uploads/", "/media/"];
const local = [];
let missingJson = 0;
let missingAssets = 0;

for (const slug of slugs) {
  const file = path.join(ROOT, "src/data/times", `${slug}.json`);
  if (!fs.existsSync(file)) {
    missingJson += 1;
    local.push({ slug, ok: false, reason: "NO_JSON" });
    continue;
  }
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  const pages = data.payload?.design?.pages?.length || 0;
  const assets = [...walk(data)].filter((p) => assetPrefixes.some((prefix) => p.startsWith(prefix)));
  const missing = assets.filter((p) => !fs.existsSync(path.join(ROOT, "public", p.slice(1))));
  if (missing.length) missingAssets += 1;
  local.push({
    slug,
    ok: pages > 0 && missing.length === 0,
    pages,
    assets: assets.length,
    missing: missing.length,
    missingSample: missing.slice(0, 3),
  });
}

console.log("=== LOCAL JSON + ASSETS ===");
console.log(
  `total=${slugs.length} ok=${local.filter((r) => r.ok).length} missingJson=${missingJson} missingAssets=${missingAssets}`,
);
for (const row of local) {
  const mark = row.ok ? "OK" : "FAIL";
  if (!row.ok) {
    console.log(
      `${mark} ${row.slug} ${row.reason || ""} pages=${row.pages ?? "-"} missing=${row.missing ?? "-"} ${
        row.missingSample?.join(", ") || ""
      }`,
    );
  } else {
    console.log(`${mark} ${row.slug} pages=${row.pages} assets=${row.assets}`);
  }
}

console.log("\n=== HTTP /times/sablon/[slug] ===");
const httpRows = [];
for (const slug of slugs) {
  const url = `${BASE}/times/sablon/${slug}`;
  const t0 = Date.now();
  try {
    const res = await fetch(url, { headers: { Accept: "text/html" } });
    const html = await res.text();
    const ms = Date.now() - t0;
    const is404 = res.status === 404 || /Gazete bulunamadı|Not Found/i.test(html);
    const hasHost =
      html.includes("data-times-reader") ||
      html.includes("TimesReader") ||
      html.includes("times-shell") ||
      html.includes("/assets/times-reader");
    const ok = res.ok && !is404;
    httpRows.push({ slug, ok, status: res.status, ms, bytes: html.length, hasHost, is404 });
  } catch (err) {
    httpRows.push({ slug, ok: false, error: String(err.message || err) });
  }
}

for (const row of httpRows) {
  if (row.error) {
    console.log(`FAIL ${row.slug} ${row.error}`);
  } else {
    console.log(
      `${row.ok ? "OK" : "FAIL"} ${row.slug} status=${row.status} ${row.ms}ms bytes=${row.bytes} host=${row.hasHost}`,
    );
  }
}

const localOk = local.every((r) => r.ok);
const httpOk = httpRows.every((r) => r.ok);
console.log("\n=== SUMMARY ===");
console.log(`local=${localOk ? "ALL_OK" : "HAS_FAILS"} http=${httpOk ? "ALL_OK" : "HAS_FAILS"}`);
if (!localOk || !httpOk) process.exitCode = 1;
