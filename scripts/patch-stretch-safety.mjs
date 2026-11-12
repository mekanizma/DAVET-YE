import fs from "node:fs";

const p = "public/assets/times-reader.js";
let js = fs.readFileSync(p, "utf8");

const a = "let u=Math.min(o,l);e.style.transform=`scale(${u.toFixed(5)}, ${u.toFixed(5)}) translate(${r.toFixed(4)}%, ${s.toFixed(4)}%)`";
const b =
  "let u=Math.min(1,Math.min(o,l)*0.985);e.style.transform=`scale(${u.toFixed(5)}, ${u.toFixed(5)}) translate(${r.toFixed(4)}%, ${s.toFixed(4)}%)`";

if (!js.includes(a)) {
  console.error("Ln scale snippet not found");
  process.exit(1);
}
js = js.replace(a, b);

const snOld =
  'for(let i=0;i<8;i++){let o=(a+n)/2;t.style.setProperty("--fit",o.toFixed(4)),ve(t)?n=o:a=o}t.style.setProperty("--fit",a.toFixed(4)),t.classList.toggle("is-clipped",ve(t))}';
const snNew =
  'for(let i=0;i<12;i++){let o=(a+n)/2;t.style.setProperty("--fit",o.toFixed(4)),ve(t)?n=o:a=o}let r=Math.max(e,a*0.985);t.style.setProperty("--fit",r.toFixed(4)),t.classList.toggle("is-clipped",ve(t))}';

if (!js.includes(snOld)) {
  console.error("Sn loop snippet not found");
  process.exit(1);
}
js = js.replace(snOld, snNew);

fs.writeFileSync(p, js);
console.log("patched Ln safety 0.985 + Sn 12 iter / 0.985 nudge");
