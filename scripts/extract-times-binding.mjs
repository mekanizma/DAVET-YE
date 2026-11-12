import { readFileSync, writeFileSync } from "node:fs";

const js = readFileSync("tmp/original-times/times-reader.qoimp8lzob.js", "utf8");
const local = readFileSync("public/assets/times-reader.js", "utf8");

function slices(src, needles, pad = 180) {
  const out = [];
  for (const n of needles) {
    let idx = 0;
    let c = 0;
    while ((idx = src.indexOf(n, idx)) !== -1 && c < 4) {
      out.push({ needle: n, at: idx, text: src.slice(Math.max(0, idx - pad), idx + pad) });
      idx += n.length;
      c++;
    }
  }
  return out;
}

const needles = [
  "fieldId",
  "payload",
  "photos",
  "sample:!1",
  "type:\"image\"",
  'type:"image"',
  ".src",
  "mount(",
  "destroy",
  "export{",
  "window.",
  "GoPost",
  "Times",
];

const report = {
  originalExports: js.match(/export\{[^}]+\}/g),
  localExports: local.match(/export\{[^}]+\}/g),
  originalWindow: [...new Set(js.match(/window\.[A-Za-z0-9_]+/g) || [])],
  localWindow: [...new Set(local.match(/window\.[A-Za-z0-9_]+/g) || [])],
  originalSlices: slices(js, [
    "fieldId",
    "photos",
    "values[",
    "o(T.field",
    "el.fieldId",
    "h.fieldId",
    "image",
    "src:",
    "mount(e",
    "mount(t",
  ]),
  localSlices: slices(local, ["fieldId", "photos", "values[", "DavetanisiTimes", "mount("]),
};

writeFileSync("tmp/original-times/binding-report.json", JSON.stringify(report, null, 2));
console.log(
  JSON.stringify(
    {
      originalExports: report.originalExports,
      localExports: report.localExports,
      originalWindow: report.originalWindow.slice(0, 30),
      localWindow: report.localWindow.slice(0, 30),
      sliceCount: report.originalSlices.length,
      first: report.originalSlices.slice(0, 8),
    },
    null,
    2,
  ),
);
