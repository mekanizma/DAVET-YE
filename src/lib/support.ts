import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { isEmail } from "@/lib/format";
import { notifySupportRequest } from "@/lib/mail";
import { supabaseUrl } from "@/lib/supabase/env";

const MAX_LIST = 500;

export type SupportStatus = "new" | "read" | "done";
export type SupportSource = "widget" | "page";

export type SupportRequest = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  message: string;
  source: SupportSource;
  status: SupportStatus;
  createdAt: string;
};

export type SupportInput = {
  firstName: string;
  lastName: string;
  email: string;
  message: string;
  source?: SupportSource;
};

function admin(): SupabaseClient | null {
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!key || !process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
  return createClient(supabaseUrl(), key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function clean(value: string, max: number) {
  return value.trim().replace(/\s+/g, " ").slice(0, max);
}

function mapRow(row: Record<string, unknown>): SupportRequest {
  const source = row.source === "page" ? "page" : "widget";
  const status = row.status === "read" || row.status === "done" ? row.status : "new";
  return {
    id: String(row.id || ""),
    firstName: String(row.first_name || ""),
    lastName: String(row.last_name || ""),
    email: String(row.email || ""),
    message: String(row.message || ""),
    source,
    status,
    createdAt: String(row.created_at || ""),
  };
}

export async function saveSupportRequest(
  input: SupportInput,
): Promise<{ ok: true; request: SupportRequest } | { ok: false; status: number; error: string }> {
  const db = admin();
  if (!db) return { ok: false, status: 503, error: "Destek formu şu an kullanılamıyor." };

  const firstName = clean(input.firstName || "", 60);
  const lastName = clean(input.lastName || "", 60);
  const email = clean(input.email || "", 160).toLowerCase();
  const message = clean(input.message || "", 2000);
  const source: SupportSource = input.source === "page" ? "page" : "widget";

  if (firstName.length < 1) return { ok: false, status: 400, error: "Lütfen adınızı yazın." };
  if (lastName.length < 1) return { ok: false, status: 400, error: "Lütfen soyadınızı yazın." };
  if (!isEmail(email)) return { ok: false, status: 400, error: "Geçerli bir e-posta yazın." };
  if (message.length < 5) return { ok: false, status: 400, error: "Talebiniz en az 5 karakter olmalı." };

  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const { error } = await db.from("dv_support").insert({
    id,
    first_name: firstName,
    last_name: lastName,
    email,
    message,
    source,
    status: "new",
    created_at: createdAt,
  });
  if (error) return { ok: false, status: 500, error: "Talebiniz kaydedilemedi." };

  const request: SupportRequest = {
    id,
    firstName,
    lastName,
    email,
    message,
    source,
    status: "new",
    createdAt,
  };

  // DB kaydı başarılı; mail hatası formu düşürmesin.
  void notifySupportRequest(request).catch((err) => {
    console.error("[support-mail]", err instanceof Error ? err.message : err);
  });

  return { ok: true, request };
}

export async function listSupportRequests(status?: string): Promise<SupportRequest[] | null> {
  const db = admin();
  if (!db) return null;
  let q = db
    .from("dv_support")
    .select("id,first_name,last_name,email,message,source,status,created_at")
    .order("created_at", { ascending: false })
    .limit(MAX_LIST);
  if (status === "new" || status === "read" || status === "done") {
    q = q.eq("status", status);
  }
  const { data, error } = await q;
  if (error || !data) return null;
  return data.map((row) => mapRow(row as Record<string, unknown>));
}

export async function updateSupportStatus(
  id: string,
  status: SupportStatus,
): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const db = admin();
  if (!db) return { ok: false, status: 503, error: "Destek listesi kullanılamıyor." };
  const cleanId = id.trim();
  if (!cleanId) return { ok: false, status: 400, error: "Geçersiz kayıt." };
  const { error } = await db.from("dv_support").update({ status }).eq("id", cleanId);
  if (error) return { ok: false, status: 500, error: "Durum güncellenemedi." };
  return { ok: true };
}

export async function countNewSupport(): Promise<number> {
  const db = admin();
  if (!db) return 0;
  const { count, error } = await db
    .from("dv_support")
    .select("id", { count: "exact", head: true })
    .eq("status", "new");
  if (error) return 0;
  return count ?? 0;
}
