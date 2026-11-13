"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Icon from "../Icon";
import { getTheme } from "@/data/themes";
import { newspapers } from "@/data/newspapers";
import { localizeNewspaper, themeTitle } from "@/i18n/catalog";
import { lp, type Locale } from "@/i18n/locale";
import { useLocale } from "@/i18n/provider";
import { normalizeNewspaperDraft, EMPTY_NEWSPAPER_DRAFT } from "@/lib/newspaperDraft";
import {
  clearDraft,
  NEWSPAPER_DRAFT,
  removeLocal,
  useDraft,
  useLocalJson,
  type NewspaperDraft,
} from "@/lib/storage";

function tx(locale: Locale, tr: string, en: string) {
  return locale === "en" ? en : tr;
}

function paperStarted(draft: NewspaperDraft) {
  if (draft.orderCode) return true;
  if (draft.headline.trim() || draft.partnerA.trim() || draft.partnerB.trim() || draft.names.trim()) return true;
  if (draft.photos.cover || draft.photos.collage.some((src) => src.trim())) return true;
  return false;
}

export default function DraftCard({ hideEmpty = false }: { hideEmpty?: boolean }) {
  const locale = useLocale();
  const { draft, ready } = useDraft();
  const [paper] = useLocalJson(NEWSPAPER_DRAFT, EMPTY_NEWSPAPER_DRAFT);
  const newspaper = normalizeNewspaperDraft(paper);
  const [inviteApproved, setInviteApproved] = useState(false);
  const [paperApproved, setPaperApproved] = useState(false);

  useEffect(() => {
    const code = draft.order?.code;
    const email = draft.order?.email;
    if (!code || !email) {
      setInviteApproved(false);
      return;
    }
    let stop = false;
    fetch(`/api/siparis/${encodeURIComponent(code)}?email=${encodeURIComponent(email)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!stop) setInviteApproved(data?.order?.status === "onaylandi");
      })
      .catch(() => {
        if (!stop) setInviteApproved(false);
      });
    return () => {
      stop = true;
    };
  }, [draft.order?.code, draft.order?.email]);

  useEffect(() => {
    if (!newspaper.orderCode || !newspaper.orderEmail) {
      setPaperApproved(false);
      return;
    }
    let stop = false;
    fetch(`/api/siparis/${encodeURIComponent(newspaper.orderCode)}?email=${encodeURIComponent(newspaper.orderEmail)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!stop) setPaperApproved(data?.order?.status === "onaylandi");
      })
      .catch(() => {
        if (!stop) setPaperApproved(false);
      });
    return () => {
      stop = true;
    };
  }, [newspaper.orderCode, newspaper.orderEmail]);

  if (!ready) return <p className="wz-loading" role="status">{tx(locale, "Yükleniyor…", "Loading…")}</p>;

  const theme = draft.template ? getTheme(draft.template) : undefined;
  const showInvite = !inviteApproved && !!(draft.event || theme || draft.info.partnerA || draft.order);
  const showPaper = !paperApproved && paperStarted(newspaper);
  const found = newspapers.find((item) => item.slug === newspaper.template);
  const paperTitle = found ? localizeNewspaper(found, locale).title : tx(locale, "Gazete", "Newspaper");
  const inviteTitle = theme ? themeTitle(theme, locale) : tx(locale, "Şablon seçilmedi", "No template selected");

  if (!showInvite && !showPaper) {
    if (hideEmpty) return null;
    return (
      <section className="dash__card" aria-labelledby="d-draft">
        <h2 id="d-draft">{tx(locale, "Taslaklar", "Drafts")}</h2>
        <p>{tx(locale, "Yarım kalan bir tasarım yok. Başladığınız davetiye veya gazete burada taslak olarak durur.", "There is no unfinished design. An invitation or newspaper you start is kept here as a draft.")}</p>
        <div className="dash__row">
          <Link href={lp(locale, "/temalar")} className="btn btn--dark btn--sm">{tx(locale, "Davetiye seç", "Choose an invitation")}</Link>
          <Link href={lp(locale, "/gazeteler")} className="btn btn--outline btn--sm">{tx(locale, "Gazete seç", "Choose a newspaper")}</Link>
        </div>
      </section>
    );
  }

  return (
    <>
      {showInvite && (
        <section className="dash__card" aria-labelledby="d-draft">
          <h2 id="d-draft">{tx(locale, "Taslak davetiye", "Invitation draft")}</h2>
          <p>
            <span className="pill pill--draft">{tx(locale, "Taslak", "Draft")}</span>{" "}
            {inviteTitle}
            {draft.info.partnerA && ` · ${draft.info.partnerA} & ${draft.info.partnerB || "…"}`}
          </p>
          <div className="dash__row">
            <Link href={lp(locale, "/davetiye-olustur/etkinlik")} className="btn btn--dark btn--sm">{tx(locale, "Devam et", "Continue")}</Link>
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => { if (window.confirm(tx(locale, "Taslak silinsin mi?", "Delete this draft?"))) clearDraft(); }}>
              <Icon name="trash" size={14} /> {tx(locale, "Sil", "Delete")}
            </button>
          </div>
        </section>
      )}
      {showPaper && (
        <section className="dash__card" aria-labelledby="d-paper">
          <h2 id="d-paper">{tx(locale, "Taslak gazete", "Newspaper draft")}</h2>
          <p>
            <span className="pill pill--draft">{tx(locale, "Taslak", "Draft")}</span>{" "}
            {paperTitle}
            {(newspaper.names || newspaper.partnerA) && ` · ${newspaper.names || [newspaper.partnerA, newspaper.partnerB].filter(Boolean).join(" & ")}`}
          </p>
          <div className="dash__row">
            <Link href={lp(locale, "/gazete-tasarla")} className="btn btn--dark btn--sm">{tx(locale, "Devam et", "Continue")}</Link>
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => { if (window.confirm(tx(locale, "Gazete taslağı silinsin mi?", "Delete this newspaper draft?"))) removeLocal(NEWSPAPER_DRAFT); }}
            >
              <Icon name="trash" size={14} /> {tx(locale, "Sil", "Delete")}
            </button>
          </div>
        </section>
      )}
    </>
  );
}
