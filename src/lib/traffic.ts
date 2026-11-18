import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { supabaseUrl } from "@/lib/supabase/env";
import type { TrafficDevice, TrafficKind, TrafficSummary } from "@/lib/trafficTypes";

export type { TrafficDevice, TrafficKind, TrafficSummary } from "@/lib/trafficTypes";

const LIVE_MS = 60_000;
const LOCAL_DIR = path.join(process.cwd(), "data", "runtime");
const LOCAL_FILE = path.join(LOCAL_DIR, "traffic.json");
const MAX_LOCAL_EVENTS = 8_000;
const MAX_LOCAL_SESSIONS = 4_000;

export type TrafficHit = {
  sessionId: string;
  visitorKey: string;
  kind: TrafficKind;
  path: string;
  label?: string;
  referrer?: string;
  device?: TrafficDevice;
};

type LocalSession = {
  sessionId: string;
  visitorKey: string;
  path: string;
  firstSeen: string;
  lastSeen: string;
  dayKey: string;
  pageviews: number;
  clicks: number;
  engaged: boolean;
  referrer: string;
  device: TrafficDevice;
};

type LocalEvent = {
  id: string;
  sessionId: string;
  visitorKey: string;
  kind: TrafficKind;
  path: string;
  label: string;
  createdAt: string;
};

type LocalStore = {
  sessions: LocalSession[];
  events: LocalEvent[];
};

