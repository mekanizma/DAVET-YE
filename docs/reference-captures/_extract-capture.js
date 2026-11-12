const fs = require("fs");

const [,, inputPath, baseName] = process.argv;
if (!inputPath || !baseName) {
  console.error("Usage: node _extract-capture.js <capture.json> <basename>");
  process.exit(1);
}

const outDir = "d:/davetiye/docs/reference-captures";
const raw = fs.readFileSync(inputPath, "utf8");
let data;
try {
  data = JSON.parse(raw);
} catch {
  const i = raw.indexOf("{");
  data = JSON.parse(raw.slice(i));
}

const steps = data?.normalized_result?.steps || [];
if (!steps.length) {
  console.error("No steps found. topKeys=", Object.keys(data || {}));
  process.exit(2);
}

const last = steps[steps.length - 1];
const arts = last.artifacts || {};
console.log("steps", steps.length, "last", last.step_id || last.id);
console.log(
  "url",
  JSON.stringify(arts.url || last.after_url || data?.normalized_result?.scenario?.final_url || null)
);

function unwrap(art) {
  if (!art) return null;
  if (art.state === "captured" && art.value != null) return art.value;
  return art;
}

function findBase64(shot) {
  if (!shot) return null;
  if (typeof shot === "string") return shot;
  const v = unwrap(shot) || shot;
  const candidates = [
    v.data_base64,
    v.base64,
    v.data,
    v.bytes,
    v.content,
    v.png,
    v.image?.base64,
    v.image?.data,
    v.payload?.base64,
    v.payload?.data,
  ];
  for (const c of candidates) {
    if (typeof c === "string" && c.length > 100) return c;
  }
  return null;
}

const shot = arts.screenshot;
if (shot) {
  console.log("screenshot keys", Object.keys(shot));
  let b64 = findBase64(shot);
  if (!b64) {
    console.log("screenshot sample", JSON.stringify(shot).slice(0, 800));
  } else {
    if (b64.startsWith("data:")) {
      b64 = b64.slice(b64.indexOf(",") + 1);
    }
    const buf = Buffer.from(b64, "base64");
    const pngPath = `${outDir}/${baseName}.png`;
    fs.writeFileSync(pngPath, buf);
    console.log("wrote", pngPath, buf.length);
  }
} else {
  console.log("no screenshot artifact");
}

const a11yRaw = unwrap(arts.accessibility) ?? arts.accessibility;
const a11y = a11yRaw;
if (a11y) {
  let text;
  if (typeof a11y === "string") text = a11y;
  else if (typeof a11y.text === "string") text = a11y.text;
  else if (typeof a11y.snapshot === "string") text = a11y.snapshot;
  else text = JSON.stringify(a11y, null, 2);
  const a11yPath = `${outDir}/${baseName}-a11y.txt`;
  fs.writeFileSync(a11yPath, text);
  console.log("wrote", a11yPath, text.length);

  const lower = text.toLowerCase();
  for (const term of [
    "tam ekran",
    "önizleme",
    "onizleme",
    "demo",
    "preview",
    "fullscreen",
    "canlı",
    "canli",
  ]) {
    const idx = lower.indexOf(term);
    console.log("term", term, idx >= 0 ? `FOUND@${idx}` : "missing");
  }

  // Print link/button names containing those terms
  const nameRe =
    /"name"\s*:\s*"([^"]*(?:Tam ekran|önizleme|Onizleme|Demo|Preview|Fullscreen|canlı|Canlı)[^"]*)"/gi;
  let m;
  const found = new Set();
  while ((m = nameRe.exec(text))) found.add(m[1]);
  console.log("matching names:", [...found]);
} else {
  console.log("no accessibility artifact");
}
