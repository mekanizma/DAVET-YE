const slug = process.argv[2] || "zumrut-yesili-cocukluk-aski";
const html = await (await fetch(`https://davetiyemgo.com/onizleme/tema/${slug}`)).text();
const faces = [...html.matchAll(/@font-face\{[^}]+\}/g)].map((m) => m[0]);
console.log("font-faces", faces.length);
faces.slice(0, 6).forEach((f) => console.log(f.slice(0, 180)));
const m = html.match(/id="stage-data">([\s\S]*?)<\/script>/);
if (!m) {
  console.log("no stage-data");
  process.exit(1);
}
const data = JSON.parse(m[1]);
const local = JSON.parse(await import("node:fs").then((fs) => fs.readFileSync(`src/data/stages/${slug}.json`, "utf8")));
console.log("remote fonts", JSON.stringify(data.fonts, null, 2));
console.log("local fonts", JSON.stringify(local.fonts, null, 2));
console.log("remote pages", data.design?.pages?.length, "intro", data.design?.intro?.mode);
console.log("local pages", local.design?.pages?.length, "intro", local.design?.intro?.mode);

// Deep compare keys that matter for playback
function fingerprint(stage) {
  const fonts = (stage.fonts || []).map((f) => f.family + ":" + f.url).sort();
  const pages = (stage.design?.pages || []).map((p) => ({
    id: p.id,
    els: (p.elements || []).length,
    anims: (p.elements || []).filter((e) => e.anim?.kind).map((e) => e.anim.kind),
  }));
  return { fonts, pageCount: pages.length, pages };
}
const R = fingerprint(data);
const L = fingerprint(local);
console.log("pageCount remote/local", R.pageCount, L.pageCount);
const animDiff = [];
for (let i = 0; i < Math.max(R.pages.length, L.pages.length); i++) {
  const rp = R.pages[i];
  const lp = L.pages[i];
  if (!rp || !lp || rp.els !== lp.els || JSON.stringify(rp.anims) !== JSON.stringify(lp.anims)) {
    animDiff.push({ i, remote: rp, local: lp });
  }
}
console.log("page diffs", animDiff.length);
animDiff.slice(0, 5).forEach((d) => console.log(JSON.stringify(d)));
