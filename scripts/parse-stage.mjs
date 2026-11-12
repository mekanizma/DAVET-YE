import fs from "node:fs";

const html = fs.readFileSync("d:/davetiye/docs/reference-captures/guz-masali.html", "utf8");
const m = html.match(/id="stage-data">([\s\S]*?)<\/script>/);
if (!m) throw new Error("no stage-data");
const data = JSON.parse(m[1]);
const d = data.design;
console.log("top", Object.keys(data));
console.log("design", Object.keys(d));
console.log("intro", Object.keys(d.intro || {}));
console.log("video", d.intro?.video);
console.log("neutral", d.intro?.neutralVideo, d.intro?.neutralPoster);
console.log(
  "pages",
  (d.pages || []).map((p) => ({
    id: p.id,
    name: p.name,
    kind: p.kind,
    els: (p.elements || []).length,
    types: [...new Set((p.elements || []).map((e) => e.type))],
  })),
);
const sample = (d.pages || [])[0]?.elements?.[0];
console.log("sample el keys", sample && Object.keys(sample));
console.log("sample", JSON.stringify(sample, null, 2).slice(0, 1500));
const gate = d.intro?.gate?.elements || [];
console.log(
  "gate",
  gate.map((e) => ({ type: e.type, name: e.name, anim: e.animation, enter: e.enter, keys: Object.keys(e) })),
);
fs.writeFileSync("d:/davetiye/docs/reference-captures/guz-stage.json", JSON.stringify(data, null, 2));
console.log("bytes", JSON.stringify(data).length);
