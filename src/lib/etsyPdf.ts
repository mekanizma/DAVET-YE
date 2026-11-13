import { existsSync, readFileSync } from "fs";
import path from "path";
import { siteUrl } from "@/lib/seo";

/** Editorial A4 guide: the purchased newspaper cover, plus how to design and download it. */

const W = 595;
const H = 842;

type RGB = [number, number, number];

type Jpeg = { width: number; height: number; data: Buffer; space: "DeviceRGB" | "DeviceGray" | "DeviceCMYK" };

const INK: RGB = [0.11, 0.09, 0.08];
const CREAM: RGB = [0.965, 0.945, 0.91];
const CARD: RGB = [0.995, 0.988, 0.97];
const MUTED: RGB = [0.43, 0.39, 0.35];
const GOLD: RGB = [0.68, 0.5, 0.28];
const WHITE: RGB = [1, 1, 1];
const LINE: RGB = [0.86, 0.82, 0.75];

function n(v: number) {
  return (Math.round(v * 1000) / 1000).toString();
}
function r(v: number) {
  return (Math.round(v * 10) / 10).toString();
}

function escapePdf(text: string) {
  return text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function toWinAnsi(text: string) {
  return text
    .replace(/[\u2018\u2019\u2032]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u2026/g, "...")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, "");
}

function wrap(text: string, width: number): string[] {
  const words = text.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  const out: string[] = [];
  let row = "";
  for (const word of words) {
    const next = row ? `${row} ${word}` : word;
    if (next.length > width) {
      if (row) out.push(row);
      row = word.length > width ? word.slice(0, width) : word;
    } else row = next;
  }
  if (row) out.push(row);
  return out.length ? out : [];
}

function charsFor(width: number, size: number) {
  return Math.max(12, Math.floor(width / (size * 0.5)));
}

function hexToRgb(hex: string | undefined, fallback: RGB): RGB {
  if (!hex) return fallback;
  const raw = hex.trim().replace("#", "");
  const full = raw.length === 3 ? raw.split("").map((c) => c + c).join("") : raw;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return fallback;
  const num = Number.parseInt(full, 16);
  return [((num >> 16) & 255) / 255, ((num >> 8) & 255) / 255, (num & 255) / 255];
}

function luminance(c: RGB) {
  return 0.3 * c[0] + 0.55 * c[1] + 0.15 * c[2];
}

function jpegInfo(data: Buffer): Jpeg | null {
  if (data.length < 4 || data[0] !== 0xff || data[1] !== 0xd8) return null;
  let i = 2;
  while (i + 9 < data.length) {
    if (data[i] !== 0xff) {
      i += 1;
      continue;
    }
    const marker = data[i + 1]!;
    if (marker === 0xd8 || marker === 0xd9) {
      i += 2;
      continue;
    }
    if (i + 3 >= data.length) return null;
    const len = data.readUInt16BE(i + 2);
    if (marker >= 0xc0 && marker <= 0xc2) {
      const height = data.readUInt16BE(i + 5);
      const width = data.readUInt16BE(i + 7);
      const components = data[i + 9];
      const space = components === 1 ? "DeviceGray" : components === 4 ? "DeviceCMYK" : "DeviceRGB";
      if (!width || !height) return null;
      return { width, height, data, space };
    }
    i += 2 + len;
  }
  return null;
}

