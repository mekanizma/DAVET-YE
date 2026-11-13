import type { Locale } from "./locale";
import { lp } from "./locale";

export function marketing(locale: Locale) {
  const en = locale === "en";
  const p = (path: string) => lp(locale, path);
  return {
    locale,
    tagline: en
      ? "A digital invitation, RSVP tracking, and a Memory Wall on one link."
      : "Dijital davetiye, katılım takibi ve Anı Duvarı tek bağlantıda.",
    nav: [
      { href: p("/temalar"), label: en ? "Invitations" : "Davetiyeler" },
      { href: p("/gazeteler"), label: en ? "Newspapers" : "Gazeteler" },
      { href: p("/tasarim-studyosu"), label: en ? "Design it yourself" : "KendinTasarla" },
      { href: p("/ne-sunuyoruz"), label: en ? "What we offer" : "Ne Sunuyoruz" },
      { href: p("/fiyatlar"), label: en ? "Pricing" : "Fiyatlar" },
      { href: p("/nasil-calisir"), label: en ? "How it works" : "Nasıl Çalışır" },
    ],
    footer: [
      {
        title: en ? "Product" : "Ürün",
        links: [
          { href: p("/temalar"), label: en ? "Invitations" : "Davetiyeler" },
          { href: p("/gazeteler"), label: en ? "Newspapers" : "Gazeteler" },
          { href: p("/tasarim-studyosu"), label: en ? "Design it yourself" : "KendinTasarla" },
          { href: p("/fiyatlar"), label: en ? "Pricing" : "Fiyatlar" },
          { href: p("/ne-sunuyoruz"), label: en ? "What we offer" : "Ne Sunuyoruz" },
          { href: p("/davetiye-olustur"), label: en ? "Create an invitation" : "Davetiye Oluştur" },
        ],
      },
      {
        title: en ? "Help" : "Yardım",
        links: [
          { href: p("/rehber"), label: en ? "Guide" : "Rehber" },
          { href: p("/hakkimizda"), label: en ? "About" : "Hakkımızda" },
          { href: p("/nasil-calisir"), label: en ? "How it works" : "Nasıl Çalışır" },
          { href: p("/sss"), label: en ? "FAQ" : "Sık Sorulanlar" },
          { href: p("/iletisim"), label: en ? "Contact" : "İletişim" },
        ],
      },
      {
        title: en ? "Legal" : "Yasal",
        links: [
          { href: p("/kosullar"), label: en ? "Terms of use" : "Kullanım Koşulları" },
          { href: p("/gizlilik"), label: en ? "Privacy policy" : "Gizlilik Politikası" },
          { href: p("/kvkk"), label: en ? "Data protection notice" : "KVKK Aydınlatma Metni" },
          { href: p("/cerez"), label: en ? "Cookie policy" : "Çerez Politikası" },
        ],
      },
    ],
    typesTitle: en ? "Invitation types" : "Davetiye türleri",
    types: [
      { href: p("/dugun-davetiyesi"), label: en ? "Wedding invitation" : "Düğün Davetiyesi" },
      { href: p("/kina-davetiyesi"), label: en ? "Henna-night invitation" : "Kına Davetiyesi" },
      { href: p("/kina-ve-dugun-davetiyesi"), label: en ? "Henna and wedding invitation" : "Kına ve Düğün Davetiyesi" },
    ],
    cookiePrefs: en ? "Cookie preferences" : "Çerez tercihleri",
    heroWords: en ? (["invitation", "memory", "story"] as const) : (["davetiyeyi", "anıyı", "hikâyeyi"] as const),
    heroTrust: en
      ? ["Ready in minutes", "Fully mobile-friendly", "Easy to share"]
      : ["Dakikalar içinde hazır", "%100 mobil uyumlu", "Kolay paylaşım"],
    categories: [
      {
        href: p("/dugun-davetiyesi"),
        label: en ? "Engagement & wedding" : "Nişan & Düğün",
        text: en ? "Elegant, animated invitations for an engagement or a wedding." : "Nişan ve düğün için zarif, animasyonlu davetiyeler.",
        slug: "barok-kapi",
        icon: "ring" as const,
      },
      {
        href: p("/kina-ve-dugun-davetiyesi"),
        label: en ? "Multiple events" : "Çoklu Etkinlik",
        text: en ? "Bring the henna night, the nikah, and the wedding together on one link." : "Kına, nikâh ve düğünü tek bağlantıda birleştirin.",
        slug: "guz-masali",
        icon: "sparkle" as const,
      },
      {
        href: p("/kina-davetiyesi"),
        label: en ? "Henna night" : "Kına",
        text: en ? "Designs with traditional motifs, made for a henna night." : "Kına gecesine özel, geleneksel motifli tasarımlar.",
        slug: "tavuslu-cini",
        icon: "candle" as const,
      },
      {
        href: p("/gazeteler"),
        label: en ? "Newspapers" : "Gazeteler",
        text: en ? "Page-turning newspapers that put your story on the front page." : "Hikâyenizi manşete taşıyan sayfa çevirmeli gazeteler.",
        slug: "",
        icon: "doc" as const,
      },
    ],
    howHome: en
      ? [
          { title: "Choose an invitation that fits the event", text: "Invitations filter to your event, and the one you pick comes alive in the preview." },
          { title: "Fill in the details and watch them live", text: "Names, date, venue, and sections — the preview updates with every keystroke." },
          { title: "Share your link", text: "WhatsApp, Instagram, or SMS. One link works everywhere." },
        ]
      : [
          { title: "Etkinliğe uygun davetiyeyi seçin", text: "Etkinliğinize uygun davetiyeler süzülür; seçtiğiniz anda önizlemede canlanır." },
          { title: "Bilgileri doldurun, canlı izleyin", text: "İsim, tarih, mekân ve bölümler — her tuşta önizleme güncellenir." },
          { title: "Bağlantınızı paylaşın", text: "WhatsApp, Instagram ya da SMS; tek bağlantı her yerde çalışır." },
        ],
    howInvitation: en
      ? [
          { title: "Choose the type of event", text: "A wedding, an engagement, a multi-day celebration, a henna night. Pick the event and the matching invitations are listed." },
          { title: "Choose an invitation that fits the event", text: "Invitations filter to your event, and the one you pick comes alive in the preview." },
          { title: "Fill in the details and watch them live", text: "Names, date, venue, and sections — the preview updates with every keystroke." },
          { title: "Complete checkout", text: "A one-time payment, with no subscription. The price is itemised in front of you." },
          { title: "Share your link", text: "WhatsApp, Instagram, or SMS. One link works everywhere." },
          { title: "Track RSVPs", text: "Replies collect in your account. Search them, filter them, and download the list as CSV." },
        ]
      : [
          { title: "Etkinlik tipini belirleyin", text: "Düğün, nişan, çok günlü kutlamalar ve kına gecesi… Etkinliğinizi seçin; size uygun davetiyeler listelensin." },
          { title: "Etkinliğe uygun davetiyeyi seçin", text: "Etkinliğinize uygun davetiyeler süzülür; seçtiğiniz anda önizlemede canlanır." },
          { title: "Bilgileri doldurun, canlı izleyin", text: "İsim, tarih, mekân ve bölümler — her tuşta önizleme güncellenir." },
          { title: "Satın alma adımını tamamlayın", text: "Tek seferlik ödeme; abonelik yok. Fiyat özeti satır satır önünüzde." },
          { title: "Bağlantınızı paylaşın", text: "WhatsApp, Instagram ya da SMS; tek bağlantı her yerde çalışır." },
          { title: "Katılımı takip edin", text: "Yanıtlar panelinizde birikir; arayabilir, filtreleyebilir ve listeyi CSV olarak indirebilirsiniz." },
        ],
    howNewspaper: en
      ? [
          { title: "Choose a newspaper template", text: "Pick the one that fits, from Love Bulletin, They Are Finally Getting Married, and the other templates." },
          { title: "Write your headline", text: "Enter the title, date, venue, and your story. They appear live on the cover." },
          { title: "Place your photographs", text: "Add your favourite frames for the cover and the inside pages." },
          { title: "Complete checkout", text: "A one-time payment, with no subscription." },
          { title: "Share your link", text: "The page-turning digital newspaper opens on any device from a single link." },
          { title: "Order an A3 or A2 print", text: "Send the print-ready file to a printer, or print it at home." },
        ]
      : [
          { title: "Gazete şablonunu seçin", text: "Aşk Bülteni, Sonunda Evleniyorlar ve diğer şablonlardan size uygun olanı seçin." },
          { title: "Manşetinizi yazın", text: "Başlık, tarih, mekân ve hikâyenizi girin; kapakta canlı görün." },
          { title: "Fotoğraflarınızı yerleştirin", text: "Kapak ve iç sayfalar için en güzel karelerinizi ekleyin." },
          { title: "Satın alma adımını tamamlayın", text: "Tek seferlik ödeme; abonelik yok." },
          { title: "Bağlantınızı paylaşın", text: "Sayfa çevirmeli dijital gazete tek bağlantıyla her cihazda açılır." },
          { title: "A3 / A2 baskı alın", text: "Baskıya hazır dosyayı matbaaya gönderin ya da evinizde yazdırın." },
        ],
    offerHome: en
      ? [
          { title: "Location & map", text: "Venue details and directions on a map", icon: "pin" as const },
          { title: "Atmosphere music", text: "Add background music to your invitation", icon: "music" as const },
          { title: "Countdown", text: "Show the time left until the event", icon: "clock" as const },
          { title: "Memory Wall", text: "Collect photographs from your guests", icon: "image" as const, addon: true },
          { title: "RSVP form", text: "Collect replies with the invitation’s own questions", icon: "check" as const },
          { title: "Share with one link", text: "One link opens on every device, with no app", icon: "share" as const },
          { title: "Guest language", text: "Guests abroad can read it in their own language", icon: "globe" as const, addon: true },
        ]
      : [
          { title: "Konum & Harita", text: "Mekân bilgisi ve harita yönlendirmesi", icon: "pin" as const },
          { title: "Atmosfer Müziği", text: "Davetiyenize fon müziği ekleyin", icon: "music" as const },
          { title: "Geri Sayım", text: "Etkinliğe kalan süreyi gösterin", icon: "clock" as const },
          { title: "Anı Duvarı", text: "Misafirlerinizden fotoğraf toplayın", icon: "image" as const, addon: true },
          { title: "Katılım Formu", text: "Davetiyenin sorularıyla katılım yanıtlarını toplayın", icon: "check" as const },
          { title: "Tek Bağlantıyla Paylaşım", text: "Tek bağlantı her cihazda, uygulama gerekmeden açılır", icon: "share" as const },
          { title: "Misafir Dili", text: "Yurt dışındaki misafirleriniz kendi dillerinde okusun", icon: "globe" as const, addon: true },
        ],
    why: en
      ? [
          { title: "Kinder to the planet", text: "A choice that respects nature, with no wasted paper.", icon: "leaf" as const },
          { title: "Better value", text: "A one-time payment, with no print or postage cost.", icon: "wallet" as const },
          { title: "Fast and practical", text: "Edit the details whenever you like and publish again in one tap. The link stays the same.", icon: "bolt" as const },
          { title: "Share without a limit", text: "Reach as many people as you wish with a single link.", icon: "share" as const },
          { title: "Modern and refined", text: "Contemporary designs that look striking on every device.", icon: "sparkle" as const },
        ]
      : [
          { title: "Çevre dostu", text: "Kâğıt israfı olmadan, doğaya saygılı bir seçim.", icon: "leaf" as const },
          { title: "Ekonomik", text: "Baskı ve kargo maliyeti olmadan tek seferlik ödeme.", icon: "wallet" as const },
          { title: "Hızlı ve pratik", text: "Bilgileri istediğiniz an düzenleyin, tek tıkla yeniden yayınlayın; bağlantınız değişmez.", icon: "bolt" as const },
          { title: "Sınırsız paylaşım", text: "Dilediğiniz kadar kişiye tek bağlantıyla ulaşın.", icon: "share" as const },
          { title: "Modern ve şık", text: "Her cihazda etkileyici görünen çağdaş tasarımlar.", icon: "sparkle" as const },
        ],
    newspaperFeatures: en
      ? [
          { title: "Page-turning reading", text: "The digital newspaper is read by turning pages, like a real paper." },
          { title: "A large headline", text: "Your story leads the cover in a large headline." },
          { title: "A timeline", text: "The important moments, from the day you met until today, on the inside pages." },
          { title: "Photo pages", text: "Your favourite frames, arranged as a collage." },
          { title: "Ready for A3 / A2 print", text: "A high-resolution file you can send to a printer." },
          { title: "Share with one link", text: "It opens on any phone, with no app." },
          { title: "A thank-you page", text: "A thank-you written for your guests." },
        ]
      : [
          { title: "Sayfa çevirmeli okuma", text: "Dijital gazete, gerçek bir gazete gibi sayfa çevrilerek okunur." },
          { title: "Büyük manşet", text: "Hikâyeniz kapakta büyük başlıkla yer alır." },
          { title: "Zaman çizelgesi", text: "Tanışmanızdan bugüne önemli anlar iç sayfalarda." },
          { title: "Fotoğraf sayfaları", text: "En güzel kareleriniz kolaj düzeninde." },
          { title: "A3 / A2 baskıya hazır", text: "Matbaaya gönderilebilen yüksek çözünürlüklü dosya." },
          { title: "Tek bağlantıyla paylaşım", text: "Uygulama gerekmeden her telefonda açılır." },
          { title: "Teşekkür sayfası", text: "Misafirlerinize özel bir teşekkür mesajı." },
        ],
    events: {
      "nisan-dugun": en ? "Engagement & wedding" : "Nişan & Düğün",
      coklu: en ? "Multiple events" : "Çoklu Etkinlik",
      kina: en ? "Henna night" : "Kına",
    } as const,
    eventDescriptions: {
      "nisan-dugun": en ? "An engagement or wedding invitation" : "Nişan veya düğün davetiyesi",
      coklu: en ? "Bring a henna night, a nikah, a wedding, and more into one invitation" : "Kına, nikâh, düğün… birden fazla töreni tek davetiyede birleştirin",
      kina: en ? "A henna-night invitation" : "Kına gecesi davetiyesi",
    } as const,
    openings: {
      envelope: en ? "Envelope opening" : "Zarf açılışı",
      door: en ? "Door opening" : "Kapı açılışı",
      seal: en ? "Seal opening" : "Mühür açılışı",
      curtain: en ? "Curtain opening" : "Perde açılışı",
    } as const,
    addonTag: en ? "ADD-ON" : "EKLENTİ",
    free: en ? "Free" : "Ücretsiz",
    perLanguage: en ? "per language" : "dil başına",
    faq: en
      ? [
          { q: "How do I share the invitation link?", a: "When your invitation is published you receive a single link. Send it by WhatsApp, Instagram, SMS, or email. It works on every device." },
          { q: "Does my guest have to download an app?", a: "No. The invitation opens directly in the phone or computer browser. There is nothing to install and no account to create." },
          { q: "Where do I see the RSVPs?", a: "Replies guests send through the RSVP form collect in your account. You can search them, filter them, and download the list as CSV." },
          { q: "Can I edit the invitation later?", a: "Yes. Edit the details whenever you like and publish again in one tap. The link does not change, so guests always see the current version." },
          { q: "Is there a monthly fee?", a: "No. The payment is one-time and there is no subscription. The invitation price covers every section. You buy add-ons such as the Memory Wall only if you want them." },
          { q: "How long does my invitation stay online?", a: "It stays online for at least six months after the event date. For a longer run, choose the 90-day Extra Time add-on." },
          { q: "Can I get a refund?", a: "You can preview the invitation full screen before you buy. Refund terms are on the Terms of use page. Write to us if you have a question." },
          { q: "Can my invitation be in more than one language?", a: "Yes. Turkish is included. With the Extra Language add-on (149 TL per language) you can also publish in other languages and let guests choose." },
        ]
      : [
          { q: "Davetiye bağlantısını nasıl paylaşırım?", a: "Davetiyeniz yayınlandığında size tek bir bağlantı verilir. Bu bağlantıyı WhatsApp, Instagram, SMS ya da e-posta ile dilediğiniz kişiye gönderebilirsiniz; bağlantı her cihazda çalışır." },
          { q: "Misafirim uygulama indirmek zorunda mı?", a: "Hayır. Davetiye telefonun ya da bilgisayarın tarayıcısında doğrudan açılır; uygulama indirmek ya da üye olmak gerekmez." },
          { q: "Katılım yanıtlarını nereden görürüm?", a: "Misafirlerin Katılım Formu üzerinden verdiği yanıtlar panelinizde birikir. Yanıtları arayabilir, filtreleyebilir ve listeyi CSV olarak indirebilirsiniz." },
          { q: "Davetiyeyi sonradan düzenleyebilir miyim?", a: "Evet. Bilgileri istediğiniz an düzenleyip tek tıkla yeniden yayınlayabilirsiniz; bağlantınız değişmez, misafirleriniz her zaman güncel sürümü görür." },
          { q: "Aylık bir ücret var mı?", a: "Hayır. Ödeme tek seferliktir ve abonelik yoktur. Davetiyenin fiyatı bütün bölümleri kapsar; Anı Duvarı gibi eklentileri yalnızca isterseniz alırsınız." },
          { q: "Davetiyem ne kadar süre yayında kalır?", a: "Davetiyeniz etkinlik tarihinden sonra en az 6 ay yayında kalır. Daha uzun yayın için 90 günlük Ek Süre eklentisini seçebilirsiniz." },
          { q: "İade alabilir miyim?", a: "Satın almadan önce davetiyeyi tam ekran önizleyebilirsiniz. İade koşulları Kullanım Koşulları sayfasında yer alır; sorularınız için bize yazabilirsiniz." },
          { q: "Davetiyem birden fazla dilde olabilir mi?", a: "Evet. Türkçe dahildir; Ek Dil eklentisiyle (dil başına 149 TL) davetiyenizi başka dillerde de yayınlayabilir, misafirlerinizin dil seçmesini sağlayabilirsiniz." },
        ],
  };
}

export const HOME_TITLE_EN = "Davetanisi — Digital invitations and wedding newspapers";
export const HOME_DESCRIPTION_EN =
  "A digital invitation for a wedding, an engagement, or a henna night, opened on a phone. Share one link, follow RSVPs, and put your story on a newspaper.";
