import fs from "node:fs";
const s = fs.readFileSync("d:/davetiye/docs/reference-captures/invite.js", "utf8");
for (const n of ["cinzeldecorative", "Beau Rivage", "beaurivage", "font-family"]) {
  const i = s.indexOf(n);
  console.log("\n##", n, i);
  if (i >= 0) console.log(s.slice(Math.max(0, i - 120), i + 180));
}
