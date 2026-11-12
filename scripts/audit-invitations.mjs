/**
 * Browser-audit every invitation theme for fonts, assets, console errors, stage mount.
 */
import fs from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer-core";

const ROOT = process.cwd();
const BASE = process.env.CHECK_BASE || "http://127.0.0.1:3001";
const CHROME = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const OUT = path.join(ROOT, "tmp", "invite-audit");
fs.mkdirSync(OUT, { recursive: true });

const themes = JSON.parse(fs.readFileSync(path.join(ROOT, "src/data/themes.json"), "utf8"));
const slugs = themes.map((t) => t.slug);

function isNoiseError(msg) {
  return /webpack-hmr|_next\/webpack|favicon\.ico|\/icon\.png|HotModuleReplacement|status of 500 \(Internal Server Error\)/i.test(
    msg,
  );
}

async function auditPage() {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const candidates = [...document.querySelectorAll("button")].filter(
    (b) => /davetiyeyi aç/i.test(b.textContent || "") || b.getAttribute("aria-label") === "Davetiyeyi aç",
  );
  const btn = candidates[0];
  if (btn) {
    btn.click();
    await sleep(900);
    const skip = [...document.querySelectorAll("button")].find((b) => /^geç$/i.test((b.textContent || "").trim()));
    if (skip) {
      skip.click();
      await sleep(1000);
    } else {
      await sleep(2200);
    }
  } else {
    await sleep(800);
  }

  try {
    await document.fonts.ready;
  } catch {}

  const textEls = [...document.querySelectorAll(".stg-text__c")].filter((el) => (el.innerText || "").trim());
  const fontIssues = [];
  const fontSample = [];
  for (const el of textEls.slice(0, 40)) {
    const cs = getComputedStyle(el);
    const fam = cs.fontFamily;
    const first = fam.split(",")[0].replace(/["']/g, "").trim();
    const text = (el.innerText || "").replace(/\s+/g, " ").trim().slice(0, 40);
    fontSample.push({ text, first });
    if (/^Dv (Sans|Script|Display) Greek$/i.test(first)) {
      fontIssues.push({ text, first, fam: fam.slice(0, 80) });
    }
  }

  const imgs = [...document.images]
    .map((i) => ({ src: (i.currentSrc || i.src || "").split("?")[0], ok: i.complete && i.naturalWidth > 0 }))
    .filter((i) => !i.ok && i.src && !i.src.startsWith("data:"));

  const hasStage = Boolean(document.querySelector(".stg-page, .stg, .stg-shell"));
  const anims = [...document.querySelectorAll("[data-anim]")].map((e) => e.getAttribute("data-anim"));
  const bodyText = (document.body.innerText || "").replace(/\s+/g, " ").trim().slice(0, 180);

  return {
    title: document.title,
    hasStage,
    animKinds: [...new Set(anims)].slice(0, 20),
    animCount: anims.length,
    fontIssues: fontIssues.slice(0, 10),
    fontIssueN: fontIssues.length,
    fontSample: fontSample.slice(0, 6),
    badImgs: imgs.slice(0, 10),
    bodyText,
  };
}

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--window-size=430,900"],
  defaultViewport: { width: 430, height: 900, deviceScaleFactor: 2 },
});

const page = await browser.newPage();
page.setDefaultTimeout(60000);

const rows = [];
for (const slug of slugs) {
  const url = `${BASE}/onizleme/tema/${encodeURIComponent(slug)}`;
  const consoleErrors = [];
  const onConsole = (msg) => {
    if (msg.type() === "error") {
      const t = msg.text();
      if (!isNoiseError(t)) consoleErrors.push(t.slice(0, 200));
    }
  };
  const onPageError = (err) => {
    const t = String(err?.message || err);
    if (!isNoiseError(t)) consoleErrors.push(t.slice(0, 200));
  };
  page.on("console", onConsole);
  page.on("pageerror", onPageError);

  const row = { slug, ok: false };
  try {
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
    await page.waitForSelector("body", { timeout: 15000 });
    const a = await page.evaluate(auditPage);
    row.audit = a;
    row.consoleErrors = [...new Set(consoleErrors)].slice(0, 8);
    row.ok = a.hasStage && a.fontIssueN === 0 && a.badImgs.length === 0 && row.consoleErrors.length === 0 && a.animCount > 0;
    await page.screenshot({ path: path.join(OUT, `${slug}.png`), fullPage: false });
    console.log(
      `${row.ok ? "OK" : "WARN"} ${slug} stage=${a.hasStage} fontsBad=${a.fontIssueN} imgs=${a.badImgs.length} anims=${a.animCount} err=${row.consoleErrors.length}`,
    );
    if (!row.ok && a.fontIssueN) console.log("  font", JSON.stringify(a.fontIssues[0]));
    if (!row.ok && row.consoleErrors.length) console.log("  err", row.consoleErrors[0]);
  } catch (err) {
    row.error = String(err?.message || err);
    console.log(`FAIL ${slug} ${row.error}`);
  } finally {
    page.off("console", onConsole);
    page.off("pageerror", onPageError);
  }
  rows.push(row);
}

await browser.close();
const report = {
  at: new Date().toISOString(),
  total: rows.length,
  ok: rows.filter((r) => r.ok).length,
  warn: rows.filter((r) => !r.ok && !r.error).length,
  fail: rows.filter((r) => r.error).length,
  rows,
};
fs.writeFileSync(path.join(OUT, "report.json"), JSON.stringify(report, null, 2));
console.log("\n=== SUMMARY ===");
console.log(`total=${report.total} ok=${report.ok} warn=${report.warn} fail=${report.fail}`);
if (report.warn + report.fail) {
  for (const r of rows.filter((x) => !x.ok)) {
    console.log("-", r.slug, r.error || `fonts=${r.audit?.fontIssueN} imgs=${r.audit?.badImgs?.length} anims=${r.audit?.animCount} err=${r.consoleErrors?.length}`);
  }
  process.exitCode = 1;
}
