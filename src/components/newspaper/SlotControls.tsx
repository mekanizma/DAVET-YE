"use client";

import { useRef } from "react";
import Icon from "@/components/Icon";
import { TextAreaField, TextField } from "@/components/Field";
import { useLocale } from "@/i18n/provider";
import {
  fromIsoDate,
  fromIsoTime,
  toIsoLocal,
  type TimesFieldDef,
} from "@/lib/timesFields";
import type { TimesPageSlot } from "@/lib/timesPages";

export function SlotControl({
  slot,
  value,
  error,
  busy,
  onChange,
  onImage,
  onClearImage,
}: {
  slot: TimesPageSlot;
  value: string;
  error?: string;
  busy?: boolean;
  onChange: (v: string) => void;
  onImage: (file: File | null) => void;
  onClearImage: () => void;
}) {
  const en = useLocale() === "en";
  if (slot.kind === "image") {
    return (
      <PhotoSlot
        label={slot.label + (slot.required ? " *" : "")}
        help={slot.help}
        src={value}
        busy={busy}
        onPick={onImage}
        onClear={onClearImage}
      />
    );
  }

  if (slot.kind === "content") {
    const hint = en ? "Page text" : "Sayfa metni";
    if (slot.multiline) {
      return (
        <TextAreaField
          id={`ct-${slot.id}`}
          label={slot.label}
          rows={3}
          value={value}
          maxLength={slot.maxLength}
          hint={hint}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    }
    return (
      <TextField
        id={`ct-${slot.id}`}
        label={slot.label}
        value={value}
        maxLength={slot.maxLength}
        hint={hint}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }

  return <FieldControl field={slot.field} value={value} error={error} onChange={onChange} />;
}

function FieldControl({
  field,
  value,
  error,
  onChange,
}: {
  field: TimesFieldDef;
  value: string;
  error?: string;
  onChange: (v: string) => void;
}) {
  const en = useLocale() === "en";
  if (field.type === "dateTime" || field.type === "date") {
    const date = fromIsoDate(value);
    const time = fromIsoTime(value) || "19:00";
    return (
      <div className="ns-grid">
        <TextField
          id={`tf-${field.id}-d`}
          type="date"
          label={field.label}
          required={field.required}
          value={date}
          error={error}
          hint={field.help}
          onChange={(e) => onChange(toIsoLocal(e.target.value, time))}
        />
        {field.type === "dateTime" ? (
          <TextField
            id={`tf-${field.id}-t`}
            type="time"
            label={en ? "Time" : "Saat"}
            value={time}
            onChange={(e) => onChange(toIsoLocal(date || new Date().toISOString().slice(0, 10), e.target.value))}
          />
        ) : null}
      </div>
    );
  }

  if (field.type === "longText") {
    return (
      <TextAreaField
        id={`tf-${field.id}`}
        label={field.label}
        required={field.required}
        rows={5}
        value={value}
        error={error}
        hint={field.help || (field.maxLength ? `${value.length}/${field.maxLength}` : undefined)}
        maxLength={field.maxLength}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }

  return (
    <TextField
      id={`tf-${field.id}`}
      label={field.label}
      required={field.required}
      value={value}
      error={error}
      hint={field.help}
      maxLength={field.maxLength}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

function PhotoSlot({
  label,
  help,
  src,
  busy,
  onPick,
  onClear,
}: {
  label: string;
  help?: string;
  src: string;
  busy?: boolean;
  onPick: (file: File | null) => void;
  onClear: () => void;
}) {
  const en = useLocale() === "en";
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className={`ns-photo${src ? " has-img" : ""}`}>
      <div className="ns-photo__frame">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt="" />
        ) : (
          <span className="ns-photo__empty">
            <Icon name="upload" size={20} />
            {busy ? (en ? "Loading…" : "Yükleniyor…") : en ? "Add a photo" : "Fotoğraf ekle"}
          </span>
        )}
      </div>
      <div className="ns-photo__meta">
        <span className="ns-photo__label">{label}</span>
        {help ? <span className="field__hint">{help}</span> : null}
        <div className="ns-photo__actions">
          <button type="button" className="btn btn--outline btn--xs" disabled={busy} onClick={() => inputRef.current?.click()}>
            {src ? (en ? "Change" : "Değiştir") : en ? "Upload" : "Yükle"}
          </button>
          {src ? (
            <button type="button" className="btn btn--ghost btn--xs" onClick={onClear} aria-label={en ? `Remove ${label}` : `${label} kaldır`}>
              <Icon name="trash" size={14} />
            </button>
          ) : null}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0] || null;
          e.target.value = "";
          onPick(f);
        }}
      />
    </div>
  );
}
