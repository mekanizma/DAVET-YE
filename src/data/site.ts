import { minPrice } from "./themes";

const SITE_NAME = "Davetanisi";
const INSTAGRAM_HANDLE = SITE_NAME.toLocaleLowerCase("tr").replace(/\s+/g, "");

export const SITE = {
  name: SITE_NAME,
  tagline: "Dijital davetiye, katılım takibi ve Anı Duvarı tek bağlantıda.",
  instagramHandle: INSTAGRAM_HANDLE,
  instagram: `https://www.instagram.com/${INSTAGRAM_HANDLE}/`,
  developer: { name: "Vodisoft", url: "https://vodisoft.com" },
  year: 2026,
};

export interface NavLink {
  href: string;
  label: string;
}

export const NAV_LINKS: NavLink[] = [
  { href: "/tr/temalar", label: "Davetiyeler" },
  { href: "/tr/gazeteler", label: "Gazeteler" },
  { href: "/tr/tasarim-studyosu", label: "KendinTasarla" },
  { href: "/tr/ne-sunuyoruz", label: "Ne Sunuyoruz" },
  { href: "/tr/fiyatlar", label: "Fiyatlar" },
  { href: "/tr/nasil-calisir", label: "Nasıl Çalışır" },
];

export const FOOTER_GROUPS: { title: string; links: NavLink[] }[] = [
  {
    title: "Ürün",
    links: [
      { href: "/tr/temalar", label: "Davetiyeler" },
      { href: "/tr/gazeteler", label: "Gazeteler" },
      { href: "/tr/tasarim-studyosu", label: "KendinTasarla" },
      { href: "/tr/fiyatlar", label: "Fiyatlar" },
      { href: "/tr/ne-sunuyoruz", label: "Ne Sunuyoruz" },
      { href: "/tr/davetiye-olustur", label: "Davetiye Oluştur" },
    ],
  },
  {
    title: "Yardım",
    links: [
      { href: "/tr/rehber", label: "Rehber" },
      { href: "/tr/hakkimizda", label: "Hakkımızda" },
      { href: "/tr/nasil-calisir", label: "Nasıl Çalışır" },
      { href: "/tr/sss", label: "Sık Sorulanlar" },
      { href: "/tr/iletisim", label: "İletişim" },
    ],
  },
  {
    title: "Yasal",
    links: [
      { href: "/tr/kosullar", label: "Kullanım Koşulları" },
      { href: "/tr/gizlilik", label: "Gizlilik Politikası" },
      { href: "/tr/kvkk", label: "KVKK Aydınlatma Metni" },
      { href: "/tr/cerez", label: "Çerez Politikası" },
    ],
  },
];

export const INVITATION_TYPE_LINKS: NavLink[] = [
  { href: "/tr/dugun-davetiyesi", label: "Düğün Davetiyesi" },
  { href: "/tr/kina-davetiyesi", label: "Kına Davetiyesi" },
  { href: "/tr/kina-ve-dugun-davetiyesi", label: "Kına ve Düğün Davetiyesi" },
];

export const HERO_WORDS = ["davetiyeyi", "anıyı", "hikâyeyi"] as const;

export const HERO_TRUST = [
  "Dakikalar içinde hazır",
  "%100 mobil uyumlu",
  "Kolay paylaşım",
];

export const CATEGORIES = [
  {
    href: "/tr/dugun-davetiyesi",
    label: "Nişan & Düğün",
    text: "Nişan ve düğün için zarif, animasyonlu davetiyeler.",
    slug: "barok-kapi",
    icon: "ring",
  },
  {
    href: "/tr/kina-ve-dugun-davetiyesi",
    label: "Çoklu Etkinlik",
    text: "Kına, nikâh ve düğünü tek bağlantıda birleştirin.",
    slug: "guz-masali",
    icon: "sparkle",
  },
  {
    href: "/tr/kina-davetiyesi",
    label: "Kına",
    text: "Kına gecesine özel, geleneksel motifli tasarımlar.",
    slug: "tavuslu-cini",
    icon: "candle",
  },
  {
    href: "/tr/gazeteler",
    label: "Gazeteler",
    text: "Hikâyenizi manşete taşıyan sayfa çevirmeli gazeteler.",
    slug: "",
    icon: "doc",
  },
] as const;

export const HOW_IT_WORKS_HOME = [
  {
    title: "Etkinliğe uygun davetiyeyi seçin",
    text: "Etkinliğinize uygun davetiyeler süzülür; seçtiğiniz anda önizlemede canlanır.",
  },
  {
    title: "Bilgileri doldurun, canlı izleyin",
    text: "İsim, tarih, mekân ve bölümler — her tuşta önizleme güncellenir.",
  },
  {
    title: "Bağlantınızı paylaşın",
    text: "WhatsApp, Instagram ya da SMS; tek bağlantı her yerde çalışır.",
  },
];

