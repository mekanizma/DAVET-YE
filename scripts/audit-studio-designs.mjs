import fs from "node:fs";
import path from "node:path";

const idx = JSON.parse(fs.readFileSync("src/data/studio-designs/index.json", "utf8"));
const issues = [];
let noCover = 0;
let missingCover = 0;
let emptyTexts = 0;

for (const it of idx.items) {
  if (!it.cover) noCover += 1;
  else {
    const p = path.join("public", it.cover.replace(/^\//, ""));
    if (!fs.existsSync(p)) {
      missingCover += 1;
      issues.push({ id: it.id, type: "missing-cover", cover: it.cover });
    }
  }
  const texts = it.texts || [];
  if (!texts.length) {
    emptyTexts += 1;
    issues.push({ id: it.id, type: "no-texts" });
  }
  if (texts.length > 14) issues.push({ id: it.id, type: "many-texts", n: texts.length });
  for (const t of texts) {
    if ((t.size || 0) > 16) issues.push({ id: it.id, type: "huge-size", size: +t.size.toFixed?.(2) || t.size, text: String(t.text).slice(0, 40) });
    if (t.y < 2 || t.y > 98) issues.push({ id: it.id, type: "edge-y", y: t.y, text: String(t.text).slice(0, 40) });
    const len = String(t.text || "").replace(/\s+/g, " ").trim().length;
    if (len > 55 && t.size >= 3.2) issues.push({ id: it.id, type: "long-dense", size: +Number(t.size).toFixed(2), len, text: String(t.text).slice(0, 60) });
    if (/\n/.test(t.text || "") === false && len > 42 && t.size >= 3.8) issues.push({ id: it.id, type: "single-line-wide", size: +Number(t.size).toFixed(2), len, text: String(t.text).slice(0, 60) });
  }
}

const byType = {};
for (const i of issues) byType[i.type] = (byType[i.type] || 0) + 1;
console.log(JSON.stringify({ total: idx.items.length, noCover, missingCover, emptyTexts, byType, issues: issues.slice(0, 60) }, null, 2));
