import { siteUrl } from "@/lib/seo";

/** Text-only Etsy access guide: code + how to use it. No product images. */

const W = 595;
const H = 842;

type RGB = [number, number, number];

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
  line(x1: number, y1: number, x2: number, y2: number, width = 0.6) {
    this.ops.push(`${width} w ${r(x1)} ${r(y1)} m ${r(x2)} ${r(y2)} l S`);
  }
  frame(x: number, y: number, w: number, h: number, width = 0.8) {
    this.ops.push(`${width} w ${r(x)} ${r(y)} ${r(w)} ${r(h)} re S`);
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

type GuideKind = "gazete" | "davetiye" | "any";

type GuideInput = {
  code: string;
  kind: GuideKind;
  newspaperTitle: string;
  description: string;
  headline: string;
  url: string;
  openChoice?: boolean;
};

function productWord(kind: GuideKind) {
  if (kind === "any") return "newspaper or invitation";
  return kind === "davetiye" ? "invitation" : "newspaper";
}

function productHeadline(kind: GuideKind) {
  if (kind === "any") return "Digital newspaper or invitation";
  return kind === "davetiye" ? "Digital invitation" : "Digital newspaper";
}

function paintPage(p: Page) {
  p.fill(CREAM);
  p.rect(0, 0, W, H);
}

function header(p: Page, ink: RGB, gold: RGB, pageNo: number, total: number) {
  p.fill(ink);
  p.rect(0, H - 56, W, 56);
  p.fill(gold);
  p.rect(0, H - 60, W, 4);
  p.text(36, H - 28, "DAVETANISI", 13, true, WHITE);
  p.text(36, H - 44, "Etsy access guide", 8, false, gold);
  p.text(W - 78, H - 34, `0${pageNo}  /  0${total}`, 9, false, [0.93, 0.9, 0.84]);
}

function footer(p: Page, code: string, url: string) {
  let host = "davetanisi.com";
  try {
    host = new URL(url).host;
  } catch {
    /* keep default */
  }
  p.strokeColor(LINE);
  p.line(36, 30, W - 36, 30, 0.6);
  p.text(36, 16, `Access code  ${code}`, 8, false, MUTED);
  p.text(W - 36 - host.length * 4.4, 16, host, 8, false, MUTED);
}

function coverPage(input: GuideInput, gold: RGB, ink: RGB) {
  const p = new Page();
  paintPage(p);
  header(p, ink, gold, 1, 2);
  footer(p, input.code, input.url);

  const product = productWord(input.kind);
  p.text(36, 756, "1 FREE PRODUCT", 8, true, gold);
  p.text(36, 726, productHeadline(input.kind), 22, true, ink);

  let y = p.paragraph(
    36,
    690,
    input.kind === "any" || input.openChoice
      ? `This code unlocks one free product. After you sign in, choose newspaper or invitation, then pick one design from the catalogue. No payment on the site.`
      : `This code unlocks one free ${product}. Open the link, enter the code, then design and finish online. No payment on the site.`,
    520,
    11,
    false,
    MUTED,
    15,
  );

  y -= 18;
  p.fill(CARD);
  p.rect(36, y - 132, 523, 132);
  p.strokeColor(LINE);
  p.frame(36, y - 132, 523, 132, 0.7);
  p.text(52, y - 28, "WHAT YOU GET", 8, true, gold);
  const bullets =
    input.kind === "any"
      ? [
          "One free product: newspaper or invitation (you choose)",
          "Then pick any design of that type from the catalogue",
          "Finish in the studio — no Shopier payment on the site",
        ]
      : input.kind === "davetiye"
        ? [
            "One free invitation design (you choose which one)",
            "Edit names, date, place and pages in the studio",
            "Publish a guest link — no Shopier payment",
          ]
        : [
            "One free newspaper design (you choose which one)",
            "Edit text and photos in the studio",
            "Download or print as PDF — no payment on the site",
          ];
  let by = y - 48;
  for (const line of bullets) {
    p.fill(gold);
    p.rect(52, by + 2, 5, 5);
    by = p.paragraph(66, by, line, 470, 10, false, INK, 13) - 6;
  }

  p.fill(ink);
  p.rect(36, 42, W - 72, 148);
  p.fill(gold);
  p.rect(36, 186, W - 72, 4);
  p.text(52, 164, "YOUR ACCESS CODE", 8, true, gold);
  p.text(52, 128, input.code, 22, true, WHITE);
  p.text(52, 98, "1. Open this address", 10, true, [0.93, 0.9, 0.84]);
  p.text(52, 82, input.url, 10, false, WHITE);
  p.text(52, 58, "2. Enter the code  ·  3. Choose type & design on screen", 9, false, [0.93, 0.9, 0.84]);
  return p.body();
}

function howPage(input: GuideInput, gold: RGB, ink: RGB) {
  const p = new Page();
  paintPage(p);
  header(p, ink, gold, 2, 2);
  footer(p, input.code, input.url);

  const product = productWord(input.kind);
  p.text(36, 756, "HOW TO USE YOUR CODE", 8, true, gold);
  p.text(36, 730, "Step by step", 20, true, ink);
  p.paragraph(
    36,
    702,
    input.kind === "any" || input.openChoice
      ? "Your code is for one free product. After sign-in choose newspaper or invitation, then one design; that choice locks to this code."
      : `Your code is for one free ${product}. Sign in and finish the design online.`,
    520,
    10,
    false,
    MUTED,
    14,
  );

  const steps: [string, string][] =
    input.kind === "any"
      ? [
          ["Open the link", `On your phone or computer, go to ${input.url}`],
          ["Enter the code", `Type ${input.code} and continue.`],
          ["Choose product type", "Pick newspaper or invitation. Next you will see designs for that type only."],
          ["Pick one design", "Choose any design from the list. Your choice locks to this code."],
          ["Finish in the studio", "Edit text and photos. For invitations publish a guest link; for newspapers download PDF."],
          ["No payment on site", "The Etsy code covers one free product. Come back with the same code to edit again."],
        ]
      : input.kind === "davetiye"
        ? [
            ["Open the link", `On your phone or computer, go to ${input.url}`],
            ["Enter the code", `Type ${input.code} and open the studio.`],
            [
              input.openChoice ? "Pick one invitation" : "Open your invitation",
              input.openChoice
                ? "Choose any invitation from the list. Your choice locks to this code."
                : "Your invitation is already selected. Other designs stay locked.",
            ],
            ["Edit the details", "Set the language, then fill names, date, place and the other pages."],
            ["Activate for free", "On the last step enter your contact details. There is no Shopier payment — the code covers it."],
            ["Share the link", "Publish once, then send the guest link. Come back with the same code to edit again."],
          ]
        : [
            ["Open the link", `On your phone or computer, go to ${input.url}`],
            ["Enter the code", `Type ${input.code} and open the studio.`],
            [
              input.openChoice ? "Pick one newspaper" : "Open your newspaper",
              input.openChoice
                ? "Choose any newspaper from the list. Your choice locks to this code."
                : "Your newspaper is already selected. Other designs stay locked.",
            ],
            ["Edit the words", "Use Pages, then Text. Replace the headline, names, date, place and story."],
            ["Add photographs", "Open Photos and upload a clear picture for each frame."],
            ["Download free", "Tap Download, then Print / Save PDF. No payment on the site."],
          ];

  steps.forEach((step, i) => {
    const y = 650 - i * 92;
    p.fill(ink);
    p.rect(36, y - 4, 28, 28);
    p.text(44, y + 5, String(i + 1), 12, true, WHITE);
    p.text(76, y + 8, step[0], 12, true, ink);
    p.paragraph(76, y - 12, step[1], 470, 10, false, MUTED, 13);
  });
  return p.body();
}

function buildPdf(pages: string[]): Buffer {
  const objects: (string | Buffer)[] = [];
  objects[0] = "<< /Type /Catalog /Pages 2 0 R >>";
  const kids = pages.map((_, i) => `${3 + i * 2} 0 R`).join(" ");
  objects[1] = `<< /Type /Pages /Kids [${kids}] /Count ${pages.length} >>`;

  const font1 = 3 + pages.length * 2;
  const font2 = font1 + 1;

  pages.forEach((stream, i) => {
    const contentObj = 4 + i * 2;
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Contents ${contentObj} 0 R /Resources << /Font << /F1 ${font1} 0 R /F2 ${font2} 0 R >> >> >>`,
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
  kind?: GuideKind;
  newspaperTitle: string;
  description: string;
  headline: string;
  coverPath?: string;
  accent?: string;
  ink?: string;
  openChoice?: boolean;
}): Buffer {
  const kind: GuideKind = input.kind === "davetiye" ? "davetiye" : input.kind === "any" ? "any" : "gazete";
  const guide: GuideInput = {
    code: input.code,
    kind,
    newspaperTitle:
      input.newspaperTitle
      || (kind === "any" ? "1 free product" : kind === "davetiye" ? "Any invitation" : "Any newspaper"),
    description: input.description,
    headline: input.headline,
    url: `${siteUrl()}/en/etsy`,
    openChoice: Boolean(input.openChoice) || kind === "any",
  };
  return buildPdf([coverPage(guide, GOLD, INK), howPage(guide, GOLD, INK)]);
}
