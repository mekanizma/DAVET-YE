import fs from "node:fs";
const s = fs.readFileSync("d:/davetiye/docs/reference-captures/invite.js", "utf8");
const i = s.indexOf("Cinzel Decorative");
console.log(s.slice(Math.max(0, i - 200), i + 400));
console.log("---woff count", (s.match(/woff2/g) || []).length);
