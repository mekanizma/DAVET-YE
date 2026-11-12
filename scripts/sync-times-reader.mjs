/**
 * Syncs Go Post / times-reader designs from davetiyemgo.com for every newspaper slug.
 * Saves payload JSON, page images, shared reader assets, fonts, and page-turn sound.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const ORIGIN = "https://davetiyemgo.com";
const BRAND = "Davetanisi";

const newspapersPath = path.join(ROOT, "src/data/newspapers.ts");
const slugMatches = [...fs.readFileSync(newspapersPath, "utf8").matchAll(/slug:\s*"([^"]+)"/g)];
const slugs = [...new Set(slugMatches.map((m) => m[1]))];

const outJsonDir = path.join(ROOT, "src/data/times");
const outAssetsDir = path.join(ROOT, "public/assets");
const outImgRoot = path.join(ROOT, "public/img/times");
const outFonts = path.join(ROOT, "public/fonts");
const outSounds = path.join(ROOT, "public/sounds");

for (const dir of [outJsonDir, outAssetsDir, outImgRoot, outFonts, outSounds]) {
  fs.mkdirSync(dir, { recursive: true });
}

async function fetchText(url) {
  const res = await fetch(url, {
    headers: { "user-agent": "DavetanisiTimesSync/1.0", accept: "*/*" },
  });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.text();
}

