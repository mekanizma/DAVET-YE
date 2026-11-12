# Assets Manifest

Tüm varlıklar yerel `public/` altında; runtime’da harici CDN hotlink yok.

| Yerel dosya | Kaynak | Kullanım | Durum |
|-------------|--------|----------|-------|
| `public/img/logo.webp` | Davetanisi wordmark (özel tasarım) | Nav / footer logo | Davetanisi |
| `public/img/decor/marble-ivory.webp` | /img/decor/marble-ivory.webp | Sayfa arka planı | Orijinal |
| `public/img/decor/marble-emerald.webp` | /img/decor/marble-emerald.webp | Koyu bölüm arka planı | Orijinal |
| `public/img/decor/floral-tl.webp` | /img/decor/floral-tl.webp | Hero sol üst dekor | Orijinal |
| `public/img/decor/bouquet-tr.webp` | /img/decor/bouquet-tr.webp | Hero sağ alt dekor | Orijinal |
| `public/fonts/fraunces.shv99f85vx.woff2` | /fonts/site/… | Display fallback | Orijinal |
| `public/fonts/inter.y14tq1jyk3.woff2` | /fonts/site/… | Body | Orijinal |
| `public/fonts/allura.woff2` | /fonts/site/allura.woff2 | Logo script | Orijinal |
| `public/img/davetiye/*-kapak.webp` | /gorsel/640/… | Öne çıkan kapaklar | Orijinal (akdeniz JPG fallback) |
| `public/img/davetiye/covers/{slug}.webp\|jpg` | /gorsel/480/… veya OG cards | Katalog (56) | Orijinal; 6 tema JPG-only |
| `public/img/davetiye/{slug}/acilis.mp4` | /img/davetiye/{slug}/acilis.mp4 | Davetiye açılış videosu (47 tema) | Orijinal; 9 temada yok (CSS fallback) |
| `public/img/times/*-kapak.jpg` | /gorsel/640/img/times/… | Gazete kartları | Orijinal |
| Playfair Display | `next/font/google` | Display serif (referans CSS birincil) | Alternatif dağıtım (Google Fonts) |
| Inter (variable) | `next/font/google` | Body tamamlayıcı | Alternatif dağıtım |
| Önizleme müzik | Yerel sessiz/placeholder veya üretilmiş kısa loop | Müzik kontrolü | Alternatif (lisanslı kaynak yok) |
| Akdeniz Masalı kapak | `/uploads/cards/` JPG | kapak.webp 404 | Orijinal JPG |

## Notlar

- Akdeniz Masalı ve 5 diğer tema için `kapak.webp` CDN’de yok; OG card JPG kullanıldı.
- Dekoratif SVG çerçeveler (telefon bezel, nokta nav) CSS/SVG ile üretildi.
- Davetiye iç sayfa illüstrasyonları (aile çizimi vb.) önizlemede CSS/SVG alternatif veya kapak kırpımı; her iç asset tek tek indirilmedi.
