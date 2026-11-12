import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

const MAX_BYTES = 5 * 1024 * 1024;
const DIR = path.join(process.cwd(), "data", "runtime", "dekont");

const KINDS = {
  jpg: { mime: "image/jpeg", magic: (b: Uint8Array) => b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  png: { mime: "image/png", magic: (b: Uint8Array) => b.length > 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 },
  webp: {
    mime: "image/webp",
    magic: (b: Uint8Array) =>
      b.length > 12 && b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50,
  },
  pdf: { mime: "application/pdf", magic: (b: Uint8Array) => b.length > 4 && b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46 },
} as const;

export type ReceiptExt = keyof typeof KINDS;

function safeCode(code: string) {
  const clean = code.trim().toUpperCase();
  return /^DV-[A-Z0-9]{4,24}$/.test(clean) ? clean : "";
}

export function sniffReceipt(bytes: Uint8Array): ReceiptExt | null {
  if (bytes.byteLength < 8 || bytes.byteLength > MAX_BYTES) return null;
  for (const [ext, kind] of Object.entries(KINDS) as [ReceiptExt, (typeof KINDS)[ReceiptExt]][]) {
    if (kind.magic(bytes)) return ext;
  }
  return null;
}

export async function saveReceipt(code: string, bytes: Uint8Array): Promise<{ ok: true; ext: ReceiptExt } | { ok: false; error: string }> {
  const id = safeCode(code);
  const ext = sniffReceipt(bytes);
  if (!id) return { ok: false, error: "Sipariş kodu geçersiz." };
  if (!ext) return { ok: false, error: "Dekont JPG, PNG, WEBP veya PDF olmalı ve 5 MB’ı geçmemeli." };
  await mkdir(DIR, { recursive: true });
  for (const old of Object.keys(KINDS)) {
    if (old !== ext) await unlink(path.join(DIR, `${id}.${old}`)).catch(() => undefined);
  }
  await writeFile(path.join(DIR, `${id}.${ext}`), bytes);
  return { ok: true, ext };
}

export async function removeReceipt(code: string) {
  const id = safeCode(code);
  if (!id) return;
  for (const ext of Object.keys(KINDS)) {
    await unlink(path.join(DIR, `${id}.${ext}`)).catch(() => undefined);
  }
}
export async function readReceipt(code: string): Promise<{ bytes: Buffer; mime: string; ext: ReceiptExt } | null> {
  const id = safeCode(code);
  if (!id) return null;
  for (const ext of Object.keys(KINDS) as ReceiptExt[]) {
    try {
      const bytes = await readFile(path.join(DIR, `${id}.${ext}`));
      if (bytes.byteLength < 8) continue;
      return { bytes, mime: KINDS[ext].mime, ext };
    } catch {
      /* try the next extension */
    }
  }
  return null;
}
