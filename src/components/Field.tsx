"use client";

import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

interface Base {
  id: string;
  label: string;
  required?: boolean;
  hint?: ReactNode;
  error?: string;
}

function Wrap({ id, label, required, hint, error, children }: Base & { children: ReactNode }) {
  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>
        {label}
        {required && <span className="req" aria-hidden="true">*</span>}
      </label>
      {children}
      {hint && !error && <p id={`${id}-h`} className="field__hint">{hint}</p>}
      {error && (
        <p id={`${id}-e`} className="field__error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function describedBy(id: string, hint?: ReactNode, error?: string) {
  if (error) return `${id}-e`;
  if (hint) return `${id}-h`;
  return undefined;
}

export function TextField({
  id,
  label,
  required,
  hint,
  error,
  ...rest
}: Base & Omit<InputHTMLAttributes<HTMLInputElement>, "id">) {
  return (
    <Wrap id={id} label={label} required={required} hint={hint} error={error}>
      <input
        id={id}
        className="input"
        aria-required={required || undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        {...rest}
      />
    </Wrap>
  );
}

export function TextAreaField({
  id,
  label,
  required,
  hint,
  error,
  ...rest
}: Base & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id">) {
  return (
    <Wrap id={id} label={label} required={required} hint={hint} error={error}>
      <textarea
        id={id}
        className="textarea"
        aria-required={required || undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        {...rest}
      />
    </Wrap>
  );
}

export function SelectField({
  id,
  label,
  required,
  hint,
  error,
  children,
  ...rest
}: Base & Omit<SelectHTMLAttributes<HTMLSelectElement>, "id">) {
  return (
    <Wrap id={id} label={label} required={required} hint={hint} error={error}>
      <select
        id={id}
        className="select"
        aria-required={required || undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        {...rest}
      >
        {children}
      </select>
    </Wrap>
  );
}
