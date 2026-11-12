import fs from "node:fs";
const s = fs.readFileSync("d:/davetiye/docs/reference-captures/invite.js", "utf8");
const re = /family:"([^"]+)"[^]{0,180}?url:"([^"]+)"/g;
const hits = [];
let m;
while ((m = re.exec(s))) hits.push([m[1], m[2], m[0].slice(0, 160)]);
console.log("hits", hits.length);
console.log(hits.slice(0, 8).map((h) => h[2]).join("\n---\n"));
// also url then family
const re2 = /url:"(\/fonts\/[^"]+)"[\s\S]{0,80}?family:"([^"]+)"/g;
let c = 0;
while ((m = re2.exec(s)) && c < 5) {
  console.log("REV", m[2], m[1]);
  c++;
}
