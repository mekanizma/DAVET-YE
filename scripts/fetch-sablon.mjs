import { mkdirSync, writeFileSync } from "node:fs";

mkdirSync("tmp/original-times", { recursive: true });
const url = "https://davetiyemgo.com/times/sablon/ask-bulteni";
const r = await fetch(url);
const t = await r.text();
writeFileSync("tmp/original-times/sablon-ask-bulteni.html", t);

const scripts = [...t.matchAll(/<script[^>]*src="([^"]+)"/g)].map((m) => m[1]);
const assets = [...new Set([...t.matchAll(/\/assets\/[^"'\\\s>]+/g)].map((m) => m[0]))];
const dataMatch = t.match(/<script[^>]*id="times-reader-data"[^>]*>([\s\S]*?)<\/script>/);
if (dataMatch) {
  writeFileSync("tmp/original-times/ask-bulteni-data.json", dataMatch[1].trim());
}

// Also fetch panel baslat HTML (will be login) and search app for times studio chunks via gazete theme page
const theme = await fetch("https://davetiyemgo.com/tr/gazeteler/ask-bulteni");
const themeHtml = await theme.text();
writeFileSync("tmp/original-times/theme-ask-bulteni.html", themeHtml);

// Find any times-related script names in sablon HTML
const allJsRefs = [...t.matchAll(/["']([^"']+\.js[^"']*)["']/g)].map((m) => m[1]).filter((x) => /times|studio|editor|panel/i.test(x));

console.log(
  JSON.stringify(
    {
      status: r.status,
      len: t.length,
      scripts,
      assets,
      hasData: Boolean(dataMatch),
      dataLen: dataMatch?.[1]?.length ?? 0,
      allJsRefs,
      title: t.match(/<title>([^<]+)/)?.[1],
    },
    null,
    2,
  ),
);
