import { readFileSync } from "node:fs";

const d = JSON.parse(readFileSync("src/data/times/ask-bulteni.json", "utf8"));
const pages = d.payload.design.pages || [];

function walk(n, acc = []) {
  if (!n || typeof n !== "object") return acc;
  if (Array.isArray(n)) {
    for (const x of n) walk(x, acc);
    return acc;
  }
  const editable =
    n.edit === "content" ||
    n.edit === true ||
    Boolean(n.fieldId) ||
    (n.type === "image" && n.fieldId);
  if (editable && (n.type === "text" || n.type === "field" || n.type === "image")) {
    acc.push({
      id: n.id,
      type: n.type,
      edit: n.edit,
      fieldId: n.fieldId,
      name: n.name,
      text: typeof n.text === "string" ? n.text.slice(0, 60) : "",
      w: n.w,
      h: n.h,
      stretch: n.stretch,
      fit: n.fit,
      size: n.style?.size,
      minSize: n.minSize,
    });
  }
  for (const [k, v] of Object.entries(n)) {
    if (v && typeof v === "object" && k !== "style") walk(v, acc);
  }
  return acc;
}

for (let i = 0; i < pages.length; i++) {
  const els = walk(pages[i]);
  console.log(`\n== ${i} ${pages[i].name} (${els.length}) ==`);
  for (const e of els) {
    console.log(
      `- ${e.type} id=${e.id} field=${e.fieldId || "-"} edit=${e.edit} ${e.w}x${e.h} fit=${e.fit}/stretch=${e.stretch} size=${e.size}/${e.minSize} "${e.text || e.name}"`,
    );
  }
}