function loadCover(publicPath?: string): Jpeg | null {
  if (!publicPath || !publicPath.startsWith("/") || publicPath.includes("..")) return null;
  const abs = path.join(process.cwd(), "public", publicPath.replace(/^\//, ""));
  if (!existsSync(abs) || !abs.toLowerCase().endsWith(".jpg") && !abs.toLowerCase().endsWith(".jpeg")) return null;
  try {
    return jpegInfo(readFileSync(abs));
  } catch {
    return null;
  }
}

function fit(srcW: number, srcH: number, maxW: number, maxH: number) {
  const scale = Math.min(maxW / srcW, maxH / srcH);
  return { w: srcW * scale, h: srcH * scale };
}

class Page {
  private ops: string[] = [];

  fill(c: RGB) {
    this.ops.push(`${n(c[0])} ${n(c[1])} ${n(c[2])} rg`);
  }
  strokeColor(c: RGB) {
    this.ops.push(`${n(c[0])} ${n(c[1])} ${n(c[2])} RG`);
  }
  rect(x: number, y: number, w: number, h: number) {
    this.ops.push(`${r(x)} ${r(y)} ${r(w)} ${r(h)} re f`);
  }
  roundedRect(x: number, y: number, w: number, h: number) {
    this.rect(x, y, w, h);
  }
  line(x1: number, y1: number, x2: number, y2: number, width = 0.6) {
    this.ops.push(`${width} w ${r(x1)} ${r(y1)} m ${r(x2)} ${r(y2)} l S`);
  }
  frame(x: number, y: number, w: number, h: number, width = 0.8) {
    this.ops.push(`${width} w ${r(x)} ${r(y)} ${r(w)} ${r(h)} re S`);
  }
  image(name: string, x: number, y: number, w: number, h: number) {
    this.ops.push(`q ${r(w)} 0 0 ${r(h)} ${r(x)} ${r(y)} cm /${name} Do Q`);
  }
  text(x: number, y: number, text: string, size: number, bold: boolean, color: RGB) {
    const safe = escapePdf(toWinAnsi(text));
    if (!safe) return;
    const font = bold ? "F2" : "F1";
    this.ops.push(`BT /${font} ${size} Tf ${n(color[0])} ${n(color[1])} ${n(color[2])} rg ${r(x)} ${r(y)} Td (${safe}) Tj ET`);
  }
  paragraph(x: number, y: number, text: string, width: number, size: number, bold: boolean, color: RGB, leading: number) {
    const lines = wrap(text, charsFor(width, size));
    let yy = y;
    for (const line of lines) {
      this.text(x, yy, line, size, bold, color);
      yy -= leading;
    }
    return yy;
  }
  body() {
    return this.ops.join("\n");
  }
}

function paintPage(p: Page) {
  p.fill(CREAM);
  p.rect(0, 0, W, H);
}

function header(p: Page, ink: RGB, gold: RGB, pageNo: number) {
  p.fill(ink);
  p.rect(0, H - 56, W, 56);
  p.fill(gold);
  p.rect(0, H - 60, W, 4);
  p.text(36, H - 28, "DAVETANISI", 13, true, WHITE);
  p.text(36, H - 44, "Newspaper studio", 8, false, gold);
  p.text(W - 78, H - 34, `0${pageNo}  /  04`, 9, false, [0.93, 0.9, 0.84]);
}

function footer(p: Page, code: string, url: string) {
  let host = "www.davetanisi.com";
  try {
    host = new URL(url).host;
  } catch {
    /* keep the public site */
  }
  p.strokeColor(LINE);
  p.line(36, 30, W - 36, 30, 0.6);
  p.text(36, 16, `Access code  ${code}`, 8, false, MUTED);
  p.text(W - 36 - host.length * 4.4, 16, host, 8, false, MUTED);
}

function framedImage(p: Page, jpeg: Jpeg | null, name: string, x: number, y: number, maxW: number, maxH: number, gold: RGB) {
  if (!jpeg) {
    p.fill(CARD);
    p.rect(x, y, maxW, maxH);
    p.strokeColor(gold);
    p.frame(x, y, maxW, maxH, 1);
    p.text(x + 16, y + maxH / 2, "Your newspaper", 11, true, INK);
    return { w: maxW, h: maxH };
  }
  const box = fit(jpeg.width, jpeg.height, maxW, maxH);
  const ix = x + (maxW - box.w) / 2;
  const iy = y + (maxH - box.h) / 2;
  p.fill([0.82, 0.78, 0.7]);
  p.rect(ix + 5, iy - 5, box.w, box.h);
  p.fill(WHITE);
  p.rect(ix - 4, iy - 4, box.w + 8, box.h + 8);
  p.image(name, ix, iy, box.w, box.h);
  p.strokeColor(gold);
  p.frame(ix - 4, iy - 4, box.w + 8, box.h + 8, 1.1);
  return box;
}

function coverPage(input: GuideInput, jpeg: Jpeg | null, gold: RGB, ink: RGB) {
  const p = new Page();
  paintPage(p);
  header(p, ink, gold, 1);
  footer(p, input.code, input.url);

  p.text(36, 756, "THE DESIGN YOU PURCHASED", 8, true, gold);
  let y = 726;
  const titleLines = wrap(input.newspaperTitle, charsFor(520, 24)).slice(0, 2);
  for (const line of titleLines) {
    p.text(36, y, line, 24, true, ink);
    y -= 28;
  }
  if (input.headline) {
    p.text(36, y - 2, input.headline, 11, false, gold);
    y -= 18;
  }

  const frameTop = y - 12;
  const frameBottom = 168;
  const frameH = Math.max(180, frameTop - frameBottom);
  framedImage(p, jpeg, "Im1", 147, frameBottom, 300, frameH, gold);

  p.fill(ink);
  p.rect(36, 42, W - 72, 112);
  p.fill(gold);
  p.rect(36, 150, W - 72, 4);
  p.text(52, 128, "YOUR ACCESS CODE", 8, true, gold);
  p.text(52, 98, input.code, 22, true, WHITE);
  p.text(52, 74, "Open this address, enter the code, then design and download.", 9, false, [0.93, 0.9, 0.84]);
  p.text(52, 58, input.url, 9, false, WHITE);
  return p.body();
}

function aboutPage(input: GuideInput, jpeg: Jpeg | null, gold: RGB, ink: RGB) {
  const p = new Page();
  paintPage(p);
  header(p, ink, gold, 2);
  footer(p, input.code, input.url);

  p.text(36, 756, "INSIDE THIS NEWSPAPER", 8, true, gold);
  p.text(36, 730, "What you are designing", 20, true, ink);

  framedImage(p, jpeg, "Im1", 36, 470, 168, 240, gold);

  const about =
    input.description.trim() ||
    `${input.newspaperTitle} is a four-page newspaper. You replace the sample words and photos, then save or print it.`;
  p.paragraph(222, 694, about, 336, 10, false, INK, 14);

  const cards: { no: string; title: string; text: string }[] = [
    { no: "01", title: "Cover", text: "The front page: headline, date, place and the photograph that opens the story." },
    { no: "02", title: "Story", text: "The inside story and timeline. Replace the sample sentences with your own." },
    { no: "03", title: "Photographs", text: "Frames waiting for your pictures. Upload one clear photo for each frame." },
    { no: "04", title: "Closing", text: "The last page: a thank-you, a note, or the detail you want guests to keep." },
  ];
  cards.forEach((card, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 36 + col * 268;
    const y = 300 - row * 118;
    p.fill(CARD);
    p.rect(x, y, 252, 104);
    p.strokeColor(LINE);
    p.frame(x, y, 252, 104, 0.7);
    p.fill(gold);
    p.rect(x, y + 100, 252, 4);
    p.text(x + 14, y + 74, card.no, 9, true, gold);
    p.text(x + 44, y + 74, card.title, 12, true, ink);
    p.paragraph(x + 14, y + 54, card.text, 222, 9, false, MUTED, 12);
  });
  return p.body();
}

function howPage(input: GuideInput, gold: RGB, ink: RGB) {
  const p = new Page();
  paintPage(p);
  header(p, ink, gold, 3);
  footer(p, input.code, input.url);

  p.text(36, 756, "HOW TO DESIGN IT", 8, true, gold);
  p.text(36, 730, "Six steps in the studio", 20, true, ink);

  p.fill(CARD);
  p.rect(36, 560, 523, 150);
  p.strokeColor(LINE);
  p.frame(36, 560, 523, 150, 0.7);
  p.fill([0.94, 0.91, 0.86]);
  p.rect(48, 572, 86, 126);
  for (const [i, label] of ["Pages", "Text", "Photos", "Download"].entries()) {
    const by = 666 - i * 28;
    p.fill(i === 3 ? ink : WHITE);
    p.rect(56, by, 70, 22);
    p.text(64, by + 7, label, 8, true, i === 3 ? WHITE : ink);
  }
  p.fill(WHITE);
  p.rect(150, 578, 92, 114);
  p.strokeColor(gold);
  p.frame(150, 578, 92, 114, 1);
  p.fill(ink);
  p.rect(156, 674, 80, 8);
  p.fill([0.9, 0.86, 0.8]);
  p.rect(156, 620, 80, 46);
  p.fill(LINE);
  p.rect(156, 600, 54, 4);
  p.rect(156, 592, 40, 4);
  p.text(258, 662, "Your newspaper is already selected.", 11, true, ink);
  p.paragraph(258, 644, "You do not choose another template. Edit the words and photos on this design, page by page.", 280, 9, false, MUTED, 12);

  const steps = [
    ["Open the link", `On your phone or computer, go to ${input.url}`],
    ["Enter the code", "Type the access code from the first page. Then tap Open studio."],
    ["Edit the words", "Use Pages to move, then Text. Replace the headline, names, date, place and story."],
    ["Add photographs", "Open Photos and upload a picture for each frame. Clear, large photos print best."],
    ["Set the finish", "Choose A3 or A2, and a paper look: original, aged paper, or black and white."],
    ["Download", "Tap Download, then Print / Save PDF. Choose Save as PDF, or send it to a printer."],
  ];
  steps.forEach((step, i) => {
    const y = 520 - i * 78;
    p.fill(ink);
    p.rect(36, y - 4, 28, 28);
    p.text(44, y + 5, String(i + 1), 12, true, WHITE);
    p.text(76, y + 8, step[0]!, 12, true, ink);
    p.paragraph(76, y - 10, step[1]!, 470, 9, false, MUTED, 12);
  });
  return p.body();
}

function savePage(input: GuideInput, gold: RGB, ink: RGB) {
  const p = new Page();
  paintPage(p);
  header(p, ink, gold, 4);
  footer(p, input.code, input.url);

  p.text(36, 756, "SAVE OR PRINT", 8, true, gold);
  p.text(36, 730, "Take the finished paper with you", 20, true, ink);
  p.paragraph(36, 702, "When the pages look right, open Download in the studio. The print window is where the file is created.", 520, 10, false, MUTED, 14);

  const choices = [
    ["Save as PDF", "In the print window, set the destination to Save as PDF. You get a file you can send, post or keep."],
    ["Print on paper", "Choose A3 for a table newspaper, or A2 for a larger keepsake. Print in colour so the photographs stay rich."],
  ];
  choices.forEach((choice, i) => {
    const x = 36 + i * 268;
    p.fill(i === 0 ? ink : CARD);
    p.rect(x, 520, 252, 150);
    if (i === 1) {
      p.strokeColor(LINE);
      p.frame(x, 520, 252, 150, 0.7);
    }
    p.text(x + 16, 632, choice[0]!, 14, true, i === 0 ? WHITE : ink);
    p.paragraph(x + 16, 608, choice[1]!, 220, 10, false, i === 0 ? [0.93, 0.9, 0.84] : MUTED, 13);
  });

  p.text(36, 492, "PAPER LOOK", 8, true, gold);
  const looks = [
    ["Original", "The colours of this design, as you see them in the studio."],
    ["Aged paper", "A warm, slightly faded newsprint tone."],
    ["Black and white", "A classic newspaper, without colour."],
  ];
  looks.forEach((look, i) => {
    const x = 36 + i * 178;
    p.fill(CARD);
    p.rect(x, 390, 168, 88);
    p.fill(gold);
    p.rect(x, 474, 168, 4);
    p.text(x + 12, 448, look[0]!, 11, true, ink);
    p.paragraph(x + 12, 430, look[1]!, 144, 8, false, MUTED, 11);
  });

  p.fill(CARD);
  p.rect(36, 78, 523, 286);
  p.strokeColor(LINE);
  p.frame(36, 78, 523, 286, 0.7);
  p.text(52, 332, "Before you send it", 14, true, ink);
  const notes = [
    "Write short headlines. A newspaper reads better in short lines.",
    "Keep faces near the centre of each photo frame.",
    "Check every name and the date before you download.",
    "Your draft stays in this browser. Come back on the same phone or computer to keep your text and photos.",
    "The same code opens the studio again. Do not share it.",
  ];
  let ny = 308;
  for (const note of notes) {
    p.fill(gold);
    p.rect(52, ny + 2, 5, 5);
    ny = p.paragraph(66, ny, note, 470, 10, false, INK, 13) - 8;
  }
  p.text(52, 100, `Code  ${input.code}`, 12, true, ink);
  p.text(52, 84, input.url, 9, false, MUTED);
  return p.body();
}

type GuideInput = {
  code: string;
  newspaperTitle: string;
  description: string;
  headline: string;
  url: string;
};

function buildPdf(pages: string[], image: Jpeg | null): Buffer {
  const objects: (string | Buffer)[] = [];
  objects[0] = "<< /Type /Catalog /Pages 2 0 R >>";
  const kids = pages.map((_, i) => `${3 + i * 2} 0 R`).join(" ");
  objects[1] = `<< /Type /Pages /Kids [${kids}] /Count ${pages.length} >>`;

  const font1 = 3 + pages.length * 2;
  const font2 = font1 + 1;
  const imageObj = font2 + 1;
  const xobj = image ? `/XObject << /Im1 ${imageObj} 0 R >>` : "";

  pages.forEach((stream, i) => {
    const contentObj = 4 + i * 2;
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Contents ${contentObj} 0 R /Resources << /Font << /F1 ${font1} 0 R /F2 ${font2} 0 R >> ${xobj} >> >>`,
    );
    objects.push(
      Buffer.concat([
        Buffer.from(`<< /Length ${Buffer.byteLength(stream, "utf8")} >>\nstream\n`),
        Buffer.from(stream, "utf8"),
        Buffer.from("\nendstream"),
      ]),
    );
  });

  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>");
  if (image) {
    objects.push(
      Buffer.concat([
        Buffer.from(
          `<< /Type /XObject /Subtype /Image /Width ${image.width} /Height ${image.height} /ColorSpace /${image.space} /BitsPerComponent 8 /Filter /DCTDecode /Length ${image.data.length} >>\nstream\n`,
        ),
        image.data,
        Buffer.from("\nendstream"),
      ]),
    );
  }

  const chunks: Buffer[] = [Buffer.from("%PDF-1.4\n")];
  const offsets: number[] = [0];
  let cursor = chunks[0]!.length;
  objects.forEach((obj, index) => {
    offsets.push(cursor);
    const head = Buffer.from(`${index + 1} 0 obj\n`);
    const body = typeof obj === "string" ? Buffer.from(obj) : obj;
    const tail = Buffer.from("\nendobj\n");
    chunks.push(head, body, tail);
    cursor += head.length + body.length + tail.length;
  });
  const xrefAt = cursor;
  let xref = `xref\n0 ${objects.length + 1}\n`;
  xref += "0000000000 65535 f \n";
  for (let i = 1; i < offsets.length; i++) xref += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  xref += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefAt}\n%%EOF`;
  chunks.push(Buffer.from(xref));
  return Buffer.concat(chunks);
}

export function buildEtsyGuidePdf(input: {
  code: string;
  newspaperTitle: string;
  description: string;
  headline: string;
  coverPath?: string;
  accent?: string;
  ink?: string;
}): Buffer {
  const guide: GuideInput = {
    code: input.code,
    newspaperTitle: input.newspaperTitle || "Your newspaper",
    description: input.description,
    headline: input.headline,
    url: `${siteUrl()}/en/etsy`,
  };
  const jpeg = loadCover(input.coverPath);
  const accent = hexToRgb(input.accent, GOLD);
  const gold = luminance(accent) > 0.72 ? GOLD : accent;
  const ink = hexToRgb(input.ink, INK);
  const safeInk = luminance(ink) > 0.45 ? INK : ink;
  return buildPdf(
    [coverPage(guide, jpeg, gold, safeInk), aboutPage(guide, jpeg, gold, safeInk), howPage(guide, gold, safeInk), savePage(guide, gold, safeInk)],
    jpeg,
  );
}
