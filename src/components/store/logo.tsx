const TONES = { oliva: "oliva", crema: "crema", "deep-olive": "deep-olive", vinotinto: "vinotinto", negro: "negro" } as const;

/** Logo horizontal del kit IV Bags (SVG). Oliva en la cabecera, crema en el footer. */
export function Logo({ height = 46, tone = "oliva", className }: { height?: number; tone?: keyof typeof TONES; className?: string }) {
  return <img src={`/kit/logos/ivbags-logo-${TONES[tone]}.svg`} alt="IV Bags" height={height} className={className} style={{ height, width: "auto", display: "block" }} />;
}
