import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Ícono para iPhone/iPad al guardar la tienda en la pantalla de inicio. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#FBF5EC" }}>
        <svg width="112" height="130" viewBox="0 0 60 70">
          <path d="M17 22C16 9 21 2 30 2s14 7 13 20h-5c1-11-2-15-8-15s-9 4-8 15Z" fill="#4F5537" />
          <path d="M5 21h50l1 46c-9 1-17-1-25 0-9 1-17 0-26 1Z" fill="#4F5537" />
          <circle cx="21.5" cy="31" r="4" fill="#FBF5EC" />
          <rect x="18" y="37.5" width="7" height="22" rx="3.5" fill="#FBF5EC" />
          <path d="M29 29c0-2 1-3 3-3 2 0 3 1 3.5 3l4 19 4-19c.5-2 1.5-3 3.5-3 2 0 3 1 3 3l-6.5 28c-.6 2.4-2 3.5-4 3.5s-3.4-1.1-4-3.5Z" fill="#FBF5EC" />
        </svg>
      </div>
    ),
    size,
  );
}
