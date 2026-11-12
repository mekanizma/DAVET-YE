import fs from "node:fs";
import puppeteer from "puppeteer-core";

const CHROME = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE = process.env.TIMES_CHECK_BASE || "http://127.0.0.1:3001";
const slugs = [
  ...new Set(
    [...fs.readFileSync("src/data/newspapers.ts", "utf8").matchAll(/slug:\s*"([^"]+)"/g)].map((m) => m[1]),
  ),
];

async function pageAudit() {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const root = document.querySelector(".tr,[data-times-reader]");
  if (!root) return { error: "no root" };
  try {
    await document.fonts.ready;
  } catch {}
  await sleep(700);
  const severe = [];
  const micro = [];
  const next = document.querySelector('[aria-label="Sonraki sayfa"]');
  const pages = Number((root.innerText.match(/(\d+)\s*\/\s*(\d+)/) || [])[2] || 4);
  for (let p = 0; p < Math.min(pages, 4); p++) {
    if (p > 0 && next) {
      next.click();
      await sleep(600);
    }
    for (const el of root.querySelectorAll("[data-stretch], [data-fit=shrink], .stg-text, span.stg-text__c")) {
      const st = getComputedStyle(el);
      if (st.display === "none" || st.visibility === "hidden") continue;
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2 || el.clientWidth > 900) continue;
      const dx = el.scrollWidth - el.clientWidth;
      const dy = el.scrollHeight - el.clientHeight;
      const text = (el.innerText || "").replace(/\s+/g, " ").trim();
      if (!text) continue;
      const row = {
        page: p,
        dx,
        dy,
        sample: text.slice(0, 40),
        font: st.fontFamily.split(",")[0].replace(/["']/g, ""),
      };
      if (dx > 5 || dy > 16) severe.push(row);
      else if (dx > 3 || dy > 10) micro.push(row);
    }
  }
  return { severe: severe.slice(0, 12), severeN: severe.length, microN: micro.length };
}

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--no-sandbox"],
  defaultViewport: { width: 1440, height: 900 },
});
const page = await browser.newPage();

let bad = 0;
let clean = 0;
for (const slug of slugs) {
  await page.goto(`${BASE}/times/sablon/${slug}`, { waitUntil: "networkidle2", timeout: 45000 });
  await page.waitForSelector(".tr", { timeout: 20000 });
  await new Promise((r) => setTimeout(r, 400));
  const a = await page.evaluate(pageAudit);
  const ok = !a.error && a.severeN === 0;
  if (ok) clean += 1;
  else bad += 1;
  console.log(
    `${ok ? "OK" : "WARN"} ${slug} severe=${a.severeN} micro=${a.microN}${
      a.severe?.[0] ? ` :: ${JSON.stringify(a.severe[0])}` : ""
    }`,
  );
}
console.log(`clean=${clean} warn=${bad} total=${slugs.length}`);
await browser.close();
if (bad) process.exitCode = 1;