async function fetchBuffer(url) {
  const res = await fetch(url, {
    headers: { "user-agent": "DavetanisiTimesSync/1.0", accept: "*/*" },
  });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

async function saveUrl(urlPath, destAbs) {
  if (!urlPath || !urlPath.startsWith("/")) return false;
  if (fs.existsSync(destAbs) && fs.statSync(destAbs).size > 0) return false;
  fs.mkdirSync(path.dirname(destAbs), { recursive: true });
  const buf = await fetchBuffer(ORIGIN + urlPath);
  fs.writeFileSync(destAbs, buf);
  return true;
}

function collectAssetPaths(value, bag = new Set()) {
  if (typeof value === "string") {
    if (
      value.startsWith("/img/") ||
      value.startsWith("/fonts/") ||
      value.startsWith("/sounds/") ||
      value.startsWith("/media/") ||
      value.startsWith("/uploads/")
    ) {
      bag.add(value.split("?")[0]);
    }
    return bag;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectAssetPaths(item, bag);
    return bag;
  }
  if (value && typeof value === "object") {
    for (const v of Object.values(value)) collectAssetPaths(v, bag);
  }
  return bag;
}

function extractReaderData(html) {
  const marker = 'id="times-reader-data"';
  const i = html.indexOf(marker);
  if (i < 0) throw new Error("times-reader-data missing");
  const gt = html.indexOf(">", i);
  const end = html.indexOf("</script>", gt);
  if (gt < 0 || end < 0) throw new Error("times-reader-data script broken");
  return JSON.parse(html.slice(gt + 1, end));
}

function extractAssetHrefs(html) {
  const css = [...html.matchAll(/href="(\/assets\/times-reader[^"]+\.css)"/g)].map((m) => m[1]);
  const js = [...html.matchAll(/src="(\/assets\/times-reader[^"]+\.js)"/g)].map((m) => m[1]);
  return { css: css[0], js: js[0] };
}

function patchTimesReader(js) {
  // Uniform contain-scale for stretch fit (avoids squashed glyphs)
  const stretchNeedle =
    "e.style.transform=`scale(${o.toFixed(5)}, ${l.toFixed(5)}) translate(${r.toFixed(4)}%, ${s.toFixed(4)}%)`";
  const stretchPatch =
    "let u=Math.min(o,l);e.style.transform=`scale(${u.toFixed(5)}, ${u.toFixed(5)}) translate(${r.toFixed(4)}%, ${s.toFixed(4)}%)`";
  if (js.includes(stretchNeedle)) js = js.replace(stretchNeedle, stretchPatch);

  if (js.includes("window.DavetanisiTimes")) return js;
  const needle =
    'ke=document.querySelector("[data-times-reader]"),lt=document.getElementById("times-reader-data");if(ke&&lt?.textContent){let t=JSON.parse(lt.textContent);if(t.listen){let e=null;window.addEventListener("message",a=>{if(a.origin!==location.origin)return;let n=a.data;if(!(n?.type!=="times:render"||!n.payload)){e?.destroy();try{e=new re(ke,{...t,payload:n.payload,title:n.title??""})}catch(i){console.error("Gazete \\xF6nizlemesi a\\xE7\\u0131lamad\\u0131",i)}}}),window.parent.postMessage({type:"times:ready"},location.origin)}else try{new re(ke,t)}catch(e){console.error("Gazete a\\xE7\\u0131lamad\\u0131",e)}}';
  const replacement = `ke=document.querySelector("[data-times-reader]"),lt=document.getElementById("times-reader-data");window.DavetanisiTimes={_inst:null,mount(el,data){try{this._inst?.destroy?.()}catch(e){}el=el||document.querySelector("[data-times-reader]");if(!el||!data)return null;el.replaceChildren();el.className="tr";el.setAttribute("data-times-reader","");try{this._inst=new re(el,data);return this._inst}catch(e){console.error("Gazete açılamadı",e);return null}},destroy(){try{this._inst?.destroy?.()}catch(e){}this._inst=null}};if(ke&&lt?.textContent){let t=JSON.parse(lt.textContent);if(t.listen){let e=null;window.addEventListener("message",a=>{if(a.origin!==location.origin)return;let n=a.data;if(!(n?.type!=="times:render"||!n.payload)){e?.destroy();try{e=new re(ke,{...t,payload:n.payload,title:n.title??""});window.DavetanisiTimes._inst=e}catch(i){console.error("Gazete önizlemesi açılamadı",i)}}}),window.parent.postMessage({type:"times:ready"},location.origin)}else try{window.DavetanisiTimes._inst=new re(ke,t)}catch(e){console.error("Gazete açılamadı",e)}}`;
  if (!js.includes(needle)) {
    console.warn("times-reader boot string changed — mount API not patched");
    return js;
  }
  return js.replace(needle, replacement);
}

console.log(`Syncing ${slugs.length} newspaper times designs…`);

let readerCss = null;
let readerJs = null;
let ok = 0;
const failures = [];

for (const slug of slugs) {
  try {
    const html = await fetchText(`${ORIGIN}/times/sablon/${slug}`);
    const assets = extractAssetHrefs(html);
    if (assets.css) readerCss = assets.css;
    if (assets.js) readerJs = assets.js;

    const data = extractReaderData(html);
    if (data.settings) {
      data.settings.brand = BRAND;
    }
    if (data.settings?.soundUrl) {
      // keep path; file downloaded below
    }

    const jsonPath = path.join(outJsonDir, `${slug}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2));

    const paths = collectAssetPaths(data);
    let downloaded = 0;
    for (const p of paths) {
      const dest = path.join(ROOT, "public", p.replace(/^\//, "").replaceAll("/", path.sep));
      if (await saveUrl(p, dest)) downloaded += 1;
    }

    // Also mirror cover jpg already used on listing if present remotely as folder assets
    console.log(`✓ ${slug}  pages=${data.payload?.design?.pages?.length ?? "?"}  newAssets=${downloaded}`);
    ok += 1;
  } catch (err) {
    failures.push(`${slug}: ${err.message}`);
    console.error(`✗ ${slug}: ${err.message}`);
  }
}

if (readerCss) {
  const dest = path.join(outAssetsDir, "times-reader.css");
  await saveUrl(readerCss, dest);
  // Always refresh reader binaries
  fs.writeFileSync(dest, await fetchBuffer(ORIGIN + readerCss));
  console.log(`reader css ← ${readerCss}`);
}
if (readerJs) {
  const dest = path.join(outAssetsDir, "times-reader.js");
  let js = (await fetchBuffer(ORIGIN + readerJs)).toString("utf8");
  js = patchTimesReader(js);
  fs.writeFileSync(dest, js);
  console.log(`reader js  ← ${readerJs} (mount API patched)`);
}

// Ensure page-turn sound exists even if a template omitted it
await saveUrl("/sounds/times-page-turn.mp3", path.join(outSounds, "times-page-turn.mp3"));

const manifest = {
  syncedAt: new Date().toISOString(),
  origin: ORIGIN,
  brand: BRAND,
  count: ok,
  slugs,
  reader: { css: "/assets/times-reader.css", js: "/assets/times-reader.js" },
  failures,
};
fs.writeFileSync(path.join(outJsonDir, "_manifest.json"), JSON.stringify(manifest, null, 2));
console.log(`Done: ${ok}/${slugs.length}. Failures: ${failures.length}`);
if (failures.length) process.exitCode = 1;
