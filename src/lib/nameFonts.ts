/** Curated name fonts available in /public/fonts for the wizard picker. */

export type NameFontOption = {
  id: string;
  family: string;
  url: string;
  tr: string;
  en: string;
};

export const NAME_FONTS: NameFontOption[] = [
  { id: "default", family: "", url: "", tr: "Davetiyenin fontu", en: "Invitation font" },

  /* Script / el yazısı */
  { id: "beau-rivage", family: "Beau Rivage", url: "/fonts/beaurivage.i4bhy7qdrn.woff2", tr: "Beau Rivage", en: "Beau Rivage" },
  { id: "great-vibes", family: "Great Vibes", url: "/fonts/greatvibes.woff2", tr: "Great Vibes", en: "Great Vibes" },
  { id: "allura", family: "Allura", url: "/fonts/allura.woff2", tr: "Allura", en: "Allura" },
  { id: "allura-full", family: "Allura Full", url: "/fonts/allura-full.woff2", tr: "Allura Full", en: "Allura Full" },
  { id: "parisienne", family: "Parisienne", url: "/fonts/parisienne.woff2", tr: "Parisienne", en: "Parisienne" },
  { id: "alex-brush", family: "Alex Brush", url: "/fonts/alexbrush.woff2", tr: "Alex Brush", en: "Alex Brush" },
  { id: "sacramento", family: "Sacramento", url: "/fonts/sacramento.woff2", tr: "Sacramento", en: "Sacramento" },
  { id: "pinyon", family: "Pinyon Script", url: "/fonts/pinyonscript.woff2", tr: "Pinyon Script", en: "Pinyon Script" },
  { id: "dancing", family: "Dancing Script", url: "/fonts/dancingscript.woff2", tr: "Dancing Script", en: "Dancing Script" },
  { id: "charm", family: "Charm", url: "/fonts/charm.woff2", tr: "Charm", en: "Charm" },
  { id: "italianno", family: "Italianno", url: "/fonts/italianno.8uu93q1x32.woff2", tr: "Italianno", en: "Italianno" },
  { id: "montecarlo", family: "MonteCarlo", url: "/fonts/montecarlo.woff2", tr: "MonteCarlo", en: "MonteCarlo" },
  { id: "birthstone", family: "Birthstone", url: "/fonts/birthstone.woff2", tr: "Birthstone", en: "Birthstone" },
  { id: "allison", family: "Allison", url: "/fonts/allison.woff2", tr: "Allison", en: "Allison" },
  { id: "arizonia", family: "Arizonia", url: "/fonts/arizonia.woff2", tr: "Arizonia", en: "Arizonia" },
  { id: "ephesis", family: "Ephesis", url: "/fonts/ephesis.5vn41hicyp.woff2", tr: "Ephesis", en: "Ephesis" },
  { id: "imperial-script", family: "Imperial Script", url: "/fonts/imperialscript.7d1u0zapbt.woff2", tr: "Imperial Script", en: "Imperial Script" },
  { id: "mea-culpa", family: "Mea Culpa", url: "/fonts/meaculpa.g588jb7ez1.woff2", tr: "Mea Culpa", en: "Mea Culpa" },
  { id: "petit-formal", family: "Petit Formal Script", url: "/fonts/petitformalscript.bznmj38gio.woff2", tr: "Petit Formal Script", en: "Petit Formal Script" },
  { id: "marck-script", family: "Marck Script", url: "/fonts/marckscript.woff2", tr: "Marck Script", en: "Marck Script" },
  { id: "the-nautigal", family: "The Nautigal", url: "/fonts/thenautigal.woff2", tr: "The Nautigal", en: "The Nautigal" },
  { id: "qwitcher", family: "Qwitcher Grypen", url: "/fonts/qwitchergrypen.woff2", tr: "Qwitcher Grypen", en: "Qwitcher Grypen" },

  /* Elegant serif / display */
  { id: "playfair", family: "Playfair Display", url: "/fonts/playfairdisplay.woff2", tr: "Playfair Display", en: "Playfair Display" },
  { id: "playfair-sc", family: "Playfair Display SC", url: "/fonts/playfairdisplaysc.psvusz38l2.woff2", tr: "Playfair Display SC", en: "Playfair Display SC" },
  { id: "cinzel", family: "Cinzel", url: "/fonts/cinzel.woff2", tr: "Cinzel", en: "Cinzel" },
  { id: "cinzel-decorative", family: "Cinzel Decorative", url: "/fonts/cinzeldecorative.woff2", tr: "Cinzel Decorative", en: "Cinzel Decorative" },
  { id: "cormorant", family: "Cormorant Garamond", url: "/fonts/cormorantgaramond.woff2", tr: "Cormorant Garamond", en: "Cormorant Garamond" },
  { id: "cormorant-upright", family: "Cormorant Upright", url: "/fonts/cormorantupright.9s49gkduoh.woff2", tr: "Cormorant Upright", en: "Cormorant Upright" },
  { id: "cormorant-sc", family: "Cormorant SC", url: "/fonts/cormorantsc.4nrg3v2jvp.woff2", tr: "Cormorant SC", en: "Cormorant SC" },
  { id: "italiana", family: "Italiana", url: "/fonts/italiana.woff2", tr: "Italiana", en: "Italiana" },
  { id: "marcellus", family: "Marcellus", url: "/fonts/marcellus.woff2", tr: "Marcellus", en: "Marcellus" },
  { id: "marcellus-sc", family: "Marcellus SC", url: "/fonts/marcellussc.qj3r07o1sw.woff2", tr: "Marcellus SC", en: "Marcellus SC" },
  { id: "bodoni", family: "Bodoni Moda", url: "/fonts/bodonimoda.woff2", tr: "Bodoni Moda", en: "Bodoni Moda" },
  { id: "abril", family: "Abril Fatface", url: "/fonts/abrilfatface.woff2", tr: "Abril Fatface", en: "Abril Fatface" },
  { id: "dm-serif", family: "DM Serif Display", url: "/fonts/dmserifdisplay.woff2", tr: "DM Serif Display", en: "DM Serif Display" },
  { id: "eb-garamond", family: "EB Garamond", url: "/fonts/ebgaramond.woff2", tr: "EB Garamond", en: "EB Garamond" },
  { id: "fraunces", family: "Fraunces", url: "/fonts/fraunces.woff2", tr: "Fraunces", en: "Fraunces" },
  { id: "forum", family: "Forum", url: "/fonts/forum.6t4pn1qatx.woff2", tr: "Forum", en: "Forum" },
  { id: "gilda", family: "Gilda Display", url: "/fonts/gildadisplay.woff2", tr: "Gilda Display", en: "Gilda Display" },
  { id: "gloock", family: "Gloock", url: "/fonts/gloock.woff2", tr: "Gloock", en: "Gloock" },
  { id: "instrument-serif", family: "Instrument Serif", url: "/fonts/instrumentserif.woff2", tr: "Instrument Serif", en: "Instrument Serif" },
  { id: "libre-baskerville", family: "Libre Baskerville", url: "/fonts/librebaskerville.woff2", tr: "Libre Baskerville", en: "Libre Baskerville" },
  { id: "libre-caslon-display", family: "Libre Caslon Display", url: "/fonts/librecaslondisplay.woff2", tr: "Libre Caslon Display", en: "Libre Caslon Display" },
  { id: "libre-caslon-text", family: "Libre Caslon Text", url: "/fonts/librecaslontext.woff2", tr: "Libre Caslon Text", en: "Libre Caslon Text" },
  { id: "lora", family: "Lora", url: "/fonts/lora.woff2", tr: "Lora", en: "Lora" },
  { id: "old-standard", family: "Old Standard TT", url: "/fonts/oldstandardtt.woff2", tr: "Old Standard TT", en: "Old Standard TT" },
  { id: "poiret", family: "Poiret One", url: "/fonts/poiretone.woff2", tr: "Poiret One", en: "Poiret One" },
  { id: "rozha", family: "Rozha One", url: "/fonts/rozhaone.woff2", tr: "Rozha One", en: "Rozha One" },
  { id: "spectral", family: "Spectral", url: "/fonts/spectral.woff2", tr: "Spectral", en: "Spectral" },
  { id: "unna", family: "Unna", url: "/fonts/unna.woff2", tr: "Unna", en: "Unna" },
  { id: "yeseva", family: "Yeseva One", url: "/fonts/yesevaone.woff2", tr: "Yeseva One", en: "Yeseva One" },
  { id: "cormorant-plain", family: "Cormorant", url: "/fonts/cormorant.woff2", tr: "Cormorant", en: "Cormorant" },
  { id: "grenze", family: "Grenze Gotisch", url: "/fonts/grenzegotisch.woff2", tr: "Grenze Gotisch", en: "Grenze Gotisch" },
  { id: "limelight", family: "Limelight", url: "/fonts/limelight.woff2", tr: "Limelight", en: "Limelight" },

  /* Clean sans (nadiren isim için) */
  { id: "josefin", family: "Josefin Sans", url: "/fonts/josefinsans.woff2", tr: "Josefin Sans", en: "Josefin Sans" },
  { id: "league-spartan", family: "League Spartan", url: "/fonts/leaguespartan.woff2", tr: "League Spartan", en: "League Spartan" },
  { id: "raleway", family: "Raleway", url: "/fonts/raleway.woff2", tr: "Raleway", en: "Raleway" },
  { id: "montserrat", family: "Montserrat", url: "/fonts/montserrat.woff2", tr: "Montserrat", en: "Montserrat" },
  { id: "outfit", family: "Outfit", url: "/fonts/outfit.woff2", tr: "Outfit", en: "Outfit" },
  { id: "jost", family: "Jost", url: "/fonts/jost.woff2", tr: "Jost", en: "Jost" },
];

