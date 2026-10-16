/** Logo IV Bags: la bolsa con "iV" calado y "bags" al lado. Toma el color de `currentColor`. */
export function Logo({ height = 46, mark = false }: { height?: number; mark?: boolean }) {
  const bag = (
    <g>
      <path d="M17 22C16 9 21 2 30 2s14 7 13 20h-5c1-11-2-15-8-15s-9 4-8 15Z" fill="currentColor" />
      <path d="M5 21h50l1 46c-9 1-17-1-25 0-9 1-17 0-26 1Z" fill="currentColor" />
      <circle cx="21.5" cy="31" r="4" fill="var(--logo-cut, var(--cream))" />
      <rect x="18" y="37.5" width="7" height="22" rx="3.5" fill="var(--logo-cut, var(--cream))" />
      <path d="M29 29c0-2 1-3 3-3 2 0 3 1 3.5 3l4 19 4-19c.5-2 1.5-3 3.5-3 2 0 3 1 3 3l-6.5 28c-.6 2.4-2 3.5-4 3.5s-3.4-1.1-4-3.5Z" fill="var(--logo-cut, var(--cream))" />
    </g>
  );
  if (mark) return <svg viewBox="0 0 60 70" height={height} aria-hidden>{bag}</svg>;
  return (
    <svg viewBox="0 0 168 70" height={height} role="img" aria-label="IV Bags">
      {bag}
      <text x="62" y="62" fill="currentColor" style={{ font: "900 44px var(--font-nunito), sans-serif", letterSpacing: "-2px" }}>bags</text>
    </svg>
  );
}
