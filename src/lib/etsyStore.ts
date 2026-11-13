import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomInt } from "crypto";
import { getNewspaper } from "@/data/newspapers";
import { localizeNewspaper } from "@/i18n/catalog";
import { createSupabaseAnon, createSupabaseServer } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/env";

export type EtsyCodeStatus = "active" | "redeemed" | "revoked";

export type EtsyCode = {
  code: string;
  newspaperSlug: string;
  newspaperTitle: string;
  note: string;
  status: EtsyCodeStatus;
  createdAt: string;
  redeemedAt: string | null;
  lastUsedAt: string | null;
  useCount: number;
};

type DbRow = {
  code: string;
  newspaper_slug: string;
  newspaper_title: string;
  note: string;
  status: EtsyCodeStatus;
  created_at: string;
  redeemed_at: string | null;
  last_used_at: string | null;
  use_count: number;
};

const LOCAL_DIR = path.join(process.cwd(), "data", "runtime");
const LOCAL_FILE = path.join(LOCAL_DIR, "etsy-codes.json");

function serverSecret(): string {
  const secret = process.env.SUPABASE_SERVER_SECRET;
  if (!secret) throw new Error("Sunucu gizli anahtarı tanımlı değil.");
  return secret;
}

function fromRow(row: DbRow): EtsyCode {
  return {
    code: row.code,
    newspaperSlug: row.newspaper_slug,
    newspaperTitle: row.newspaper_title,
    note: row.note || "",
    status: row.status,
    createdAt: row.created_at,
    redeemedAt: row.redeemed_at,
    lastUsedAt: row.last_used_at,
    useCount: row.use_count || 0,
  };
}

function normalizeCode(raw: string) {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

export function isEtsyCodeFormat(code: string) {
  return /^ETSY-[A-Z0-9]{6,16}$/.test(normalizeCode(code));
}

function newEtsyCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let body = "";
  for (let i = 0; i < 8; i++) body += alphabet[randomInt(alphabet.length)];
  return `ETSY-${body}`;
}

