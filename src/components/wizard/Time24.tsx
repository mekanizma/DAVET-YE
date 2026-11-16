"use client";

/** Always shows and stores 24-hour HH:mm (no AM/PM). */
export default function Time24({
  value,
  onChange,
  id,
  "aria-label": ariaLabel,
  "aria-invalid": ariaInvalid,
  className = "input",
  optional = false,
}: {
  value: string;
  onChange: (next: string) => void;
  id?: string;
  "aria-label"?: string;
  "aria-invalid"?: boolean;
  className?: string;
  optional?: boolean;
}) {
  const match = /^(\d{1,2}):(\d{2})$/.exec((value || "").trim());
  const empty = optional && !match;
  const hour = match ? Math.min(23, Math.max(0, Number(match[1]))) : 19;
  const minute = match ? Math.min(59, Math.max(0, Number(match[2]))) : 0;
  const hh = String(hour).padStart(2, "0");
  const mm = String(minute).padStart(2, "0");

  return (
    <span className="time24" lang="tr-TR">
      <select
        id={id}
        className={className}
        value={empty ? "" : hh}
        aria-label={ariaLabel ? `${ariaLabel} saat` : "Saat"}
        aria-invalid={ariaInvalid || undefined}
        onChange={(e) => {
          const nextH = e.target.value;
          if (!nextH) {
            onChange("");
            return;
          }
          onChange(`${nextH}:${empty ? "00" : mm}`);
        }}
      >
        {optional ? <option value="">{optional ? "—" : ""}</option> : null}
        {Array.from({ length: 24 }, (_, i) => {
          const v = String(i).padStart(2, "0");
          return <option key={v} value={v}>{v}</option>;
        })}
      </select>
      <span className="time24__sep" aria-hidden="true">:</span>
      <select
        className={className}
        value={empty ? "" : mm}
        aria-label={ariaLabel ? `${ariaLabel} dakika` : "Dakika"}
        aria-invalid={ariaInvalid || undefined}
        disabled={empty}
        onChange={(e) => {
          const nextM = e.target.value;
          if (!nextM) {
            onChange("");
            return;
          }
          onChange(`${hh}:${nextM}`);
        }}
      >
        {optional ? <option value="">—</option> : null}
        {Array.from({ length: 60 }, (_, i) => {
          const v = String(i).padStart(2, "0");
          return <option key={v} value={v}>{v}</option>;
        })}
      </select>
    </span>
  );
}
