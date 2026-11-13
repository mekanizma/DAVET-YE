"use client";

import { useMemo, useState } from "react";
import { useCatalog } from "@/components/CatalogProvider";
import { languagesFor } from "@/i18n/product";
import { marketing } from "@/i18n/marketing";
import { useLocale } from "@/i18n/provider";
import { foldTr, formatTL } from "@/lib/format";
import { saveDraft, type InvitationDraft } from "@/lib/storage";
import type { Errors } from "./validate";

const MAX_EXTRA = 10;

export default function StepLanguages({ draft, errors }: { draft: InvitationDraft; errors: Errors }) {
  const locale = useLocale();
  const en = locale === "en";
  const copy = marketing(locale);
  const languages = languagesFor(locale);
  const lang = useCatalog().addons.find((a) => a.id === "ek-dil");
  const per = !lang || lang.active === false || lang.included ? 0 : lang.price;
  const price = formatTL(per, locale);
  const primary = draft.languages[0] || "tr";
  const extras = draft.languages.slice(1);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const choices = useMemo(() => {
    const f = foldTr(q.trim());
    return languages.filter((l) => l.code !== primary && (!f || foldTr(`${l.native} ${l.label}`).includes(f)));
  }, [q, primary, languages]);

  function setPrimary(code: string) {
    const rest = extras.filter((c) => c !== code);
    saveDraft({ languages: [code, ...rest] });
  }
  function toggleExtra(code: string) {
    const has = extras.includes(code);
    if (!has && extras.length >= MAX_EXTRA) return;
    const rest = has ? extras.filter((c) => c !== code) : [...extras, code];
    saveDraft({ languages: [primary, ...rest] });
  }

  const current = languages.find((l) => l.code === primary) ?? languages[0];
  const included = en ? "Included" : "Dahil";

  return (
    <div className="lang-step">
      <section>
        <h2>{en ? "Main language" : "Ana dil"}</h2>
        <p>
          {primary === "tr"
            ? (en ? `${included}. The invitation opens in this language.` : `${included}. Davetiye ilk açıldığında bu dilde görünür.`)
            : (en ? `${copy.free}. The invitation opens in this language.` : `${copy.free}. Davetiye ilk açıldığında bu dilde görünür.`)}
        </p>
        <label className="lang-select">
          <span className="sr-only">{en ? "Main language" : "Ana dil"}</span>
          <select value={primary} onChange={(e) => setPrimary(e.target.value)}>
            {languages.map((l) => (
              <option key={l.code} value={l.code}>
                {l.flag} {l.native}{l.code === "tr" ? ` · ${included}` : ""}
              </option>
            ))}
          </select>
          <span className="lang-select__face" aria-hidden="true">{current.flag} {current.native}{current.code === "tr" ? ` · ${included}` : ""}</span>
        </label>
      </section>

      <section>
        <div className="lang-step__head">
          <div>
            <h2>{en ? "Extra languages" : "Ek diller"}</h2>
            <p>
              {per === 0
                ? (en ? `${copy.free}. Guests can choose a language on the invitation.` : `${copy.free}. Misafirleriniz davetiyede dil seçebilir.`)
                : (en ? `${price} per language. Guests can choose a language on the invitation.` : `Dil başına ${price}. Misafirleriniz davetiyede dil seçebilir.`)}
            </p>
          </div>
          <span className="lang-step__count">{en ? `${extras.length} of ${MAX_EXTRA} selected` : `${extras.length} / ${MAX_EXTRA} seçildi`}</span>
        </div>
        <button
          type="button"
          className="lang-select lang-select--btn"
          aria-expanded={open}
          aria-controls="extra-langs"
          onClick={() => setOpen((v) => !v)}
        >
          {extras.length
            ? extras.map((c) => languages.find((l) => l.code === c)?.native || c).join(", ")
            : (en ? "Choose extra languages (optional)" : "Ek dil seçin (isteğe bağlı)")}
        </button>
        {open && (
          <div id="extra-langs" className="lang-pop">
            <input
              type="search"
              className="input"
              placeholder={en ? "Search languages…" : "Dil ara…"}
              aria-label={en ? "Search languages…" : "Dil ara…"}
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <ul role="listbox" aria-label={en ? "Extra languages" : "Ek diller"}>
              {choices.map((l) => {
                const on = extras.includes(l.code);
                return (
                  <li key={l.code}>
                    <label>
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() => toggleExtra(l.code)}
                        disabled={!on && extras.length >= MAX_EXTRA}
                      />
                      <span>{l.flag} {l.native} <small>{l.label}</small></span>
                      <b className="num">{per === 0 ? copy.free : `+${price}`}</b>
                    </label>
                  </li>
                );
              })}
            </ul>
            <button type="button" className="btn btn--dark btn--sm" onClick={() => setOpen(false)}>{en ? "Done" : "Tamam"}</button>
          </div>
        )}
      </section>

      <div className="lang-warn" role="note">
        <strong>{en ? "You will need to write every text in each language" : "Her dilde her metni yazmanız gerekecek"}</strong>
        <p>
          {en
            ? "For every language you add, you also need to write every text you fill in, from the names to the order of the day, and from the invitation line to the venue name. The date, time, phone number, and map are shared across languages."
            : "Eklediğiniz her dil için isimlerden programa, davet metninden mekân adına kadar doldurduğunuz bütün metinleri o dilde de yazmalısınız. Tarih, saat, telefon ve harita gibi bilgiler tüm dillerde ortaktır."}
        </p>
      </div>
      {errors.languages && <p className="field__error" role="alert">{errors.languages}</p>}
    </div>
  );
}
