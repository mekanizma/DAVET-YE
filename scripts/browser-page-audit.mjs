/**
 * Launch Chrome via playwright-less fetch of pages is not enough.
 * This script uses CDP-free HTTP + DOM markers after build.
 * For true browser checks we rely on REA / IDE browser.
 */
import fs from "fs";

const BASE = process.env.BASE || "http://127.0.0.1:3000";

const pages = [
  ["/tr", ["Özel gününüz", "Öne çıkan", "Hikâyeniz manşette", "footer", "Davetanisi"]],
  ["/tr/temalar", ["Her etkinlik", "Akdeniz Masalı", "Bordo Mühür"]],
  ["/tr/temalar/guz-masali", ["Güz Masalı", "Bu Davetiyeyle Başla", "Tam Ekran"]],
  ["/tr/temalar/akdeniz-masali", ["Akdeniz Masalı"]],
  ["/tr/temalar/barok-kapi", ["Barok Kapı"]],
  ["/tr/temalar/tavuslu-cini", ["Tavuslu Çini"]],
  ["/tr/temalar/opera-gecesi", ["Opera Gecesi"]],
  ["/tr/temalar/bordo-muhur", ["Bordo Mühür"]],
  ["/onizleme/tema/guz-masali", ["Davetiyeyi aç"]],
  ["/onizleme/tema/akdeniz-masali", ["aç"]],
  ["/tr/gazeteler", ["Aşk Bülteni", "Gazete"]],
  ["/tr/gazeteler/ask-bulteni", ["Aşk Bülteni"]],
  ["/tr/gazeteler/evleniyoruz", ["Evleniyoruz"]],
  ["/tr/gazeteler/kolaj-gazetesi", ["Kolaj"]],
  ["/times/sablon/ask-bulteni", ["Yazdır", "Aşk"]],
  ["/tr/tasarim-studyosu", ["tasarla", "Hazır"]],
  ["/tr/tasarla", ["düzenleyici", "Metin"]],
  ["/tr/davetiye-olustur/etkinlik", ["Etkinlik"]],
  ["/tr/gazete-olustur", ["Gazete", "manşet"]],
  ["/tr/fiyatlar", ["Tek seferlik", "Eklenti"]],
  ["/tr/sss", ["soru"]],
  ["/tr/nasil-calisir", ["adım"]],
  ["/tr/ne-sunuyoruz", ["Davetiye"]],
  ["/tr/iletisim", ["yazın"]],
  ["/tr/hakkimizda", ["dijitale"]],
  ["/tr/rehber", ["rehber"]],
  ["/tr/kosullar", ["koşul"]],
  ["/tr/gizlilik", ["Gizlilik"]],
  ["/tr/kvkk", ["KVKK"]],
  ["/tr/cerez", ["Çerez"]],
  ["/tr/dugun-davetiyesi", ["Düğün"]],
  ["/tr/kina-davetiyesi", ["Kına"]],
  ["/tr/kina-ve-dugun-davetiyesi", ["Kına"]],
  ["/panel/giris", ["Giriş", "Şifre"]],
  ["/panel/kayit", ["Kayıt"]],
  ["/panel/sifremi-unuttum", ["şifre"]],
  ["/panel", ["Panel"]],
];

const bad = [];
for (const [path, must] of pages) {
  const res = await fetch(BASE + path, { redirect: "follow" });
  const html = await res.text();
  const miss = must.filter((m) => !html.toLowerCase().includes(m.toLowerCase()));
  // Client-only pages may miss SSR text for wizard radios etc.
  const stuckLoading =
    html.includes("Yükleniyor") &&
    !html.includes("Etkinlik türü") &&
    !html.includes("Panele erişmek") &&
    path.startsWith("/panel") &&
    path === "/panel";
  if (!res.ok || miss.length) {
    bad.push({ path, status: res.status, miss, bytes: html.length });
  } else {
    process.stdout.write(".");
  }
}
console.log("\nok", pages.length - bad.length, "/", pages.length);
if (bad.length) {
  console.log("BAD");
  console.log(JSON.stringify(bad, null, 2));
}
fs.writeFileSync(
  "docs/reference-captures/content-audit.json",
  JSON.stringify({ total: pages.length, bad }, null, 2),
);
