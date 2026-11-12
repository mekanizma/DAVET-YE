import Image from "next/image";
import type { CSSProperties } from "react";

const PETALS = [
  { x: "8%", delay: "0s", dur: "9s", size: "sm", rot: -18 },
  { x: "18%", delay: "-1.2s", dur: "10.5s", size: "md", rot: 22 },
  { x: "28%", delay: "-3.4s", dur: "8.8s", size: "sm", rot: -8 },
  { x: "38%", delay: "-0.6s", dur: "11s", size: "lg", rot: 14 },
  { x: "48%", delay: "-4.1s", dur: "9.4s", size: "md", rot: -26 },
  { x: "58%", delay: "-2.2s", dur: "10.2s", size: "sm", rot: 10 },
  { x: "68%", delay: "-5s", dur: "8.6s", size: "lg", rot: -12 },
  { x: "78%", delay: "-1.8s", dur: "11.4s", size: "md", rot: 28 },
  { x: "88%", delay: "-3.8s", dur: "9.8s", size: "sm", rot: -20 },
  { x: "14%", delay: "-6.2s", dur: "12s", size: "md", rot: 6 },
  { x: "52%", delay: "-7s", dur: "10.8s", size: "sm", rot: -30 },
  { x: "82%", delay: "-4.6s", dur: "9.2s", size: "md", rot: 16 },
] as const;

function Petal({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 56" aria-hidden="true">
      <path
        d="M20 2C12 12 4 24 6 36c2 10 10 16 14 18 4-2 12-8 14-18 2-12-6-24-14-34Z"
        fill="currentColor"
      />
      <path
        d="M20 10c-2 8-3 16-2 24"
        fill="none"
        stroke="rgba(255,255,255,0.28)"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Blooming floral field that opens and scatters petals upward. */
export default function FeaturesFloral() {
  return (
    <div className="features-floral" aria-hidden="true">
      <div className="features-floral__bloom features-floral__bloom--l">
        <Image
          src="/img/decor/floral-tl.webp"
          alt=""
          width={280}
          height={280}
          className="features-floral__img"
        />
      </div>
      <div className="features-floral__bloom features-floral__bloom--r">
        <Image
          src="/img/decor/bouquet-tr.webp"
          alt=""
          width={260}
          height={320}
          className="features-floral__img"
        />
      </div>
      <div className="features-floral__burst" />
      <ul className="features-floral__petals">
        {PETALS.map((p, i) => (
          <li
            key={i}
            className={`features-floral__petal features-floral__petal--${p.size}`}
            style={
              {
                left: p.x,
                animationDelay: p.delay,
                animationDuration: p.dur,
                "--petal-rot": `${p.rot}deg`,
              } as CSSProperties
            }
          >
            <Petal />
          </li>
        ))}
      </ul>
    </div>
  );
}
