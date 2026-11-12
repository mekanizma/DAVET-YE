/** Örnek içerik: önizleme ve canlı kartlarda kullanılır (referanstaki Güz Masalı önizlemesinden). */
export const SAMPLE = {
  partnerA: "Ayşe",
  partnerB: "Mehmet",
  brideFamily: "Ayten & Mustafa YILMAZ",
  groomFamily: "Zeynep & Ahmet KAYA",
  /** 12 Haziran 2027 Cumartesi 19:00 (yerel saat) */
  date: "2027-06-12",
  time: "19:00",
  venue: "Çırağan Sarayı",
  address: "Çırağan Cad. No:32, Beşiktaş / İstanbul",
  message: "Sizleri de aramızda görmekten mutluluk duyarız.",
  familyMessage:
    "Ailelerimizin hayır dualarıyla bu mutlu günde sizleri de aramızda görmek isteriz.",
  program: [
    { time: "19:00", title: "Karşılama", text: "Kokteyl ve canlı müzik" },
    { time: "20:00", title: "Nikâh Töreni", text: "Sevdiklerimizin şahitliğinde" },
    { time: "20:45", title: "Akşam Yemeği", text: "" },
    { time: "22:00", title: "Pasta & Dans", text: "Pist açılıyor" },
  ],
  wishes: [
    { name: "Ayşe", text: "Çok mutlu olun, ömür boyu beraber!" },
    { name: "Mehmet", text: "Tebrikler, nice güzel yıllara." },
  ],
  ibanHolder: "Ayşe Yılmaz",
  /** Örnek IBAN: gerçek bir hesaba ait değildir. */
  iban: "TR12 0006 4000 0011 2345 6789 01",
  closing:
    "Hayatımızın en özel gününde sizleri de aramızda görmekten mutluluk duyarız.",
};

export function sampleDate(date = SAMPLE.date, time = SAMPLE.time): Date {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1, hh ?? 0, mm ?? 0, 0);
}
