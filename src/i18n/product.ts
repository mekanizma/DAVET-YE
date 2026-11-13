import type { Locale } from "./locale";
import { DESIGN_PRICING, PRICE_FEATURES, type Addon } from "@/data/pricing";
import { INVITATION_SECTIONS, OFFER_INVITATION } from "@/data/sections";
import { LANGUAGES } from "@/data/pricing";

const ADDON_EN: Record<string, { title: string; note?: string; text: string; unit?: string }> = {
  "ani-duvari": {
    title: "Memory Wall",
    note: "5 GB",
    text: "Guests upload photographs on the day, and every memory gathers on one wall.",
  },
  "ani-cekimi": {
    title: "Memory Capture (Lens)",
    note: "2 GB",
    text: "Guests catch a memory in playful frames, using their camera.",
  },
  "masa-qr": {
    title: "Table QR card",
    note: "5 GB",
    text: "A QR card for the tables. Guests scan it and upload the photographs they take, straight to you.",
  },
  "ek-dil": {
    title: "Extra language",
    note: "per language",
    text: "Publish the invitation in other languages too, and let guests choose.",
    unit: "language",
  },
  markasiz: {
    title: "Unbranded publishing",
    text: "The platform signature at the bottom of the invitation is removed.",
  },
  "ek-depolama": {
    title: "Extra storage",
    note: "10 GB",
    text: "An extra 10 GB for uploaded photographs and videos.",
  },
  "ek-sure": {
    title: "Extra time",
    note: "90 days",
    text: "Extend your invitation’s time online by 90 days.",
  },
};

const SECTION_EN: Record<string, { title: string; text: string }> = {
  isimler: { title: "Names", text: "Your names" },
  aileler: { title: "Families", text: "Show the family names on the invitation" },
  tarih: { title: "Date", text: "Date, time, and ceremony details" },
  konum: { title: "Location", text: "Venue details and directions on a map" },
  soz: { title: "Promise ceremony", text: "Date, time, and ceremony details" },
  nisan: { title: "Engagement ceremony", text: "Date, time, and ceremony details" },
  kina: { title: "Henna night", text: "Date, time, and ceremony details" },
  nikah: { title: "Nikah ceremony", text: "Date, time, and ceremony details" },
  dugun: { title: "Wedding ceremony", text: "Date, time, and ceremony details" },
  after: { title: "After party", text: "Date, time, and ceremony details" },
  "geri-sayim": { title: "Countdown", text: "Show the time left until the event" },
  hikaye: { title: "Our story", text: "The story of how you met" },
  program: { title: "Order of the day", text: "Show the flow of the nikah, the meal, and the party" },
  kiyafet: { title: "Dress code", text: "Say what you would like people to wear" },
  album: { title: "Our album", text: "Add your own photographs to the invitation" },
  menu: { title: "Menu", text: "Share the menu and the order of service" },
  katilim: { title: "RSVP form", text: "Collect replies with the invitation’s own questions" },
  "ani-duvari": { title: "Memory Wall", text: "Collect photographs from your guests" },
  "ani-cekimi": { title: "Memory Capture", text: "Guests catch a memory in camera frames" },
  dilekler: { title: "Wishes", text: "Guests leave a message" },
  iban: { title: "Gift / IBAN", text: "For guests who would rather send a gift by transfer" },
  kapanis: { title: "Closing", text: "A thank-you and a closing note" },
};

