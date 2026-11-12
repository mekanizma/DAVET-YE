import { readFileSync, writeFileSync } from "node:fs";

const path = "public/assets/times-reader.js";
let js = readFileSync(path, "utf8");

// Show current broken region if present
const broken = js.indexOf("o.appendChild(r),(()=>{");
console.log("broken idx", broken);
if (broken >= 0) console.log(js.slice(broken, broken + 320));

const ln = js.indexOf("function Ln(t){");
console.log("Ln", js.slice(ln, ln + 220));
