import type { Locale } from "@/i18n/locale";
import { localizeError } from "@/i18n/product";

export function authErrorMessage(message: string, locale: Locale = "tr"): string {
  const m = message.toLowerCase();
  const say = (text: string) => localizeError(text, locale);
  if (m.includes("invalid login") || m.includes("invalid credentials")) return say("E-posta veya şifre hatalı.");
  if (m.includes("email_address_invalid") || (m.includes("email address") && m.includes("invalid"))) {
    return say("Bu e-posta adresi kabul edilmiyor. test@gmail.com gibi deneme adresleri engellenir; başka bir adres kullanın.");
  }
  if (m.includes("already registered") || m.includes("already been registered")) return say("Bu e-posta ile bir hesap zaten var. Giriş yapın.");
  if (m.includes("email not confirmed")) return say("Girişten önce e-postanızdaki doğrulama bağlantısına tıklayın.");
  if (m.includes("password")) return say("Şifre en az 8 karakter olmalı.");
  if (m.includes("rate limit") || m.includes("too many") || m.includes("over_request")) return say("Çok fazla deneme. Bir süre sonra yeniden deneyin.");
  if (m.includes("redirect") || (m.includes("invalid") && m.includes("url"))) return say("Adres henüz Supabase yönlendirme listesinde değil.");
  if (m.includes("fetch") || m.includes("network") || m.includes("failed to fetch")) return say("Bağlantı kurulamadı.");
  return say("İşlem tamamlanamadı. Bilgileri kontrol edip yeniden deneyin.");
}
