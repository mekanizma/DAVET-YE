const PANEL = "/panel";
const STARTS = ["/tr/davetiye-olustur", "/tr/gazete-tasarla", "/tr/gazete-olustur"];

export function isDesignStart(pathname: string) {
  return STARTS.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

/** Girişten sonra dönülebilecek yollar: panel ve tasarım başlangıcı. */
export function safeReturnPath(raw: string | null | undefined) {
  if (!raw) return PANEL;
  const value = raw.trim();
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\") || value.includes("://")) return PANEL;
  const path = value.split(/[?#]/)[0];
  if (path.includes("//") || path === "/panel/giris" || path === "/panel/kayit") return PANEL;
  const allowed = path === PANEL || path.startsWith(`${PANEL}/`) || isDesignStart(path);
  return allowed ? value.split("#")[0] : PANEL;
}