function admin(): SupabaseClient | null {
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!key || !process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
  return createClient(supabaseUrl(), key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function cleanId(value: string, max = 64) {
  return value.trim().replace(/[^a-zA-Z0-9_-]/g, "").slice(0, max);
}

function cleanPath(value: string) {
  const raw = value.trim().split("?")[0]?.split("#")[0] || "/";
  if (!raw.startsWith("/")) return "/";
  if (raw.startsWith("/yonetim") || raw.startsWith("/api/")) return "";
  return raw.slice(0, 240) || "/";
}

function cleanLabel(value: string) {
  return value.trim().replace(/\s+/g, " ").slice(0, 120);
}

function cleanReferrer(value: string) {
  return value.trim().slice(0, 240);
}

function deviceOf(value: string | undefined): TrafficDevice {
  if (value === "mobile" || value === "desktop") return value;
  return "other";
}

function istanbulDay(d = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function dayOffset(day: string, days: number): string {
  const [y, m, d] = day.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

export function clientIp(req: Request): string {
  const cf = req.headers.get("cf-connecting-ip");
  if (cf) return cf.trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]?.trim() || "0.0.0.0";
  return "0.0.0.0";
}

export function visitorKeyFromRequest(req: Request): string {
  const ip = clientIp(req);
  const ua = (req.headers.get("user-agent") || "").slice(0, 180);
  const day = istanbulDay();
  return createHash("sha256").update(`${ip}|${ua}|${day}`).digest("hex").slice(0, 40);
}

async function readLocal(): Promise<LocalStore> {
  try {
    const raw = await readFile(LOCAL_FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<LocalStore>;
    return {
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
      events: Array.isArray(parsed.events) ? parsed.events : [],
    };
  } catch {
    return { sessions: [], events: [] };
  }
}

async function writeLocal(store: LocalStore) {
  await mkdir(LOCAL_DIR, { recursive: true });
  await writeFile(LOCAL_FILE, JSON.stringify(store), "utf8");
}

function pruneLocal(store: LocalStore): LocalStore {
  const cutoff = Date.now() - 14 * 24 * 60 * 60 * 1000;
  const sessions = store.sessions
    .filter((s) => Date.parse(s.lastSeen) >= cutoff)
    .sort((a, b) => Date.parse(b.lastSeen) - Date.parse(a.lastSeen))
    .slice(0, MAX_LOCAL_SESSIONS);
  const events = store.events
    .filter((e) => Date.parse(e.createdAt) >= cutoff)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, MAX_LOCAL_EVENTS);
  return { sessions, events };
}

async function recordLocal(hit: Required<TrafficHit> & { visitorKey: string }) {
  const store = pruneLocal(await readLocal());
  const now = new Date().toISOString();
  const dayKey = istanbulDay();
  const existing = store.sessions.find((s) => s.sessionId === hit.sessionId);
  if (existing) {
    existing.lastSeen = now;
    existing.path = hit.path;
    existing.visitorKey = hit.visitorKey;
    existing.device = hit.device;
    if (hit.kind === "pageview") existing.pageviews += 1;
    if (hit.kind === "click") existing.clicks += 1;
    if (hit.kind === "engage") existing.engaged = true;
    if (hit.referrer && !existing.referrer) existing.referrer = hit.referrer;
  } else {
    store.sessions.push({
      sessionId: hit.sessionId,
      visitorKey: hit.visitorKey,
      path: hit.path,
      firstSeen: now,
      lastSeen: now,
      dayKey,
      pageviews: hit.kind === "pageview" ? 1 : 0,
      clicks: hit.kind === "click" ? 1 : 0,
      engaged: hit.kind === "engage",
      referrer: hit.referrer,
      device: hit.device,
    });
  }
  if (hit.kind !== "ping") {
    store.events.unshift({
      id: crypto.randomUUID(),
      sessionId: hit.sessionId,
      visitorKey: hit.visitorKey,
      kind: hit.kind,
      path: hit.path,
      label: hit.label,
      createdAt: now,
    });
  }
  await writeLocal(pruneLocal(store));
}

async function recordDb(db: SupabaseClient, hit: Required<TrafficHit> & { visitorKey: string }) {
  const now = new Date().toISOString();
  const dayKey = istanbulDay();
  const { data: existing } = await db
    .from("dv_traffic_sessions")
    .select("session_id,pageviews,clicks,engaged,referrer")
    .eq("session_id", hit.sessionId)
    .maybeSingle();

  const pageviews = (existing?.pageviews ?? 0) + (hit.kind === "pageview" ? 1 : 0);
  const clicks = (existing?.clicks ?? 0) + (hit.kind === "click" ? 1 : 0);
  const engaged = Boolean(existing?.engaged) || hit.kind === "engage";
  const referrer = String(existing?.referrer || hit.referrer || "");

  const { error: sessionError } = await db.from("dv_traffic_sessions").upsert(
    {
      session_id: hit.sessionId,
      visitor_key: hit.visitorKey,
      path: hit.path,
      last_seen: now,
      day_key: dayKey,
      pageviews: Math.max(pageviews, hit.kind === "pageview" ? 1 : 0),
      clicks,
      engaged,
      referrer,
      device: hit.device,
      ...(existing ? {} : { first_seen: now }),
    },
    { onConflict: "session_id" },
  );
  if (sessionError) throw sessionError;

  if (hit.kind !== "ping") {
    const { error: eventError } = await db.from("dv_traffic_events").insert({
      session_id: hit.sessionId,
      visitor_key: hit.visitorKey,
      kind: hit.kind,
      path: hit.path,
      label: hit.label,
      created_at: now,
    });
    if (eventError) throw eventError;
  }
}

export function parseTrafficHit(
  body: unknown,
  req: Request,
): { ok: true; hit: Required<TrafficHit> } | { ok: false; error: string } {
  const raw = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const sessionId = cleanId(String(raw.sessionId || ""));
  if (sessionId.length < 8) return { ok: false, error: "Geçersiz oturum." };

  const kindRaw = String(raw.kind || "");
  const kind: TrafficKind =
    kindRaw === "click" || kindRaw === "engage" || kindRaw === "ping" || kindRaw === "pageview"
      ? kindRaw
      : "pageview";

  const pathValue = cleanPath(String(raw.path || "/"));
  if (!pathValue) return { ok: false, error: "Yol atlandı." };

  const visitorFromClient = cleanId(String(raw.visitorKey || ""), 64);
  const visitorKey = visitorFromClient.length >= 8 ? visitorFromClient : visitorKeyFromRequest(req);

  return {
    ok: true,
    hit: {
      sessionId,
      visitorKey,
      kind,
      path: pathValue,
      label: cleanLabel(String(raw.label || "")),
      referrer: cleanReferrer(String(raw.referrer || "")),
      device: deviceOf(String(raw.device || "")),
    },
  };
}

export async function recordTrafficHit(hit: Required<TrafficHit>): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const db = admin();
    if (db) {
      await recordDb(db, hit);
      return { ok: true };
    }
    await recordLocal(hit);
    return { ok: true };
  } catch {
    try {
      await recordLocal(hit);
      return { ok: true };
    } catch {
      return { ok: false, error: "Kayıt alınamadı." };
    }
  }
}

function summarizeLocal(store: LocalStore): TrafficSummary {
  const now = Date.now();
  const today = istanbulDay();
  const yesterday = dayOffset(today, -1);
  const liveNow = new Set(
    store.sessions.filter((s) => now - Date.parse(s.lastSeen) <= LIVE_MS).map((s) => s.sessionId),
  ).size;

  const todaySessions = store.sessions.filter((s) => s.dayKey === today);
  const yesterdaySessions = store.sessions.filter((s) => s.dayKey === yesterday);
  const todayVisitors = new Set(todaySessions.map((s) => s.visitorKey)).size;
  const yesterdayVisitors = new Set(yesterdaySessions.map((s) => s.visitorKey)).size;
  const todayPageviews = todaySessions.reduce((n, s) => n + s.pageviews, 0);
  const todayClicks = todaySessions.reduce((n, s) => n + s.clicks, 0);
  const todayEngaged = todaySessions.filter((s) => s.engaged).length;

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const day = dayOffset(today, i - 6);
    const rows = store.sessions.filter((s) => s.dayKey === day);
    return {
      day,
      visitors: new Set(rows.map((s) => s.visitorKey)).size,
      pageviews: rows.reduce((n, s) => n + s.pageviews, 0),
      clicks: rows.reduce((n, s) => n + s.clicks, 0),
    };
  });

  const pathCounts = new Map<string, number>();
  for (const e of store.events) {
    if (e.kind !== "pageview") continue;
    if (istanbulDay(new Date(e.createdAt)) !== today) continue;
    pathCounts.set(e.path, (pathCounts.get(e.path) || 0) + 1);
  }

  const topPaths = [...pathCounts.entries()]
    .map(([p, views]) => ({ path: p, views }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 8);

  const devices = { mobile: 0, desktop: 0, other: 0 };
  for (const s of todaySessions) devices[s.device] += 1;

  return {
    liveNow,
    todayVisitors,
    todaySessions: todaySessions.length,
    todayPageviews,
    todayClicks,
    todayEngaged,
    yesterdayVisitors,
    last7Days,
    topPaths,
    devices,
    updatedAt: new Date().toISOString(),
  };
}

