import { NextResponse } from "next/server";
import { clearEtsyCookie } from "@/lib/etsySession";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  clearEtsyCookie(res);
  return res;
}
