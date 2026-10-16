"use client";

import { ClipboardEvent, KeyboardEvent, useRef, type CSSProperties } from "react";

/** Una casilla por dígito del código: avanza solo, acepta pegar el código completo. */
export function OtpInput({ value, onChange, length = 6, disabled, invalid }: { value: string; onChange: (v: string) => void; length?: number; disabled?: boolean; invalid?: boolean }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length }, (_, i) => value[i] ?? "");

  function set(i: number, d: string) {
    const next = (value.slice(0, i) + d + value.slice(i + 1)).slice(0, length);
    onChange(next.replace(/\D/g, ""));
  }
  function onKey(i: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[i] && i > 0) { refs.current[i - 1]?.focus(); onChange(value.slice(0, i - 1)); e.preventDefault(); }
    if (e.key === "ArrowLeft" && i > 0) refs.current[i - 1]?.focus();
    if (e.key === "ArrowRight" && i < length - 1) refs.current[i + 1]?.focus();
  }
  function onPaste(e: ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!pasted) return;
    e.preventDefault();
    onChange(pasted);
    refs.current[Math.min(pasted.length, length - 1)]?.focus();
  }

  return (
    <div className={`otp${invalid ? " shake" : ""}`} style={{ "--n": length } as CSSProperties} role="group" aria-label="Código de verificación">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          className={`otp-box${d ? " filled" : ""}`}
          style={{ animationDelay: `${i * 45}ms` }}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          aria-label={`Dígito ${i + 1}`}
          maxLength={1}
          value={d}
          disabled={disabled}
          autoFocus={i === 0}
          onPaste={onPaste}
          onKeyDown={(e) => onKey(i, e)}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, "");
            if (v.length > 1) { onChange(v.slice(0, length)); refs.current[Math.min(v.length, length - 1)]?.focus(); return; }
            set(i, v);
            if (v && i < length - 1) refs.current[i + 1]?.focus();
          }}
        />
      ))}
    </div>
  );
}