const OFFER_EN: Record<string, { title: string; text: string }> = {
  "Açılış Videosu": { title: "Opening video", text: "A short opening video before the invitation opens" },
  "Aile Bilgileri": { title: "Family details", text: "Show the family names on the invitation" },
  Etkinlikler: { title: "Events", text: "Date, time, and ceremony details" },
  "Geri Sayım": { title: "Countdown", text: "Show the time left until the event" },
  Konum: { title: "Location", text: "Venue details and directions on a map" },
  Program: { title: "Programme", text: "Show the flow of the nikah, the meal, and the party" },
  "Yemek Menüsü": { title: "Menu", text: "Share the menu and the order of service" },
  Galeri: { title: "Gallery", text: "Add your own photographs to the invitation" },
  "Katılım Formu": { title: "RSVP form", text: "Collect replies with the invitation’s own questions" },
  "Hediye Hesabı (IBAN)": { title: "Gift account (IBAN)", text: "For guests who would rather send a gift by transfer" },
  Kıyafet: { title: "Dress", text: "Say what you would like people to wear" },
  Dilekler: { title: "Wishes", text: "Guests leave a message" },
  "Atmosfer Müziği": { title: "Atmosphere music", text: "Add background music to your invitation" },
  "Anı Duvarı": { title: "Memory Wall", text: "Collect photographs from your guests" },
  "Anı Çekimi (Lens)": { title: "Memory Capture (Lens)", text: "Guests catch a memory in camera frames" },
};

const FREE_EN = [
  "Opening video",
  "Family details",
  "Events",
  "Countdown",
  "Location",
  "Programme",
  "Menu",
  "Gallery",
  "RSVP form",
  "Gift account (IBAN)",
];

const FEATURES_EN = [
  "One-time payment",
  "Online for at least six months after the event",
  "Unlimited RSVPs",
  "Unlimited guest views",
];

const LANG_EN: Record<string, string> = {
  tr: "Turkish",
  en: "English",
  de: "German",
  fr: "French",
  es: "Spanish",
  it: "Italian",
  ru: "Russian",
  el: "Greek",
  ar: "Arabic",
  pt: "Portuguese",
};

export function localizeAddon<T extends Addon>(addon: T, locale: Locale): T {
  if (locale !== "en") return addon;
  const en = ADDON_EN[addon.id];
  if (!en) return addon;
  return { ...addon, title: en.title, note: en.note ?? addon.note, text: en.text, unit: en.unit ?? addon.unit };
}

export function localizeAddons<T extends Addon>(addons: T[], locale: Locale): T[] {
  return addons.map((addon) => localizeAddon(addon, locale));
}

export function invitationSections(locale: Locale) {
  if (locale !== "en") return INVITATION_SECTIONS;
  return INVITATION_SECTIONS.map((section) => {
    const en = SECTION_EN[section.id];
    return en ? { ...section, title: en.title, text: en.text } : section;
  });
}

export function offerInvitation(locale: Locale) {
  if (locale !== "en") return OFFER_INVITATION;
  return OFFER_INVITATION.map((item) => {
    const en = OFFER_EN[item.title];
    return en ? { ...item, title: en.title, text: en.text } : item;
  });
}

export function freeSections(locale: Locale, fallback: string[]): string[] {
  if (locale !== "en") return fallback;
  return FREE_EN;
}

export function priceFeatures(locale: Locale, features: string[]): string[] {
  if (locale !== "en") return features;
  if (features.length === PRICE_FEATURES.length && features.every((item, i) => item === PRICE_FEATURES[i])) return FEATURES_EN;
  const known = new Map(PRICE_FEATURES.map((item, i) => [item, FEATURES_EN[i]]));
  return features.map((item) => known.get(item) ?? item);
}

export function designPricing(locale: Locale, paidPrice: string) {
  if (locale !== "en") {
    return {
      free: DESIGN_PRICING.free,
      paid: { ...DESIGN_PRICING.paid, price: paidPrice },
    };
  }
  return {
    free: {
      title: "Download with a watermark",
      price: "Free",
      caption: "For every card, with no limit",
      items: [
        "Every ready-made design and tool",
        "Unlimited designs and saves",
        "PNG and JPG sized for sharing on a phone",
      ],
    },
    paid: {
      title: "Download without a watermark",
      price: paidPrice,
      caption: "Per card, paid once",
      items: [
        "A high-resolution PNG and JPG with no watermark",
        "A print-ready PDF you can send to a printer",
        "Update the card and download it again as often as you like",
      ],
    },
  };
}

export function languageLabel(code: string, locale: Locale): string {
  const row = LANGUAGES.find((item) => item.code === code);
  if (!row) return code;
  if (locale !== "en") return row.label;
  return LANG_EN[code] ?? row.label;
}

