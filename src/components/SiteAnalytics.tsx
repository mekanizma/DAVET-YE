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

function clickLabel(el: HTMLElement) {
  const tracked = el.closest<HTMLElement>("[data-track]");
  if (tracked?.dataset.track) return tracked.dataset.track.slice(0, 120);
  const text = (el.innerText || el.getAttribute("aria-label") || el.getAttribute("title") || "").trim();
  return text.replace(/\s+/g, " ").slice(0, 80);
}

function isMeaningfulClick(el: HTMLElement) {
  if (el.closest("[data-no-track]")) return false;
  if (el.closest("[data-track]")) return true;
  const target = el.closest<HTMLElement>("a,button,[role='button']");
  if (!target) return false;
  if (target.tagName === "A") {
    const href = target.getAttribute("href") || "";
    if (!href || href === "#" || href.startsWith("javascript:")) return false;
  }
  return Boolean(target.className?.toString().includes("btn") || target.dataset.track);
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
    send("pageview", pathname);

    const onClick = (ev: MouseEvent) => {
      const el = ev.target as HTMLElement | null;
      if (!el || !isMeaningfulClick(el)) return;
      const hit = el.closest<HTMLElement>("a,button,[role='button'],[data-track]") || el;
      send("click", pathname, clickLabel(hit));
    };

    const markEngage = () => {
      if (engaged.current) return;
      engaged.current = true;
      send("engage", pathname);
    };

    const onScroll = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      if (max > 0 && window.scrollY / max >= 0.45) markEngage();
    };

    const engageTimer = window.setTimeout(markEngage, 12_000);
    const ping = () => {
      if (document.visibilityState === "hidden") return;
      send("ping", pathname);
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
