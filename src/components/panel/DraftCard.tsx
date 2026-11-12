"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Icon from "../Icon";
import { getTheme } from "@/data/themes";
import { newspapers } from "@/data/newspapers";
import { normalizeNewspaperDraft, EMPTY_NEWSPAPER_DRAFT } from "@/lib/newspaperDraft";
import {
  clearDraft,
  NEWSPAPER_DRAFT,
  removeLocal,
  useDraft,
  useLocalJson,
  type NewspaperDraft,
} from "@/lib/storage";

function paperStarted(draft: NewspaperDraft) {
  if (draft.orderCode) return true;
  if (draft.headline.trim() || draft.partnerA.trim() || draft.partnerB.trim() || draft.names.trim()) return true;
  if (draft.photos.cover || draft.photos.collage.some((src) => src.trim())) return true;
  return false;
}

export default function DraftCard({ hideEmpty = false }: { hideEmpty?: boolean }) {
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

  if (!ready) return <p className="wz-loading" role="status">Yükleniyor…</p>;

  const theme = draft.template ? getTheme(draft.template) : undefined;
  const showInvite = !inviteApproved && !!(draft.event || theme || draft.info.partnerA || draft.order);
  const showPaper = !paperApproved && paperStarted(newspaper);
  const paperTitle = newspapers.find((item) => item.slug === newspaper.template)?.title || "Gazete";

  if (!showInvite && !showPaper) {
    if (hideEmpty) return null;
    return (
      <section className="dash__card" aria-labelledby="d-draft">
        <h2 id="d-draft">Taslaklar</h2>
        <p>Yarım kalan bir tasarım yok. Başladığınız davetiye veya gazete burada taslak olarak durur.</p>
        <div className="dash__row">
          <Link href="/tr/temalar" className="btn btn--dark btn--sm">Davetiye seç</Link>
          <Link href="/tr/gazeteler" className="btn btn--outline btn--sm">Gazete seç</Link>
        </div>
      </section>
    );
  }

  return (
    <>
      {showInvite && (
        <section className="dash__card" aria-labelledby="d-draft">
          <h2 id="d-draft">Taslak davetiye</h2>
          <p>
            <span className="pill pill--draft">Taslak</span>{" "}
            {theme?.title ?? "Şablon seçilmedi"}
            {draft.info.partnerA && ` · ${draft.info.partnerA} & ${draft.info.partnerB || "…"}`}
          </p>
          <div className="dash__row">
            <Link href="/tr/davetiye-olustur/etkinlik" className="btn btn--dark btn--sm">Devam et</Link>
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => { if (window.confirm("Taslak silinsin mi?")) clearDraft(); }}>
              <Icon name="trash" size={14} /> Sil
            </button>
          </div>
        </section>
      )}
      {showPaper && (
        <section className="dash__card" aria-labelledby="d-paper">
          <h2 id="d-paper">Taslak gazete</h2>
          <p>
            <span className="pill pill--draft">Taslak</span>{" "}
            {paperTitle}
            {(newspaper.names || newspaper.partnerA) && ` · ${newspaper.names || [newspaper.partnerA, newspaper.partnerB].filter(Boolean).join(" & ")}`}
          </p>
          <div className="dash__row">
            <Link href="/tr/gazete-tasarla" className="btn btn--dark btn--sm">Devam et</Link>
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => { if (window.confirm("Gazete taslağı silinsin mi?")) removeLocal(NEWSPAPER_DRAFT); }}
            >
              <Icon name="trash" size={14} /> Sil
            </button>
          </div>
        </section>
      )}
    </>
  );
}
