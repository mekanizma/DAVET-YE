import fs from "fs";

const j = JSON.parse(
  fs.readFileSync(
    "C:/Users/YILDIRIM/.cursor/projects/d-davetiye/agent-tools/b9116141-cc61-4270-a2fe-43aea65a1f7d.txt",
    "utf8",
  ),
);
const nr = j.normalized_result;
const events = nr.events?.items || [];
console.log("events", events.length);
const hist = {};
for (const e of events) {
  const k = e.type || e.kind || e.family || e.event || "unknown";
  hist[k] = (hist[k] || 0) + 1;
}
console.log("hist", hist);

const interesting = [];
for (const e of events) {
  const s = JSON.stringify(e);
  if (/error|exception|failed|TypeError|ReferenceError|Hydration/i.test(s)) {
    interesting.push(s.slice(0, 600));
  }
}
console.log("interesting", interesting.length);
interesting.slice(0, 40).forEach((x, i) => console.log(i, x, "\n---"));

const steps = nr.steps || [];
for (const s of steps) {
  const url = s.artifacts?.url?.value?.url || s.after_url?.url || "";
  console.log(s.step_id, s.status, url);
}
