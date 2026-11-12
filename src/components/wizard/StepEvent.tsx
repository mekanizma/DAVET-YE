"use client";

import Icon, { type IconName } from "../Icon";
import { EVENT_DESCRIPTIONS, EVENT_LABELS, getTheme, type EventType } from "@/data/themes";
import { saveDraft, type InvitationDraft } from "@/lib/storage";
import type { Errors } from "./validate";

const ICONS: Record<EventType, IconName> = { "nisan-dugun": "ring", kina: "candle", coklu: "calendar" };
const ORDER: EventType[] = ["nisan-dugun", "coklu", "kina"];

export default function StepEvent({ draft, errors }: { draft: InvitationDraft; errors: Errors }) {
  function choose(ev: EventType) {
    const tpl = draft.template ? getTheme(draft.template) : undefined;
    saveDraft({ event: ev, template: tpl && tpl.eventTypes.includes(ev) ? draft.template : null });
  }
  return (
    <fieldset className="wz-fieldset">
      <legend className="sr-only">Etkinlik türü</legend>
      <div className="choice-grid" role="radiogroup" aria-label="Hangi özel gün için davetiye hazırlıyorsunuz?" aria-describedby={errors.event ? "ev-e" : undefined}>
        {ORDER.map((ev) => {
          const on = draft.event === ev;
          return (
            <label key={ev} className={`choice${on ? " is-on" : ""}`}>
              <input type="radio" name="event" value={ev} checked={on} onChange={() => choose(ev)} />
              <span className="choice__icon"><Icon name={ICONS[ev]} size={22} /></span>
              <span className="choice__body">
                <strong>{EVENT_LABELS[ev]}</strong>
                <small>{EVENT_DESCRIPTIONS[ev]}</small>
              </span>
              <span className="choice__tick" aria-hidden="true"><Icon name="check" size={14} /></span>
            </label>
          );
        })}
      </div>
      {errors.event && <p id="ev-e" className="field__error" role="alert">{errors.event}</p>}
    </fieldset>
  );
}