export const HOW_IT_WORKS_INVITATION = [
  {
    title: "Etkinlik tipini belirleyin",
    text: "Düğün, nişan, çok günlü kutlamalar ve kına gecesi… Etkinliğinizi seçin; size uygun davetiyeler listelensin.",
  },
  ...HOW_IT_WORKS_HOME.slice(0, 2),
  {
    title: "Satın alma adımını tamamlayın",
    text: "Tek seferlik ödeme; abonelik yok. Fiyat özeti satır satır önünüzde.",
  },
  HOW_IT_WORKS_HOME[2],
  {
    title: "Katılımı takip edin",
    text: "Yanıtlar panelinizde birikir; arayabilir, filtreleyebilir ve listeyi CSV olarak indirebilirsiniz.",
  },
];

/** Gazete sekmesi: altı adım metinleri referansta açılmadı; ürün bilgisinden türetilmiştir. */
export const HOW_IT_WORKS_NEWSPAPER = [
  { title: "Gazete şablonunu seçin", text: "Aşk Bülteni, Sonunda Evleniyorlar ve diğer şablonlardan size uygun olanı seçin." },
  { title: "Manşetinizi yazın", text: "Başlık, tarih, mekân ve hikâyenizi girin; kapakta canlı görün." },
  { title: "Fotoğraflarınızı yerleştirin", text: "Kapak ve iç sayfalar için en güzel karelerinizi ekleyin." },
  { title: "Satın alma adımını tamamlayın", text: "Tek seferlik ödeme; abonelik yok." },
  { title: "Bağlantınızı paylaşın", text: "Sayfa çevirmeli dijital gazete tek bağlantıyla her cihazda açılır." },
  { title: "A3 / A2 baskı alın", text: "Baskıya hazır dosyayı matbaaya gönderin ya da evinizde yazdırın." },
];

export const OFFER_FEATURES_HOME = [
  { title: "Konum & Harita", text: "Mekân bilgisi ve harita yönlendirmesi", icon: "pin" },
  { title: "Atmosfer Müziği", text: "Davetiyenize fon müziği ekleyin", icon: "music" },
  { title: "Geri Sayım", text: "Etkinliğe kalan süreyi gösterin", icon: "clock" },
  { title: "Anı Duvarı", text: "Misafirlerinizden fotoğraf toplayın", icon: "image", addon: true },
  { title: "Katılım Formu", text: "Davetiyenin sorularıyla katılım yanıtlarını toplayın", icon: "check" },
  { title: "Tek Bağlantıyla Paylaşım", text: "Tek bağlantı her cihazda, uygulama gerekmeden açılır", icon: "share" },
  { title: "Misafir Dili", text: "Yurt dışındaki misafirleriniz kendi dillerinde okusun", icon: "globe", addon: true },
] as const;

export const WHY_DIGITAL = [
  { title: "Çevre dostu", text: "Kâğıt israfı olmadan, doğaya saygılı bir seçim.", icon: "leaf" },
  { title: "Ekonomik", text: "Baskı ve kargo maliyeti olmadan tek seferlik ödeme.", icon: "wallet" },
  { title: "Hızlı ve pratik", text: "Bilgileri istediğiniz an düzenleyin, tek tıkla yeniden yayınlayın; bağlantınız değişmez.", icon: "bolt" },
  { title: "Sınırsız paylaşım", text: "Dilediğiniz kadar kişiye tek bağlantıyla ulaşın.", icon: "share" },
  { title: "Modern ve şık", text: "Her cihazda etkileyici görünen çağdaş tasarımlar.", icon: "sparkle" },
] as const;

export const NEWSPAPER_FEATURES = [
  { title: "Sayfa çevirmeli okuma", text: "Dijital gazete, gerçek bir gazete gibi sayfa çevrilerek okunur." },
  { title: "Büyük manşet", text: "Hikâyeniz kapakta büyük başlıkla yer alır." },
  { title: "Zaman çizelgesi", text: "Tanışmanızdan bugüne önemli anlar iç sayfalarda." },
  { title: "Fotoğraf sayfaları", text: "En güzel kareleriniz kolaj düzeninde." },
  { title: "A3 / A2 baskıya hazır", text: "Matbaaya gönderilebilen yüksek çözünürlüklü dosya." },
  { title: "Tek bağlantıyla paylaşım", text: "Uygulama gerekmeden her telefonda açılır." },
  { title: "Teşekkür sayfası", text: "Misafirlerinize özel bir teşekkür mesajı." },
];

export const STARTING_PRICE = minPrice;
