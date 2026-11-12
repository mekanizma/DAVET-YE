import fs from "fs";

const j = JSON.parse(
  fs.readFileSync(
    "C:/Users/YILDIRIM/.cursor/projects/d-davetiye/agent-tools/b9709598-408b-4cdb-aa16-83a67a9ef5e2.txt",
    "utf8",
  ),
);
const nr = j.normalized_result;
const events = nr.events?.items || [];
console.log("=== CONSOLE/ERRORS ===");
for (const e of events) {
  const s = JSON.stringify(e);
  if (/error|404|Exception|Hydration|failed/i.test(s)) {
    console.log(s.slice(0, 450));
    console.log("---");
  }
}

console.log("\n=== STEPS ===");
for (const s of nr.steps || []) {
  const url = s.artifacts?.url?.value?.url || "";
  const a11y = s.artifacts?.accessibility?.value?.text || "";
  const loading = (a11y.match(/Yükleniyor/g) || []).length;
  const headings = [...a11y.matchAll(/heading "([^"]+)"/g)].map((m) => m[1]).slice(0, 3);
  const empty =
    /Henüz|boş|Bulunamadı|could not be found|Sayfa bulunamadı/i.test(a11y);
  console.log(
    JSON.stringify({
      step: s.step_id,
      status: s.status,
      url,
      loading,
      emptyish: empty,
      headings,
      a11yLen: a11y.length,
    }),
  );
}
