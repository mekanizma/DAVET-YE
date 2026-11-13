import type { InvitationStyle } from "@/data/invitationStyles";
import type { Locale } from "./locale";

const PILL: Record<string, string> = {
  DAVETLİSİNİZ: "YOU'RE INVITED",
  "HOŞ GELDİNİZ": "WELCOME",
  "BÜYÜK GÜN": "THE BIG DAY",
  DAVET: "AN INVITATION",
  "GALA GECESİ": "GALA NIGHT",
  "ÖZEL DAVET": "A PRIVATE INVITATION",
};

const OPEN_LABEL: Record<string, string> = {
  "Davetiyeyi aç": "Open the invitation",
  "Kapıyı aç": "Open the door",
  "Mührü kır": "Break the seal",
  "Perdeyi aç": "Open the curtain",
};

const OPEN_HINT: Record<string, string> = {
  "Zarfa dokunun": "Tap the envelope",
  "Kapıyı aralayın": "Part the door",
  "Çini kapıyı aralayın": "Part the tiled door",
  "Mühre dokunun": "Tap the seal",
  "Perdeyi aralayın": "Part the curtain",
  "Sahne perdesini açın": "Open the stage curtain",
};

const LEAD: Record<string, string> = {
  "Biz Evleniyoruz": "We are getting married",
  "Akdeniz'in kıyısında": "On the Mediterranean shore",
  "Bir ömür boyu sürecek hikâyenin başlangıcı": "The start of a story that lasts a lifetime",
  "Çini işi bir davet": "An invitation in tilework",
  "Bu gece sahne sizin": "The stage is yours tonight",
  "Mühürlü bir davet": "A sealed invitation",
};

/** English opening copy. Colours, fonts, and ornaments stay as they are. */
export function localizeInvitationStyle(style: InvitationStyle, locale: Locale): InvitationStyle {
  if (locale !== "en") return style;
  return {
    ...style,
    pill: PILL[style.pill] ?? style.pill,
    openLabel: OPEN_LABEL[style.openLabel] ?? style.openLabel,
    openHint: OPEN_HINT[style.openHint] ?? style.openHint,
    lead: LEAD[style.lead] ?? style.lead,
  };
}
