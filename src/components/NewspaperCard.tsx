import Link from "next/link";
import Icon from "./Icon";
import NewspaperCover from "./NewspaperCover";
import { localizeNewspaper } from "@/i18n/catalog";
import { lp, withLocaleQuery } from "@/i18n/locale";
import { getLocale } from "@/i18n/server";
import type { Newspaper } from "@/data/newspapers";
import { formatTL } from "@/lib/format";

export default async function NewspaperCard({
  paper: source,
  priority = false,
}: {
  paper: Newspaper;
  priority?: boolean;
}) {
  const locale = await getLocale();
  const en = locale === "en";
  const paper = localizeNewspaper(source, locale);
  const href = lp(locale, `/gazeteler/${paper.slug}`);
  return (
    <article className="ncard">
      <div className="ncard__media">
        <NewspaperCover paper={paper} priority={priority} />
        <Link href={href} className="pcard__cover-link" aria-label={en ? `View the ${paper.title} newspaper` : `${paper.title} gazetesini incele`} />
      </div>
      <div className="ncard__info">
        <h3 className="ncard__title">{paper.title}</h3>
        <div className="ncard__row">
          <p className="pcard__price">
            <strong>{formatTL(paper.price, locale)}</strong>
            <s>{formatTL(paper.compareAt, locale)}</s>
          </p>
          <Link href={href} className="btn btn--dark btn--xs" aria-label={en ? `View ${paper.title}` : `${paper.title} — incele`}>
            {en ? "View" : "İncele"} <Icon name="arrow" size={12} />
          </Link>
        </div>
        <details className="pcard__more">
          <summary>
            {en ? "Show more" : "Daha fazla göster"} <Icon name="chevron-down" size={14} />
          </summary>
          <p className="pcard__desc">{paper.eyebrow}</p>
          <Link href={withLocaleQuery(locale, `/times/sablon/${paper.slug}`)} className="btn btn--outline btn--xs">
            <Icon name="expand" size={12} /> {en ? "Preview full screen" : "Tam ekran önizle"}
          </Link>
        </details>
      </div>
    </article>
  );
}
