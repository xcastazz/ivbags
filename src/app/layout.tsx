import type { Metadata } from "next";
import { Toaster } from "@/components/toaster";
import { StoreProvider } from "@/components/store/store-provider";
import { AuthProvider } from "@/components/auth/auth-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "IV Bags | Piezas hechas a mano",
  description: "Bolsos, prendas y accesorios pintados, bordados y estampados a mano en Medellín.",
};

/** Fuentes y estilos del kit IV Bags (public/kit), tal como indica su LEEME. */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className="h-full antialiased">
      <head>
        <link rel="preload" href="/kit/fuentes/instrument-serif-400.woff2" as="font" type="font/woff2" crossOrigin="" />
        <link rel="preload" href="/kit/fuentes/nunito-sans-400.woff2" as="font" type="font/woff2" crossOrigin="" />
        <link rel="stylesheet" href="/kit/css/fuentes.css" />
        <link rel="stylesheet" href="/kit/css/iv-bags.css" />
      </head>
      <body className="min-h-full"><StoreProvider><AuthProvider><div vaul-drawer-wrapper="">{children}</div></AuthProvider><Toaster /></StoreProvider></body>
    </html>
  );
}
