import { downloadBlob } from "@/lib/format";

export interface KayitApi {
  ready: true;
  count: number;
  gate: number;
  show: (index: number) => void;
  stage: () => HTMLElement | null;
}

type KayitWindow = Window & { __kayit?: KayitApi };

function wait(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(() => resolve(), ms);
    const stop = () => {
      window.clearTimeout(timer);
      reject(new DOMException("İptal edildi.", "AbortError"));
    };
    if (signal.aborted) stop();
    else signal.addEventListener("abort", stop, { once: true });
  });
}

function throwIfAborted(signal: AbortSignal) {
  if (signal.aborted) throw new DOMException("İptal edildi.", "AbortError");
}

function waitKayit(frame: HTMLIFrameElement, signal: AbortSignal) {
  return new Promise<KayitApi>((resolve, reject) => {
    const start = Date.now();
    const tick = () => {
      if (signal.aborted) {
        reject(new DOMException("İptal edildi.", "AbortError"));
        return;
      }
      const api = (frame.contentWindow as KayitWindow | null)?.__kayit;
      const stage = api?.stage();
      if (api?.ready && stage && stage.clientWidth > 40) resolve(api);
      else if (Date.now() - start > 45000) reject(new Error("Şablon açılamadı."));
      else window.setTimeout(tick, 80);
    };
    tick();
  });
}

async function showShot(api: KayitApi, index: number, signal: AbortSignal) {
  api.show(index);
  const start = Date.now();
  while (Date.now() - start < 4000) {
    throwIfAborted(signal);
    const stage = api.stage();
    if (stage) {
      if (index < api.gate) {
        if (stage.querySelector(".stg-intro")) return stage;
      } else {
        const page = stage.querySelectorAll(".stg-page")[index - api.gate] as HTMLElement | undefined;
        const root = stage.querySelector(".stg-pages") as HTMLElement | null;
        if (page && root && Math.abs(root.scrollTop - page.offsetTop) < 4) return stage;
      }
    }
    await wait(40, signal);
  }
  const stage = api.stage();
  if (!stage) throw new Error("Sayfa hazırlanamadı.");
  return stage;
}

/** html-to-image ignores scroll position, so only the current page stays in the stage. */
function showOnly(stage: HTMLElement, index: number, gate: number) {
  const pages = [...stage.querySelectorAll<HTMLElement>(".stg-page")];
  const saved = pages.map((page) => page.style.display);
  if (index >= gate) {
    const current = index - gate;
    pages.forEach((page, i) => {
      page.style.display = i === current ? "" : "none";
    });
    const root = stage.querySelector(".stg-pages") as HTMLElement | null;
    if (root) root.scrollTop = 0;
  }
  return () => {
    pages.forEach((page, i) => {
      page.style.display = saved[i];
    });
  };
}

