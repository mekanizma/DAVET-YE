const FALLBACK_ORIGIN = "https://davetanisi.com";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

/** Public site origin. Never the bind address from `next start -H 0.0.0.0`. */
export function siteOrigin() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || FALLBACK_ORIGIN;
  try {
    return new URL(raw).origin;
  } catch {
    return FALLBACK_ORIGIN;
  }
}

function hostnameOf(host: string) {
  const bare = host.replace(/^\[|\]$/g, "");
  return (bare.split(":")[0] || "").toLowerCase();
}

/**
 * Origin for redirects after auth. `request.url` on Render is
 * `https://0.0.0.0:10000/...` because the process listens on 0.0.0.0.
 * Localhost stays local so password and confirmation links work in dev.
 */
export function requestOrigin(headerList: { get(name: string): string | null }) {
  const forwarded = headerList.get("x-forwarded-host") || headerList.get("host") || "";
  const host = forwarded.split(",")[0]?.trim() ?? "";
  const hostname = hostnameOf(host);
  if (LOCAL_HOSTS.has(hostname)) {
    const proto = (headerList.get("x-forwarded-proto") || "http").split(",")[0]?.trim() || "http";
    return `${proto}://${host}`;
  }
  return siteOrigin();
}
