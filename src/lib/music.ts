"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Tiny generative ambience (Web Audio): a soft pad plus a slow pentatonic arpeggio.
 * No audio file is shipped (no licensed track available) and nothing starts without a
 * user gesture — the toggle button calls `toggle()` from a click handler.
 */
export function useAmbientMusic() {
  const [on, setOn] = useState(false);
  const [supported, setSupported] = useState(true);
  const ctxRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stepRef = useRef(0);

  const stop = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    const ctx = ctxRef.current;
    const master = masterRef.current;
    if (ctx && master) {
      try {
        master.gain.cancelScheduledValues(ctx.currentTime);
        master.gain.setTargetAtTime(0, ctx.currentTime, 0.2);
        const c = ctx;
        setTimeout(() => void c.close().catch(() => undefined), 900);
      } catch {
        /* ignore */
      }
    }
    ctxRef.current = null;
    masterRef.current = null;
  }, []);

  useEffect(() => stop, [stop]);

  const start = useCallback(() => {
    const AC: typeof AudioContext | undefined =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) {
      setSupported(false);
      return false;
    }
    const ctx = new AC();
    void ctx.resume();
    const master = ctx.createGain();
    master.gain.value = 0;
    master.gain.setTargetAtTime(0.16, ctx.currentTime, 0.6);
    master.connect(ctx.destination);
    ctxRef.current = ctx;
    masterRef.current = master;

    // drone pad (A2 + E3), very quiet
    [110, 164.81].forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = f;
      g.gain.value = i === 0 ? 0.35 : 0.2;
      o.connect(g).connect(master);
      o.start();
    });

    const scale = [220, 261.63, 293.66, 329.63, 392, 440, 523.25, 587.33];
    const pattern = [0, 2, 4, 5, 4, 2, 3, 1, 0, 3, 5, 7, 5, 4, 2, 1];
    const tick = () => {
      const c = ctxRef.current;
      const m = masterRef.current;
      if (!c || !m) return;
      const f = scale[pattern[stepRef.current % pattern.length]];
      stepRef.current++;
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = "triangle";
      o.frequency.value = f;
      const t = c.currentTime;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.5, t + 0.06);
      g.gain.exponentialRampToValueAtTime(0.0008, t + 2.2);
      o.connect(g).connect(m);
      o.start(t);
      o.stop(t + 2.3);
      timerRef.current = setTimeout(tick, 780);
    };
    tick();
    return true;
  }, []);

  const toggle = useCallback(() => {
    setOn((cur) => {
      if (cur) {
        stop();
        return false;
      }
      return start();
    });
  }, [start, stop]);

  return { on, toggle, supported };
}
