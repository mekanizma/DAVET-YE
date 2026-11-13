import { siteUrl } from "@/lib/seo";

/** Minimal multi-page PDF (Helvetica, WinAnsi). No dependencies. */

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

type Line = { text: string; size: number; gap?: number; bold?: boolean };

function pageStream(lines: Line[], startY = 750) {
  const parts: string[] = ["BT", "/F1 11 Tf", "50 " + startY + " Td"];
  let first = true;
  for (const line of lines) {
    const size = line.size;
    const gap = line.gap ?? size + 6;
    const font = line.bold ? "/F2" : "/F1";
    if (first) {
      parts.push(`${font} ${size} Tf`);
      first = false;
    } else {
      parts.push(`0 -${gap} Td`, `${font} ${size} Tf`);
    }
    parts.push(`(${escapePdf(toWinAnsi(line.text))}) Tj`);
  }
  parts.push("ET");
  return parts.join("\n");
}

function wrap(text: string, width: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const out: string[] = [];
  let row = "";
  for (const w of words) {
    const next = row ? `${row} ${w}` : w;
    if (next.length > width) {
      if (row) out.push(row);
      row = w.length > width ? w.slice(0, width) : w;
    } else {
      row = next;
    }
  }
  if (row) out.push(row);
  return out.length ? out : [""];
}

function buildPdf(pages: string[]): Buffer {
  const objects: string[] = [];
  objects.push("<< /Type /Catalog /Pages 2 0 R >>");

  const kids = pages.map((_, i) => `${3 + i * 2} 0 R`).join(" ");
  objects.push(`<< /Type /Pages /Kids [${kids}] /Count ${pages.length} >>`);

  for (let i = 0; i < pages.length; i++) {
    const pageObj = 3 + i * 2;
    const contentObj = pageObj + 1;
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents ${contentObj} 0 R /Resources << /Font << /F1 ${3 + pages.length * 2} 0 R /F2 ${4 + pages.length * 2} 0 R >> >> >>`,
    );
    const stream = pages[i]!;
    objects.push(`<< /Length ${Buffer.byteLength(stream, "utf8")} >>\nstream\n${stream}\nendstream`);
  }

  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");

  let body = "%PDF-1.4\n";
  const offsets: number[] = [0];
  for (let i = 0; i < objects.length; i++) {
    offsets.push(Buffer.byteLength(body, "utf8"));
    body += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`;
  }
  const xref = Buffer.byteLength(body, "utf8");
  let xrefBlock = `xref\n0 ${objects.length + 1}\n`;
  xrefBlock += "0000000000 65535 f \n";
  for (let i = 1; i < offsets.length; i++) {
    xrefBlock += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  body += xrefBlock;
  body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
  body += `startxref\n${xref}\n%%EOF`;
  return Buffer.from(body, "utf8");
}

export function buildEtsyGuidePdf(input: {
  code: string;
  newspaperTitle: string;
  description: string;
  headline: string;
}): Buffer {
  const origin = siteUrl();
  const redeemUrl = `${origin}/en/etsy`;
  const about = input.description.trim() || `${input.newspaperTitle} is a four-page newspaper you edit in the browser and then save as a PDF or print.`;

  const page1: Line[] = [
    { text: "DAVETANISI", size: 11, bold: true, gap: 18 },
    { text: "Your newspaper design guide", size: 20, bold: true, gap: 26 },
    { text: "Thank you for your Etsy purchase.", size: 12, gap: 16 },
    { text: input.newspaperTitle, size: 16, bold: true, gap: 18 },
    ...(input.headline
      ? [{ text: `Front-page headline: ${input.headline}`, size: 11, gap: 16 }]
      : []),
    { text: "Your access code", size: 11, gap: 14 },
    { text: input.code, size: 26, bold: true, gap: 26 },
    { text: "Open this address and enter the code:", size: 11, gap: 14 },
    { text: redeemUrl, size: 11, gap: 20 },
    { text: "The code opens only this newspaper. You design it in the", size: 11, gap: 14 },
    { text: "studio, then download or print the finished pages. Keep this PDF.", size: 11, gap: 8 },
  ];

  const aboutLines = [
    "About this design",
    "",
    ...wrap(about, 86),
    "",
    "The studio is in English when you open the link above. Your",
    "purchased newspaper is already selected. You edit four pages:",
    "the cover, the story inside, the photo pages, and the closing",
    "note. Sample words are there so you can see the layout; replace",
    "them with your own names, date, place, and story.",
  ];

  const howTo = [
    "How to design and download",
    "",
    "1. On your phone or computer, open the sign-in page above.",
    "2. Type the access code. Upper or lower case both work.",
    "   Then tap Open studio.",
    "3. Pages — choose the page you want to change.",
    "4. Text — replace headlines, names, the date, the venue,",
    "   and the story. The newspaper updates as you type.",
    "5. Photos — upload a picture for each frame on that page.",
    "   Use clear, high-resolution photos.",
    "6. Download — choose A3 or A2, and a paper look:",
    "   original, aged paper, or black and white.",
    "7. Tap Print / Save PDF. In the print dialog choose",
    "   Save as PDF, or send the pages to your printer.",
    "",
    "Sign in again later with the same code. The draft stays in",
    "the browser you designed in, so use that device to keep your",
    "text and photos. Do not share the code.",
  ];

  const page2: Line[] = howTo.flatMap((t) => {
    if (!t) return [{ text: " ", size: 8, gap: 10 }];
    if (t.startsWith("How to") || t.startsWith("Step ")) {
      return [{ text: t, size: t.startsWith("How") ? 14 : 12, bold: true, gap: 16 }];
    }
    return wrap(t, 78).map((line) => ({ text: line, size: 11, gap: 13 }));
  });

  const tips = [
    "Tips for a beautiful result",
    "",
    "- Write short, clear headlines. Newspaper columns read best",
    "  with concise lines.",
    "- Keep important faces near the centre of photo frames.",
    "- Check spelling of names and dates before you print.",
    "- On mobile, rotate to landscape for a larger preview, or",
    "  finish fine edits on a laptop.",
    "- Drafts are saved in this browser. Use the same device when",
    "  you come back, or keep the code handy to unlock again.",
    "",
    "Sign-in page:",
    redeemUrl,
    "",
    "Need help? Reply to your Etsy order message and include your",
    `access code (${input.code}).`,
    "",
    "Davetanisi — digital invitations & wedding newspapers",
    origin,
  ];

  const page3: Line[] = tips.flatMap((t) => {
    if (!t) return [{ text: " ", size: 8, gap: 10 }];
    if (t.startsWith("Tips") || t.startsWith("Studio") || t.startsWith("Need") || t.startsWith("Davetanisi")) {
      return [{ text: t, size: t.startsWith("Tips") ? 14 : 11, bold: t.startsWith("Tips") || t.startsWith("Davetanisi"), gap: 15 }];
    }
    return wrap(t, 78).map((line) => ({ text: line, size: 11, gap: 13 }));
  });

  const pageAbout: Line[] = aboutLines.flatMap((t) => {
    if (!t) return [{ text: " ", size: 8, gap: 10 }];
    if (t === "About this design") return [{ text: t, size: 14, bold: true, gap: 18 }];
    return wrap(t, 86).map((line) => ({ text: line, size: 11, gap: 14 }));
  });

  return buildPdf([pageStream(page1), pageStream(pageAbout), pageStream(page2), pageStream(page3)]);
}
