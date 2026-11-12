/**
 * Fix short display headlines that overflow their boxes.
 * Ignores soft hyphens; prefers size/minSize reduction over box growth.
 */
import fs from "node:fs";
import path from "node:path";

const dir = path.join(process.cwd(), "src/data/times");
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json") && !f.startsWith("_"));

function widthFactor(font = "") {
  const f = font.toLowerCase();
  if (/bebas|oswald|league spartan/.test(f)) return 0.5;
  if (/script|allura|allison|birthstone|qwitcher|nautigal|dancing|parisienne|great vibes|charm|pinyon|marck/.test(f))
    return 0.44;
  if (/playfair|abril|yeseva|rozha|gloock|dm serif|cinzel|grenze/.test(f)) return 0.64;
  return 0.56;
}

function visibleChars(text) {
  return Array.from(String(text || "").replace(/\u00ad/g, "").replace(/\s+/g, " ").trim());
}

const fixes = [];

for (const file of files) {
  const slug = file.replace(/\.json$/, "");
  const full = path.join(dir, file);
  const data = JSON.parse(fs.readFileSync(full, "utf8"));
  const canvasW = data.payload?.design?.canvas?.width || 800;
  let changed = 0;

  for (const page of data.payload?.design?.pages || []) {
    for (const el of page.elements || []) {
      if (el.type !== "text") continue;
      const raw = el.text;
      if (!raw || typeof raw !== "string") continue;

      // Only short display / masthead-like lines (avoids body copy)
      const plain = raw.replace(/\u00ad/g, "").trim();
      const lines = plain.split(/\n/).map((l) => l.trim()).filter(Boolean);
      if (!lines.length || lines.length > 3) continue;
      const longest = Math.max(...lines.map((l) => visibleChars(l).length));
      if (longest < 4 || longest > 28) continue;

      const font = el.style?.font || "";
      const size = Number(el.style?.size) || 12;
      if (size < 18) continue; // body text left alone

      let minSize = Number(el.minSize) || Math.max(4, size * 0.55);
      const x = Number(el.x) || 0;
      let w = Number(el.w) || 0;
      let h = Number(el.h) || 0;
      if (w < 20 || h < 10) continue;

      const factor = widthFactor(font);
      const lh = Number(el.style?.lineHeight) || 1.05;
      const needWAtMin = longest * minSize * factor;
      const needHAtMin = lines.length * minSize * lh;
      const overflowW = needWAtMin > w * 1.1;
      const overflowH = needHAtMin > h * 1.15;
      if (!overflowW && !overflowH) continue;

      const before = { w, h, minSize, size };
      let nextSize = size;

      if (overflowW) {
        const room = Math.max(0, canvasW - 20 - x - w);
        const want = Math.ceil(needWAtMin - w + 6);
        if (room >= 8 && want > 0) {
          w += Math.min(room, want);
        }
        // Recompute with possibly wider box
        const still = longest * minSize * factor > w * 1.05;
        if (still) {
          minSize = Math.max(6, Math.floor((w / (longest * factor)) * 10) / 10);
          if (size > minSize * 1.35) nextSize = Math.max(minSize, Math.round(minSize * 1.25 * 10) / 10);
        }
      }

      if (overflowH) {
        minSize = Math.min(minSize, Math.max(6, Math.floor((h / (lines.length * lh)) * 10) / 10));
        if (nextSize > minSize * 1.35) nextSize = Math.max(minSize, Math.round(minSize * 1.25 * 10) / 10);
      }

      if (w === before.w && h === before.h && minSize === before.minSize && nextSize === before.size) continue;

      el.w = Math.round(w * 10) / 10;
      el.h = Math.round(h * 10) / 10;
      el.minSize = minSize;
      if (el.style) el.style.size = nextSize;

      changed += 1;
      fixes.push({
        slug,
        page: page.name || page.id,
        id: el.id,
        text: plain.replace(/\s+/g, " ").slice(0, 40),
        font,
        before,
        after: { w: el.w, h: el.h, minSize, size: nextSize },
      });
    }
  }

  if (changed) fs.writeFileSync(full, JSON.stringify(data, null, 2));
}

console.log(`fixed ${fixes.length} display text boxes`);
for (const f of fixes) {
  console.log(
    `${f.slug} · ${f.page} · ${f.id} · "${f.text}" · ${f.font} · w ${f.before.w}→${f.after.w} min ${f.before.minSize}→${f.after.minSize} size ${f.before.size}→${f.after.size}`,
  );
}
fs.writeFileSync(path.join(dir, "_fit-fixes.json"), JSON.stringify(fixes, null, 2));
