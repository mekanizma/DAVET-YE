import fs from "node:fs";
import path from "node:path";
import type { Locale } from "@/i18n/locale";

export type TimesReaderData = {
  payload: Record<string, unknown>;
  settings?: Record<string, unknown>;
  title?: string;
  preview?: boolean;
  embedded?: boolean;
  strings?: Record<string, string>;
  listen?: boolean;
};

export function timesDesignPath(slug: string) {
  return path.join(process.cwd(), "src/data/times", `${slug}.json`);
}

export function hasTimesDesign(slug: string) {
  if (!slug || slug.startsWith("_") || !/^[a-z0-9-]+$/i.test(slug)) return false;
  return fs.existsSync(timesDesignPath(slug));
}

export function loadTimesDesign(slug: string, locale: Locale = "tr"): TimesReaderData | null {
  const english = path.join(process.cwd(), "src/data/times/en", `${slug}.json`);
  const file = locale === "en" && fs.existsSync(english) ? english : timesDesignPath(slug);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8")) as TimesReaderData;
}
