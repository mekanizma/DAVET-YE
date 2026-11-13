"use client";

import Image from "next/image";
import Link from "next/link";
import PhoneFrame from "./PhoneFrame";
import Icon from "./Icon";
import { localizeTheme } from "@/i18n/catalog";
import { withLocaleQuery } from "@/i18n/locale";
import { useLocale, useLp } from "@/i18n/provider";
import { coverOf, discountPercent, type Theme } from "@/data/themes";
import { formatTL } from "@/lib/format";

/**
 * Invitation product card: a phone mock showing the theme cover, with the info panel
 * (badge, title, price, CTA, "Daha fazla göster") overlaid on the lower part of the screen.
 */
export default function ProductCard({
  theme: source,
  coverOnly = false,
  priority = false,
}: {
  theme: Theme;
  coverOnly?: boolean;
  priority?: boolean;
}) {
  const locale = useLocale();
  const lp = useLp();
  const en = locale === "en";
  const theme = localizeTheme(source, locale);
  const href = lp(`/temalar/${theme.slug}`);
  const discount = discountPercent(theme);
  return (
    <article className="pcard" style={{ ["--pc-accent" as string]: theme.colors.accent }}>
      <PhoneFrame className="pcard__phone">
        <Image
          src={coverOf(theme)}
          alt={theme.title}
          width={360}
          height={640}
          sizes="(max-width: 640px) 80vw, (max-width: 1100px) 44vw, 300px"
          priority={priority}
          loading={priority ? undefined : "lazy"}
        />
        <Link href={href} className="pcard__cover-link" aria-label={en ? `View the ${theme.title} invitation` : `${theme.title} davetiyesini incele`} />
        {!coverOnly && (
          <div className="pcard__panel">
            {theme.badge && (
              <span className={`pbadge pbadge--${theme.badge}`}>
                <Icon name={theme.badge === "featured" ? "star" : "sparkle"} size={11} />
                {theme.badge === "featured" ? (en ? "Featured" : "Öne çıkan") : (en ? "New" : "Yeni")}
              </span>
            )}
            <div className="pcard__row">
              <div className="pcard__text">
                <h3 className="pcard__title">{theme.title}</h3>
                <p className="pcard__price">
                  <strong>{formatTL(theme.price, locale)}</strong>
                  {theme.compareAt > theme.price && <s>{formatTL(theme.compareAt, locale)}</s>}
                </p>
              </div>
              <Link href={href} className="btn btn--dark btn--xs pcard__go" aria-label={en ? `View ${theme.title}` : `${theme.title} — incele`}>
                {en ? "View" : "İncele"} <Icon name="arrow" size={12} />
              </Link>
            </div>
            <details className="pcard__more">
              <summary>
                {en ? "Show more" : "Daha fazla göster"} <Icon name="chevron-down" size={14} />
              </summary>
              <p className="pcard__desc">{theme.eyebrow}</p>
              {discount > 0 && <p className="pcard__off">{en ? `${discount}% off` : `%${discount} indirim`}</p>}
              <Link href={withLocaleQuery(locale, `/onizleme/tema/${theme.slug}`)} className="btn btn--outline btn--xs">
                <Icon name="expand" size={12} /> {en ? "Preview full screen" : "Tam ekran önizle"}
              </Link>
            </details>
          </div>
        )}
      </PhoneFrame>
    </article>
  );
}
