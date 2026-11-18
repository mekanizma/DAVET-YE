"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import Icon from "../Icon";
import { usePrefersReducedMotion } from "../PhoneCarousel";
import { Particles } from "./Decor";
import OpeningScreen, { type OpeningPhase } from "./OpeningScreen";
import {
  ClosingSection,
  CountdownSection,
  DateSection,
  FamiliesSection,
  LocationSection,
  NamesSection,
  ProgramSection,
} from "./BasicSections";
import {
  AlbumCollageSection,
  GiftSection,
  LensSection,
  MemoryWallSection,
  RsvpSection,
  WishesSection,
  type WallPhoto,
} from "./InteractiveSections";
import LiveDayStrip from "./LiveDayStrip";
import { IvProvider, type InvData } from "./ctx";
import { getInvitationStyle } from "@/data/invitationStyles";
import { sampleDate, sampleFor } from "@/data/sample";
import { localizeInvitationStyle } from "@/i18n/invitation";
import { themeTitle } from "@/i18n/catalog";
import { lp, type Locale } from "@/i18n/locale";
import { useLocale } from "@/i18n/provider";
import { RSVP_FORM_ENABLED } from "@/data/sections";
import { coverOf, openingVideoOf, type Theme } from "@/data/themes";
import { resolveInviteMusicSrc } from "@/lib/musicCatalog";
import { nameFontFaceCss, nameFontOf, nameFontStack } from "@/lib/nameFonts";
import { useDraft, type InvitationDraft } from "@/lib/storage";

