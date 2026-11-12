import fs from "node:fs";
const s = fs.readFileSync("d:/davetiye/docs/reference-captures/invite.js", "utf8");
const i = s.indexOf("minWeight");
console.log("idx", i);
console.log(s.slice(i - 500, i + 200));
console.log("\n\nCOUNT minWeight", s.split("minWeight").length - 1);
