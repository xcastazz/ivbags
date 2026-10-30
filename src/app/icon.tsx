import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

/** Ícono de la pestaña: la bolsa "iv" recortada del logo oficial. */
export default async function Icon() {
  const png = await readFile(join(process.cwd(), "public/brand/logo-ivbags.png"));
  const src = `data:image/png;base64,${png.toString("base64")}`;
  // El logo mide 823×1280; la bolsa ocupa aprox. x 200–620, y 110–745.
  const scale = 64 / 640;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", overflow: "hidden", position: "relative" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} width={823 * scale} height={1280 * scale} style={{ position: "absolute", left: -(410 - 320) * scale, top: -110 * scale }} alt="" />
      </div>
    ),
    size,
  );
}
