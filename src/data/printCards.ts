export interface PrintLook {
  id: string;
  name: string;
  /** CSS aspect-ratio, width / height */
  ratio: string;
  paper: string;
  ink: string;
  accent: string;
  motif: "plain" | "medallion" | "star" | "frame" | "arch" | "botanical";
}

export const QR_LOOKS: PrintLook[] = [
  { id: "minimal", name: "Minimal Siyah Beyaz", ratio: "400 / 600", paper: "#ffffff", ink: "#161616", accent: "#161616", motif: "plain" },
  { id: "adacayi", name: "Adaçayı Bahçe", ratio: "400 / 600", paper: "#f4f1e8", ink: "#3e4a38", accent: "#7d8f72", motif: "botanical" },
  { id: "terrakota", name: "Terrakota Boho", ratio: "500 / 700", paper: "#f3e6d8", ink: "#8c4e32", accent: "#c46a45", motif: "arch" },
  { id: "lacivert-yildiz", name: "Lacivert Yıldız", ratio: "400 / 600", paper: "#13213c", ink: "#f4ead8", accent: "#d4b483", motif: "star" },
  { id: "allik", name: "Allık Gül", ratio: "400 / 600", paper: "#f8eee9", ink: "#7a3d48", accent: "#c98b93", motif: "botanical" },
  { id: "artdeco", name: "Art Deco Işıltı", ratio: "500 / 707", paper: "#111111", ink: "#f0e2b8", accent: "#c6a15b", motif: "frame" },
  { id: "zumrut", name: "Zümrüt Pano", ratio: "400 / 600", paper: "#f7f3ea", ink: "#1c4638", accent: "#1f6b52", motif: "frame" },
  { id: "renkli", name: "Renkli Adımlar", ratio: "1 / 1", paper: "#fbf6ee", ink: "#2b241c", accent: "#e07a3d", motif: "arch" },
];

export const CARD_LOOKS: PrintLook[] = [
  { id: "altin", name: "Altın Madalyon", ratio: "450 / 800", paper: "#f7efe1", ink: "#5a4630", accent: "#b8923a", motif: "medallion" },
  { id: "lacivert-gece", name: "Lacivert Gece", ratio: "450 / 800", paper: "#0f1d3a", ink: "#f6f1e6", accent: "#d4b483", motif: "star" },
  { id: "minimal-zarafet", name: "Minimal Zarafet", ratio: "500 / 700", paper: "#fbf8f2", ink: "#1a1a1a", accent: "#1a1a1a", motif: "plain" },
  { id: "gul", name: "Gül Çelengi", ratio: "500 / 700", paper: "#fdf8f5", ink: "#6a3a42", accent: "#d4a0a6", motif: "botanical" },
  { id: "sakura", name: "Sakura Söz", ratio: "450 / 800", paper: "#f8eee8", ink: "#6a3a48", accent: "#e7b4c0", motif: "botanical" },
  { id: "adacayi-kabartma", name: "Adaçayı Kabartma", ratio: "450 / 800", paper: "#6c7c5d", ink: "#2a3328", accent: "#f4f1e6", motif: "frame" },
  { id: "begonvil", name: "Begonvil Avlusu", ratio: "450 / 800", paper: "#f7efe6", ink: "#6a3040", accent: "#e08a96", motif: "arch" },
  { id: "elhamra", name: "Elhamra Avlusu", ratio: "450 / 800", paper: "#f3eadc", ink: "#5a3a28", accent: "#a36b3c", motif: "medallion" },
];

export function pickLook(list: PrintLook[], id: string | undefined): PrintLook {
  return list.find((item) => item.id === id) ?? list[0];
}
