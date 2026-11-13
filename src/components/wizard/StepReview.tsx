"use client";

import Link from "next/link";
import { getTheme } from "@/data/themes";
import { themeTitle } from "@/i18n/catalog";
import { lp, withLocaleQuery } from "@/i18n/locale";
import { marketing } from "@/i18n/marketing";
import { languageLabel } from "@/i18n/product";
import { useLocale } from "@/i18n/provider";
import { longDate } from "@/lib/format";
import { saveDraft, type InvitationDraft } from "@/lib/storage";
import { gapSentence, infoFieldLabel, infoIssues, type Errors } from "./validate";

export default function StepReview({ draft, errors }: { draft: InvitationDraft; errors: Errors }) {
  const locale = useLocale();
  const en = locale === "en";
  const theme = draft.template ? getTheme(draft.template) : undefined;
  const i = draft.info;
  const gaps = Object.entries(infoIssues(draft, locale));
  function fmtDate(d: string, t: string) {
    if (!d) return "—";
    const [y, m, day] = d.split("-").map(Number);
    return `${longDate(new Date(y, m - 1, day), locale)}${t ? `, ${t}` : ""}`;
  }
  const rows: { id: string; label: string; value: string }[] = [
    { id: "event", label: en ? "Event" : "Etkinlik", value: draft.event ? marketing(locale).events[draft.event] : "—" },
    { id: "template", label: en ? "Invitation" : "Davetiye", value: theme ? themeTitle(theme, locale) : "—" },
    { id: "languages", label: en ? "Languages" : "Diller", value: draft.languages.map((c) => languageLabel(c, locale)).join(", ") },
    { id: "names", label: en ? "Names" : "İsimler", value: `${i.partnerA || "—"} & ${i.partnerB || "—"}` },
    { id: "bride", label: en ? "Bride’s family" : "Gelin ailesi", value: i.brideFamily || "—" },
    { id: "groom", label: en ? "Groom’s family" : "Damat ailesi", value: i.groomFamily || "—" },
    { id: "date", label: en ? "Date" : "Tarih", value: fmtDate(i.date, i.time) },
    ...(draft.event === "coklu" ? [{ id: "kina", label: en ? "Henna night" : "Kına gecesi", value: fmtDate(i.kinaDate, i.kinaTime) }] : []),
    { id: "venue", label: en ? "Venue" : "Mekân", value: [i.venue, i.address].filter(Boolean).join(" — ") || "—" },
    { id: "message", label: en ? "Message" : "Mesaj", value: i.message || "—" },
    { id: "story", label: en ? "Story" : "Hikâye", value: i.story || "—" },
    {
      id: "program",
      label: en ? "Order of the day" : "Program",
      value: draft.program.filter((p) => p.time.trim() || p.title.trim()).length
        ? draft.program
            .filter((p) => p.time.trim() || p.title.trim())
            .map((p) => `${p.time} ${p.title}`.trim())
            .join(" · ")
        : "—",
    },
    ...(i.iban.trim()
      ? [{ id: "gift", label: en ? "Gift account" : "Hediye hesabı", value: [i.ibanHolder, i.iban].filter(Boolean).join(" · ") }]
      : []),
  ];
  return (
    <div className="wz-review">
      {gaps.length > 0 && (
        <div className="alert alert--error wz-gaps" role="alert">
          <p>{gapSentence(gaps.length, locale)}</p>
          <ul>
            {gaps.map(([key, message]) => {
              const href = `${lp(locale, "/davetiye-olustur/bilgiler")}?alan=${encodeURIComponent(key)}#alan-${key}`;
              return (
                <li key={key}>
                  <Link href={href} scroll={false}>
                    <b>{infoFieldLabel(key, locale)}</b>
                    <span>{message}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      <dl className="review-list">
        {rows.map((row) => (
          <div key={row.id}>
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>

      {theme && (
        <div className="review-preview">
          <p className="wz-h">{en ? "Live preview" : "Canlı önizleme"}</p>
          <div className="review-phone">
            <iframe
              title={en ? "Invitation preview" : "Davetiye önizlemesi"}
              src={withLocaleQuery(locale, `/onizleme/tema/${theme.slug}?embed=1&taslak=1${draft.event === "coklu" ? "&mod=kina-dugun" : ""}`)}
              loading="lazy"
            />
          </div>
          <Link className="btn btn--outline btn--sm" href={withLocaleQuery(locale, `/onizleme/tema/${theme.slug}?taslak=1`)} target="_blank" rel="noopener noreferrer">
            {en ? "Open full screen" : "Tam ekran aç"}
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
            {en ? (
              <>
                I have read and accept the <Link href={lp(locale, "/kosullar")} target="_blank">terms of use</Link>, the{" "}
                <Link href={lp(locale, "/gizlilik")} target="_blank">privacy policy</Link>, and the{" "}
                <Link href={lp(locale, "/kvkk")} target="_blank">data protection notice</Link>.
              </>
            ) : (
              <>
                <Link href={lp(locale, "/kosullar")} target="_blank">Kullanım koşullarını</Link>,{" "}
                <Link href={lp(locale, "/gizlilik")} target="_blank">gizlilik politikasını</Link> ve{" "}
                <Link href={lp(locale, "/kvkk")} target="_blank">KVKK aydınlatma metnini</Link> okudum, kabul ediyorum.
              </>
            )}
          </span>
        </label>
        {errors.terms && <p id="terms-e" className="field__error" role="alert">{errors.terms}</p>}
      </div>
    </div>
  );
}
