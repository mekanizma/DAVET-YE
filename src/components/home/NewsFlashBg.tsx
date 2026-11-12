const FLASHES = [
  { x: "12%", y: "18%", delay: "0s", dur: "3.8s", size: "lg" },
  { x: "78%", y: "12%", delay: "-0.7s", dur: "4.2s", size: "md" },
  { x: "52%", y: "28%", delay: "-1.4s", dur: "3.4s", size: "sm" },
  { x: "88%", y: "42%", delay: "-2.1s", dur: "4.6s", size: "lg" },
  { x: "22%", y: "55%", delay: "-0.4s", dur: "3.9s", size: "md" },
  { x: "64%", y: "62%", delay: "-2.8s", dur: "4.1s", size: "sm" },
  { x: "8%", y: "78%", delay: "-1.8s", dur: "4.4s", size: "md" },
  { x: "42%", y: "8%", delay: "-3.2s", dur: "3.6s", size: "sm" },
  { x: "94%", y: "72%", delay: "-0.9s", dur: "4s", size: "md" },
  { x: "34%", y: "88%", delay: "-2.4s", dur: "4.8s", size: "lg" },
] as const;

/** Paparazzi-style flash bursts behind the newspaper strip. */
export default function NewsFlashBg() {
  return (
    <div className="news-flash" aria-hidden="true">
      <div className="news-flash__stage" />
      <div className="news-flash__vignette" />
      <div className="news-flash__grain" />
      {FLASHES.map((f, i) => (
        <span
          key={i}
          className={`news-flash__burst news-flash__burst--${f.size}`}
          style={{
            left: f.x,
            top: f.y,
            animationDelay: f.delay,
            animationDuration: f.dur,
          }}
        />
      ))}
      <span className="news-flash__pop news-flash__pop--a" />
      <span className="news-flash__pop news-flash__pop--b" />
      <span className="news-flash__pop news-flash__pop--c" />
    </div>
  );
}
