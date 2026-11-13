"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import TimesReader from "@/components/TimesReader";
import Icon from "@/components/Icon";
import { getNewspaper } from "@/data/newspapers";
import { lp } from "@/i18n/locale";
import { useLocale } from "@/i18n/provider";
import { EMPTY_NEWSPAPER_DRAFT, normalizeNewspaperDraft } from "@/lib/newspaperDraft";
import { getLocalJson, NEWSPAPER_DRAFT, type NewspaperDraft } from "@/lib/storage";
import type { TimesReaderData } from "@/lib/times";
import { legacyDraftToTimesValues } from "@/lib/timesFields";
import { applyTimesDraft } from "@/lib/timesPages";

export default function EtsyPrint({ slug }: { slug?: string }) {
  const locale = useLocale();
  const en = locale === "en";
  const [draft, setDraft] = useState<NewspaperDraft | null>(null);
  const [design, setDesign] = useState<TimesReaderData | null>(null);
  const [err, setErr] = useState("");
  const [sessionOk, setSessionOk] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/etsy/oturum")
      .then((r) => r.json())
      .then((d) => setSessionOk(Boolean(d?.ok)))
      .catch(() => setSessionOk(false));
  }, []);

  useEffect(() => {
    const saved = normalizeNewspaperDraft(getLocalJson(NEWSPAPER_DRAFT, EMPTY_NEWSPAPER_DRAFT));
    setDraft(saved);
  }, []);

  const paperSlug = slug || draft?.template || "";

  useEffect(() => {
    if (!paperSlug || !getNewspaper(paperSlug)) return;
    let stop = false;
    fetch(`/api/times/${encodeURIComponent(paperSlug)}${en ? "?dil=en" : ""}`)
      .then(async (r) => {
        if (!r.ok) throw new Error(en ? "Template could not be loaded." : "Şablon yüklenemedi.");
        return r.json() as Promise<TimesReaderData>;
      })
      .then((data) => {
        if (!stop) setDesign(data);
      })
      .catch((e: Error) => {
        if (!stop) setErr(e.message);
      });
    return () => {
      stop = true;
    };
  }, [paperSlug, en]);

  const preview = useMemo(() => {
    if (!design || !draft) return null;
    const values = { ...legacyDraftToTimesValues(draft), ...(draft.values || {}) };
    const contents = { ...(draft.contents || {}) };
    return applyTimesDraft(design, { values, contents }, { embedded: false });
  }, [design, draft]);

  function collectSheets() {
    const sheets = Array.from(document.querySelectorAll<HTMLElement>(".etsy-print__stage .tr-sheet"));
    const unique = new Map<string, HTMLElement>();
    for (const sheet of sheets) {
      const key = sheet.dataset.page || String(unique.size + 1);
      if (!unique.has(key)) unique.set(key, sheet);
    }
    return [...unique.entries()].sort((a, b) => Number(a[0]) - Number(b[0]));
  }

  async function doPrint() {
    let ordered = collectSheets();
    if (!ordered.length) {
      const opener = Array.from(document.querySelectorAll<HTMLButtonElement>(".etsy-print__stage button")).find((button) =>
        /read the newspaper|gazeteyi oku/i.test(button.textContent || ""),
      );
      opener?.click();
      await new Promise((resolve) => window.setTimeout(resolve, 600));
      ordered = collectSheets();
    }
    if (!ordered.length) {
      window.alert(en ? "The newspaper is still loading. Wait a moment, then try again." : "Gazete henüz yüklenmedi. Biraz bekleyip yeniden deneyin.");
      return;
    }
    let stack = document.getElementById("etsy-sheet-stack");
    if (!stack) {
      stack = document.createElement("div");
      stack.id = "etsy-sheet-stack";
      stack.className = "etsy-sheet-stack";
      document.body.appendChild(stack);
    }
    stack.replaceChildren();
    for (const [, sheet] of ordered) {
      const page = document.createElement("section");
      page.className = "etsy-sheet-stack__page";
      page.appendChild(sheet.cloneNode(true));
      stack.appendChild(page);
    }
    document.body.classList.add("etsy-printing");
    const cleanup = () => {
      document.body.classList.remove("etsy-printing");
      stack?.replaceChildren();
      window.removeEventListener("afterprint", cleanup);
    };
    window.addEventListener("afterprint", cleanup);
    window.print();
  }

  if (sessionOk === false) {
    return (
      <div className="etsy-print etsy-print--msg">
        <p>{en ? "Sign in with your Etsy code first." : "Önce Etsy kodunuzla giriş yapın."}</p>
        <Link href={lp(locale, "/etsy")} className="btn btn--dark">
          {en ? "Enter code" : "Kod gir"}
        </Link>
      </div>
    );
  }

  if (err) {
    return (
      <div className="etsy-print etsy-print--msg">
        <p role="alert">{err}</p>
        <Link href={lp(locale, "/etsy/tasarla")} className="btn btn--outline">
          {en ? "Back to studio" : "Stüdyoya dön"}
        </Link>
      </div>
    );
  }

  if (!preview) {
    return (
      <div className="etsy-print etsy-print--msg">
        <p role="status">{en ? "Preparing your newspaper…" : "Gazeteniz hazırlanıyor…"}</p>
      </div>
    );
  }

  return (
    <div className="etsy-print">
      <header className="etsy-print__bar no-print">
        <Link href={lp(locale, "/etsy/tasarla")} className="btn btn--ghost btn--sm">
          {en ? "Back to studio" : "Stüdyoya dön"}
        </Link>
        <button type="button" className="btn btn--dark btn--sm" onClick={doPrint}>
          <Icon name="download" size={14} />
          {en ? "Print / Save PDF" : "Yazdır / PDF kaydet"}
        </button>
      </header>
      <p className="etsy-print__hint no-print">
        {en
          ? "In the print dialog choose “Save as PDF” for a digital file, or your printer for paper."
          : "Yazdır penceresinde “PDF olarak kaydet” veya yazıcınızı seçin."}
      </p>
      <div className="etsy-print__stage">
        <TimesReader data={preview} slug={paperSlug} embedded />
      </div>
    </div>
  );
}
