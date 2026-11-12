import fs from "fs";

const BASE = "http://127.0.0.1:3000";

const routes = [
  "/",
  "/tr",
  "/tr/temalar",
  "/tr/gazeteler",
  "/tr/tasarim-studyosu",
  "/tr/tasarla",
  "/tr/ne-sunuyoruz",
  "/tr/fiyatlar",
  "/tr/nasil-calisir",
  "/tr/sss",
  "/tr/davetiye-olustur",
  "/tr/davetiye-olustur/etkinlik",
  "/tr/davetiye-olustur/sablon",
  "/tr/gazete-olustur",
  "/tr/iletisim",
  "/tr/hakkimizda",
  "/tr/rehber",
  "/tr/kosullar",
  "/tr/gizlilik",
  "/tr/kvkk",
  "/tr/cerez",
  "/tr/dugun-davetiyesi",
  "/tr/kina-davetiyesi",
  "/tr/kina-ve-dugun-davetiyesi",
  "/panel/giris",
  "/panel/kayit",
  "/panel/sifremi-unuttum",
  "/panel",
  "/tr/gazeteler/ask-bulteni",
  "/tr/gazeteler/dogum-gunu-gecesi",
  "/tr/gazeteler/sonunda-evleniyorlar",
  "/tr/gazeteler/ask-kazandi",
  "/times/sablon/ask-bulteni",
  "/times/sablon/dogum-gunu-gecesi",
];

const themes = JSON.parse(fs.readFileSync("src/data/themes.json", "utf8"));
for (const t of themes) {
  routes.push(`/tr/temalar/${t.slug}`);
  routes.push(`/onizleme/tema/${t.slug}`);
}

async function check(path) {
  const url = BASE + path;
  const res = await fetch(url, { redirect: "follow" });
  const html = await res.text();
  const assets = [...html.matchAll(/\/_next\/static\/[^"'\s>]+/g)].map(
    (m) => m[0],
  );
  const unique = [...new Set(assets)];
  const brokenAssets = [];
  for (const a of unique) {
    const ar = await fetch(BASE + a);
    if (!ar.ok) brokenAssets.push(`${a}→${ar.status}`);
  }
  const imgs = [...html.matchAll(/src="(\/img\/[^"]+)"/g)].map((m) => m[1]);
  const brokenImgs = [];
  for (const img of [...new Set(imgs)]) {
    const ir = await fetch(BASE + encodeURI(img));
    if (!ir.ok) brokenImgs.push(`${img}→${ir.status}`);
  }
  const looks404 =
    /This page could not be found|Sayfa bulunamadı/i.test(html) &&
    !/Davetanisi/.test(html);
  return {
    path,
    status: res.status,
    bytes: html.length,
    assets: unique.length,
    brokenAssets,
    brokenImgs,
    looks404,
  };
}

const results = [];
for (const r of routes) {
  try {
    results.push(await check(r));
    process.stdout.write(".");
  } catch (e) {
    results.push({ path: r, error: String(e) });
    process.stdout.write("x");
  }
}
console.log("");

const bad = results.filter(
  (r) =>
    r.error ||
    r.status >= 400 ||
    r.looks404 ||
    (r.brokenAssets && r.brokenAssets.length) ||
    (r.brokenImgs && r.brokenImgs.length),
);

console.log("checked", results.length);
console.log("bad", bad.length);
for (const b of bad) console.log(JSON.stringify(b, null, 0));
fs.writeFileSync(
  "docs/reference-captures/page-check.json",
  JSON.stringify({ checked: results.length, badCount: bad.length, bad, results }, null, 2),
);
