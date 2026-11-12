import Link from "next/link";
import Icon from "./Icon";
import NewspaperCover from "./NewspaperCover";
import type { Newspaper } from "@/data/newspapers";
import { formatTL } from "@/lib/format";

export default function NewspaperCard({
  paper,
  priority = false,
}: {
  paper: Newspaper;
  priority?: boolean;
}) {
  const href = `/tr/gazeteler/${paper.slug}`;
  return (
    <article className="ncard">
      <div className="ncard__media">
        <NewspaperCover paper={paper} priority={priority} />
        <Link href={href} className="pcard__cover-link" aria-label={`${paper.title} gazetesini incele`} />
      </div>
      <div className="ncard__info">
        <h3 className="ncard__title">{paper.title}</h3>
        <div className="ncard__row">
          <p className="pcard__price">
            <strong>{formatTL(paper.price)}</strong>
            <s>{formatTL(paper.compareAt)}</s>
          </p>
          <Link href={href} className="btn btn--dark btn--xs" aria-label={`${paper.title} — incele`}>
            İncele <Icon name="arrow" size={12} />
          </Link>
        </div>
        <details className="pcard__more">
          <summary>
            Daha fazla göster <Icon name="chevron-down" size={14} />
          </summary>
          <p className="pcard__desc">{paper.eyebrow}</p>
          <Link href={`/times/sablon/${paper.slug}`} className="btn btn--outline btn--xs">
            <Icon name="expand" size={12} /> Tam ekran önizle
          </Link>
        </details>
      </div>
    </article>
  );
}
