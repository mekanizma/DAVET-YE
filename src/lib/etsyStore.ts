import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomInt } from "crypto";
import { getNewspaper } from "@/data/newspapers";
import { getTheme } from "@/data/themes";
import { localizeNewspaper, themeTitle } from "@/i18n/catalog";
import { createSupabaseServer, createSupabaseService } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/env";

export type EtsyCodeStatus = "active" | "redeemed" | "revoked";
/** Locked product type, or `any` until the customer chooses. */
export type EtsyProductKind = "gazete" | "davetiye" | "any";
export type EtsyLockedKind = "gazete" | "davetiye";

/** Code unlocks one free product; customer picks newspaper or invitation later. */
export const ETSY_ANY_SLUG = "__any__";

export function isEtsyOpenChoice(item: { productSlug?: string | null; kind?: string | null } | string | null | undefined) {
  if (item == null) return true;
  if (typeof item === "string") return !item || item === ETSY_ANY_SLUG;
  return item.kind === "any" || !item.productSlug || item.productSlug === ETSY_ANY_SLUG;
}

export function etsyOpenTitle(locale: "tr" | "en" = "en") {
  return locale === "en" ? "1 free product (newspaper or invitation)" : "1 ücretsiz ürün (gazete veya davetiye)";
}

export type EtsyCode = {
  code: string;
  kind: EtsyProductKind;
  /** @deprecated use productSlug */
  newspaperSlug: string;
  /** @deprecated use productTitle */
  newspaperTitle: string;
  productSlug: string;
  productTitle: string;
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
  product_kind?: string | null;
};

const LOCAL_DIR = path.join(process.cwd(), "data", "runtime");
const LOCAL_FILE = path.join(LOCAL_DIR, "etsy-codes.json");

function serverSecret(): string {
  const secret = process.env.SUPABASE_SERVER_SECRET;
  if (!secret) throw new Error("Sunucu gizli anahtarı tanımlı değil.");
  return secret;
}

function asKind(value: unknown): EtsyProductKind {
  if (value === "davetiye") return "davetiye";
  if (value === "any") return "any";
  return "gazete";
}

function asLockedKind(value: unknown): EtsyLockedKind | null {
  if (value === "davetiye" || value === "gazete") return value;
  return null;
}

