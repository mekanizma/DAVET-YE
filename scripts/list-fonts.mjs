import fs from "node:fs";

const s = fs.readFileSync("d:/davetiye/docs/reference-captures/invite.js", "utf8");
const html = fs.readFileSync("d:/davetiye/docs/reference-captures/guz-masali.html", "utf8");
const set = new Set();
for (const src of [s, html]) {
  for (const m of src.matchAll(/\/fonts\/[a-z0-9._-]+\.woff2/gi)) set.add(m[0]);
}
console.log([...set].sort().join("\n"));
console.log("count", set.size);
