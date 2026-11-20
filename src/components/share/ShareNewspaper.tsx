"use client";

import { useEffect, useMemo, useState } from "react";
import TimesReader from "@/components/TimesReader";
import type { Locale } from "@/i18n/locale";
import type { TimesReaderData } from "@/lib/times";
import { applyTimesDraft } from "@/lib/timesPages";

export default function ShareNewspaper({
  template,
  locale,
  design,
}: {
  template: string;
  locale: Locale;
  design: Record<string, unknown>;
}) {
  const [data, setData] = useState<TimesReaderData | null>(null);
  const [failed, setFailed] = useState(false);
  const en = locale === "en";

  useEffect(() => {
    let stop = false;
    fetch(`/api/times/${encodeURIComponent(template)}${en ? "?dil=en" : ""}`)
      .then((res) => {
        if (!res.ok) throw new Error("missing");
        return res.json() as Promise<TimesReaderData>;
      })
      .then((next) => {
        if (!stop) setData(next);
      })
      .catch(() => {
        if (!stop) setFailed(true);
      });
    return () => {
      stop = true;
    };
  }, [template, en]);

  const values = design.values && typeof design.values === "object" ? design.values as Record<string, string> : {};
  const contents = design.contents && typeof design.contents === "object" ? design.contents as Record<string, string> : {};
  const pageCount = typeof design.pageCount === "number" ? design.pageCount : 0;
  const extras = Array.isArray(design.extras) ? design.extras : [];
  const layout =
    design.layout && typeof design.layout === "object" && !Array.isArray(design.layout)
      ? (design.layout as Record<string, { x: number; y: number; w?: number; h?: number }>)
      : {};
  const preview = useMemo(
    () =>
      data
        ? applyTimesDraft(
            data,
            {
              values,
              contents,
              pageCount,
              extras: extras as import("@/lib/newspaperExtras").NewspaperExtra[],
              layout,
            },
            { embedded: false },
          )
        : null,
    [data, values, contents, pageCount, extras, layout],
  );

  if (failed) {
    return <p className="share-note">{en ? "This newspaper could not be opened." : "Bu gazete açılamadı."}</p>;
  }
  if (!preview) {
    return <p className="share-note" role="status">{en ? "Opening the newspaper…" : "Gazete açılıyor…"}</p>;
  }
  return (
    <div className="share-paper">
      <TimesReader data={preview} slug={template} />
    </div>
  );
}
