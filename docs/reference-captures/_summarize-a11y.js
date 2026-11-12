const fs = require("fs");
const dir = "d:/davetiye/docs/reference-captures";
const files = [
  "guz-masali-detail-a11y.txt",
  "guz-masali-onizleme-a11y.txt",
  "ask-bulteni-a11y.txt",
  "fiyatlar-a11y.txt",
  "sss-a11y.txt",
  "nasil-calisir-a11y.txt",
  "ne-sunuyoruz-a11y.txt",
  "davetiye-olustur-a11y.txt",
  "tasarim-studyosu-a11y.txt",
  "panel-giris-a11y.txt",
  "home-mobile-390-a11y.txt",
  "home-tablet-1024-a11y.txt",
];

const roleRe =
  /^\s*-\s*(heading|button|link|tab|textbox|img|region|main|navigation|banner|complementary|form|dialog|radio|checkbox|group|listitem|combobox|switch)\s+"([^"]{1,100})"/i;

for (const f of files) {
  const t = fs.readFileSync(`${dir}/${f}`, "utf8");
  console.log(`\n==== ${f} ====`);
  const out = [];
  for (const line of t.split(/\n/)) {
    const m = line.match(roleRe);
    if (m) out.push(`${m[1]}: ${m[2]}`);
  }
  console.log(out.slice(0, 40).join("\n"));
}
