import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

// Inline minimal apply since TS path aliases won't resolve in plain node
const data = JSON.parse(readFileSync("src/data/times/ask-bulteni.json", "utf8"));
const contents = { p3e11: "TEST MANŞET", p1e11: "TEST KAPAK" };
const values = { names: "ELA & BERK", city: "Bodrum" };

function walk(els, visit) {
  if (!Array.isArray(els)) return;
  for (const el of els) {
    visit(el);
    if (Array.isArray(el.elements)) walk(el.elements, visit);
  }
}

const pages = structuredClone(data.payload.design.pages);
for (const page of pages) {
  walk(page.elements, (el) => {
    if (el?.id && Object.prototype.hasOwnProperty.call(contents, el.id)) {
      el.text = contents[el.id];
    }
  });
}
data.payload.design.pages = pages;
data.payload.values = { ...data.payload.values, ...values };

const p3 = pages[2].elements.find((e) => e.id === "p3e11");
const p1 = pages[0].elements.find((e) => e.id === "p1e11");
console.log(JSON.stringify({ p3: p3.text, p1: p1.text, names: data.payload.values.names }, null, 2));
