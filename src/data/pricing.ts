export interface Addon {
  id: string;
  title: string;
  /** Short caption e.g. "5 GB" */
  note?: string;
  text: string;
  /** TL price; 0 => Ücretsiz */
  price: number;
  /** Price crossed out when free (reference: Lens 199 TL → Ücretsiz) */
  was?: number;
  unit?: string;
}

export const ADDONS: Addon[] = [
  {
    id: "ani-duvari",
    title: "Anı Duvarı",
    note: "5 GB",
    text: "Misafirleriniz etkinlik günü fotoğraflarını yükler, tüm anılar tek duvarda toplanır.",
    price: 159,
  },
  {
    id: "ani-cekimi",
    title: "Anı Çekimi (Lens)",
    note: "2 GB",
    text: "Misafirler kameralı eğlenceli çerçevelerle anı yakalar.",
    price: 0,
    was: 199,
  },
  {
    id: "masa-qr",
    title: "Masa QR Kartı",
    note: "5 GB",
    text: "Masalara koyacağınız QR'lı kart: misafirleriniz okutup çektikleri fotoğrafları doğrudan size yükler.",
    price: 49,
    was: 99,
  },
  {
    id: "ek-dil",
    title: "Ek Dil",
    note: "dil başına",
    text: "Davetiyenizi başka dillerde de yayınlayın; misafirleriniz dil seçebilsin.",
    price: 149,
    unit: "dil",
  },
  {
    id: "markasiz",
    title: "Markasız Yayın",
    text: "Davetiyenin altındaki platform imzası kaldırılır.",
    price: 69,
  },
  {
    id: "ek-depolama",
    title: "Ek Depolama",
    note: "10 GB",
    text: "Yüklenen fotoğraf ve videolar için 10 GB ek alan.",
    price: 169,
  },
  {
    id: "ek-sure",
    title: "Ek Süre",
    note: "90 gün",
    text: "Davetiyenizin yayın süresini 90 gün uzatın.",
    price: 99,
  },
];

export const ADDONS_HOME = ADDONS.filter((a) => a.id !== "ek-sure");

export const FREE_SECTIONS = [
  "Açılış Videosu",
  "Aile Bilgileri",
  "Etkinlikler",
  "Geri Sayım",
  "Konum",
  "Program",
  "Yemek Menüsü",
  "Galeri",
  "Katılım Formu",
  "Hediye Hesabı (IBAN)",
];

export const PRICE_FEATURES = [
  "Tek seferlik ödeme",
  "Etkinlik tarihinden sonra en az 6 ay yayında",
  "Sınırsız katılım yanıtı",
  "Sınırsız misafir görüntüleme",
];

export const DESIGN_PRICING = {
  free: {
    title: "Filigranlı indirme",
    price: "Ücretsiz",
    caption: "Her kart için, sınırsız",
    items: [
      "Bütün hazır tasarımlar ve araçlar",
      "Sınırsız tasarım ve kayıt",
      "Telefonda paylaşmaya uygun PNG ve JPG",
    ],
  },
  paid: {
    title: "Filigransız indirme",
    price: "99 TL",
    caption: "Kart başına, tek seferlik",
    items: [
      "Filigransız, yüksek çözünürlüklü PNG ve JPG",
      "Matbaaya gönderilebilen, baskıya hazır PDF",
      "Kartınızı güncelleyip dilediğiniz kadar yeniden indirme",
    ],
  },
};

export const NEWSPAPER_PRICE = { price: 990, compareAt: 1290 };

/** Fiyat bandı örnekleri (reference /tr/fiyatlar tablosundan). */
export const PRICE_BAND_SAMPLES: Record<number, string> = {
  690: "Akdeniz Masalı — Zarif Tül Perde Açılışı ve Akdeniz Manzarası Eşliğinde Dijital Davetiye",
  990: "Zümrüt Yeşili Çocukluk Aşkı — Kabartmalı Zümrüt Kapak Açılışı ve Çocukluk Aşkı Rölyefleri Eşliğinde Dijital Davetiye",
  1090: "Siyah İnci — Mühürlü Antrasit Zarf Açılışı ve Siyah Kabartma Sayfalar Eşliğinde Dijital Davetiye",
  1290: "Bahar Yolu — Doğanın Uyanışı ve Çiçek Açan Yeni Bir Başlangıç Eşliğinde Dijital Davetiye",
};
export const PRICE_BAND_SLUGS: Record<number, string> = {
  690: "akdeniz-masali",
  990: "zumrut-yesili-cocukluk-aski",
  1090: "siyah-inci",
  1290: "bahar-yolu",
};

/** Davetiye detay sayfasında "bu davetiyeye dahil" ek ürünler. */
export const THEME_INCLUDED_ADDONS = ["ani-duvari"];

export const LANGUAGES = [
  { code: "tr", label: "Türkçe", native: "Türkçe", flag: "🇹🇷", included: true },
  { code: "en", label: "İngilizce", native: "English", flag: "🇬🇧", included: false },
  { code: "de", label: "Almanca", native: "Deutsch", flag: "🇩🇪", included: false },
  { code: "fr", label: "Fransızca", native: "Français", flag: "🇫🇷", included: false },
  { code: "es", label: "İspanyolca", native: "Español", flag: "🇪🇸", included: false },
  { code: "it", label: "İtalyanca", native: "Italiano", flag: "🇮🇹", included: false },
  { code: "ru", label: "Rusça", native: "Русский", flag: "🇷🇺", included: false },
  { code: "el", label: "Yunanca", native: "Ελληνικά", flag: "🇬🇷", included: false },
  { code: "ar", label: "Arapça", native: "العربية", flag: "🇸🇦", included: false },
  { code: "pt", label: "Portekizce", native: "Português", flag: "🇵🇹", included: false },
];
