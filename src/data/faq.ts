export interface Faq {
  q: string;
  a: string;
  /**
   * Referansta bu grup kapalı yakalandığı için cevap metni yakalanmadı;
   * yanıt ürün mesajlarından türetilmiştir.
   */
  inferred: boolean;
}

export const FAQ: Faq[] = [
  {
    q: "Davetiye bağlantısını nasıl paylaşırım?",
    a: "Davetiyeniz yayınlandığında size tek bir bağlantı verilir. Bu bağlantıyı WhatsApp, Instagram, SMS ya da e-posta ile dilediğiniz kişiye gönderebilirsiniz; bağlantı her cihazda çalışır.",
    inferred: true,
  },
  {
    q: "Misafirim uygulama indirmek zorunda mı?",
    a: "Hayır. Davetiye telefonun ya da bilgisayarın tarayıcısında doğrudan açılır; uygulama indirmek ya da üye olmak gerekmez.",
    inferred: true,
  },
  {
    q: "Katılım yanıtlarını nereden görürüm?",
    a: "Misafirlerin Katılım Formu üzerinden verdiği yanıtlar panelinizde birikir. Yanıtları arayabilir, filtreleyebilir ve listeyi CSV olarak indirebilirsiniz.",
    inferred: true,
  },
  {
    q: "Davetiyeyi sonradan düzenleyebilir miyim?",
    a: "Evet. Bilgileri istediğiniz an düzenleyip tek tıkla yeniden yayınlayabilirsiniz; bağlantınız değişmez, misafirleriniz her zaman güncel sürümü görür.",
    inferred: true,
  },
  {
    q: "Aylık bir ücret var mı?",
    a: "Hayır. Ödeme tek seferliktir ve abonelik yoktur. Davetiyenin fiyatı bütün bölümleri kapsar; Anı Duvarı gibi eklentileri yalnızca isterseniz alırsınız.",
    inferred: true,
  },
  {
    q: "Davetiyem ne kadar süre yayında kalır?",
    a: "Davetiyeniz etkinlik tarihinden sonra en az 6 ay yayında kalır. Daha uzun yayın için 90 günlük Ek Süre eklentisini seçebilirsiniz.",
    inferred: true,
  },
  {
    q: "İade alabilir miyim?",
    a: "Satın almadan önce davetiyeyi tam ekran önizleyebilirsiniz. İade koşulları Kullanım Koşulları sayfasında yer alır; sorularınız için bize yazabilirsiniz.",
    inferred: true,
  },
  {
    q: "Davetiyem birden fazla dilde olabilir mi?",
    a: "Evet. Türkçe dahildir; Ek Dil eklentisiyle (dil başına 149 TL) davetiyenizi başka dillerde de yayınlayabilir, misafirlerinizin dil seçmesini sağlayabilirsiniz.",
    inferred: true,
  },
];
