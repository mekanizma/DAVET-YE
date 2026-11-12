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
  GiftSection,
  LensSection,
  MemoryWallSection,
  RsvpSection,
  WishesSection,
  type WallPhoto,
} from "./InteractiveSections";
import { IvProvider, type InvData } from "./ctx";
import { getInvitationStyle } from "@/data/invitationStyles";
import { SAMPLE, sampleDate } from "@/data/sample";
import { coverOf, openingVideoOf, type Theme } from "@/data/themes";
import { useAmbientMusic } from "@/lib/music";
import { useDraft } from "@/lib/storage";

export default function InvitationExperience({
  theme,
  embed = false,
  mode = "tek",
  useDraftData = false,
}: {
  theme: Theme;
  embed?: boolean;
  mode?: "tek" | "kina-dugun";
  /** Use the visitor's local wizard draft instead of sample content */
  useDraftData?: boolean;
}) {
  const { draft, ready } = useDraft();
  const live = useDraftData && ready;
  const style = useMemo(() => getInvitationStyle(theme), [theme]);
  const reduced = usePrefersReducedMotion();
  const [phase, setPhase] = useState<OpeningPhase>("closed");
  const [photos, setPhotos] = useState<WallPhoto[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const music = useAmbientMusic();
  const photosRef = useRef<WallPhoto[]>([]);
  photosRef.current = photos;
  const openingVideo = useMemo(() => openingVideoOf(theme), [theme]);

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
    return {
      partnerA: pick(info.partnerA, SAMPLE.partnerA),
      partnerB: pick(info.partnerB, SAMPLE.partnerB),
      brideFamily: pick(info.brideFamily, SAMPLE.brideFamily),
      groomFamily: pick(info.groomFamily, SAMPLE.groomFamily),
      date,
      kinaDate: kina,
      venue: pick(info.venue, SAMPLE.venue),
      address: pick(info.address, SAMPLE.address),
      message: pick(info.message, SAMPLE.message),
      familyMessage: pick(info.story, SAMPLE.familyMessage),
      program: (() => {
        if (!live) return SAMPLE.program;
        const rows = (draft.program || [])
          .filter((p) => p.time.trim() || p.title.trim())
          .map((p) => ({ time: p.time, title: p.title, text: p.note || "" }));
        return rows.length ? rows : SAMPLE.program;
      })(),
      iban: pick(info.iban, SAMPLE.iban),
      ibanHolder: pick(info.ibanHolder, SAMPLE.ibanHolder),
      closing: SAMPLE.closing,
    };
  }, [mode, live, info, draft.event, draft.program]);
  const hidden = useMemo(() => new Set(live ? draft.hiddenSections : []), [live, draft.hiddenSections]);
  const show = (id: string) => !hidden.has(id);

  const open = useCallback(() => {
    if (phase !== "closed") return;
    if (reduced) {
      setPhase("done");
      return;
    }
    setPhase("opening");
  }, [phase, reduced]);

  const finishOpen = useCallback(() => {
    setPhase((p) => (p === "done" ? p : "done"));
  }, []);

  useEffect(() => {
    if (phase === "done") scrollRef.current?.focus({ preventScroll: true });
  }, [phase]);

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

  // release object URLs on unmount
  useEffect(
    () => () => {
      photosRef.current.forEach((p) => URL.revokeObjectURL(p.url));
    },
    [],
  );

  const addPhoto = useCallback((p: WallPhoto) => setPhotos((cur) => [...cur, p]), []);
  const removePhoto = useCallback((id: string) => {
    setPhotos((cur) => {
      const hit = cur.find((x) => x.id === id);
      if (hit) URL.revokeObjectURL(hit.url);
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
        <div className="iv__stage">
          <div
            ref={scrollRef}
            className="iv__scroll"
            tabIndex={interactive ? 0 : -1}
            aria-label={`${theme.title} davetiyesi`}
            inert={!interactive}
            aria-hidden={!interactive}
          >
            <NamesSection />
            {show("aileler") && <FamiliesSection />}
            {show("tarih") && <DateSection />}
            {show("konum") && <LocationSection />}
            {show("geri-sayim") && <CountdownSection />}
            {show("program") && <ProgramSection />}
            {show("katilim") && <RsvpSection />}
            {show("ani-duvari") && <MemoryWallSection photos={photos} onAdd={addPhoto} onRemove={removePhoto} />}
            {show("ani-cekimi") && <LensSection onCapture={addPhoto} />}
            {show("dilekler") && <WishesSection />}
            {show("iban") && <GiftSection />}
            <ClosingSection
              embed={embed}
              exitHref={`/tr/temalar/${theme.slug}`}
              startHref={`/tr/davetiye-olustur?sablon=${theme.slug}`}
              onTop={() => scrollRef.current?.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" })}
            />
          </div>

          {interactive && <Particles kind={style.particles} />}

          <OpeningScreen
            type={theme.opening}
            phase={phase}
            cover={cover}
            title={theme.title}
            style={style}
            initials={initials}
            video={openingVideo}
            onOpen={open}
            onOpened={finishOpen}
            onSkip={finishOpen}
          />

          <div className="iv__wm" aria-hidden="true">
            {Array.from({ length: 7 }, (_, i) => (
              <span key={i}>ÖNİZLEME · ÖNİZLEME · ÖNİZLEME</span>
            ))}
          </div>

          <button
            type="button"
            className="iv__music"
            onClick={music.toggle}
            aria-pressed={music.on}
            aria-label="Müziği aç/kapat"
            title={music.supported ? "Müziği aç/kapat" : "Bu tarayıcı ses üretimini desteklemiyor"}
            disabled={!music.supported}
          >
            <Icon name={music.on ? "music" : "music-off"} size={18} />
          </button>

          {!embed && (
            <Link href={`/tr/temalar/${theme.slug}`} className="iv__exit" aria-label="Davetiye sayfasına dön">
              <Icon name="chevron-left" size={18} />
              <span>{theme.title}</span>
            </Link>
          )}
        </div>
      </div>
    </IvProvider>
  );
}
