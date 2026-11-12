/**
 * Pull KendinTasarla ready designs from davetiyemgo.com card-studio boot data.
 */
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "src/data/studio-designs");
const IMG_DIR = path.join(ROOT, "public/img/studio-presets");
const BASE = "https://davetiyemgo.com";

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(IMG_DIR, { recursive: true });

function slugify(name) {
  return name
    .toLocaleLowerCase("tr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function download(url, dest) {
  if (fs.existsSync(dest) && fs.statSync(dest).size > 200) return false;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(dest, buf);
  return true;
}

const html = await (await fetch(`${BASE}/tr/tasarla`)).text();
const bootMatch = html.match(/<script[^>]*type="application\/json"[^>]*>(\{[\s\S]*?\})<\/script>/);
let boot = null;
if (bootMatch) {
  try {
    boot = JSON.parse(bootMatch[1]);
  } catch {}
}

// Also try inline assignment patterns
if (!boot) {
  const m = html.match(/\{\"mode\":\"customer\"[\s\S]*?\}\s*<\/script>/);
  if (m) {
    const raw = m[0].replace(/\s*<\/script>$/, "");
    try {
      boot = JSON.parse(raw);
    } catch {}
  }
}

const jsHref = [...html.matchAll(/src="(\/assets\/card-studio[^"]+\.js)"/g)].map((x) => x[1])[0];
const jsUrl = jsHref ? new URL(jsHref, BASE).href : `${BASE}/assets/card-studio.9ujjitg6i8.js`;
console.log("js", jsUrl);
const js = await (await fetch(jsUrl)).text();
fs.writeFileSync(path.join(OUT_DIR, "_card-studio.js"), js);

// Heuristic: find large JSON arrays of design objects
const candidates = [];
const re = /\{[^{}]{0,80}"(?:id|slug|name|title)"\s*:\s*"[^"]{2,80}"[^{}]{0,2000}\}/g;
// Better: look for presets key
for (const key of ["presets", "designs", "templates", "readyDesigns", "catalog", "gallery"]) {
  const idx = js.indexOf(`"${key}"`);
  if (idx >= 0) candidates.push({ key, idx });
}
console.log("key hits", candidates);

// Extract from page boot via CDP-less approach: parse __boot if present in HTML
const bootIdx = html.indexOf('"mode":"customer"');
console.log("bootIdx", bootIdx);
if (bootIdx >= 0) {
  // walk braces
  let start = html.lastIndexOf("{", bootIdx);
  let depth = 0;
  let end = -1;
  for (let i = start; i < html.length; i++) {
    const ch = html[i];
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) {
        end = i + 1;
        break;
      }
    }
  }
  if (end > start) {
    try {
      boot = JSON.parse(html.slice(start, end));
      console.log("boot keys", Object.keys(boot));
    } catch (e) {
      console.log("boot parse fail", e.message);
    }
  }
}

fs.writeFileSync(path.join(OUT_DIR, "_boot.json"), JSON.stringify(boot, null, 2));

// Search JS for design list structures containing known name
const needle = "Altın Madalyon";
const ni = js.indexOf(needle);
console.log("needle in js", ni);
if (ni >= 0) {
  // expand to nearest array
  let a = js.lastIndexOf("[", ni);
  let depth = 0;
  let end = -1;
  for (let i = a; i < js.length && i < a + 5_000_000; i++) {
    const ch = js[i];
    if (ch === "[") depth++;
    else if (ch === "]") {
      depth--;
      if (depth === 0) {
        end = i + 1;
        break;
      }
    }
  }
  if (end > a) {
    const slice = js.slice(a, end);
    fs.writeFileSync(path.join(OUT_DIR, "_presets-raw.js"), "export default " + slice);
    console.log("raw array length", slice.length);
    try {
      const arr = Function(`"use strict"; return (${slice});`)();
      console.log("parsed array", Array.isArray(arr), arr?.length, arr?.[0] && Object.keys(arr[0]));
      fs.writeFileSync(path.join(OUT_DIR, "_presets.json"), JSON.stringify(arr, null, 2));
    } catch (e) {
      console.log("array eval fail", e.message);
    }
  }
}

console.log("done");
