/** Library tracks offered in the wizard “Fon müziği” step. */

export type MusicTrackId = "seremoni" | "fon" | "fon-2" | "sinematik" | "davet" | "caz" | "gece";

export const MUSIC_TRACKS: Array<{
  id: MusicTrackId;
  tr: string;
  en: string;
  src: string;
}> = [
  { id: "seremoni", tr: "Düğün Seremoni Fon Müziği", en: "Wedding ceremony music", src: "/media/uploads/20261002093258-156246af17b34edbbfd0e07e6df83d6c.mp3" },
  { id: "fon", tr: "Düğün Fon Müziği", en: "Wedding background music", src: "/media/uploads/20261002094000-97efe2e78be742febbb60420a9cad14d.mp3" },
  { id: "fon-2", tr: "Düğün Fon Müziği 2", en: "Wedding background music 2", src: "/media/uploads/20261002093445-443c547d18334b06af50555c5210658f.mp3" },
  { id: "sinematik", tr: "Sinematik Düğün Müziği", en: "Cinematic wedding music", src: "/media/uploads/20261002093543-5726d1c8fb52460491dd912892d321d4.mp3" },
  { id: "davet", tr: "Düğün Davetiye Müziği", en: "Wedding invitation music", src: "/media/uploads/20261002093628-4dc67502024142dda2834c7d163d5f1d.mp3" },
  { id: "caz", tr: "Düğün Caz Müziği", en: "Wedding jazz", src: "/media/uploads/20261002093725-c1ec440dcfd547178bd5d0ac6aed7466.mp3" },
  { id: "gece", tr: "Gece Ruhu Düğün Müziği", en: "Night-mood wedding music", src: "/media/uploads/20261002093907-6d430a375656403ca1cc5c75adc43d35.mp3" },
];

export function musicTrackSrc(id: string | undefined | null): string | null {
  if (!id || id === "default" || id === "none") return null;
  return MUSIC_TRACKS.find((track) => track.id === id)?.src || null;
}