export function nameFontOf(id: string | undefined | null): NameFontOption {
  return NAME_FONTS.find((font) => font.id === id) || NAME_FONTS[0];
}

export function nameFontFaceCss(id: string | undefined | null) {
  const font = nameFontOf(id);
  if (!font.family || !font.url) return "";
  const family = font.family.replace(/"/g, "");
  return `@font-face{font-family:"${family}";src:url("${font.url}") format("woff2");font-weight:400;font-display:swap}`;
}

export function nameFontStack(id: string | undefined | null) {
  const font = nameFontOf(id);
  if (!font.family) return "";
  const name = font.family.replace(/"/g, "");
  if (/script|vibes|allura|brush|sacramento|parisienne|pinyon|dancing|charm|beau|italianno|montecarlo|birthstone|allison|arizonia|ephesis|imperial|mea culpa|petit|marck|nautigal|qwitcher/i.test(name)) {
    return `"${name}", "Dv Script Greek", "Dv Script", cursive`;
  }
  if (/jost|montserrat|inter|raleway|outfit|josefin|league|spartan|oswald|bebas/i.test(name)) {
    return `"${name}", "Dv Sans Greek", "Dv Sans", sans-serif`;
  }
  return `"${name}", "Dv Display Greek", "Dv Display", serif`;
}
