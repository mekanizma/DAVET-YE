import { createHmac, timingSafeEqual } from "crypto";
import type { NextResponse } from "next/server";

export const ETSY_COOKIE = "dv_etsy";
const MAX_AGE_SEC = 60 * 60 * 24 * 30; // 30 days

export type EtsySession = {
  code: string;
  slug: string;
  title: string;
  exp: number;
};

function secret(): string {
  return process.env.SUPABASE_SERVER_SECRET || process.env.ADMIN_PASSWORD || "etsy-dev-secret";
}

function b64url(input: string | Buffer) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromB64url(input: string) {
  const pad = input.length % 4 === 0 ? "" : "=".repeat(4 - (input.length % 4));
  return Buffer.from(input.replace(/-/g, "+").replace(/_/g, "/") + pad, "base64").toString("utf8");
}

export function signEtsySession(session: Omit<EtsySession, "exp"> & { exp?: number }): string {
  const payload: EtsySession = {
    code: session.code,
    slug: session.slug,
    title: session.title,
    exp: session.exp ?? Math.floor(Date.now() / 1000) + MAX_AGE_SEC,
  };
  const body = b64url(JSON.stringify(payload));
  const sig = createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function readEtsySession(raw: string | undefined | null): EtsySession | null {
  if (!raw || !raw.includes(".")) return null;
  const [body, sig] = raw.split(".");
  if (!body || !sig) return null;
  const expected = createHmac("sha256", secret()).update(body).digest("base64url");
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  try {
    const parsed = JSON.parse(fromB64url(body)) as EtsySession;
    if (!parsed?.code || !parsed?.slug || !parsed?.exp) return null;
    if (parsed.exp * 1000 < Date.now()) return null;
    if (!/^ETSY-[A-Z0-9]{6,16}$/.test(parsed.code)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function setEtsyCookie(res: NextResponse, token: string) {
  res.cookies.set(ETSY_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SEC,
  });
}

export function clearEtsyCookie(res: NextResponse) {
  res.cookies.set(ETSY_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}
