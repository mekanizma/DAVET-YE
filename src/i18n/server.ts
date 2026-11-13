import { headers } from "next/headers";
import type { Locale } from "./locale";

/** Locale set by middleware. Server Components only. */
export async function getLocale(): Promise<Locale> {
  const h = await headers();
  return h.get("x-locale") === "en" ? "en" : "tr";
}
