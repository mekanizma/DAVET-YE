import { readFileSync, writeFileSync } from "node:fs";

const path = "public/assets/times-reader.js";
let js = readFileSync(path, "utf8");

const brokenStart = js.indexOf("o.appendChild(r),(()=>{");
const brokenEnd = js.indexOf("a.appendChild(o)}function Pt", brokenStart);
if (brokenStart < 0 || brokenEnd < 0) {
  // maybe already partially fixed — try locate standard marker
  const i = js.indexOf("o.appendChild(r),e.stretch)");
  console.log("alt", i, js.slice(i, i + 280));
  process.exit(brokenStart < 0 ? 1 : 0);
}

// Keep comma-if shape:
// if (cols..., appendChild(r), stretch) { stretch + optional shrink }
// else if (shrink) { shrink }
const restored =
  'o.appendChild(r),e.stretch)(o.dataset.stretch="",e.fit==="shrink"&&(o.dataset.fit="shrink",o.dataset.fitMin=String(Math.max(.1,Math.min(1,e.minSize&&e.style?.size?e.minSize/e.style.size:.35)))));else if(e.fit==="shrink"){o.dataset.fit="shrink";let d=e.minSize&&e.style?.size?e.minSize/e.style.size:.35;o.dataset.fitMin=String(Math.max(.1,Math.min(1,d)))}';

js = js.slice(0, brokenStart) + restored + js.slice(brokenEnd);

if (!js.includes('t.style.overflow="hidden";e.style.transformOrigin="0 0"')) {
  const from =
    "function Ln(t){let e=t.firstElementChild;if(!e||!t.isConnected||t.clientWidth===0||t.clientHeight===0)return;e.style.transform=\"\";";
  const to =
    'function Ln(t){let e=t.firstElementChild;if(!e||!t.isConnected||t.clientWidth===0||t.clientHeight===0)return;t.style.overflow="hidden";e.style.transformOrigin="0 0";e.style.transform="";';
  if (!js.includes(from)) {
    console.error("Ln patch target missing");
    process.exit(1);
  }
  js = js.replace(from, to);
}

writeFileSync(path, js);
try {
  new Function(js);
  console.log("syntax OK");
} catch (e) {
  console.error("syntax FAIL", e.message);
  process.exit(1);
}
