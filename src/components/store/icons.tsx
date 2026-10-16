import type { SVGProps } from "react";

/** Estrella de carboncillo: "spark" de 4 puntas (oliva) o "burst" de 6 puntas finas (vinotinto). */
export function Star({ size = 16, variant = "spark", className, ...props }: SVGProps<SVGSVGElement> & { size?: number; variant?: "spark" | "burst" }) {
  const d = variant === "spark"
    ? "M12.4 .8 14 9.6l9.4 1.9-9.2 2.3-1.6 9.6-1.9-9.4L.6 12.1l9.7-2.4Z"
    : "M12 1.5 13.3 10l7.4-4.6-5.6 6.4 7.4 1.1-7.6 1 4.6 7.1-6.3-5.5L12 22.5 10.9 15l-6.4 5.4 4.7-7.3-7.7-.9 7.6-1.1L3.4 5.2l7.2 4.7Z";
  return <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden className={className} {...props}><path d={d} fill="currentColor" stroke="currentColor" strokeWidth=".6" strokeLinejoin="round" /></svg>;
}

export function Heart({ filled, size = 20 }: { filled?: boolean; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "var(--pink)" : "none"} stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden><path d="M12 20C5 15 3 11.5 3 8.5 3 6 5 4 7.5 4c2 0 3.5 1.2 4.5 3 1-1.8 2.5-3 4.5-3C19 4 21 6 21 8.5c0 3-2 6.5-9 11.5Z" /></svg>;
}

export function Bag({ size = 21 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 8h14l-1 12H6Z" /><path d="M9 8c0-4.5 6-4.5 6 0" /></svg>;
}

export function User({ size = 20 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden><circle cx="12" cy="8.5" r="4" /><path d="M4.5 20.5c1.2-4 4-6 7.5-6s6.3 2 7.5 6" /></svg>;
}

export function Close({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><path d="M6 6l12 12M18 6 6 18" /></svg>;
}

export function Trash({ size = 18 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden><path d="M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13" /></svg>;
}

const STROKE = { stroke: "#5B3F3A", strokeWidth: 1.7, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
const STEM = "#F6EEDC";

const MUSHROOMS = [
  { vb: "0 0 60 80", w: 36, body: <><path d="M24 41C25 56 23 68 21 78h14c-1-10-1-22 1-37Z" fill={STEM} /><path d="M8 40C8 16 52 16 52 40c-12 3-32 3-44 0Z" fill="#9E5A55" /><circle cx="22" cy="30" r="2.4" fill="#FBF5EC" /><circle cx="33" cy="25" r="2" fill="#FBF5EC" /><circle cx="42" cy="33" r="2.2" fill="#FBF5EC" /><circle cx="30" cy="36" r="1.6" fill="#FBF5EC" /></> },
  { vb: "0 0 70 80", w: 42, body: <><path d="M31 37c-1 15 2 29-2 41h10c2-12-1-26 0-41Z" fill={STEM} /><path d="M4 34c6-12 56-14 62-2-10 6-52 7-62 2Z" fill="#B98D84" /><path d="M18 36l10 1M44 37l10-2" fill="none" /></> },
  { vb: "0 0 44 80", w: 26, body: <><path d="M21 26c1 18-2 36 2 52h3c-3-16 0-34-2-52Z" fill={STEM} /><path d="M8 24c2-12 26-12 28 0-8 3-20 3-28 0Z" fill="#EFE4C9" /></> },
  { vb: "0 0 54 80", w: 32, body: <><path d="M22 45c1 13-1 24-2 33h12c0-9-1-20 0-33Z" fill={STEM} /><path d="M9 44C9 26 18 12 27 11c9 1 18 15 18 33-9 3-27 3-36 0Z" fill="#C3C59B" /></> },
  { vb: "0 0 56 80", w: 33, body: <><path d="M14 58c0 8-1 14-2 20h8c-1-6-1-12 0-20Z" fill={STEM} /><path d="M5 59c0-13 24-13 24 0-7 2-17 2-24 0Z" fill="#D9B8AE" /><path d="M38 64c0 6 0 10-1 14h6c-1-4-1-8 0-14Z" fill={STEM} /><path d="M31 65c0-10 19-10 19 0-6 2-13 2-19 0Z" fill="#D9B8AE" /></> },
  { vb: "0 0 64 80", w: 38, body: <><path d="M27 39c1 15-2 28-3 39h12c-1-12 0-24 0-39Z" fill={STEM} /><path d="M6 38c2-14 16-22 28-21 12 1 24 9 24 20-8 3-18-1-26 3-8 2-18 0-26-2Z" fill="#6D4546" /></> },
  { vb: "0 0 40 80", w: 24, body: <><path d="M17 53c0 9-1 17-2 25h8c0-8-1-16 0-25Z" fill={STEM} /><path d="M7 52c2-12 8-22 13-24 5 2 11 12 13 24-7 2-19 2-26 0Z" fill="#C7905E" /></> },
];

export function Mushroom({ type, height = 48 }: { type: number; height?: number }) {
  const m = MUSHROOMS[type % MUSHROOMS.length];
  return <svg viewBox={m.vb} width={(m.w * height) / 48} height={height} style={{ display: "block" }} aria-hidden><g {...STROKE}>{m.body}</g></svg>;
}
