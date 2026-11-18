"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { CONSENT, getLocalJson, type ConsentChoice } from "@/lib/storage";

const SESSION_KEY = "dv-traffic-session";
const VISITOR_KEY = "dv-traffic-visitor";
const PING_MS = 20_000;

function rid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID().replace(/-/g, "").slice(0, 32);
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 14)}`;
}

function sessionId() {
  try {
    const existing = sessionStorage.getItem(SESSION_KEY);
    if (existing && existing.length >= 8) return existing;
    const next = rid();
    sessionStorage.setItem(SESSION_KEY, next);
    return next;
  } catch {
    return rid();
  }
}

function visitorKey() {
  try {
    const consent = getLocalJson<ConsentChoice | null>(CONSENT, null);
    if (!consent?.analytics) return "";
    const existing = localStorage.getItem(VISITOR_KEY);
    if (existing && existing.length >= 8) return existing;
    const next = rid();
    localStorage.setItem(VISITOR_KEY, next);
    return next;
  } catch {
    return "";
  }
}

function deviceOf(): "mobile" | "desktop" | "other" {
  if (typeof window === "undefined") return "other";
  const coarse = window.matchMedia?.("(pointer: coarse)")?.matches;
  const narrow = window.matchMedia?.("(max-width: 820px)")?.matches;
  if (coarse || narrow) return "mobile";
  return "desktop";
}

function shouldSkip(path: string) {
  return path === "/yonetim" || path.startsWith("/yonetim/") || path.startsWith("/api/");
}

function send(kind: "pageview" | "click" | "engage" | "ping", path: string, label = "") {
  if (shouldSkip(path)) return;
  const body = JSON.stringify({
    kind,
    path,
    label,
    sessionId: sessionId(),
    visitorKey: visitorKey(),
    referrer: typeof document !== "undefined" ? document.referrer.slice(0, 240) : "",
    device: deviceOf(),
  });
  try {
    if (kind === "ping" && typeof navigator !== "undefined" && "sendBeacon" in navigator) {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon("/api/trafik", blob);
      return;
    }
  } catch {
    /* fall through */
  }
  void fetch("/api/trafik", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => undefined);
}

/** Clicks often land on a Text node inside a button/link — those have no closest(). */
function eventElement(ev: Event): Element | null {
  const raw = ev.target;
  if (raw instanceof Element) return raw;
  if (raw instanceof Node) return raw.parentElement;
  return null;
}

function clickLabel(el: Element) {
  const tracked = el.closest("[data-track]");
  if (tracked instanceof HTMLElement && tracked.dataset.track) return tracked.dataset.track.slice(0, 120);
  const host = el instanceof HTMLElement ? el : el.parentElement;
  if (!host) return "";
  const text = (host.innerText || host.getAttribute("aria-label") || host.getAttribute("title") || "").trim();
  return text.replace(/\s+/g, " ").slice(0, 80);
}

function isMeaningfulClick(el: Element) {
  if (el.closest("[data-no-track]")) return false;
  if (el.closest("[data-track]")) return true;
  const target = el.closest("a,button,[role='button']");
  if (!target) return false;
  if (target.tagName === "A") {
    const href = target.getAttribute("href") || "";
    if (!href || href === "#" || href.startsWith("javascript:")) return false;
  }
  const className = typeof (target as HTMLElement).className === "string"
    ? (target as HTMLElement).className
    : String((target as HTMLElement).className || "");
  return Boolean(className.includes("btn") || (target instanceof HTMLElement && target.dataset.track));
}

export default function SiteAnalytics() {
  const pathname = usePathname() || "/";
  const engaged = useRef(false);
  const lastPath = useRef("");

  useEffect(() => {
    if (shouldSkip(pathname)) return;
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;
    engaged.current = false;
    try {
      send("pageview", pathname);
    } catch {
      /* never break the page for analytics */
    }

    const onClick = (ev: MouseEvent) => {
      try {
        const el = eventElement(ev);
        if (!el || !isMeaningfulClick(el)) return;
        const hit = el.closest("a,button,[role='button'],[data-track]") || el;
        send("click", pathname, clickLabel(hit));
      } catch {
        /* ignore analytics failures */
      }
    };

    const markEngage = () => {
      try {
        if (engaged.current) return;
        engaged.current = true;
        send("engage", pathname);
      } catch {
        /* ignore */
      }
    };

    const onScroll = () => {
      try {
        const doc = document.documentElement;
        const max = doc.scrollHeight - window.innerHeight;
        if (max > 0 && window.scrollY / max >= 0.45) markEngage();
      } catch {
        /* ignore */
      }
    };

    const engageTimer = window.setTimeout(markEngage, 12_000);
    const ping = () => {
      try {
        if (document.visibilityState === "hidden") return;
        send("ping", pathname);
      } catch {
        /* ignore */
      }
    };
    const pingTimer = window.setInterval(ping, PING_MS);

    document.addEventListener("click", onClick, true);
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", ping);

    return () => {
      window.clearTimeout(engageTimer);
      window.clearInterval(pingTimer);
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", ping);
    };
  }, [pathname]);

  return null;
}
