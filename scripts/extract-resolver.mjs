import { readFileSync, writeFileSync } from "node:fs";

const js = readFileSync("tmp/original-times/times-reader.qoimp8lzob.js", "utf8");
const local = readFileSync("public/assets/times-reader.js", "utf8");

function around(src, needle, before = 400, after = 800) {
  const i = src.indexOf(needle);
  if (i < 0) return null;
  return src.slice(Math.max(0, i - before), i + after);
}

// Find resolver construction
const markers = [
  "raw:o",
  "resolver:",
  "values=",
  ".values",
  "sample:!0",
  "sample:!1",
  "function Vt",
  "DavetanisiTimes",
  "GoPostTimes",
  "globalThis",
  "self.",
];

const report = {};
for (const m of markers) {
  report[m] = around(js, m, 200, 500);
}

// Broader: find where values object is read
const valIdx = [];
let idx = 0;
while ((idx = js.indexOf("values", idx)) !== -1 && valIdx.length < 20) {
  valIdx.push({ at: idx, ctx: js.slice(Math.max(0, idx - 60), idx + 100) });
  idx += 6;
}
report.valuesHits = valIdx;

// Local mount assignment
report.localMount = around(local, "DavetanisiTimes", 100, 400);
report.localRaw = around(local, "raw:o", 300, 600) || around(local, "resolver.raw", 200, 400);
report.localVt = around(local, "function Vt", 50, 400);

writeFileSync("tmp/original-times/resolver-report.json", JSON.stringify(report, null, 2));
console.log(JSON.stringify({
  localMount: report.localMount,
  localVt: report.localVt,
  rawSnippet: report["raw:o"],
  valuesHits: report.valuesHits.slice(0, 12),
}, null, 2));
