import type { Metadata } from "next";
import { Cormorant_Garamond, Nunito_Sans } from "next/font/google";
import "./globals.css";

const nunito = Nunito_Sans({ variable: "--font-nunito", subsets: ["latin"] });
const cormorant = Cormorant_Garamond({ variable: "--font-cormorant", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ivbags | Piezas hechas a mano",
  description: "Bolsos, prendas y accesorios pintados a mano.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return <html lang="es" className={`${nunito.variable} ${cormorant.variable} h-full antialiased`}><body className="min-h-full">{children}</body></html>;
}
