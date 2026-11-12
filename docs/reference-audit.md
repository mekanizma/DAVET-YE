# Davetanisi Referans Denetimi

Kaynak: önceki referans site (yönlendirme: `/tr`); marka adı Davetanisi olarak güncellendi.  
Araç: REA `capture_browser_scenario` + CSS/asset indirme  
Tarih: 2026-11-10  
Viewport’lar: 1440×900, 1024×768, 390×844

## Özet

Referans, krem/fildişi mermer dokulu pazarlama sitesi + dijital davetiye/gazete ürün kataloğu. Tipografi: Playfair Display / Fraunces (serif başlık), Inter (gövde), Allura (logo script). Ana renkler CSS değişkenlerinden doğrulandı.

## Tasarım tokenları (CSS `:root`)

| Token | Değer |
|-------|--------|
| `--paper` | `#f8f4ec` |
| `--paper-2` | `#f3ede2` |
| `--surface` | `#fffcf7` |
| `--home-cream` | `#fbf6ec` |
| `--ink` | `#13201c` |
| `--ink-soft` | `#4b5551` |
| `--emerald` / `--home-dark` | `#0d3229` / `#0b2b24` |
| `--gold` / `--gold-text` | `#b8894e` / `#83592b` |
| `--line` | `#e6d9c3` |
| `--wrap` / `--nav-h` | `1200px` / `72px` (küçük ekranda 64px) |
| `--radius` / `--radius-lg` / `--radius-pill` | `16px` / `24px` / `999px` |
| `--ease` | `cubic-bezier(.2, .7, .3, 1)` |
| `--dur` / `--dur-slow` | `.22s` / `.42s` |

Arka plan: `marble-ivory.webp` (krem) / `marble-emerald.webp` (koyu bölümler). Dekor: `floral-tl.webp`, `bouquet-tr.webp`.

## Sayfa envanteri

| Rota | Durum | Not |
|------|-------|-----|
| `/tr` | İncelendi | Tam ana sayfa + cookie diyaloğu |
| `/tr/temalar` | İncelendi | 56 şablon, arama + etkinlik/etiket filtreleri |
| `/tr/temalar/[slug]` | İncelendi (Güz Masalı) | Tek/çoklu önizleme, fiyat, bölümler, benzerler |
| `/onizleme/tema/[slug]` | İncelendi (Güz Masalı) | Tam ekran mobil önizleme + bölümler |
| `/tr/gazeteler` | İncelendi | Katalog |
| `/tr/gazeteler/ask-bulteni` | İncelendi | Gazete detay |
| `/tr/tasarim-studyosu` | İncelendi | DIY stüdyo giriş + öne çıkan kartlar |
| `/tr/ne-sunuyoruz` | İncelendi | Özellik kataloğu, Davetiye/Gazete sekmeleri |
| `/tr/fiyatlar` | İncelendi | Tek seferlik + eklentiler |
| `/tr/nasil-calisir` | İncelendi | 6 adım, Davetiye/Gazete sekmeleri |
| `/tr/sss` | İncelendi | Akordeon; cevap metinleri kapalı gruplarda |
| `/tr/davetiye-olustur` → `/etkinlik` | İncelendi | 6 adımlı sihirbaz; adım 1’de kalındı |
| `/panel/giris` | İncelendi | Form görüldü; gönderim yapılmadı |
| Ödeme / panel içi | Erişilemedi | Giriş ve ödeme adımları denenmedi |
| Gazete sayfa çevirme / A3–A2 | Kısmen | Ürün metninde var; tam animasyon her şablonda doğrulanmadı |

## Ana sayfa bölüm sırası

1. Üst navigasyon (logo, menü, dil, Giriş, Davetiye Oluştur)
2. Hero: eyebrow, animasyonlu kelime (`davetiyeyi` / `anıyı` / `hikâyeyi`), açıklama, iki aksiyon kartı, güven rozetleri; sağda 6’lı telefon carousel + gazete mockup
3. Kategorilere göre keşfedin (4 kart)
4. Öne çıkan tasarımlar (6 davetiye kartı, telefon mockup + alt bilgi paneli)
5. Hikâyeniz manşette (gazete grid)
6. Nasıl çalışır (3 adım + link)
7. Size ne sunuyoruz (özellik listesi + örnek kompozisyon)
8. Neden dijital davetiye (5 madde)
9. Fiyat + eklentiler
10. SSS akordeon
11. Son CTA
12. Footer + çerez diyaloğu/tercihleri

