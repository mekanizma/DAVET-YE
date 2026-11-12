import type { NewspaperDraft, NewspaperProgramItem, NewspaperTimelineItem } from "@/lib/storage";
import { newspapers } from "@/data/newspapers";

export const DEFAULT_TIMELINE: NewspaperTimelineItem[] = [
  { title: "İlk tanışma", text: "Her şey bir merhaba ile başladı." },
  { title: "İlk buluşma", text: "Sahilde uzun bir yürüyüş." },
  { title: "Evlenme teklifi", text: "Evet! demek için çok az zaman gerekti." },
  { title: "Büyük gün", text: "Birlikte yeni bir sayfa açıyoruz." },
];

export const DEFAULT_PROGRAM: NewspaperProgramItem[] = [
  { time: "19:00", title: "Karşılama" },
  { time: "20:00", title: "Nikâh töreni" },
  { time: "20:45", title: "Akşam yemeği" },
  { time: "22:00", title: "Pasta & dans" },
];

export const EMPTY_NEWSPAPER_DRAFT: NewspaperDraft = {
  template: newspapers[0]?.slug || "ask-bulteni",
  values: {},
  contents: {},
  /** Kapak */
  headline: "",
  tagline: "",
  edition: "ÖZEL SAYI · SAYI: 1",
  kicker: "AŞK HER ZAMAN HABER DEĞERDİR",
  slogan: "AŞK · AİLE · MUTLULUK · DAİMA",
  coverNote: "",
  scriptNote: "",
  inviteNote: "",
  /** İsimler (manşet altı / hikâye) */
  partnerA: "",
  partnerB: "",
  names: "",
  familyA: "",
  familyB: "",
  /** Künye / haber tarihi */
  date: "",
  time: "19:00",
  venue: "",
  address: "",
  /** İç sayfalar */
  story: "",
  storySpot: "NASIL BAŞLADI?",
  quote: "Sevgi, birlikte aynı yöne bakmaktır.",
  thanks: "Bu özel günümüzde sizleri de aramızda görmekten büyük mutluluk duyuyoruz.",
  thanksTitle: "TEŞEKKÜR EDERİZ",
  closing: "SEVGİYLE,",
  timeline: DEFAULT_TIMELINE.map((t) => ({ ...t })),
  program: DEFAULT_PROGRAM.map((p) => ({ ...p })),
  photos: { cover: "", collage: ["", "", "", "", ""] },
  size: "A3",
  style: "original",
  updatedAt: "",
};

/** Merge older local drafts that lack newer fields. */
export function normalizeNewspaperDraft(raw: Partial<NewspaperDraft> | null | undefined): NewspaperDraft {
  const base = { ...EMPTY_NEWSPAPER_DRAFT, ...(raw || {}) };
  const collage = Array.isArray(raw?.photos?.collage) ? [...raw!.photos!.collage] : [];
  while (collage.length < 5) collage.push("");
  const timeline =
    Array.isArray(raw?.timeline) && raw!.timeline!.length
      ? raw!.timeline!.map((t) => ({ title: t?.title || "", text: t?.text || "" }))
      : DEFAULT_TIMELINE.map((t) => ({ ...t }));
  const program =
    Array.isArray(raw?.program) && raw!.program!.length
      ? raw!.program!.map((p) => ({ time: p?.time || "", title: p?.title || "" }))
      : DEFAULT_PROGRAM.map((p) => ({ ...p }));

  const partnerA = base.partnerA || "";
  const partnerB = base.partnerB || "";
  const names = base.names?.trim() || [partnerA, partnerB].filter(Boolean).join(" & ") || "";

  const values =
    raw?.values && typeof raw.values === "object" && !Array.isArray(raw.values)
      ? Object.fromEntries(
          Object.entries(raw.values)
            .filter(([, v]) => typeof v === "string")
            .map(([k, v]) => [k, v as string]),
        )
      : {};
  const contents =
    raw?.contents && typeof raw.contents === "object" && !Array.isArray(raw.contents)
      ? Object.fromEntries(
          Object.entries(raw.contents)
            .filter(([, v]) => typeof v === "string")
            .map(([k, v]) => [k, v as string]),
        )
      : {};

  return {
    ...EMPTY_NEWSPAPER_DRAFT,
    ...base,
    partnerA,
    partnerB,
    names,
    values,
    contents,
    timeline,
    program,
    photos: {
      cover: raw?.photos?.cover || "",
      collage: collage.slice(0, 5),
    },
    size: base.size === "A2" ? "A2" : "A3",
    style: base.style === "sepia" || base.style === "mono" ? base.style : "original",
  };
}

export function draftDisplayNames(d: NewspaperDraft) {
  const joined = [d.partnerA.trim(), d.partnerB.trim()].filter(Boolean).join(" & ");
  return joined || d.names.trim();
}

/** Compress an image file to a JPEG data URL for localStorage. */
export async function fileToDraftPhoto(file: File, maxEdge = 1280, quality = 0.72): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Yalnızca görsel yükleyin.");
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Görsel işlenemedi.");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", quality);
}
