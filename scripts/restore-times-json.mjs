import fs from "node:fs";
import path from "node:path";

const ORIGIN = "https://davetiyemgo.com";
const BRAND = "Davetanisi";
const dir = path.join(process.cwd(), "src/data/times");
const slugs = fs
  .readdirSync(dir)
  .filter((f) => f.endsWith(".json") && !f.startsWith("_"))
  .map((f) => f.replace(/\.json$/, ""));

let ok = 0;
for (const slug of slugs) {
  const html = await (await fetch(`${ORIGIN}/times/sablon/${slug}`)).text();
  const marker = 'id="times-reader-data"';
  const i = html.indexOf(marker);
  if (i < 0) throw new Error(`no data for ${slug}`);
  const gt = html.indexOf(">", i);
  const end = html.indexOf("</script>", gt);
  const data = JSON.parse(html.slice(gt + 1, end));
  if (data.settings) data.settings.brand = BRAND;
  fs.writeFileSync(path.join(dir, `${slug}.json`), JSON.stringify(data, null, 2));
  ok += 1;
  process.stdout.write(`${slug} `);
}
console.log(`\nrestored ${ok}`);
