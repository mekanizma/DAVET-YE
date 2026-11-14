import { downloadBlob } from "@/lib/format";

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

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

function pageNodes(doc: Document) {
  const sheets = [...doc.querySelectorAll<HTMLElement>(".tr-sheet")];
  if (sheets.length) {
    return sheets.sort((a, b) => Number(a.dataset.page || 0) - Number(b.dataset.page || 0));
  }
  return [...doc.querySelectorAll<HTMLElement>(".np-sheet")];
}

function hush(doc: Document) {
  for (const media of doc.querySelectorAll("audio, video")) {
    const el = media as HTMLMediaElement;
    el.muted = true;
    el.pause();
  }
}

async function waitPages(frame: HTMLIFrameElement, signal: AbortSignal) {
  const start = Date.now();
  let stable = 0;
  let last = 0;
  while (Date.now() - start < 45000) {
    throwIfAborted(signal);
    const doc = frame.contentDocument;
    const root = doc?.querySelector<HTMLElement>(".tr");
    if (root && root.dataset.state !== "reading") {
      doc?.querySelector<HTMLButtonElement>(".tr-cover__paper")?.click();
    }
    const pages = doc ? pageNodes(doc) : [];
    const cssReady = doc
      ? [...doc.querySelectorAll("link[rel='stylesheet']")].every((node) => (node as HTMLLinkElement).sheet)
      : false;
    const laidOut = pages.length > 0 && pages.every((page) => page.clientWidth > 40 && page.clientHeight > 40);
    if (cssReady && laidOut && pages.length === last) {
      stable += 1;
      if (stable >= 3) return pages;
    } else {
      stable = 0;
    }
    last = pages.length;
    await wait(120, signal);
  }
  throw new Error("Gazete açılamadı.");
}

