import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const dir = "src/data/times";
const files = readdirSync(dir).filter((f) => f.endsWith(".json") && !f.startsWith("_"));
const marker = "DAVETANISI_TEST_VALUE";
let ok = 0;
let fail = 0;
const failures = [];

for (const file of files) {
  const slug = file.replace(/\.json$/, "");
  const data = JSON.parse(readFileSync(join(dir, file), "utf8"));
  const fields = data.payload?.design?.fields || [];
  const values = {};
  for (const f of fields) {
    if (f.type === "image") {
      values[f.id] = `/img/times/${slug}/01.webp`;
      continue;
    }
    if (f.type === "dateTime" || f.type === "date") {
      values[f.id] = "2030-01-15T18:30:00Z";
      continue;
    }
    values[f.id] = `${marker}:${f.id}`;
  }
  const next = {
    ...data,
    payload: {
      ...data.payload,
      values: { ...(data.payload.values || {}), ...values },
    },
    preview: true,
    embedded: true,
  };

  const got = next.payload.values || {};
  const missing = Object.keys(values).filter((id) => got[id] !== values[id]);
  const groups = [...new Set(fields.map((f) => f.group || "Genel"))];
  if (missing.length) {
    fail++;
    failures.push({ slug, missing, fieldCount: fields.length });
  } else {
    ok++;
  }
  console.log(`${missing.length ? "FAIL" : "OK  "} ${slug.padEnd(28)} fields=${fields.length} groups=${groups.join("|")}`);
}

console.log(`\n${ok} ok / ${fail} fail / ${files.length} total`);
if (failures.length) {
  console.log(JSON.stringify(failures, null, 2));
  process.exit(1);
}
