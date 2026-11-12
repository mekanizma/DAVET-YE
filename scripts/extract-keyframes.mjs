import fs from "node:fs";
const css = fs.readFileSync("d:/davetiye/docs/reference-captures/invite.css", "utf8");
const keep = [];
const re = /@keyframes\s+([\w-]+)\s*\{/g;
let m;
while ((m = re.exec(css))) {
  if (!m[1].startsWith("stg-")) continue;
  let i = m.index + m[0].length;
  let depth = 1;
  while (i < css.length && depth) {
    if (css[i] === "{") depth++;
    else if (css[i] === "}") depth--;
    i++;
  }
  keep.push(css.slice(m.index, i));
}
fs.writeFileSync("d:/davetiye/src/app/styles/stage-motion.css", keep.join("\n") + "\n");
console.log("keyframes", keep.length);
