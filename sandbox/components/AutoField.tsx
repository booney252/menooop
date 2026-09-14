"use client";

import { useEffect, useState } from "react";

type Common = {
  value: string;
  onSave: (value: string) => void | Promise<void>;
  placeholder?: string;
  className?: string;
  bare?: boolean;
};

// A text input that keeps its own draft and saves on blur (or Enter).
export function AutoInput({
  value,
  onSave,
  placeholder,
  className = "",
  bare,
  type = "text",
  ...rest
}: Common & { type?: string } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onBlur" | "type" | "className">) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  const commit = () => {
    if (draft !== value) void onSave(draft);
  };
  return (
    <input
      {...rest}
      type={type}
      className={`${bare ? "field-bare" : "field"} ${className}`}
      value={draft}
      placeholder={placeholder}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        if (e.key === "Escape") {
          setDraft(value);
          (e.target as HTMLInputElement).blur();
        }
      }}
    />
  );
}

export function AutoTextarea({
  value,
  onSave,
  placeholder,
  className = "",
  bare,
  rows = 4,
  ...rest
}: Common & Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "value" | "onBlur" | "className">) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  return (
    <textarea
      {...rest}
      rows={rows}
      className={`${bare ? "field-bare" : "field"} ${className}`}
      value={draft}
      placeholder={placeholder}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        if (draft !== value) void onSave(draft);
      }}
    />
  );
}

// Integer input; empty means null. Saves on blur.
export function AutoNumber({
  value,
  onSave,
  className = "",
  bare,
  placeholder,
}: {
  value: number | null;
  onSave: (value: number | null) => void | Promise<void>;
  className?: string;
  bare?: boolean;
  placeholder?: string;
}) {
  const str = value === null || value === undefined ? "" : String(value);
  const [draft, setDraft] = useState(str);
  useEffect(() => setDraft(str), [str]);
  return (
    <input
      type="text"
      inputMode="numeric"
      className={`${bare ? "field-bare" : "field"} text-right tabular-nums ${className}`}
      value={draft}
      placeholder={placeholder}
      onChange={(e) => setDraft(e.target.value.replace(/[^\d-]/g, ""))}
      onBlur={() => {
        const next = draft.trim() === "" ? null : Number.parseInt(draft, 10);
        const clean = next === null || Number.isNaN(next) ? null : next;
        if (clean !== value) void onSave(clean);
        setDraft(clean === null ? "" : String(clean));
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
      }}
    />
  );
}

export function AutoSelect<T extends string>({
  value,
  options,
  onSave,
  className = "",
  bare,
  labels,
}: {
  value: T;
  options: readonly T[];
  onSave: (value: T) => void | Promise<void>;
  className?: string;
  bare?: boolean;
  labels?: Partial<Record<T, string>>;
}) {
  return (
    <select
      className={`${bare ? "field-bare" : "field"} ${className}`}
      value={value}
      onChange={(e) => void onSave(e.target.value as T)}
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {labels?.[o] ?? o}
        </option>
      ))}
    </select>
  );
}
