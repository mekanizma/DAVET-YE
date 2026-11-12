import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const dir = "src/data/times";
const files = readdirSync(dir).filter((f) => f.endsWith(".json"));
const bySlug = {};
const union = new Map();

for (const file of files) {
  const slug = file.replace(/\.json$/, "");
  const data = JSON.parse(readFileSync(join(dir, file), "utf8"));
  const fields = data.payload?.design?.fields || data.design?.fields || [];
  bySlug[slug] = fields.map((f) => ({
    id: f.id,
    type: f.type,
    label: f.label,
    group: f.group,
    required: !!f.required,
    maxLength: f.maxLength ?? null,
    role: f.role,
  }));
  for (const f of fields) {
    const prev = union.get(f.id) || { id: f.id, types: new Set(), groups: new Set(), labels: new Set(), count: 0, requiredCount: 0 };
    prev.types.add(f.type);
    prev.groups.add(f.group || "");
    prev.labels.add(f.label || "");
    prev.count++;
    if (f.required) prev.requiredCount++;
    union.set(f.id, prev);
  }
}

const unionArr = [...union.values()].map((u) => ({
  id: u.id,
  types: [...u.types],
  groups: [...u.groups],
  labels: [...u.labels],
  count: u.count,
  requiredCount: u.requiredCount,
}));

writeFileSync(
  "tmp/original-times/all-fields.json",
  JSON.stringify({ slugCount: files.length, union: unionArr, bySlug }, null, 2),
);
console.log(JSON.stringify({ slugCount: files.length, union: unionArr }, null, 2));