async function summarizeDb(db: SupabaseClient): Promise<TrafficSummary> {
  const today = istanbulDay();
  const yesterday = dayOffset(today, -1);
  const weekStart = dayOffset(today, -6);
  const liveSince = new Date(Date.now() - LIVE_MS).toISOString();

  const [liveRes, weekRes, eventsRes] = await Promise.all([
    db.from("dv_traffic_sessions").select("session_id").gte("last_seen", liveSince),
    db
      .from("dv_traffic_sessions")
      .select("session_id,visitor_key,day_key,pageviews,clicks,engaged,device")
      .gte("day_key", weekStart),
    db
      .from("dv_traffic_events")
      .select("path,kind,created_at")
      .eq("kind", "pageview")
      .gte("created_at", `${today}T00:00:00+03:00`)
      .limit(5000),
  ]);

  const sessions = (weekRes.data || []) as Array<{
    session_id: string;
    visitor_key: string;
    day_key: string;
    pageviews: number;
    clicks: number;
    engaged: boolean;
    device: TrafficDevice;
  }>;

  const todaySessions = sessions.filter((s) => s.day_key === today);
  const yesterdaySessions = sessions.filter((s) => s.day_key === yesterday);

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const day = dayOffset(today, i - 6);
    const rows = sessions.filter((s) => s.day_key === day);
    return {
      day,
      visitors: new Set(rows.map((s) => s.visitor_key)).size,
      pageviews: rows.reduce((n, s) => n + (s.pageviews || 0), 0),
      clicks: rows.reduce((n, s) => n + (s.clicks || 0), 0),
    };
  });

  const pathCounts = new Map<string, number>();
  for (const e of eventsRes.data || []) {
    const p = String((e as { path?: string }).path || "/");
    pathCounts.set(p, (pathCounts.get(p) || 0) + 1);
  }
  const topPaths = [...pathCounts.entries()]
    .map(([p, views]) => ({ path: p, views }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 8);

  const devices = { mobile: 0, desktop: 0, other: 0 };
  for (const s of todaySessions) {
    if (s.device === "mobile" || s.device === "desktop") devices[s.device] += 1;
    else devices.other += 1;
  }

  return {
    liveNow: new Set((liveRes.data || []).map((r) => String((r as { session_id: string }).session_id))).size,
    todayVisitors: new Set(todaySessions.map((s) => s.visitor_key)).size,
    todaySessions: todaySessions.length,
    todayPageviews: todaySessions.reduce((n, s) => n + (s.pageviews || 0), 0),
    todayClicks: todaySessions.reduce((n, s) => n + (s.clicks || 0), 0),
    todayEngaged: todaySessions.filter((s) => s.engaged).length,
    yesterdayVisitors: new Set(yesterdaySessions.map((s) => s.visitor_key)).size,
    last7Days,
    topPaths,
    devices,
    updatedAt: new Date().toISOString(),
  };
}

export async function trafficSummary(): Promise<TrafficSummary> {
  const empty: TrafficSummary = {
    liveNow: 0,
    todayVisitors: 0,
    todaySessions: 0,
    todayPageviews: 0,
    todayClicks: 0,
    todayEngaged: 0,
    yesterdayVisitors: 0,
    last7Days: Array.from({ length: 7 }, (_, i) => ({
      day: dayOffset(istanbulDay(), i - 6),
      visitors: 0,
      pageviews: 0,
      clicks: 0,
    })),
    topPaths: [],
    devices: { mobile: 0, desktop: 0, other: 0 },
    updatedAt: new Date().toISOString(),
  };

  try {
    const db = admin();
    if (db) return await summarizeDb(db);
    return summarizeLocal(await readLocal());
  } catch {
    try {
      return summarizeLocal(await readLocal());
    } catch {
      return empty;
    }
  }
}
