import Link from "next/link";
import Icon, { type IconName } from "./Icon";
import FeaturesDemo from "./home/FeaturesDemo";
import FeaturesFloral from "./home/FeaturesFloral";
import { OFFER_FEATURES_HOME } from "@/data/site";
import type { Theme } from "@/data/themes";

export default function Features({ themes = [] }: { themes?: Theme[] }) {
  return (
    <section className="features" aria-labelledby="feat-offer-title">
      <div className="features__wash" aria-hidden="true" />
      <FeaturesFloral />
      <div className="wrap wrap--lg features__grid">
        <div className="features__copy">
          <p className="eyebrow eyebrow--accent">Size ne sunuyoruz</p>
          <h2 id="feat-offer-title">
            Sadece bir davetiye değil, <em>eksiksiz bir dijital deneyim.</em>
          </h2>
          <p className="features__lead">
            Misafirleriniz için gereken her şey tek, zarif ve kolay kullanılan bir bağlantıda.
          </p>
          <div className="features__actions">
            <Link href="/tr/temalar" className="btn btn--cream">
              Davetiyeleri Keşfet <Icon name="arrow" size={14} />
            </Link>
            <Link href="/tr/ne-sunuyoruz" className="btn btn--ghost-light">
              Tüm özellikler
            </Link>
          </div>
        </div>

        <FeaturesDemo themes={themes} />

        <ul className="features__list">
          {OFFER_FEATURES_HOME.map((f) => (
            <li key={f.title} className="feature">
              <span className="feature__icon">
                <Icon name={f.icon as IconName} size={18} />
              </span>
              <div>
                <h3>
                  {f.title}
                  {"addon" in f && f.addon && <span className="tag-addon">EKLENTİ</span>}
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
