import type { MetadataRoute } from "next";
import { getProducts } from "@/lib/data";
import { SITE_URL } from "@/lib/site";

/** Mapa del sitio para Google: páginas fijas y cada producto. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getProducts();
  const pages = ["", "/tienda", "/favoritos", "/personaliza", "/nosotras", "/blog", "/contacto", "/legal/terminos", "/legal/privacidad", "/legal/envios", "/legal/cambios-y-devoluciones"];
  return [
    ...pages.map((p) => ({ url: `${SITE_URL}${p}`, changeFrequency: "weekly" as const, priority: p === "" ? 1 : p.startsWith("/legal") ? 0.3 : 0.8 })),
    ...products.map((p) => ({ url: `${SITE_URL}/producto/${p.slug}`, changeFrequency: "weekly" as const, priority: 0.9, images: p.images.slice(0, 1) })),
  ];
}
