import type { OpeningType, Theme } from "./themes";

/**
 * Per-theme presentation profile for the invitation preview.
 * The six featured themes have hand-authored profiles (palette, ornament,
 * particles, opening wording) so they are not recolours of one template.
 */
export type ParticleKind = "leaves" | "petals" | "sparkles" | "ripples" | "dust" | "none";
export type OrnamentKind = "leaf" | "wave" | "baroque" | "tile" | "stage" | "wax" | "floral" | "line";

export interface InvitationStyle {
  /** page / opening background (behind the phone column) */
  bg: string;
  /** section scrim and text on cover backgrounds */
  deep: string;
  /** primary accent: buttons, ornaments */
  accent: string;
  /** card paper */
  paper: string;
  paperInk: string;
  paperSoft: string;
  /** light / dark paper card */
  dark: boolean;
  gold: string;
  pill: string;
  openLabel: string;
  openHint: string;
  particles: ParticleKind;
  ornament: OrnamentKind;
  /** display font token for names */
  nameFont: "display" | "script" | "serif";
  lead: string;
}

const featured: Record<string, InvitationStyle> = {
  "guz-masali": {
    bg: "#c9651a",
    deep: "#3a1a08",
    accent: "#b4501a",
    paper: "#fff6ea",
    paperInk: "#3b2012",
    paperSoft: "#7a5033",
    dark: false,
    gold: "#e0a04a",
    pill: "DAVETLİSİNİZ",
    openLabel: "Davetiyeyi aç",
    openHint: "Zarfa dokunun",
    particles: "leaves",
    ornament: "leaf",
    nameFont: "script",
    lead: "Biz Evleniyoruz",
  },
  "akdeniz-masali": {
    bg: "#7aa3ad",
    deep: "#143c46",
    accent: "#2b6b7a",
    paper: "#fbf8f1",
    paperInk: "#17353d",
    paperSoft: "#4d6e76",
    dark: false,
    gold: "#c9a76a",
    pill: "HOŞ GELDİNİZ",
    openLabel: "Perdeyi aç",
    openHint: "Perdeyi aralayın",
    particles: "ripples",
    ornament: "wave",
    nameFont: "serif",
    lead: "Akdeniz'in kıyısında",
  },
  "barok-kapi": {
    bg: "#c9ae7c",
    deep: "#3b2c14",
    accent: "#8a6226",
    paper: "#f8f0df",
    paperInk: "#33260f",
    paperSoft: "#7a6232",
    dark: false,
    gold: "#c79a42",
    pill: "BÜYÜK GÜN",
    openLabel: "Kapıyı aç",
    openHint: "Kapıyı aralayın",
    particles: "dust",
    ornament: "baroque",
    nameFont: "display",
    lead: "Bir ömür boyu sürecek hikâyenin başlangıcı",
  },
  "tavuslu-cini": {
    bg: "#1f6f78",
    deep: "#0a2f3a",
    accent: "#0f5662",
    paper: "#f4f7f3",
    paperInk: "#0c2f38",
    paperSoft: "#3f6b72",
    dark: false,
    gold: "#d3a94e",
    pill: "DAVET",
    openLabel: "Kapıyı aç",
    openHint: "Çini kapıyı aralayın",
    particles: "none",
    ornament: "tile",
    nameFont: "display",
    lead: "Çini işi bir davet",
  },
  "opera-gecesi": {
    bg: "#5d1220",
    deep: "#1c0a0f",
    accent: "#c79a42",
    paper: "#2a1217",
    paperInk: "#f4e6c8",
    paperSoft: "#d3b98a",
    dark: true,
    gold: "#e3c98e",
    pill: "GALA GECESİ",
    openLabel: "Perdeyi aç",
    openHint: "Sahne perdesini açın",
    particles: "sparkles",
    ornament: "stage",
    nameFont: "display",
    lead: "Bu gece sahne sizin",
  },
  "bordo-muhur": {
    bg: "#6b1c2a",
    deep: "#2a0a10",
    accent: "#7a1e2e",
    paper: "#fbf3ea",
    paperInk: "#3a1218",
    paperSoft: "#7a4a50",
    dark: false,
    gold: "#c9a258",
    pill: "ÖZEL DAVET",
    openLabel: "Mührü kır",
    openHint: "Mühre dokunun",
    particles: "petals",
    ornament: "wax",
    nameFont: "script",
    lead: "Mühürlü bir davet",
  },
};

const openLabels: Record<OpeningType, [string, string]> = {
  envelope: ["Davetiyeyi aç", "Zarfa dokunun"],
  door: ["Kapıyı aç", "Kapıyı aralayın"],
  seal: ["Mührü kır", "Mühre dokunun"],
  curtain: ["Perdeyi aç", "Perdeyi aralayın"],
};

const ornamentByOpening: Record<OpeningType, OrnamentKind> = {
  envelope: "floral",
  door: "baroque",
  seal: "wax",
  curtain: "line",
};

export function getInvitationStyle(theme: Theme): InvitationStyle {
  const hit = featured[theme.slug];
  if (hit) return hit;
  const c = theme.colors;
  const [openLabel, openHint] = openLabels[theme.opening];
  return {
    bg: c.accent,
    deep: c.accentDeep,
    accent: c.accent,
    paper: c.tint,
    paperInk: c.accentDeep,
    paperSoft: c.accent,
    dark: false,
    gold: c.gold,
    pill: "DAVETLİSİNİZ",
    openLabel,
    openHint,
    particles: /sakura|lale|gul|inci-ve|begonvil|pembe/.test(theme.slug)
      ? "petals"
      : /yildiz|opera|sampanya/.test(theme.slug)
        ? "sparkles"
        : "none",
    ornament: ornamentByOpening[theme.opening],
    nameFont: /rokoko|kaftan|saray|elhamra|lale/.test(theme.slug) ? "script" : "display",
    lead: "Biz Evleniyoruz",
  };
}
