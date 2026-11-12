import fs from "node:fs";
const r = JSON.parse(fs.readFileSync("tmp/invite-audit/report.json", "utf8"));
const errs = new Map();
for (const row of r.rows) {
  for (const e of row.consoleErrors || []) {
    let k = e;
    if (/webpack-hmr|HotModule|_next\/webpack/i.test(e)) k = "HMR websocket (dev only)";
    else if (/status of 500/i.test(e)) k = "HTTP 500 resource";
    else k = e.slice(0, 140);
    errs.set(k, (errs.get(k) || 0) + 1);
  }
}
const healthy = r.rows.filter(
  (x) => x.audit?.hasStage && x.audit?.fontIssueN === 0 && !(x.audit?.badImgs || []).length && !x.error,
);
console.log("healthy core", healthy.length, "/", r.total);
console.log("errors:");
for (const [k, v] of [...errs.entries()].sort((a, b) => b[1] - a[1])) console.log(v, k);
const fails = r.rows.filter((x) => x.error || !x.audit?.hasStage || x.audit?.fontIssueN || x.audit?.badImgs?.length);
console.log("real fails", fails.length);
for (const f of fails) {
  console.log(
    "-",
    f.slug,
    f.error || `stage=${f.audit?.hasStage} fonts=${f.audit?.fontIssueN} imgs=${f.audit?.badImgs?.length}`,
  );
}
