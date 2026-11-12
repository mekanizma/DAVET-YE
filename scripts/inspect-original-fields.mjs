import { readFileSync, writeFileSync, readdirSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const data = JSON.parse(readFileSync("tmp/original-times/ask-bulteni-data.json", "utf8"));
const design = data.payload?.design || {};
const fields = design.fields || [];
const images = (design.images || design.layers || []).filter?.(Boolean) || [];

// Collect all layers/elements with fieldId
function walk(node, acc = []) {
  if (!node || typeof node !== "object") return acc;
  if (Array.isArray(node)) {
    for (const n of node) walk(n, acc);
    return acc;
  }
  if (node.fieldId || node.field || node.bind) {
    acc.push({
      fieldId: node.fieldId || node.field || node.bind,
      type: node.type,
      kind: node.kind,
      role: node.role,
      text: typeof node.text === "string" ? node.text.slice(0, 80) : undefined,
      src: node.src || node.url,
      label: node.label,
      name: node.name,
      id: node.id,
    });
  }
  for (const v of Object.values(node)) {
    if (v && typeof v === "object") walk(v, acc);
  }
  return acc;
}

const fieldEls = walk(design);
const byId = {};
for (const f of fieldEls) {
  const id = f.fieldId;
  if (!byId[id]) byId[id] = [];
  byId[id].push(f);
}

const summary = {
  designKeys: Object.keys(design),
  values: data.payload.values,
  photos: data.payload.photos,
  fieldDefs: fields,
  uniqueFieldIds: Object.keys(byId),
  fieldElsSample: fieldEls.slice(0, 40),
  settings: data.settings,
  strings: data.strings,
  preview: data.preview,
  embedded: data.embedded,
};

writeFileSync("tmp/original-times/ask-bulteni-fields-summary.json", JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));

// Also inspect local synced design
const localPath = "src/data/times/ask-bulteni.json";
try {
  const local = JSON.parse(readFileSync(localPath, "utf8"));
  const ldesign = local.payload?.design || local.design || {};
  const lwalk = walk(ldesign);
  console.log(
    "\nLOCAL",
    JSON.stringify(
      {
        keys: Object.keys(local),
        designKeys: Object.keys(ldesign),
        values: local.payload?.values || local.values,
        uniqueFieldIds: [...new Set(lwalk.map((x) => x.fieldId))],
        fields: ldesign.fields,
      },
      null,
      2,
    ),
  );
} catch (e) {
  console.log("local missing", e.message);
}
