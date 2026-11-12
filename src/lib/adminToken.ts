/** HMAC session for the admin panel. Uses Web Crypto so middleware and route handlers share it. */

const MAX_AGE_SEC = 60 * 60 * 24 * 7;

function signingSecret(): string {
  const pw = process.env.ADMIN_PASSWORD || "";
  return pw ? `${pw}:dvg-admin-v1` : "";
}

function b64url(bytes: ArrayBuffer): string {
  let bin = "";
  const arr = new Uint8Array(bytes);
  for (let i = 0; i < arr.length; i++) bin += String.fromCharCode(arr[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmac(value: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return b64url(sig);
}

function same(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function adminConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.length >= 8);
}

export async function passwordMatches(input: string): Promise<boolean> {
  const expected = process.env.ADMIN_PASSWORD || "";
  if (!expected || !input) return false;
  const enc = new TextEncoder();
  const [a, b] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(input)),
    crypto.subtle.digest("SHA-256", enc.encode(expected)),
  ]);
  const aa = new Uint8Array(a);
  const bb = new Uint8Array(b);
  let diff = 0;
  for (let i = 0; i < aa.length; i++) diff |= aa[i] ^ bb[i];
  return diff === 0;
}

export async function signAdminToken(now = Date.now()): Promise<string> {
  const secret = signingSecret();
  if (!secret) throw new Error("ADMIN_PASSWORD tanımlı değil");
  const exp = Math.floor(now / 1000) + MAX_AGE_SEC;
  const sig = await hmac(String(exp), secret);
  return `${exp}.${sig}`;
}

export async function verifyAdminToken(token: string | undefined | null): Promise<boolean> {
  const secret = signingSecret();
  if (!secret || !token) return false;
  const dot = token.indexOf(".");
  if (dot < 1) return false;
  const expRaw = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const exp = Number(expRaw);
  if (!Number.isFinite(exp) || exp < Date.now() / 1000) return false;
  const expected = await hmac(expRaw, secret);
  return same(expected, sig);
}

export const ADMIN_COOKIE = "dvg_admin";
export const ADMIN_MAX_AGE = MAX_AGE_SEC;