async function readLocal(): Promise<EtsyCode[]> {
  try {
    const raw = await readFile(LOCAL_FILE, "utf8");
    const parsed = JSON.parse(raw) as EtsyCode[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeLocal(list: EtsyCode[]) {
  await mkdir(LOCAL_DIR, { recursive: true });
  await writeFile(LOCAL_FILE, JSON.stringify(list, null, 2), "utf8");
}

async function listFromDb(): Promise<EtsyCode[] | null> {
  if (!supabaseConfigured()) return null;
  try {
    const db = await createSupabaseServer();
    const { data, error } = await db
      .from("dv_etsy_codes")
      .select("code, newspaper_slug, newspaper_title, note, status, created_at, redeemed_at, last_used_at, use_count")
      .order("created_at", { ascending: false });
    if (error) return null;
    return ((data || []) as DbRow[]).map(fromRow);
  } catch {
    return null;
  }
}

export async function listEtsyCodes(): Promise<EtsyCode[]> {
  const fromDb = await listFromDb();
  if (fromDb) return fromDb;
  const local = await readLocal();
  return local.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createEtsyCode(input: {
  newspaperSlug: string;
  note?: string;
}): Promise<{ ok: true; item: EtsyCode } | { ok: false; error: string }> {
  const paper = getNewspaper(input.newspaperSlug);
  if (!paper) return { ok: false, error: "Gazete şablonu bulunamadı." };
  const title = localizeNewspaper(paper, "en").title;
  const note = (input.note || "").replace(/[\u0000-\u001F\u007F]/g, "").trim().slice(0, 200);
  const now = new Date().toISOString();

  for (let attempt = 0; attempt < 6; attempt++) {
    const code = newEtsyCode();
    const item: EtsyCode = {
      code,
      newspaperSlug: paper.slug,
      newspaperTitle: title,
      note,
      status: "active",
      createdAt: now,
      redeemedAt: null,
      lastUsedAt: null,
      useCount: 0,
    };

    if (supabaseConfigured()) {
      try {
        const db = await createSupabaseServer();
        const { error } = await db.from("dv_etsy_codes").insert({
          code: item.code,
          newspaper_slug: item.newspaperSlug,
          newspaper_title: item.newspaperTitle,
          note: item.note,
          status: item.status,
          created_at: item.createdAt,
          redeemed_at: null,
          last_used_at: null,
          use_count: 0,
        });
        if (!error) return { ok: true, item };
        if (error.code !== "23505") {
          // table missing or other error → fall through to local
          break;
        }
      } catch {
        break;
      }
    } else {
      break;
    }
  }

  // Local fallback (dev / before migration)
  const local = await readLocal();
  let item: EtsyCode | null = null;
  for (let attempt = 0; attempt < 6; attempt++) {
    const code = newEtsyCode();
    if (local.some((r) => r.code === code)) continue;
    item = {
      code,
      newspaperSlug: paper.slug,
      newspaperTitle: title,
      note,
      status: "active",
      createdAt: now,
      redeemedAt: null,
      lastUsedAt: null,
      useCount: 0,
    };
    local.unshift(item);
    await writeLocal(local);
    return { ok: true, item };
  }
  return { ok: false, error: "Kod üretilemedi. Yeniden deneyin." };
}

export async function revokeEtsyCode(code: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const clean = normalizeCode(code);
  if (!isEtsyCodeFormat(clean)) return { ok: false, error: "Geçersiz kod." };

  if (supabaseConfigured()) {
    try {
      const db = await createSupabaseServer();
      const { error, count } = await db
        .from("dv_etsy_codes")
        .update({ status: "revoked" }, { count: "exact" })
        .eq("code", clean);
      if (!error && (count == null || count > 0)) return { ok: true };
    } catch {
      /* local */
    }
  }

  const local = await readLocal();
  const idx = local.findIndex((r) => r.code === clean);
  if (idx < 0) return { ok: false, error: "Kod bulunamadı." };
  local[idx] = { ...local[idx]!, status: "revoked" };
  await writeLocal(local);
  return { ok: true };
}

export async function getEtsyCode(code: string): Promise<EtsyCode | null> {
  const clean = normalizeCode(code);
  if (!isEtsyCodeFormat(clean)) return null;

  if (supabaseConfigured()) {
    try {
      const db = await createSupabaseServer();
      const { data, error } = await db
        .from("dv_etsy_codes")
        .select("code, newspaper_slug, newspaper_title, note, status, created_at, redeemed_at, last_used_at, use_count")
        .eq("code", clean)
        .maybeSingle();
      if (!error && data) return fromRow(data as DbRow);
    } catch {
      /* buyer sessions cannot read the table; the lookup below can */
    }
    if (process.env.SUPABASE_SERVER_SECRET) {
      try {
        const db = createSupabaseAnon();
        const { data, error } = await db.rpc("dv_etsy_lookup", {
          access_code: clean,
          server_secret: serverSecret(),
        });
        if (!error && data) return fromRow(data as DbRow);
      } catch {
        /* local file */
      }
    }
  }

  const local = await readLocal();
  return local.find((r) => r.code === clean) || null;
}

export async function redeemEtsyCode(code: string): Promise<{ ok: true; item: EtsyCode } | { ok: false; error: string }> {
  const clean = normalizeCode(code);
  if (!isEtsyCodeFormat(clean)) return { ok: false, error: "Enter a valid access code (ETSY-……)." };

  if (supabaseConfigured() && process.env.SUPABASE_SERVER_SECRET) {
    try {
      const db = createSupabaseAnon();
      const { data, error } = await db.rpc("dv_etsy_redeem", {
        access_code: clean,
        server_secret: serverSecret(),
      });
      if (!error && data) {
        const row = data as DbRow;
        return { ok: true, item: fromRow(row) };
      }
    } catch {
      /* local */
    }
  }

  const local = await readLocal();
  const idx = local.findIndex((r) => r.code === clean);
  if (idx < 0) return { ok: false, error: "This access code was not found." };
  const row = local[idx]!;
  if (row.status === "revoked") return { ok: false, error: "This access code has been revoked." };
  const now = new Date().toISOString();
  const next: EtsyCode = {
    ...row,
    status: "redeemed",
    redeemedAt: row.redeemedAt || now,
    lastUsedAt: now,
    useCount: row.useCount + 1,
  };
  local[idx] = next;
  await writeLocal(local);
  return { ok: true, item: next };
}