function fromRow(row: DbRow): EtsyCode {
  const kind = asKind(row.product_kind);
  const productSlug = row.newspaper_slug;
  const productTitle = row.newspaper_title;
  return {
    code: row.code,
    kind,
    newspaperSlug: productSlug,
    newspaperTitle: productTitle,
    productSlug,
    productTitle,
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

function resolveProduct(kind: EtsyLockedKind, slug: string): { slug: string; title: string } | null {
  if (kind === "gazete") {
    const paper = getNewspaper(slug);
    if (!paper) return null;
    return { slug: paper.slug, title: localizeNewspaper(paper, "en").title };
  }
  const theme = getTheme(slug);
  if (!theme) return null;
  return { slug: theme.slug, title: themeTitle(theme, "en") };
}

async function readLocal(): Promise<EtsyCode[]> {
  try {
    const raw = await readFile(LOCAL_FILE, "utf8");
    const parsed = JSON.parse(raw) as Array<Partial<EtsyCode> & DbRow>;
    if (!Array.isArray(parsed)) return [];
    return parsed.map((row) => {
      if (row.productSlug || row.newspaperSlug) {
        const kind = asKind(row.kind || row.product_kind);
        const productSlug = String(row.productSlug || row.newspaperSlug || row.newspaper_slug || "");
        const productTitle = String(row.productTitle || row.newspaperTitle || row.newspaper_title || "");
        return {
          code: String(row.code || ""),
          kind,
          newspaperSlug: productSlug,
          newspaperTitle: productTitle,
          productSlug,
          productTitle,
          note: String(row.note || ""),
          status: (row.status as EtsyCodeStatus) || "active",
          createdAt: String(row.createdAt || row.created_at || ""),
          redeemedAt: (row.redeemedAt ?? row.redeemed_at ?? null) as string | null,
          lastUsedAt: (row.lastUsedAt ?? row.last_used_at ?? null) as string | null,
          useCount: Number(row.useCount ?? row.use_count ?? 0) || 0,
        };
      }
      return fromRow(row as DbRow);
    });
  } catch {
    return [];
  }
}

async function writeLocal(list: EtsyCode[]) {
  await mkdir(LOCAL_DIR, { recursive: true });
  await writeFile(LOCAL_FILE, JSON.stringify(list, null, 2), "utf8");
}

const SELECT_COLS = "code, newspaper_slug, newspaper_title, note, status, created_at, redeemed_at, last_used_at, use_count, product_kind";

async function listFromDb(): Promise<EtsyCode[] | null> {
  if (!supabaseConfigured()) return null;
  try {
    const db = await createSupabaseServer();
    const { data, error } = await db
      .from("dv_etsy_codes")
      .select(SELECT_COLS)
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
  note?: string;
}): Promise<{ ok: true; item: EtsyCode } | { ok: false; error: string }> {
  const product = { slug: ETSY_ANY_SLUG, title: etsyOpenTitle("en") };
  const note = (input.note || "").replace(/[\u0000-\u001F\u007F]/g, "").trim().slice(0, 200);
  const now = new Date().toISOString();

  for (let attempt = 0; attempt < 6; attempt++) {
    const code = newEtsyCode();
    const item: EtsyCode = {
      code,
      kind: "any",
      newspaperSlug: product.slug,
      newspaperTitle: product.title,
      productSlug: product.slug,
      productTitle: product.title,
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
          newspaper_slug: item.productSlug,
          newspaper_title: item.productTitle,
          product_kind: "any",
          note: item.note,
          status: item.status,
          created_at: item.createdAt,
          redeemed_at: null,
          last_used_at: null,
          use_count: 0,
        });
        if (!error) return { ok: true, item };
        if (error.code !== "23505") break;
      } catch {
        break;
      }
    } else {
      break;
    }
  }

  const local = await readLocal();
  for (let attempt = 0; attempt < 6; attempt++) {
    const code = newEtsyCode();
    if (local.some((r) => r.code === code)) continue;
    const item: EtsyCode = {
      code,
      kind: "any",
      newspaperSlug: product.slug,
      newspaperTitle: product.title,
      productSlug: product.slug,
      productTitle: product.title,
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

/** Lock an open code to the one free product (type + design) the customer picked. */
export async function lockEtsyProduct(
  code: string,
  kind: EtsyLockedKind,
  productSlug: string,
): Promise<{ ok: true; item: EtsyCode } | { ok: false; error: string }> {
  const clean = normalizeCode(code);
  const lockedKind = asLockedKind(kind);
  if (!isEtsyCodeFormat(clean) || !lockedKind) return { ok: false, error: "Invalid access code." };
  const current = await getEtsyCode(clean);
  if (!current || current.status === "revoked") return { ok: false, error: "This access code is not valid." };

  if (!isEtsyOpenChoice(current)) {
    if (current.kind === lockedKind && current.productSlug === productSlug) return { ok: true, item: current };
    return { ok: false, error: "This code is already locked to another design." };
  }

  // Older type-scoped codes may already have gazete|davetiye; keep that type.
  if (current.kind !== "any" && current.kind !== lockedKind) {
    return { ok: false, error: "This code is for a different product type." };
  }

  const product = resolveProduct(lockedKind, productSlug);
  if (!product) {
    return { ok: false, error: lockedKind === "davetiye" ? "Invitation not found." : "Newspaper not found." };
  }

  if (supabaseConfigured()) {
    try {
      const db = createSupabaseService();
      const { data, error } = await db
        .from("dv_etsy_codes")
        .update({
          newspaper_slug: product.slug,
          newspaper_title: product.title,
          product_kind: lockedKind,
        })
        .eq("code", clean)
        .eq("newspaper_slug", ETSY_ANY_SLUG)
        .select(SELECT_COLS)
        .maybeSingle();
      if (!error && data) return { ok: true, item: fromRow(data as DbRow) };
      const again = await getEtsyCode(clean);
      if (again && !isEtsyOpenChoice(again)) {
        if (again.kind === lockedKind && again.productSlug === product.slug) return { ok: true, item: again };
        return { ok: false, error: "This code is already locked to another design." };
      }
    } catch {
      /* local */
    }
  }

  const local = await readLocal();
  const idx = local.findIndex((r) => r.code === clean);
  if (idx < 0) return { ok: false, error: "This access code was not found." };
  const row = local[idx]!;
  if (!isEtsyOpenChoice(row)) {
    if (row.kind === lockedKind && row.productSlug === product.slug) return { ok: true, item: row };
    return { ok: false, error: "This code is already locked to another design." };
  }
  const next: EtsyCode = {
    ...row,
    kind: lockedKind,
    productSlug: product.slug,
    productTitle: product.title,
    newspaperSlug: product.slug,
    newspaperTitle: product.title,
  };
  local[idx] = next;
  await writeLocal(local);
  return { ok: true, item: next };
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
        .select(SELECT_COLS)
        .eq("code", clean)
        .maybeSingle();
      if (!error && data) return fromRow(data as DbRow);
    } catch {
      /* buyer sessions cannot read the table; the lookup below can */
    }
    if (process.env.SUPABASE_SERVER_SECRET) {
      try {
        const db = createSupabaseService();
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
      const db = createSupabaseService();
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
