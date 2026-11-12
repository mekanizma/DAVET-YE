"use client";

import Link from "next/link";
import { LANGUAGES } from "@/data/pricing";
import { EVENT_LABELS, getTheme } from "@/data/themes";
import { longDate } from "@/lib/format";
import { saveDraft, type InvitationDraft } from "@/lib/storage";
import { INFO_FIELDS, infoIssues, type Errors } from "./validate";

function fmtDate(d: string, t: string) {
  if (!d) return "—";
  const [y, m, day] = d.split("-").map(Number);
  return `${longDate(new Date(y, m - 1, day))}${t ? `, ${t}` : ""}`;
}

export default function StepReview({ draft, errors }: { draft: InvitationDraft; errors: Errors }) {
  const theme = draft.template ? getTheme(draft.template) : undefined;
  const i = draft.info;
  const gaps = Object.entries(infoIssues(draft));
  const rows: [string, string][] = [
    ["Etkinlik", draft.event ? EVENT_LABELS[draft.event] : "—"],
    ["Davetiye", theme?.title ?? "—"],
    ["Diller", draft.languages.map((c) => LANGUAGES.find((l) => l.code === c)?.label ?? c).join(", ")],
    ["İsimler", `${i.partnerA || "—"} & ${i.partnerB || "—"}`],
    ["Gelin ailesi", i.brideFamily || "—"],
    ["Damat ailesi", i.groomFamily || "—"],
    ["Tarih", fmtDate(i.date, i.time)],
    ...(draft.event === "coklu" ? ([["Kına gecesi", fmtDate(i.kinaDate, i.kinaTime)]] as [string, string][]) : []),
    ["Mekân", [i.venue, i.address].filter(Boolean).join(" — ") || "—"],
    ["Mesaj", i.message || "—"],
    ["Hikâye", i.story || "—"],
    [
      "Program",
      draft.program.filter((p) => p.time.trim() || p.title.trim()).length
        ? draft.program
            .filter((p) => p.time.trim() || p.title.trim())
            .map((p) => `${p.time} ${p.title}`.trim())
            .join(" · ")
        : "—",
    ],
    ...(i.iban.trim()
      ? ([["Hediye hesabı", [i.ibanHolder, i.iban].filter(Boolean).join(" · ")]] as [string, string][])
      : []),
  ];
  return (
    <div className="wz-review">
      {gaps.length > 0 && (
        <div className="alert alert--error wz-gaps" role="alert">
          <p>Ödemeden önce {gaps.length} eksik bilgi tamamlanmalı.</p>
          <ul>
            {gaps.map(([key, message]) => {
              const field = INFO_FIELDS[key];
              const href = `/tr/davetiye-olustur/bilgiler?alan=${encodeURIComponent(key)}#alan-${key}`;
              return (
                <li key={key}>
                  <Link href={href} scroll={false}>
                    <b>{field?.label ?? "Eksik alan"}</b>
                    <span>{message}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      <dl className="review-list">
        {rows.map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>

      {theme && (
        <div className="review-preview">
          <p className="wz-h">Canlı önizleme</p>
          <div className="review-phone">
            <iframe
              title="Davetiye önizlemesi"
              src={`/onizleme/tema/${theme.slug}?embed=1&taslak=1${draft.event === "coklu" ? "&mod=kina-dugun" : ""}`}
              loading="lazy"
            />
          </div>
          <Link className="btn btn--outline btn--sm" href={`/onizleme/tema/${theme.slug}?taslak=1`} target="_blank" rel="noopener noreferrer">
            Tam ekran aç
          </Link>
        </div>
      )}

      <div className="field">
        <label className="check">
          <input
            type="checkbox"
            checked={draft.termsAccepted}
            onChange={(e) => saveDraft({ termsAccepted: e.target.checked })}
            aria-invalid={errors.terms ? true : undefined}
            aria-describedby={errors.terms ? "terms-e" : undefined}
          />
          <span>
            <Link href="/tr/kosullar" target="_blank">Kullanım koşullarını</Link>,{" "}
            <Link href="/tr/gizlilik" target="_blank">gizlilik politikasını</Link> ve{" "}
            <Link href="/tr/kvkk" target="_blank">KVKK aydınlatma metnini</Link> okudum, kabul ediyorum.
          </span>
        </label>
        {errors.terms && <p id="terms-e" className="field__error" role="alert">{errors.terms}</p>}
      </div>
    </div>
  );
}
