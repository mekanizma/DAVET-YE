import Link from "next/link";
import Icon, { type IconName } from "./Icon";
import FeaturesDemo from "./home/FeaturesDemo";
import FeaturesFloral from "./home/FeaturesFloral";
import { lp } from "@/i18n/locale";
import { getLocale } from "@/i18n/server";
import { marketing } from "@/i18n/marketing";
import type { Theme } from "@/data/themes";

export default async function Features({ themes = [] }: { themes?: Theme[] }) {
  const locale = await getLocale();
  const en = locale === "en";
  const copy = marketing(locale);
  return (
    <section className="features" aria-labelledby="feat-offer-title">
      <div className="features__wash" aria-hidden="true" />
      <FeaturesFloral />
      <div className="wrap wrap--lg features__grid">
        <div className="features__copy">
          <p className="eyebrow eyebrow--accent">{en ? "What we offer" : "Size ne sunuyoruz"}</p>
          <h2 id="feat-offer-title">
            {en ? (
              <>More than an invitation. <em>A complete digital experience.</em></>
            ) : (
              <>Sadece bir davetiye değil, <em>eksiksiz bir dijital deneyim.</em></>
            )}
          </h2>
          <p className="features__lead">
            {en
              ? "Everything your guests need, on one elegant link that is simple to use."
              : "Misafirleriniz için gereken her şey tek, zarif ve kolay kullanılan bir bağlantıda."}
          </p>
          <div className="features__actions">
            <Link href={lp(locale, "/temalar")} className="btn btn--cream">
              {en ? "Browse invitations" : "Davetiyeleri Keşfet"} <Icon name="arrow" size={14} />
            </Link>
            <Link href={lp(locale, "/ne-sunuyoruz")} className="btn btn--ghost-light">
              {en ? "All the features" : "Tüm özellikler"}
            </Link>
          </div>
        </div>

        <FeaturesDemo themes={themes} />

        <ul className="features__list">
          {copy.offerHome.map((f) => (
            <li key={f.title} className="feature">
              <span className="feature__icon">
                <Icon name={f.icon as IconName} size={18} />
              </span>
              <div>
                <h3>
                  {f.title}
                  {"addon" in f && f.addon && <span className="tag-addon">{copy.addonTag}</span>}
                </h3>
                <p>{f.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
