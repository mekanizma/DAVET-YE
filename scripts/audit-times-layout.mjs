/**
 * Browser-audit every times newspaper for overflow / font breakage.
 * Usage: node scripts/audit-times-layout.mjs
 * Env: TIMES_CHECK_BASE=http://127.0.0.1:3001
 */
import fs from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer-core";

const ROOT = process.cwd();
const BASE = process.env.TIMES_CHECK_BASE || "http://127.0.0.1:3001";
const OUT = path.join(ROOT, "tmp", "times-layout-audit");
const CHROME =
  process.env.CHROME_PATH ||
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const slugs = [
  ...new Set(
    [...fs.readFileSync(path.join(ROOT, "src/data/newspapers.ts"), "utf8").matchAll(/slug:\s*"([^"]+)"/g)].map(
      (m) => m[1],
    ),
  ),
];

fs.mkdirSync(OUT, { recursive: true });

async function pageAudit() {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const root = document.querySelector("[data-times-reader], .tr[data-times-reader], .tr");
  if (!root) return { ok: false, error: "NO_TIMES_ROOT" };

  try {
    await document.fonts.ready;
  } catch {}
  await sleep(700);

  const issues = [];
  const fontFails = [];
  const stretchBad = [];

  function isVisible(el) {
    const st = getComputedStyle(el);
    if (st.display === "none" || st.visibility === "hidden" || Number(st.opacity) === 0) return false;
    const r = el.getBoundingClientRect();
    return r.width > 1 && r.height > 1;
  }

  function checkOverflow(scope, pageIndex) {
    const nodes = scope.querySelectorAll("p, h1, h2, h3, h4, h5, h6, span, a, li, div, [data-stretch], [data-edit]");
    for (const el of nodes) {
      if (!isVisible(el)) continue;
      const st = getComputedStyle(el);
      const dx = el.scrollWidth - el.clientWidth;
      const dy = el.scrollHeight - el.clientHeight;
      const text = (el.innerText || "").replace(/\s+/g, " ").trim();
      if (!text && !el.querySelector("img")) continue;
      // ignore huge wrappers; focus text boxes
      if (el.clientWidth > 900 || el.clientHeight > 900) continue;
      if (dx > 3 || dy > 8) {
        issues.push({
          page: pageIndex,
          kind: dx > 3 ? "overflow-x" : "overflow-y",
          dx,
          dy,
          tag: el.tagName.toLowerCase(),
          cls: (el.className && String(el.className).slice(0, 80)) || "",
          edit: el.getAttribute("data-edit") || el.getAttribute("data-field") || "",
          sample: text.slice(0, 80),
          font: st.fontFamily.split(",")[0].replace(/["']/g, "").trim(),
          size: st.fontSize,
        });
      }
    }
  }

  function checkStretch(scope, pageIndex) {
    for (const el of scope.querySelectorAll("[data-stretch]")) {
      if (!isVisible(el)) continue;
      const st = getComputedStyle(el);
      const fit = st.getPropertyValue("--fit").trim();
      const scale = Number(fit || "1");
      const dx = el.scrollWidth - el.clientWidth;
      const dy = el.scrollHeight - el.clientHeight;
      const text = (el.innerText || "").replace(/\s+/g, " ").trim().slice(0, 80);
      if ((Number.isFinite(scale) && scale < 0.55) || dx > 2 || dy > 4) {
        stretchBad.push({
          page: pageIndex,
          scale: Number.isFinite(scale) ? scale : null,
          dx,
          dy,
          sample: text,
          edit: el.getAttribute("data-edit") || "",
        });
      }
    }
  }

  function checkFonts(scope, pageIndex) {
    const nodes = scope.querySelectorAll("p, h1, h2, h3, h4, h5, h6, span, [data-stretch], [data-edit]");
    for (const el of nodes) {
      if (!isVisible(el)) continue;
      const text = (el.innerText || "").trim();
      if (!text) continue;
      const st = getComputedStyle(el);
      const family = st.fontFamily;
      const first = family.split(",")[0].replace(/["']/g, "").trim().toLowerCase();
      const generic = ["serif", "sans-serif", "monospace", "cursive", "fantasy", "system-ui", "ui-serif", "ui-sans-serif"];
      if (generic.includes(first) && /headline|masthead|title|manset/i.test(el.className + (el.getAttribute("data-edit") || ""))) {
        fontFails.push({ page: pageIndex, reason: "generic-first", family, sample: text.slice(0, 60) });
      }
    }
  }

  checkOverflow(root, 0);
  checkStretch(root, 0);
  checkFonts(root, 0);

  const next =
    root.querySelector('[aria-label="Sonraki sayfa"], button.tr-next, .tr-controls [data-dir="next"]') ||
    document.querySelector('[aria-label="Sonraki sayfa"]');

  const pageCount = Number((root.innerText.match(/(\d+)\s*\/\s*(\d+)/) || [])[2] || 4);
  for (let i = 1; i < Math.min(pageCount, 6); i++) {
    if (next) {
      next.click();
      await sleep(650);
    }
    checkOverflow(root, i);
    checkStretch(root, i);
    checkFonts(root, i);
  }

  const uniq = (arr, keyFn) => {
    const seen = new Set();
    const out = [];
    for (const a of arr) {
      const k = keyFn(a);
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(a);
    }
    return out;
  };

  return {
    ok: true,
    title: document.title,
    pageCount,
    overflow: uniq(issues, (x) => `${x.page}|${x.edit}|${x.sample}`).slice(0, 40),
    stretch: uniq(stretchBad, (x) => `${x.page}|${x.sample}`).slice(0, 30),
    fonts: uniq(fontFails, (x) => `${x.page}|${x.reason}|${x.sample}`).slice(0, 20),
  };
}

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--window-size=1440,900"],
  defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 1 },
});

const page = await browser.newPage();
page.setDefaultTimeout(45000);

const summary = [];

for (const slug of slugs) {
  const url = `${BASE}/times/sablon/${encodeURIComponent(slug)}`;
  const row = { slug, url, ok: false };
  try {
    const res = await page.goto(url, { waitUntil: "networkidle2", timeout: 45000 });
    row.status = res?.status() || 0;
    await page.waitForSelector(".tr, [data-times-reader]", { timeout: 20000 });
    await page.waitForFunction(() => document.fonts && document.fonts.status === "loaded", { timeout: 10000 }).catch(() => {});
    await new Promise((r) => setTimeout(r, 900));

    const audit = await page.evaluate(pageAudit);
    row.audit = audit;
    row.ok = Boolean(audit?.ok) && (audit.overflow?.length || 0) === 0 && (audit.stretch?.length || 0) === 0;

    const shot = path.join(OUT, `${slug}.png`);
    await page.screenshot({ path: shot, fullPage: false });
    row.shot = shot;

    const o = audit.overflow?.length || 0;
    const s = audit.stretch?.length || 0;
    const f = audit.fonts?.length || 0;
    console.log(
      `${row.ok && f === 0 ? "OK" : "WARN"} ${slug} overflow=${o} stretch=${s} fonts=${f} pages=${audit.pageCount || "?"}`,
    );
    if (o) console.log("  overflow:", JSON.stringify(audit.overflow.slice(0, 3)));
    if (s) console.log("  stretch:", JSON.stringify(audit.stretch.slice(0, 3)));
    if (f) console.log("  fonts:", JSON.stringify(audit.fonts.slice(0, 3)));
  } catch (err) {
    row.error = String(err?.message || err);
    console.log(`FAIL ${slug} ${row.error}`);
  }
  summary.push(row);
}

await browser.close();

const report = {
  base: BASE,
  at: new Date().toISOString(),
  total: summary.length,
  ok: summary.filter((r) => r.ok && !(r.audit?.fonts?.length)).length,
  warn: summary.filter((r) => !r.error && (!r.ok || r.audit?.fonts?.length)).length,
  fail: summary.filter((r) => r.error).length,
  rows: summary,
};
fs.writeFileSync(path.join(OUT, "report.json"), JSON.stringify(report, null, 2));

console.log("\n=== SUMMARY ===");
console.log(`total=${report.total} clean=${report.ok} warn=${report.warn} fail=${report.fail}`);
console.log(`report: ${path.join(OUT, "report.json")}`);

const problem = summary.filter((r) => r.error || !r.ok || r.audit?.fonts?.length);
if (problem.length) {
  console.log("\nPROBLEMS:");
  for (const r of problem) {
    console.log(
      `- ${r.slug}: ${r.error || `overflow=${r.audit?.overflow?.length || 0} stretch=${r.audit?.stretch?.length || 0} fonts=${r.audit?.fonts?.length || 0}`}`,
    );
  }
  process.exitCode = 1;
}