export function languagesFor(locale: Locale) {
  return LANGUAGES.map((item) => ({
    ...item,
    label: locale === "en" ? (LANG_EN[item.code] ?? item.label) : item.label,
  }));
}

const STATUS_EN: Record<string, string> = {
  bekliyor: "Awaiting payment",
  bildirildi: "Awaiting confirmation",
  onaylandi: "Confirmed",
  reddedildi: "Declined",
  "test-success": "Test order",
  "test-failed": "Failed test",
};

export function statusLabel(status: string, locale: Locale, fallback: string): string {
  if (locale !== "en") return fallback;
  return STATUS_EN[status] ?? fallback;
}

export const API_ERROR_EN: Record<string, string> = {
  "Sipariş kodu geçersiz.": "The order code is not valid.",
  "Dekont JPG, PNG, WEBP veya PDF olmalı ve 5 MB’ı geçmemeli.": "The receipt must be a JPG, PNG, WEBP, or PDF, and no larger than 5 MB.",
  "Dekont kaydedilemedi.": "The receipt could not be saved.",
  "Çok fazla sipariş denemesi. Biraz sonra yeniden deneyin.": "Too many order attempts. Please try again in a little while.",
  "İstek okunamadı.": "The request could not be read.",
  "Sipariş türü geçersiz.": "The order type is not valid.",
  "Sipariş bulunamadı.": "Order not found.",
  "Dekont okunamadı.": "The receipt could not be read.",
  "Ad soyad en az 3 karakter olmalı.": "Please enter a full name of at least 3 characters.",
  "Dekont yükleyin. JPG, PNG, WEBP veya PDF, en fazla 5 MB.": "Upload a receipt. JPG, PNG, WEBP, or PDF, up to 5 MB.",
  "Sipariş bulunamadı. Kod ve e-posta birlikte kontrol edilir.": "Order not found. The code and email are checked together.",
  "Bu sipariş zaten onaylanmış.": "This order has already been confirmed.",
  "Bu davetiye şu an satışta değil.": "This invitation is not on sale at the moment.",
  "Bu gazete şu an satışta değil.": "This newspaper is not on sale at the moment.",
  "Geçerli bir e-posta yazın.": "Please enter a valid email address.",
  "Telefon numarası eksik görünüyor.": "The phone number looks incomplete.",
  "Sipariş kaydedilemedi.": "The order could not be saved.",
  "Gönderen adını yazın.": "Please enter the sender’s name.",
  "Sipariş bulunamadı. Kodu ve e-postayı kontrol edin.": "Order not found. Check the code and the email.",
  "Bu sipariş için bildirim alınamıyor.": "A notice cannot be recorded for this order.",
  "Bildirim kaydedilemedi.": "The notice could not be saved.",
  "Supabase ayarları eksik.": "The account service is not configured.",
  "Giriş gerekli.": "Please sign in.",
  "Siparişler okunamadı.": "Orders could not be loaded.",
  "E-posta veya şifre hatalı.": "The email or password is incorrect.",
  "Bu e-posta adresi kabul edilmiyor. test@gmail.com gibi deneme adresleri engellenir; başka bir adres kullanın.":
    "This email address is not accepted. Trial addresses such as test@gmail.com are blocked. Please use another address.",
  "Bu e-posta ile bir hesap zaten var. Giriş yapın.": "An account with this email already exists. Please sign in.",
  "Girişten önce e-postanızdaki doğrulama bağlantısına tıklayın.": "Before you sign in, open the confirmation link in your email.",
  "Şifre en az 8 karakter olmalı.": "The password must be at least 8 characters.",
  "Çok fazla deneme. Bir süre sonra yeniden deneyin.": "Too many attempts. Please try again in a little while.",
  "Adres henüz Supabase yönlendirme listesinde değil.": "This address is not on the sign-in redirect list yet.",
  "Bağlantı kurulamadı.": "The connection could not be made.",
  "İşlem tamamlanamadı. Bilgileri kontrol edip yeniden deneyin.": "That could not be completed. Check the details and try again.",
};

export function localizeError(message: string, locale: Locale): string {
  if (locale !== "en" || !message) return message;
  return API_ERROR_EN[message] ?? message;
}
