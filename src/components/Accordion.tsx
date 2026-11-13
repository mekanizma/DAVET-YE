"use client";

import { useId, useState } from "react";
import { useLocale } from "@/i18n/provider";
import Icon from "./Icon";

export interface AccordionItem {
  q: string;
  a: string;
  inferred?: boolean;
}

export default function Accordion({
  items,
  multiple = false,
  defaultOpen = [],
}: {
  items: AccordionItem[];
  multiple?: boolean;
  defaultOpen?: number[];
}) {
  const uid = useId();
  const locale = useLocale();
  const [open, setOpen] = useState<number[]>(defaultOpen);

  const toggle = (i: number) =>
    setOpen((cur) =>
      cur.includes(i)
        ? cur.filter((x) => x !== i)
        : multiple
          ? [...cur, i]
          : [i],
    );

  return (
    <div className="accordion">
      {items.map((it, i) => {
        const isOpen = open.includes(i);
        const bid = `${uid}-b-${i}`;
        const pid = `${uid}-p-${i}`;
        return (
          <div key={it.q} className={`accordion__item${isOpen ? " is-open" : ""}`}>
            <h3 className="accordion__h">
              <button
                id={bid}
                type="button"
                className="accordion__btn"
                aria-expanded={isOpen}
                aria-controls={pid}
                onClick={() => toggle(i)}
              >
                <span>{it.q}</span>
                <Icon name={isOpen ? "minus" : "plus"} size={18} />
              </button>
            </h3>
            <div
              id={pid}
              role="region"
              aria-labelledby={bid}
              className="accordion__panel"
              hidden={!isOpen}
            >
              <p>{it.a}</p>
              {it.inferred && (
                <p className="accordion__flag">
                  {locale === "en"
                    ? "Draft answer written for this local copy."
                    : "Yerel taslak yanıt — referansta açık hâli yakalanmadı."}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
