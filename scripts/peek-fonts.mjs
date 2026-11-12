import fs from "node:fs";
const data = JSON.parse(fs.readFileSync("d:/davetiye/src/data/stages/guz-masali.json", "utf8"));
console.log("top fonts type", Array.isArray(data.fonts) ? "array " + data.fonts.length : typeof data.fonts);
console.log(JSON.stringify(data.fonts, null, 2).slice(0, 1500));
