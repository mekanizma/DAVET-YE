"use client";

import { useMemo, useState } from "react";
import { useCatalog } from "@/components/CatalogProvider";
import { LANGUAGES } from "@/data/pricing";
import { foldTr, formatTL } from "@/lib/format";
import { saveDraft, type InvitationDraft } from "@/lib/storage";
import type { Errors } from "./validate";

const MAX_EXTRA = 10;

export default function StepLanguages({ draft, errors }: { draft: InvitationDraft; errors: Errors }) {
  const lang = useCatalog().addons.find((a) => a.id === "ek-dil");
  const per = !lang || lang.active === false || lang.included ? 0 : lang.price;
  const primary = draft.languages[0] || "tr";
  const extras = draft.languages.slice(1);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const choices = useMemo(() => {
    const f = foldTr(q.trim());
    return LANGUAGES.filter((l) => l.code !== primary && (!f || foldTr(`${l.native} ${l.label}`).includes(f)));
  }, [q, primary]);

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

  const current = LANGUAGES.find((l) => l.code === primary) ?? LANGUAGES[0];

  return (
    <div className="lang-step">
      <section>
        <h2>Ana dil</h2>
        <p>Ücretsiz. Davetiye ilk açıldığında bu dilde görünür.</p>
        <label className="lang-select">
          <span className="sr-only">Ana dil</span>
          <select value={primary} onChange={(e) => setPrimary(e.target.value)}>
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>{l.flag} {l.native}</option>
            ))}
          </select>
          <span className="lang-select__face" aria-hidden="true">{current.flag} {current.native}</span>
        </label>
      </section>

      <section>
        <div className="lang-step__head">
          <div>
            <h2>Ek diller</h2>
            <p>Dil başına {per === 0 ? "ücretsiz" : formatTL(per)}. Misafirleriniz davetiyede dil seçebilir.</p>
          </div>
          <span className="lang-step__count">{extras.length} / {MAX_EXTRA} seçildi</span>
        </div>
        <button
          type="button"
          className="lang-select lang-select--btn"
          aria-expanded={open}
          aria-controls="extra-langs"
          onClick={() => setOpen((v) => !v)}
        >
          {extras.length
            ? extras.map((c) => LANGUAGES.find((l) => l.code === c)?.native || c).join(", ")
            : "Ek dil seçin (isteğe bağlı)"}
        </button>
        {open && (
          <div id="extra-langs" className="lang-pop">
            <input
              type="search"
              className="input"
              placeholder="Dil ara…"
              aria-label="Dil ara…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <ul role="listbox" aria-label="Ek diller">
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
                      <b className="num">{per === 0 ? "Ücretsiz" : `+${formatTL(per)}`}</b>
                    </label>
                  </li>
                );
              })}
            </ul>
            <button type="button" className="btn btn--dark btn--sm" onClick={() => setOpen(false)}>Tamam</button>
          </div>
        )}
      </section>

      <div className="lang-warn" role="note">
        <strong>Her dilde her metni yazmanız gerekecek</strong>
        <p>
          Eklediğiniz her dil için isimlerden programa, davet metninden mekân adına kadar doldurduğunuz bütün metinleri o dilde de yazmalısınız. Tarih, saat, telefon ve harita gibi bilgiler tüm dillerde ortaktır.
        </p>
      </div>
      {errors.languages && <p className="field__error" role="alert">{errors.languages}</p>}
    </div>
  );
}
