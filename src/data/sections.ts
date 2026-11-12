export interface InvitationSection {
  id: string;
  title: string;
  text: string;
  addon?: boolean;
  /** İsteğe bağlı bölüm (hepsi referansta "İsteğe bağlı") */
  optional: boolean;
}

/** Güz Masalı detay sayfasındaki "Bu davetiyede kullanabilecekleriniz" listesi (referans). */
export const INVITATION_SECTIONS: InvitationSection[] = [
  { id: "isimler", title: "İsimler", text: "Sizin ve eşinizin isimleri", optional: true },
  { id: "aileler", title: "Aileler", text: "Aile adlarını davetiyede gösterin", optional: true },
  { id: "tarih", title: "Tarih", text: "Tarih, saat ve tören bilgileri", optional: true },
  { id: "konum", title: "Konum", text: "Mekân bilgisi ve harita yönlendirmesi", optional: true },
  { id: "soz", title: "Söz Merasimi", text: "Tarih, saat ve tören bilgileri", optional: true },
  { id: "nisan", title: "Nişan Töreni", text: "Tarih, saat ve tören bilgileri", optional: true },
  { id: "kina", title: "Kına Gecesi", text: "Tarih, saat ve tören bilgileri", optional: true },
  { id: "nikah", title: "Nikâh Töreni", text: "Tarih, saat ve tören bilgileri", optional: true },
  { id: "dugun", title: "Düğün Töreni", text: "Tarih, saat ve tören bilgileri", optional: true },
  { id: "after", title: "After Parti", text: "Tarih, saat ve tören bilgileri", optional: true },
  { id: "geri-sayim", title: "Geri sayım", text: "Etkinliğe kalan süreyi gösterin", optional: true },
  { id: "hikaye", title: "Hikâyemiz", text: "Tanışma hikâyeniz", optional: true },
  { id: "program", title: "Program akışı", text: "Nikâh, yemek ve parti akışını gösterin", optional: true },
  { id: "kiyafet", title: "Kıyafet kodu", text: "Kıyafet tercihinizi belirtin", optional: true },
  { id: "album", title: "Albümümüz", text: "Kendi fotoğraflarınızı davetiyeye ekleyin", optional: true },
  { id: "menu", title: "Menü", text: "Yemek menünüzü ve servis sırasını paylaşın", optional: true },
  { id: "katilim", title: "Katılım formu", text: "Davetiyenin sorularıyla katılım yanıtlarını toplayın", optional: true },
  { id: "ani-duvari", title: "Anı duvarı", text: "Misafirlerinizden fotoğraf toplayın", optional: true, addon: true },
  { id: "ani-cekimi", title: "Anı çekimi", text: "Misafirler kameralı çerçevelerle anı yakalasın", optional: true, addon: true },
  { id: "dilekler", title: "Dilekler", text: "Misafirleriniz mesaj bıraksın", optional: true },
  { id: "iban", title: "Hediye / IBAN", text: "Hediyesini havale ile göndermek isteyenler için", optional: true },
  { id: "kapanis", title: "Kapanış", text: "Teşekkür ve kapanış mesajı", optional: true },
];

/** /tr/ne-sunuyoruz Davetiye sekmesi */
export const OFFER_INVITATION = [
  { title: "Açılış Videosu", text: "Davetiye açılmadan önce kısa bir açılış videosu" },
  { title: "Aile Bilgileri", text: "Aile adlarını davetiyede gösterin" },
  { title: "Etkinlikler", text: "Tarih, saat ve tören bilgileri" },
  { title: "Geri Sayım", text: "Etkinliğe kalan süreyi gösterin" },
  { title: "Konum", text: "Mekân bilgisi ve harita yönlendirmesi" },
  { title: "Program", text: "Nikâh, yemek ve parti akışını gösterin" },
  { title: "Yemek Menüsü", text: "Yemek menünüzü ve servis sırasını paylaşın" },
  { title: "Galeri", text: "Kendi fotoğraflarınızı davetiyeye ekleyin" },
  { title: "Katılım Formu", text: "Davetiyenin sorularıyla katılım yanıtlarını toplayın" },
  { title: "Hediye Hesabı (IBAN)", text: "Hediyesini havale ile göndermek isteyenler için" },
  { title: "Kıyafet", text: "Kıyafet tercihinizi belirtin" },
  { title: "Dilekler", text: "Misafirleriniz mesaj bıraksın" },
  { title: "Atmosfer Müziği", text: "Davetiyenize fon müziği ekleyin" },
  { title: "Anı Duvarı", text: "Misafirlerinizden fotoğraf toplayın", addon: true },
  { title: "Anı Çekimi (Lens)", text: "Misafirler kameralı çerçevelerle anı yakalasın", addon: true },
];
