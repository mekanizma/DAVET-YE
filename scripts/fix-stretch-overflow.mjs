/**
 * Fix stretch mastheads that overflow their boxes even at minSize.
 * Prefer lowering size/minSize; keep stretch so reader still fills the slot.
 */
import fs from "node:fs";
import path from "node:path";

const dir = path.join(process.cwd(), "src/data/times");
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json") && !f.startsWith("_"));

function widthFactor(font = "") {
  const f = font.toLowerCase();
  if (/bebas|oswald|league spartan/.test(f)) return 0.5;
  if (/playfair|abril|yeseva|rozha|gloock|dm serif|cinzel|grenze|fraunces/.test(f)) return 0.62;
  return 0.56;
}

function chars(text) {
  return Array.from(String(text || "").replace(/\u00ad/g, "").replace(/\s+/g, " ").trim());
}

const fixes = [];

for (const file of files) {
  const slug = file.replace(/\.json$/, "");
  const full = path.join(dir, file);
  const data = JSON.parse(fs.readFileSync(full, "utf8"));
  let changed = 0;

  for (const page of data.payload?.design?.pages || []) {
    for (const el of page.elements || []) {
      if (el.type !== "text") continue;
      if (!el.stretch) continue;
      const plain = String(el.text || "").replace(/\u00ad/g, "").trim();
      if (!plain) continue;
      const lines = plain.split(/\n/).map((l) => l.trim()).filter(Boolean);
      if (!lines.length || lines.length > 2) continue;

      const longest = Math.max(...lines.map((l) => chars(l).length));
      const font = el.style?.font || "";
      let size = Number(el.style?.size) || 12;
      let minSize = Number(el.minSize) || size * 0.6;
      const w = Number(el.w) || 0;
      const h = Number(el.h) || 0;
      if (w < 40 || h < 20 || size < 24) continue;

      const factor = widthFactor(font);
      const lh = Number(el.style?.lineHeight) || 1;
      // At stretch, reader scales to box — but if natural glyph box is huge before
      // layout settles, overflow flashes. Keep natural width under ~1.15 of box.
      const needW = longest * size * factor;
      const needH = lines.length * size * lh;
      const before = { size, minSize, w, h };
      let nextSize = size;
      let nextMin = minSize;

      if (needW > w * 1.05) {
        nextSize = Math.max(18, Math.floor((w / (longest * factor)) * 0.98 * 10) / 10);
        nextMin = Math.min(nextMin, Math.max(12, Math.floor(nextSize * 0.6 * 10) / 10));
      }
      if (needH > h * 1.08) {
        const byH = Math.floor((h / (lines.length * lh)) * 0.95 * 10) / 10;
        nextSize = Math.min(nextSize, Math.max(18, byH));
        nextMin = Math.min(nextMin, Math.max(12, Math.floor(nextSize * 0.6 * 10) / 10));
      }

      // Always ensure shrink can also run as fallback when stretch is skipped in tiny embeds
      if (el.fit !== "shrink") el.fit = "shrink";

      if (nextSize === before.size && nextMin === before.minSize) continue;
      el.style.size = nextSize;
      el.minSize = nextMin;
      changed++;
      fixes.push({
        slug,
        page: page.name,
        id: el.id,
        text: plain.replace(/\s+/g, " ").slice(0, 40),
        before,
        after: { size: nextSize, minSize: nextMin, w, h },
      });
    }
  }

  if (changed) fs.writeFileSync(full, JSON.stringify(data));
  console.log(`${slug}: ${changed} stretch fixes`);
}

console.log(`\n${fixes.length} total`);
for (const f of fixes.slice(0, 40)) {
  console.log(`- ${f.slug}/${f.page} ${f.id} "${f.text}" ${f.before.size}→${f.after.size}`);
}
