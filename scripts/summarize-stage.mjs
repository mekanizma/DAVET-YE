import fs from "node:fs";

const data = JSON.parse(fs.readFileSync("d:/davetiye/docs/reference-captures/guz-stage.json", "utf8"));
const d = data.design;
const byType = {};
for (const page of [d.intro.gate, ...d.pages]) {
  for (const el of page.elements || []) {
    if (!byType[el.type]) byType[el.type] = { page: page.name || page.id, el };
  }
}
for (const [type, { page, el }] of Object.entries(byType)) {
  const slim = { ...el };
  console.log("\n====", type, "on", page);
  console.log(JSON.stringify(slim, null, 2).slice(0, 1800));
}
console.log("\nFONTS", JSON.stringify(d.fonts, null, 2).slice(0, 800));
console.log("\nCHROME", JSON.stringify(d.chrome, null, 2).slice(0, 800));
console.log("\nVALUES keys", Object.keys(data.values || {}));
console.log(JSON.stringify(data.values, null, 2).slice(0, 1200));
console.log("\nMUSIC", JSON.stringify(data.music || d.music, null, 2).slice(0, 500));
