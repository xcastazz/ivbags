import type { CSSProperties } from "react";

const STARS = { spark: "estrella-oliva", burst: "estrella-vinotinto", cream: "estrella-crema" } as const;

/** Estrella del kit IV Bags: oliva ("spark"), vinotinto ("burst") o crema. Con `twinkle` gira despacio. */
export function Star({ size = 16, variant = "spark", className, style }: { size?: number; variant?: keyof typeof STARS; className?: string; style?: CSSProperties }) {
  return <img src={`/kit/ilustraciones/estrellas/${STARS[variant]}.png`} alt="" aria-hidden width={size} height={size} className={className} style={{ width: size, height: size, flex: "none", ...style }} />;
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
