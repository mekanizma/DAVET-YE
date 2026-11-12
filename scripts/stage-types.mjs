import fs from "node:fs";
import path from "node:path";
const dir = "d:/davetiye/src/data/stages";
const types = new Map();
const anims = new Set();
const actions = new Set();
const iconAnims = new Set();
let videos = 0;
for (const file of fs.readdirSync(dir)) {
  const data = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));
  const d = data.design;
  if (d.intro?.video) videos++;
  const pages = [...(d.intro?.gate ? [d.intro.gate] : []), ...(d.pages || [])];
  for (const p of pages) {
    for (const el of p.elements || []) {
      types.set(el.type, (types.get(el.type) || 0) + 1);
      if (el.anim?.kind) anims.add(el.anim.kind);
      if (el.action) actions.add(el.action);
      if (el.button?.iconAnim) iconAnims.add(el.button.iconAnim);
    }
  }
}
console.log("videos", videos);
console.log("types", [...types.entries()].sort((a, b) => b[1] - a[1]));
console.log("anims", [...anims].sort().join(", "));
console.log("actions", [...actions].sort().join(", "));
console.log("iconAnims", [...iconAnims].sort().join(", "));
