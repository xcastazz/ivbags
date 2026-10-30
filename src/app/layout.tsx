import type { Metadata } from "next";
import { Toaster } from "@/components/toaster";
import { StoreProvider } from "@/components/store/store-provider";
import { AuthProvider } from "@/components/auth/auth-provider";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const DESCRIPTION = "IV Bags (ivbags): bolsos, totebags, prendas y accesorios pintados, bordados y estampados a mano en Medellín. Bolsos personalizados con tu mascota. Envíos a todo Colombia.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "IV Bags | Bolsos y totebags hechos a mano en Medellín",
  description: DESCRIPTION,
  applicationName: "IV Bags",
  keywords: ["ivbags", "iv bags", "totebags pintadas a mano", "bolsos hechos a mano", "bolsos personalizados mascota", "tote bag Medellín", "bolsos artesanales Colombia"],
  openGraph: { type: "website", locale: "es_CO", siteName: "IV Bags", title: "IV Bags | Hecho a mano en Medellín", description: DESCRIPTION },
  robots: { index: true, follow: true },
  ...(process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION && { verification: { google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION } }),
};

/** Le dice a Google que "IV Bags" / "ivbags" es una tienda y cuál es su sitio y su Instagram. */
const BRAND_JSON_LD = JSON.stringify({
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "WebSite", name: "IV Bags", alternateName: ["ivbags", "IV Bags Medellín"], url: SITE_URL },
    { "@type": "Store", name: "IV Bags", alternateName: "ivbags", url: SITE_URL, logo: `${SITE_URL}/brand/logo-ivbags.png`, description: DESCRIPTION, email: "ivbags.taller@gmail.com", telephone: "+573133264049", address: { "@type": "PostalAddress", addressLocality: "Medellín", addressRegion: "Antioquia", addressCountry: "CO" }, sameAs: ["https://instagram.com/iv_totebags"] },
  ],
});

/** Fuentes y estilos del kit IV Bags (public/kit), tal como indica su LEEME. */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className="h-full antialiased">
      <head>
        <link rel="preload" href="/kit/fuentes/instrument-serif-400.woff2" as="font" type="font/woff2" crossOrigin="" />
        <link rel="preload" href="/kit/fuentes/nunito-sans-400.woff2" as="font" type="font/woff2" crossOrigin="" />
        <link rel="stylesheet" href="/kit/css/fuentes.css" />
        <link rel="stylesheet" href="/kit/css/iv-bags.css" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: BRAND_JSON_LD }} />
      </head>
      <body className="min-h-full"><StoreProvider><AuthProvider><div vaul-drawer-wrapper="">{children}</div></AuthProvider><Toaster /></StoreProvider></body>
    </html>
  );
}