## Davetiye şablonları (56)

Tam slug listesi: `docs/reference-captures/temalar-slugs.txt`  
Ana sayfa öne çıkanlar: Akdeniz Masalı, Güz Masalı, Barok Kapı, Tavuslu Çini, Opera Gecesi, Bordo Mühür.

### Güz Masalı önizlemede gözlenen bölümler

Açılış (DAVETLİSİNİZ + zarf butonu) → İsimler → Aileler → Tarih (+Takvime Ekle) → Konum (+Yol Tarifi) → Geri sayım → Program → Katılım formu → Anı duvarı → Anı çekimi → Dilekler → Hediye/IBAN → Kapanış (+Başa dön). Müzik aç/kapat. ÖNİZLEME filigranı. Sayfa geçişi butonları.

Diğer şablonların açılışları (kapı/mühür/zarf) her slug için ayrıntılı yakalanmadı; kapak görselleri yerel, etkileşim Güz Masalı üzerinden doğrulandı ve ortak bölüm motoru ile diğer temalara uyarlandı (tema-özel kapak + renk).

## Gazeteler

Örnekler: Aşk Bülteni, Doğum Günü Gecesi, Sonunda Evleniyorlar, Aşk Kazandı. Fiyat örneği: 990 TL / ~~1.290 TL~~.

## Animasyonlar (gözlenen)

| Animasyon | Tetikleyici | Not |
|-----------|-------------|-----|
| Hero kelime rotasyonu | zamanlayıcı | `davetiyeyi`/`anıyı`/`hikâyeyi` |
| Telefon carousel | otomatik + nokta butonları | 6 durum |
| Kart hover | hover | görsel hafif zoom / gölge (masaüstü) |
| Cookie panel | ilk ziyaret | alt-orta diyaloğu |
| Davetiye açılış | “Davetiyeyi aç” | zarf/açılış sekansı |
| Sayfa geçişi | buton / kaydırma | önizleme bölümleri |
| SSS | tıklama | akordeon |
| prefers-reduced-motion | OS | referansta CSS token’ları var; davranış doğrulanmalı |

## Responsive

- **1440:** tam yatay nav, hero iki kolon, 3’lü kart grid  
- **1024:** hamburger menü hâlâ görünür (nav daraltılmış)  
- **390:** dikey hero, kartlar stack, hamburger + dil

## Erişilemeyen / doğrulanmayan

- Gerçek hesap oluşturma, giriş sonrası panel, ödeme sağlayıcısı  
- Oluşturma sihirbazı adım 2–6 (etkinlik seçimi sonrası)  
- Tüm 56 şablonun benzersiz açılış animasyonları tek tek  
- Gazete flipbook her şablonda kare kare  
- SSS cevap gövdeleri (kapalı akordeon; metinler ürün mesajından türetildi ve işaretlendi)

## Yerel karşılaştırma (2026-11-10)

Viewport’lar: 1440 / 1024 / 390. Kanıt: `compare-home-*.png`, `local-home-*.png`, `spot-*-390.png`.

### Eşleşenler
- Krem mermer zemin, floral dekor, emerald/gold palet, serif+sans tipografi
- Hero iki kolon (masaüstü), aksiyon kartları, güven rozetleri, 6’lı telefon carousel + gazete
- Bölüm sırası, navigasyon etiketleri/rotalar, çerez diyaloğu
- Mobilde hamburger + dil; taşma yok (spot kontroller)

### Kalan somut farklar
- Hero carousel başlangıç slaytı (bizde Akdeniz; referans anlık Güz olabilir — rotasyonlu)
- 1024px’te Giriş/Oluştur butonları referansta daha erken gizlenebilir
- Display font: Playfair (Google); referans CDN Fraunces/Playfair karışımı
- SSS cevap metinleri kapalı akordeondan çıkarılmadı → ürün mesajından türetildi
- Panel/ödeme/sihirbaz 2–6: referanstan tam doğrulanmadı (yerel mock)
- 50 şablonun benzersiz iç açılış animasyonları kapak+opening tipiyle türetildi; 6 öne çıkan elle stillendi
- Stüdyo: erişilen kontroller yeniden üretildi; referanstaki tüm hazır tasarım sayısı (110+) yok

## Kanıt dosyaları

`docs/reference-captures/` — PNG + a11y metinleri, CSS dump, evidence bundle’lar.
