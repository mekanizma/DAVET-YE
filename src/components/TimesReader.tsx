"use client";

import { useEffect, useMemo, useRef } from "react";
import { getNewspaper } from "@/data/newspapers";
import { localizeNewspaper } from "@/i18n/catalog";
import { useLocale } from "@/i18n/provider";
import type { TimesReaderData } from "@/lib/times";
import { patchTimesDataForSkin, timesSkinFor } from "@/lib/timesSkins";

type TimesApi = {
  mount: (el: HTMLElement | null, data: TimesReaderData) => unknown;
  destroy: () => void;
};

declare global {
  interface Window {
    DavetanisiTimes?: TimesApi;
  }
}

function ensureStylesheet(href: string, marker: string) {
  let link = document.head.querySelector<HTMLLinkElement>(`link[${marker}]`);
  if (link) return link;
  link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  link.setAttribute(marker, "1");
  document.head.appendChild(link);
  return link;
}

const READER_EN: Record<string, string> = {
  read: "Read the newspaper",
  fullscreen: "Full screen",
  exitFullscreen: "Exit full screen",
  share: "Share",
  copyLink: "Copy link",
  linkCopied: "Link copied",
  whatsapp: "WhatsApp",
  facebook: "Facebook",
  x: "X",
  telegram: "Telegram",
  email: "Email",
  nativeShare: "Share…",
  close: "Close",
  next: "Next page",
  prev: "Previous page",
  zoomIn: "Zoom in",
  zoomOut: "Zoom out",
  fit: "Fit to page",
  pageOf: "{0} / {1}",
  pagesOf: "{0}–{1} / {2}",
  backToCover: "Back to the cover",
  preview: "Preview",
  shareText: "Read the {0} newspaper:",
  tapToRead: "You can also open it by tapping the cover.",
  readHint: "Newspaper controls",
  edition: "Special edition",
  soundOn: "Turn page sounds on",
  soundOff: "Turn page sounds off",
  openFull: "Open the full-screen preview",
};

function englishReader(data: TimesReaderData, slug: string): TimesReaderData {
  const paper = getNewspaper(slug);
  const named = paper ? localizeNewspaper(paper, "en") : null;
  const payload = data.payload;
  let nextPayload = payload;
  if (payload && typeof payload === "object") {
    const record: Record<string, unknown> = { ...payload, locale: "en" };
    const design = record.design;
    if (design && typeof design === "object") {
      const designRecord = { ...(design as Record<string, unknown>) };
      const intro = designRecord.intro;
      if (intro && typeof intro === "object") {
        const introRecord = { ...(intro as Record<string, unknown>) };
        const skip = introRecord.skipLabel;
        if (skip == null || skip === "" || skip === "Geç") introRecord.skipLabel = "Skip";
        designRecord.intro = introRecord;
      }
      record.design = designRecord;
    }
    nextPayload = record;
  }
  return {
    ...data,
    title: named?.title || data.title,
    strings: { ...(data.strings || {}), ...READER_EN },
    payload: nextPayload,
  };
}

/**
 * Hosts the times-reader with Davetanisi chrome skins (background + fonts)
 * that differ from the original Go Post desk look — unique per newspaper.
 */
export default function TimesReader({
  data,
  slug,
  embedded = false,
}: {
  data: TimesReaderData;
  slug: string;
  /** Panel / builder side preview — do not lock page chrome to fullscreen desk. */
  embedded?: boolean;
}) {
  const locale = useLocale();
  const rootRef = useRef<HTMLDivElement>(null);
  const skin = useMemo(() => timesSkinFor(slug), [slug]);
  const localized = useMemo(() => {
    if (locale !== "en") return data;
    return englishReader(data, slug);
  }, [data, locale, slug]);
  const patched = useMemo(() => patchTimesDataForSkin(localized, slug), [localized, slug]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    if (!embedded) {
      document.documentElement.classList.add("tr-html");
      document.body.classList.add("tr-body");
    }

    const baseCss = ensureStylesheet("/assets/times-reader.css?v=3", "data-times-reader-css");
    const skinCss = ensureStylesheet("/assets/times-reader-skin.css?v=4", "data-times-reader-skin");

    root.dataset.skin = skin.id;
    root.dataset.embedded = embedded ? "1" : "0";
    root.style.setProperty("--tr-skin-bg", skin.background);
    root.style.setProperty("--tr-scene", skin.sceneColor);
    root.style.setProperty("--tr-accent", skin.accent);
    root.style.setProperty("--tr-ink", skin.ink);
    root.style.setProperty("--tr-muted", skin.muted);
    root.style.setProperty("--tr-brand-font", skin.brandFont);
    root.style.setProperty("--tr-title-font", skin.titleFont);
    root.style.setProperty("--tr-ui-font", skin.uiFont);

    let cancelled = false;

    const applyChromeVars = () => {
      if (cancelled || !rootRef.current) return;
      const el = rootRef.current;
      el.dataset.skin = skin.id;
      el.dataset.embedded = embedded ? "1" : "0";
      el.style.setProperty("--tr-skin-bg", skin.background);
      el.style.setProperty("--tr-accent", skin.accent);
      el.style.setProperty("--tr-ink", skin.ink);
      el.style.setProperty("--tr-muted", skin.muted);
      el.style.setProperty("--tr-brand-font", skin.brandFont);
      el.style.setProperty("--tr-title-font", skin.titleFont);
      el.style.setProperty("--tr-ui-font", skin.uiFont);
      el.style.setProperty("--tr-scene", skin.sceneColor);
    };

    const mount = () => {
      if (cancelled) return;
      const run = () => {
        window.DavetanisiTimes?.mount(root, patched as TimesReaderData);
        applyChromeVars();
        requestAnimationFrame(applyChromeVars);
      };
      if (window.DavetanisiTimes?.mount) {
        run();
        return;
      }
      void import(/* webpackIgnore: true */ "/assets/times-reader.js?v=5" as string)
        .then(() => {
          if (cancelled) return;
          run();
        })
        .catch((err) => console.error("times-reader yüklenemedi", err));
    };

    mount();
    baseCss.addEventListener("load", mount);
    skinCss.addEventListener("load", applyChromeVars);

    return () => {
      cancelled = true;
      baseCss.removeEventListener("load", mount);
      skinCss.removeEventListener("load", applyChromeVars);
      window.DavetanisiTimes?.destroy();
      if (!embedded) {
        document.documentElement.classList.remove("tr-html");
        document.body.classList.remove("tr-body");
      }
    };
  }, [patched, skin, embedded]);

  return (
    <>
      <div
        ref={rootRef}
        className={`tr${embedded ? " tr--embedded" : ""}`}
        data-times-reader=""
        data-skin={skin.id}
        data-embedded={embedded ? "1" : "0"}
      />
      <noscript>
        <p style={{ color: "#fff", padding: 24, fontFamily: "system-ui" }}>
          {locale === "en"
            ? "Turn on JavaScript in your browser to read the newspaper."
            : "Gazeteyi okumak için tarayıcınızda JavaScript'i açın."}
        </p>
      </noscript>
    </>
  );
}
