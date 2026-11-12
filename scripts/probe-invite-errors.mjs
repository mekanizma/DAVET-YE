import puppeteer from "puppeteer-core";

const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  headless: true,
  args: ["--no-sandbox"],
  defaultViewport: { width: 430, height: 900 },
});
const page = await browser.newPage();

const slugs = [
  "zumrut-yesili-cocukluk-aski",
  "sakura-bahcesi",
  "bordo-muhur",
  "akdeniz-masali",
  "opera-gecesi",
  "kis-masali",
  "tavuslu-cini",
];

for (const slug of slugs) {
  const failed = [];
  const pageErrs = [];
  const onResp = (res) => {
    if (res.status() >= 400) failed.push({ status: res.status(), url: res.url() });
  };
  const onPage = (e) => pageErrs.push(e.message);
  page.on("response", onResp);
  page.on("pageerror", onPage);
  try {
    await page.goto(`http://127.0.0.1:3001/onizleme/tema/${slug}`, {
      waitUntil: "networkidle2",
      timeout: 60000,
    });
    await page.evaluate(async () => {
      const btn = [...document.querySelectorAll("button")].find((b) => /davetiyeyi aç/i.test(b.textContent || ""));
      btn?.click();
      await new Promise((r) => setTimeout(r, 700));
      const skip = [...document.querySelectorAll("button")].find((b) => /^geç$/i.test((b.textContent || "").trim()));
      skip?.click();
      await new Promise((r) => setTimeout(r, 1200));
    });
    const fonts = await page.evaluate(() =>
      [...document.querySelectorAll(".stg-text__c")]
        .slice(0, 8)
        .map((e) => ({
          t: (e.innerText || "").slice(0, 24),
          f: getComputedStyle(e).fontFamily.split(",")[0].replace(/"/g, ""),
        })),
    );
    const greekFirst = fonts.filter((f) => /Dv .*Greek/i.test(f.f)).length;
    const realFails = failed.filter((f) => !/webpack-hmr|_next\/webpack/i.test(f.url));
    console.log(
      JSON.stringify({
        slug,
        greekFirst,
        pageErr: pageErrs[0] || null,
        fails: realFails.slice(0, 5),
        fonts: fonts.slice(0, 4),
      }),
    );
  } catch (err) {
    console.log(JSON.stringify({ slug, error: String(err.message || err) }));
  } finally {
    page.off("response", onResp);
    page.off("pageerror", onPage);
  }
}

await browser.close();