async function settle(page: HTMLElement, signal: AbortSignal) {
  const imgs = [...page.querySelectorAll("img")];
  await Promise.all(
    imgs.map(async (img) => {
      img.loading = "eager";
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

function fontFaceText(doc: Document) {
  const faces: string[] = [];
  const push = (css: string) => {
    for (const face of css.match(/@font-face\s*\{[^}]*\}/g) || []) faces.push(face);
  };
  for (const node of doc.querySelectorAll("style")) push(node.textContent || "");
  for (const sheet of [...doc.styleSheets]) {
    let rules: CSSRuleList;
    try {
      rules = sheet.cssRules;
    } catch {
      continue;
    }
    for (const rule of rules) {
      if (rule instanceof CSSFontFaceRule) faces.push(rule.cssText);
    }
  }
  return [...new Set(faces)];
}

function usedFamilies(pages: HTMLElement[]) {
  const names = new Set<string>();
  const take = (value: string) => {
    for (const part of value.split(",")) {
      const name = part.trim().replace(/^["']|["']$/g, "").toLowerCase();
      if (name && !/^(serif|sans-serif|monospace|system-ui|cursive|fantasy|inherit|initial|unset)$/.test(name)) names.add(name);
    }
  };
  for (const page of pages) {
    take(getComputedStyle(page).fontFamily);
    for (const el of page.querySelectorAll<HTMLElement>("*")) take(getComputedStyle(el).fontFamily);
  }
  return names;
}

function faceFamily(css: string) {
  return (css.match(/font-family:\s*([^;]+)/i)?.[1] || "").replace(/["']/g, "").trim().toLowerCase();
}

/** Newspaper fonts live in the preview document. The admin page would otherwise substitute a wider face and clip the headlines. */
async function embedDocumentFonts(doc: Document, pages: HTMLElement[]) {
  const families = usedFamilies(pages);
  const faces = fontFaceText(doc).filter((face) => {
    const family = faceFamily(face);
    return !families.size || families.has(family);
  });
  const cache = new Map<string, string>();
  const out: string[] = [];
  for (const face of faces) {
    let next = face;
    const urls = [...face.matchAll(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g)];
    for (const match of urls) {
      const raw = match[2];
      if (!raw || raw.startsWith("data:")) continue;
      let data = cache.get(raw);
      if (!data) {
        const res = await fetch(new URL(raw, doc.baseURI)).catch(() => null);
        if (!res?.ok) continue;
        const type = res.headers.get("content-type") || "font/woff2";
        data = `data:${type};base64,${bytesToBase64(new Uint8Array(await res.arrayBuffer()))}`;
        cache.set(raw, data);
      }
      next = next.replace(match[0], `url("${data}")`);
    }
    if (next.includes("data:")) out.push(next);
  }
  return out.join("\n");
}

function mimeType() {
  const types = ["video/mp4;codecs=avc1.42E01E", "video/mp4", "video/webm;codecs=vp9", "video/webm"];
  return types.find((type) => MediaRecorder.isTypeSupported(type)) || "";
}

function fileName(title: string, ext: string) {
  const base = title.replace(/[\\/:*?"<>|]+/g, " ").replace(/\s+/g, " ").trim() || "gazete";
  return `${base}.${ext}`;
}

function reveal(doc: Document) {
  const node = doc.createElement("style");
  node.setAttribute("data-kayit", "1");
  node.textContent = ".tr-sheet [data-anim], .np-sheet [data-anim] { animation: none !important; opacity: 1 !important; }";
  doc.head.appendChild(node);
}

export async function recordNewspaperVideo(
  frame: HTMLIFrameElement,
  title: string,
  onStatus: (status: string) => void,
  signal: AbortSignal,
) {
  if (typeof MediaRecorder === "undefined") throw new Error("Bu tarayıcı video kaydı yapamıyor.");
  onStatus("Gazete açılıyor…");
  const pages = await waitPages(frame, signal);
  const doc = frame.contentDocument;
  if (!doc) throw new Error("Gazete açılamadı.");
  hush(doc);
  reveal(doc);
  await doc.fonts?.ready;
  const { toCanvas } = await import("html-to-image");
  const mime = mimeType();
  const fontEmbedCSS = await embedDocumentFonts(doc, pages);
  const shots: HTMLCanvasElement[] = [];

  for (let index = 0; index < pages.length; index += 1) {
    throwIfAborted(signal);
    onStatus(`Sayfa ${index + 1} / ${pages.length} hazırlanıyor…`);
    const page = pages[index];
    await settle(page, signal);
    const snap = await toCanvas(page, {
      pixelRatio: 2,
      cacheBust: false,
      backgroundColor: getComputedStyle(page).backgroundColor || "#ffffff",
      fontEmbedCSS: fontEmbedCSS || " ",
      filter: (node) => {
        const tag = (node as HTMLElement).tagName;
        if (!tag) return true;
        return tag !== "VIDEO" && tag !== "AUDIO" && tag !== "LINK";
      },
    });
    if (!snap.width || !snap.height) throw new Error("Sayfa görüntülenemedi.");
    shots.push(snap);
  }

  if (!shots.length) throw new Error("Gazetede indirilecek sayfa yok.");
  onStatus("Video kaydediliyor…");
  const film = document.createElement("canvas");
  film.width = shots[0].width - (shots[0].width % 2);
  film.height = shots[0].height - (shots[0].height % 2);
  const ctx = film.getContext("2d");
  if (!ctx) throw new Error("Video hazırlanamadı.");
  const chunks: Blob[] = [];
  const stream = film.captureStream(30);
  const recorder = new MediaRecorder(stream, {
    ...(mime ? { mimeType: mime } : {}),
    videoBitsPerSecond: 5_000_000,
  });
  recorder.ondataavailable = (event) => {
    if (event.data.size) chunks.push(event.data);
  };
  recorder.start();
  for (const snap of shots) await hold(ctx, film, snap, 2000, signal);

  const type = recorder.mimeType || mime || "video/webm";
  const blob = await new Promise<Blob>((resolve, reject) => {
    recorder.onstop = () => resolve(new Blob(chunks, { type }));
    recorder.onerror = () => reject(new Error("Video kaydedilemedi."));
    recorder.stop();
  });
  throwIfAborted(signal);
  const ext = type.includes("mp4") ? "mp4" : "webm";
  downloadBlob(fileName(title, ext), blob);
}
