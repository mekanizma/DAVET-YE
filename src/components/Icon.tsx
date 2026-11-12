import type { SVGProps } from "react";

export type IconName =
  | "mail" | "doc" | "heart" | "check" | "arrow" | "menu" | "close" | "calendar"
  | "pin" | "clock" | "camera" | "image" | "gift" | "music" | "music-off" | "copy"
  | "search" | "tag" | "sort" | "phone" | "star" | "leaf" | "wallet" | "bolt"
  | "share" | "globe" | "chevron-down" | "chevron-up" | "expand" | "instagram"
  | "plus" | "minus" | "sparkle" | "ring" | "candle" | "lock" | "print"
  | "download" | "trash" | "home" | "sliders" | "upload" | "route" | "chevron-left"
  | "chevron-right" | "envelope" | "type" | "info" | "alert" | "user";

const paths: Record<IconName, React.ReactNode> = {
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3.5 7 8.5 6 8.5-6" /></>,
  envelope: <><path d="M3 10.5 12 4l9 6.5V19a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" /><path d="m3.5 10.5 8.5 6 8.5-6" /></>,
  doc: <><path d="M7 3h7l5 5v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" /><path d="M14 3v5h5M9 13h6M9 17h6" /></>,
  heart: <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  calendar: <><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 3v4M16 3v4M4 10h16" /></>,
  pin: <><path d="M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0 1 13 0c0 4.8-6.5 11-6.5 11z" /><circle cx="12" cy="10" r="2.4" /></>,
  clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>,
  camera: <><path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" /><circle cx="12" cy="13" r="3.6" /></>,
  image: <><rect x="3.5" y="4.5" width="17" height="15" rx="2" /><circle cx="9" cy="10" r="1.6" /><path d="m4 18 5.5-5 4 3.5 3-2.5 3.5 4" /></>,
  gift: <><rect x="4" y="9" width="16" height="11" rx="1.5" /><path d="M3 9h18v3H3zM12 9v11M12 9c-3-.5-4.5-2-4.5-3.2a2 2 0 0 1 3.6-1c.7.9.9 2.4.9 4.2zm0 0c3-.5 4.5-2 4.5-3.2a2 2 0 0 0-3.6-1c-.7.9-.9 2.4-.9 4.2z" /></>,
  music: <><path d="M9 18V6l10-2v12" /><circle cx="6.5" cy="18" r="2.5" /><circle cx="16.5" cy="16" r="2.5" /></>,
  "music-off": <><path d="M9 18V6l10-2v10" /><circle cx="6.5" cy="18" r="2.5" /><path d="M4 4l16 16" /></>,
  copy: <><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></>,
  search: <><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4.5 4.5" /></>,
  tag: <><path d="M3.5 12.5V4.5a1 1 0 0 1 1-1h8l8 8-9 9-8-8z" /><circle cx="8" cy="8" r="1.4" /></>,
  sort: <path d="M8 5v14m0 0-3-3m3 3 3-3M16 19V5m0 0-3 3m3-3 3 3" />,
  phone: <><rect x="7" y="3" width="10" height="18" rx="2.2" /><path d="M11 18h2" /></>,
  star: <path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 17l-5.2 2.7 1-5.9L3.5 9.7l5.9-.8z" />,
  leaf: <><path d="M5 19c0-8 5-13 14-14 0 9-5 14-13 14" /><path d="M5 19c3-5 6-8 10-10" /></>,
  wallet: <><path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18v3" /><rect x="3.5" y="7.5" width="17" height="12" rx="2" /><circle cx="16.5" cy="13.5" r="1.2" /></>,
  bolt: <path d="M13 3 5 13.5h6L10 21l8-10.5h-6z" />,
  share: <><circle cx="6" cy="12" r="2.3" /><circle cx="17.5" cy="6" r="2.3" /><circle cx="17.5" cy="18" r="2.3" /><path d="m8 11 7.5-4M8 13l7.5 4" /></>,
  globe: <><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17M12 3.5c2.5 2.6 3.7 5.4 3.7 8.5s-1.2 5.9-3.7 8.5c-2.5-2.6-3.7-5.4-3.7-8.5S9.5 6.1 12 3.5z" /></>,
  "chevron-down": <path d="m6 9 6 6 6-6" />,
  "chevron-up": <path d="m6 15 6-6 6 6" />,
  "chevron-left": <path d="m15 6-6 6 6 6" />,
  "chevron-right": <path d="m9 6 6 6-6 6" />,
  expand: <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />,
  instagram: <><rect x="4" y="4" width="16" height="16" rx="4.5" /><circle cx="12" cy="12" r="3.6" /><circle cx="16.8" cy="7.2" r=".6" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  sparkle: <path d="M12 3c.6 4.6 2.4 6.4 7 7-4.6.6-6.4 2.4-7 7-.6-4.6-2.4-6.4-7-7 4.6-.6 6.4-2.4 7-7zM19 16c.2 1.6.9 2.3 2.5 2.5-1.6.2-2.3.9-2.5 2.5-.2-1.6-.9-2.3-2.5-2.5 1.6-.2 2.3-.9 2.5-2.5z" />,
  ring: <><circle cx="9.5" cy="14.5" r="4.5" /><circle cx="15" cy="14.5" r="4.5" /><path d="m9 6 1.5-2h3L15 6l-1.5 2h-3z" /></>,
  candle: <><rect x="9" y="11" width="6" height="9" rx="1" /><path d="M12 11V9M12 3.5c1.4 1.5 2 2.6 2 3.5a2 2 0 0 1-4 0c0-.9.6-2 2-3.5z" /></>,
  lock: <><rect x="5" y="10.5" width="14" height="9.5" rx="2" /><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" /></>,
  print: <><path d="M7 9V4h10v5M7 17H5a1 1 0 0 1-1-1v-5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1h-2" /><rect x="7" y="14" width="10" height="6" rx="1" /></>,
  download: <path d="M12 4v11m0 0-4-4m4 4 4-4M5 19h14" />,
  upload: <path d="M12 16V5m0 0-4 4m4-4 4 4M5 19h14" />,
  trash: <><path d="M5 7h14M10 7V4.5h4V7M7 7l.8 12h8.4L17 7" /></>,
  home: <path d="M4 11.5 12 5l8 6.5V19a1 1 0 0 1-1 1h-4v-5h-6v5H5a1 1 0 0 1-1-1z" />,
  sliders: <path d="M4 7h10m4 0h2M4 17h2m4 0h10M14 5v4m-4 6v4" />,
  route: <><circle cx="6.5" cy="17.5" r="2" /><circle cx="17.5" cy="6.5" r="2" /><path d="M8.5 17.5H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.5" /></>,
  type: <path d="M5 6V4h14v2M12 4v16m-3 0h6" />,
  info: <><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5M12 8v.01" /></>,
  alert: <><path d="M12 4 3 19.5h18z" /><path d="M12 10v4.5M12 17v.01" /></>,
  user: <><circle cx="12" cy="8.5" r="3.5" /><path d="M5 20c.5-4 3.4-6 7-6s6.5 2 7 6" /></>,
};

export default function Icon({
  name,
  size = 20,
  ...rest
}: { name: IconName; size?: number } & Omit<SVGProps<SVGSVGElement>, "name">) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {paths[name]}
    </svg>
  );
}