export default function InvitationExperience({
  theme,
  embed = false,
  mode = "tek",
  useDraftData = false,
  watermark,
  locale: localeProp,
  guestDraft = null,
  albumSlug = "",
  hideExit = false,
}: {
  theme: Theme;
  embed?: boolean;
  mode?: "tek" | "kina-dugun";
  /** Use the visitor's local wizard draft instead of sample content */
  useDraftData?: boolean;
  /** Preview watermark. Live/paid shares hide it; unpaid drafts keep it. */
  watermark?: boolean;
  locale?: Locale;
  guestDraft?: InvitationDraft | null;
  albumSlug?: string;
  /** When the page already mounts a global PreviewExit control. */
  hideExit?: boolean;
}) {
  const contextLocale = useLocale();
  const locale = localeProp ?? contextLocale;
  const en = locale === "en";
  const sample = sampleFor(locale);
  const title = themeTitle(theme, locale);
  const stored = useDraft();
  const draft = guestDraft ?? stored.draft;
  const ready = guestDraft ? true : stored.ready;
  const live = Boolean(guestDraft) || (useDraftData && ready);
  const paidLocal = draft.order?.status === "onaylandi";
  const showWatermark = watermark ?? (!guestDraft && !paidLocal);
  const style = useMemo(() => localizeInvitationStyle(getInvitationStyle(theme), locale), [theme, locale]);
  const reduced = usePrefersReducedMotion();
  const [phase, setPhase] = useState<OpeningPhase>("closed");
  const [photos, setPhotos] = useState<WallPhoto[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [musicOn, setMusicOn] = useState(false);
  const musicStarted = useRef(false);
  const photosRef = useRef<WallPhoto[]>([]);
  photosRef.current = photos;
  const openingVideo = useMemo(() => openingVideoOf(theme), [theme]);
  const musicChoice = live ? draft.info.music : "default";
  const trackSrc = resolveInviteMusicSrc(musicChoice);
  const musicEnabled = Boolean(trackSrc);
  const albumPhotos = live ? (draft.info.albumPhotos || []).filter(Boolean).slice(0, 8) : [];

  useEffect(() => {
    musicStarted.current = false;
    setMusicOn(false);
    audioRef.current?.pause();
  }, [trackSrc]);

  const startMusic = useCallback(() => {
    const a = audioRef.current;
    if (!a || !trackSrc) return;
    a.volume = 0.6;
    a.play()
      .then(() => {
        musicStarted.current = true;
        setMusicOn(true);
      })
      .catch(() => setMusicOn(false));
  }, [trackSrc]);

  const toggleMusic = useCallback(() => {
    if (!musicEnabled) return;
    const a = audioRef.current;
    if (!a) return;
    if (musicOn) {
      a.pause();
      setMusicOn(false);
      return;
    }
    startMusic();
  }, [musicEnabled, musicOn, startMusic]);

  const info = draft.info;
  const data: InvData = useMemo(() => {
    const date = live && info.date ? sampleDate(info.date, info.time || "19:00") : sampleDate();
    let kina: Date | null = null;
    if (live) {
      if ((draft.event === "kina" || draft.event === "coklu") && info.kinaDate) {
        kina = sampleDate(info.kinaDate, info.kinaTime || "19:00");
      }
    } else if (mode === "kina-dugun") {
      kina = new Date(date);
      kina.setDate(kina.getDate() - 1);
    }
    const pick = (v: string, fallback: string) => (live && v.trim() ? v.trim() : fallback);
    const nameFont = live ? nameFontOf(info.nameFont) : nameFontOf("default");
    return {
      partnerA: pick(info.partnerA, sample.partnerA),
      partnerB: pick(info.partnerB, sample.partnerB),
      nameFontFamily: nameFontStack(nameFont.id) || undefined,
      brideFamily: pick(info.brideFamily, sample.brideFamily),
      groomFamily: pick(info.groomFamily, sample.groomFamily),
      date,
      kinaDate: kina,
      venue: pick(info.venue, sample.venue),
      address: pick(info.address, sample.address),
      message: pick(info.message, sample.message),
      familyMessage: pick(info.story, sample.familyMessage),
      program: (() => {
        if (!live) return sample.program;
        const rows = (draft.program || [])
          .filter((p) => p.time.trim() || p.title.trim())
          .map((p) => ({ time: p.time, title: p.title, text: p.note || "" }));
        return rows.length ? rows : sample.program;
      })(),
      iban: pick(info.iban, sample.iban),
      ibanHolder: pick(info.ibanHolder, sample.ibanHolder),
      closing: sample.closing,
    };
  }, [mode, live, info, draft.event, draft.program, sample]);
  const hidden = useMemo(() => new Set(live ? draft.hiddenSections : []), [live, draft.hiddenSections]);
  const show = (id: string) => (id === "katilim" && !RSVP_FORM_ENABLED ? false : !hidden.has(id));

  const open = useCallback(() => {
    if (phase !== "closed") return;
    startMusic();
    if (reduced) {
      setPhase("done");
      return;
    }
    setPhase("opening");
  }, [phase, reduced, startMusic]);

  const finishOpen = useCallback(() => {
    startMusic();
    setPhase((p) => (p === "done" ? p : "done"));
  }, [startMusic]);

  useEffect(() => {
    if (phase === "done") scrollRef.current?.focus({ preventScroll: true });
  }, [phase]);

  useEffect(() => {
    if ((phase === "opening" || phase === "done") && trackSrc && !musicStarted.current) startMusic();
  }, [phase, trackSrc, startMusic]);

  /**
   * Mobile: focusing name/RSVP fields opens the keyboard. Browser scroll-into-view
   * then fights scroll-snap and 100dvh resize, so the whole stage jumps.
   * While typing we disable snap and keep stage height locked to the layout viewport.
   */
  useEffect(() => {
    if (phase !== "done") return;
    const root = scrollRef.current;
    const stage = root?.parentElement;
    if (!root || !stage) return;

    const lockStage = () => {
      // clientHeight tracks the layout viewport; avoids 100dvh shrink when the keyboard opens
      stage.style.setProperty("--iv-stage-h", `${document.documentElement.clientHeight}px`);
    };
    lockStage();

    let blurTimer = 0;
    const isField = (el: EventTarget | null) =>
      el instanceof HTMLElement && el.matches("input, textarea, select");

    const onFocusIn = (e: FocusEvent) => {
      if (!isField(e.target)) return;
      window.clearTimeout(blurTimer);
      root.classList.add("is-typing");
    };
    const onFocusOut = () => {
      blurTimer = window.setTimeout(() => {
        if (!isField(document.activeElement) || !root.contains(document.activeElement)) {
          root.classList.remove("is-typing");
          root.style.removeProperty("--iv-kb");
        }
      }, 80);
    };

    const vv = window.visualViewport;
    const syncKeyboard = () => {
      if (!vv) return;
      const covered = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      root.style.setProperty("--iv-kb", `${covered}px`);
    };

    root.addEventListener("focusin", onFocusIn);
    root.addEventListener("focusout", onFocusOut);
    window.addEventListener("orientationchange", lockStage);
    vv?.addEventListener("resize", syncKeyboard);
    vv?.addEventListener("scroll", syncKeyboard);

    return () => {
      window.clearTimeout(blurTimer);
      root.removeEventListener("focusin", onFocusIn);
      root.removeEventListener("focusout", onFocusOut);
      window.removeEventListener("orientationchange", lockStage);
      vv?.removeEventListener("resize", syncKeyboard);
      vv?.removeEventListener("scroll", syncKeyboard);
      root.classList.remove("is-typing");
      root.style.removeProperty("--iv-kb");
      stage.style.removeProperty("--iv-stage-h");
    };
  }, [phase]);

  useEffect(() => {
    if (!albumSlug) return;
    let stop = false;
    fetch(`/api/d/${encodeURIComponent(albumSlug)}/foto`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const rows = Array.isArray(data?.photos) ? data.photos as { id: string; url: string; source?: string }[] : [];
        if (stop) return;
        const next = rows.filter((row) => row?.id && row?.url).map((row) => ({
          id: row.id,
          url: row.url,
          source: row.source === "lens" ? "lens" as const : "upload" as const,
        }));
        setPhotos((cur) => {
          const ids = new Set(next.map((row) => row.id));
          return [...next, ...cur.filter((row) => !ids.has(row.id))];
        });
      })
      .catch(() => undefined);
    return () => {
      stop = true;
    };
  }, [albumSlug]);

  // release object URLs on unmount
  useEffect(
    () => () => {
      photosRef.current.forEach((p) => {
        if (p.url.startsWith("blob:")) URL.revokeObjectURL(p.url);
      });
    },
    [],
  );

  const addPhoto = useCallback((p: WallPhoto) => setPhotos((cur) => [...cur, p]), []);
  const removePhoto = useCallback((id: string) => {
    setPhotos((cur) => {
      const hit = cur.find((x) => x.id === id);
      if (hit?.url.startsWith("blob:")) URL.revokeObjectURL(hit.url);
      return cur.filter((x) => x.id !== id);
    });
  }, []);

  const cover = coverOf(theme);
  const interactive = phase === "done";

  const cssVars = {
    "--iv-bg": style.bg,
    "--iv-deep": style.deep,
    "--iv-accent": style.accent,
    "--iv-paper": style.paper,
    "--iv-ink": style.paperInk,
    "--iv-soft": style.paperSoft,
    "--iv-gold": style.gold,
    "--iv-cover": `url(${cover})`,
  } as CSSProperties;

  const initials = `${data.partnerA[0] ?? ""}${data.partnerB[0] ?? ""}`;
  const liveNameFont = live ? nameFontOf(info.nameFont) : nameFontOf("default");
  const nameFace = nameFontFaceCss(liveNameFont.id);

  return (
    <IvProvider value={{ theme, style, data, embed, reduced, hidden }}>
      <div
        className="iv"
        style={cssVars}
        data-embed={embed ? "1" : undefined}
        data-orn={style.ornament}
        data-dark={style.dark ? "1" : undefined}
        data-open={interactive ? "1" : "0"}
        data-theme={theme.slug}
      >
        {nameFace ? <style>{nameFace}</style> : null}
        {liveNameFont.url ? <link rel="preload" href={liveNameFont.url} as="font" type="font/woff2" crossOrigin="anonymous" /> : null}
        <div className="iv__stage">
          <div
            ref={scrollRef}
            className="iv__scroll"
            tabIndex={interactive ? 0 : -1}
            aria-label={en ? `${title} invitation` : `${theme.title} davetiyesi`}
            inert={!interactive}
            aria-hidden={!interactive}
          >
            {live ? (
              <LiveDayStrip
                locale={locale}
                eventDate={info.date}
                program={(draft.program || []).map((row) => ({ time: row.time, title: row.title, note: row.note }))}
                liveNote={info.liveNote || ""}
              />
            ) : null}
            <NamesSection />
            {show("aileler") && <FamiliesSection />}
            {show("tarih") && <DateSection />}
            {show("konum") && <LocationSection />}
            {show("geri-sayim") && <CountdownSection />}
            {show("program") && <ProgramSection />}
            {show("katilim") && <RsvpSection albumSlug={albumSlug} />}
            {show("album") && <AlbumCollageSection photos={albumPhotos} />}
            {show("ani-duvari") && <MemoryWallSection photos={photos} onAdd={addPhoto} onRemove={removePhoto} albumSlug={albumSlug} />}
            {show("ani-cekimi") && <LensSection onCapture={addPhoto} albumSlug={albumSlug} />}
            {show("dilekler") && <WishesSection albumSlug={albumSlug} live={live} />}
            {show("iban") && <GiftSection />}
            <ClosingSection
              embed={embed}
              exitHref={lp(locale, `/temalar/${theme.slug}`)}
              startHref={lp(locale, `/davetiye-olustur?sablon=${theme.slug}`)}
              onTop={() => scrollRef.current?.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" })}
            />
          </div>

          {interactive && <Particles kind={style.particles} />}

          <OpeningScreen
            type={theme.opening}
            phase={phase}
            cover={cover}
            title={title}
            style={style}
            initials={initials}
            video={openingVideo}
            onOpen={open}
            onOpened={finishOpen}
            onSkip={finishOpen}
          />

          {showWatermark ? (
            <div className="iv__wm" aria-hidden="true">
              {Array.from({ length: 7 }, (_, i) => (
                <span key={i}>{en ? "PREVIEW · PREVIEW · PREVIEW" : "ÖNİZLEME · ÖNİZLEME · ÖNİZLEME"}</span>
              ))}
            </div>
          ) : null}

          {musicEnabled ? (
            <>
              <audio ref={audioRef} src={trackSrc || undefined} loop preload="auto" playsInline />
              <button
                type="button"
                className="iv__music"
                onClick={toggleMusic}
                aria-pressed={musicOn}
                aria-label={en ? "Turn music on or off" : "Müziği aç/kapat"}
                title={en ? "Turn music on or off" : "Müziği aç/kapat"}
              >
                <Icon name={musicOn ? "music" : "music-off"} size={18} />
              </button>
            </>
          ) : null}

          {!embed && !hideExit ? (
            <Link href={lp(locale, `/temalar/${theme.slug}`)} className="iv__exit" aria-label={en ? "Back to the invitation page" : "Davetiye sayfasına dön"}>
              <Icon name="chevron-left" size={18} />
              <span>{title}</span>
            </Link>
          ) : null}
        </div>
      </div>
    </IvProvider>
  );
}
