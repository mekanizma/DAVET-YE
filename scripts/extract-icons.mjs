import fs from "node:fs";

const s = fs.readFileSync("d:/davetiye/docs/reference-captures/invite.js", "utf8");
const start = s.indexOf('envelopeOpen:');
const start2 = s.lastIndexOf("{", start);
console.log("near", s.slice(start2, start2 + 200));
// grab icon map by finding label:" patterns near path
const re = /([A-Za-z0-9_]+):\{label:"([^"]*)",path:"([^"]*)"\}/g;
const icons = {};
let m;
while ((m = re.exec(s))) icons[m[1]] = { label: m[2], path: m[3] };
console.log("icons", Object.keys(icons).length);
fs.writeFileSync("d:/davetiye/src/data/stage-icons.json", JSON.stringify(icons, null, 2));
console.log(Object.keys(icons).join(", "));