async function settle(stage: HTMLElement, signal: AbortSignal) {
  const imgs = [...stage.querySelectorAll("img")];
  await Promise.all(
    imgs.map(async (img) => {
      if (!img.complete) {
        await new Promise<void>((resolve) => {
          img.addEventListener("load", () => resolve(), { once: true });
          img.addEventListener("error", () => resolve(), { once: true });
        });
      }
      if (img.decode) await img.decode().catch(() => undefined);
    }),
  );
  throwIfAborted(signal);
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

function hold(ctx: CanvasRenderingContext2D, film: HTMLCanvasElement, snap: CanvasImageSource, ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const start = performance.now();
    const frame = (now: number) => {
      if (signal.aborted) {
        reject(new DOMException("İptal edildi.", "AbortError"));
        return;
      }
      ctx.drawImage(snap, 0, 0, film.width, film.height);
      if (now - start >= ms) resolve();
      else requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  });
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

/** Theme fonts live in the invitation document. Capturing from the admin page would otherwise fall back to a wider font and clip the names. */
async function embedFrameFonts(doc: Document) {
  const css = [...doc.querySelectorAll("style")].map((node) => node.textContent || "").join("\n");
  const faces = css.match(/@font-face\{[^}]+\}/g) || [];
  const cache = new Map<string, string>();
  const out: string[] = [];
  for (const face of faces) {
    const url = face.match(/url\("([^"]+)"\)/)?.[1];
    if (!url) continue;
    let data = cache.get(url);
    if (!data) {
      const res = await fetch(new URL(url, doc.baseURI));
      if (!res.ok) continue;
      data = `data:font/woff2;base64,${bytesToBase64(new Uint8Array(await res.arrayBuffer()))}`;
      cache.set(url, data);
    }
    out.push(face.replace(/url\("[^"]+"\)/, `url("${data}")`));
  }
  return out.join("");
}

function mimeType() {
  const types = ["video/mp4;codecs=avc1.42E01E", "video/mp4", "video/webm;codecs=vp9", "video/webm"];
  return types.find((type) => MediaRecorder.isTypeSupported(type)) || "";
}

function fileName(title: string, ext: string) {
  const base = title.replace(/[\\/:*?"<>|]+/g, " ").replace(/\s+/g, " ").trim() || "davetiye";
  return `${base}.${ext}`;
}

export async function recordTemplateVideo(
  frame: HTMLIFrameElement,
  title: string,
  onStatus: (status: string) => void,
  signal: AbortSignal,
) {
  if (typeof MediaRecorder === "undefined") throw new Error("Bu tarayıcı video kaydı yapamıyor.");
  onStatus("Şablon açılıyor…");
  const api = await waitKayit(frame, signal);
  await frame.contentDocument?.fonts?.ready;
  const { toCanvas } = await import("html-to-image");
  const mime = mimeType();
  let recorder: MediaRecorder | null = null;
  let film: HTMLCanvasElement | null = null;
  let ctx: CanvasRenderingContext2D | null = null;
  const chunks: Blob[] = [];
  const fontEmbedCSS = frame.contentDocument ? await embedFrameFonts(frame.contentDocument) : "";
  const shots: HTMLCanvasElement[] = [];

  for (let index = 0; index < api.count; index += 1) {
    throwIfAborted(signal);
    onStatus(`Sayfa ${index + 1} / ${api.count} hazırlanıyor…`);
    const stage = await showShot(api, index, signal);
    await settle(stage, signal);
    const undo = showOnly(stage, index, api.gate);
    try {
      const snap = await toCanvas(stage, {
        pixelRatio: 2,
        cacheBust: false,
        backgroundColor: getComputedStyle(stage).backgroundColor || "#111111",
        fontEmbedCSS: fontEmbedCSS || undefined,
        filter: (node) => {
          const tag = (node as HTMLElement).tagName;
          if (!tag) return true;
          return tag !== "VIDEO" && tag !== "AUDIO" && tag !== "LINK";
        },
      });
      if (!snap.width || !snap.height) throw new Error("Sayfa görüntülenemedi.");
      shots.push(snap);
    } finally {
      undo();
    }
  }

  if (!shots.length) throw new Error("Şablonda indirilecek sayfa yok.");
  onStatus("Video kaydediliyor…");
  film = document.createElement("canvas");
  film.width = shots[0].width - (shots[0].width % 2);
  film.height = shots[0].height - (shots[0].height % 2);
  const context = film.getContext("2d");
  if (!context) throw new Error("Video hazırlanamadı.");
  ctx = context;
  const stream = film.captureStream(30);
  recorder = new MediaRecorder(stream, {
    ...(mime ? { mimeType: mime } : {}),
    videoBitsPerSecond: 5_000_000,
  });
  recorder.ondataavailable = (event) => {
    if (event.data.size) chunks.push(event.data);
  };
  recorder.start();
  for (const snap of shots) {
    await hold(ctx, film, snap, 2000, signal);
  }

  if (!recorder) throw new Error("Şablonda indirilecek sayfa yok.");
  onStatus("Video kaydediliyor…");
  const type = recorder.mimeType || mime || "video/webm";
  const blob = await new Promise<Blob>((resolve, reject) => {
    recorder!.onstop = () => resolve(new Blob(chunks, { type }));
    recorder!.onerror = () => reject(new Error("Video kaydedilemedi."));
    recorder!.stop();
  });
  throwIfAborted(signal);
  const ext = type.includes("mp4") ? "mp4" : "webm";
  downloadBlob(fileName(title, ext), blob);
}
