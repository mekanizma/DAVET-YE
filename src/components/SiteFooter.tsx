import Link from "next/link";
import Icon from "./Icon";
import Logo from "./Logo";
import ConsentButton from "./ConsentButton";
import { FOOTER_GROUPS, INVITATION_TYPE_LINKS, SITE } from "@/data/site";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="wrap wrap--lg">
        <div className="site-footer__grid">
          <div className="site-footer__brand">
            <Logo width={140} />
            <p>{SITE.tagline}</p>
            <a
              className="social"
              href={SITE.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${SITE.name} Instagram · @${SITE.instagramHandle}`}
            >
              <Icon name="instagram" size={20} />
              <span className="sr-only">@{SITE.instagramHandle}</span>
            </a>
          </div>
          {FOOTER_GROUPS.map((g) => (
            <div key={g.title}>
              <p className="site-footer__title">{g.title}</p>
              <ul className="site-footer__list">
                {g.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href}>{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <nav className="site-footer__types" aria-label="Davetiye türleri">
          <p className="site-footer__title">Davetiye türleri</p>
          <ul>
            {INVITATION_TYPE_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href}>{l.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="site-footer__bottom">
          <span>© {SITE.year} {SITE.name}</span>
          <ConsentButton />
        </div>
      </div>
    </footer>
  );
}
