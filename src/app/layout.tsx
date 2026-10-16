import type { Metadata } from "next";
import { Instrument_Serif, Nunito_Sans, Sacramento } from "next/font/google";
import { Toaster } from "@/components/toaster";
import { StoreProvider } from "@/components/store/store-provider";
import { AuthProvider } from "@/components/auth/auth-provider";
import "./globals.css";

const nunito = Nunito_Sans({ variable: "--font-nunito", subsets: ["latin"] });
const instrument = Instrument_Serif({ variable: "--font-serif", subsets: ["latin"], weight: "400", style: ["normal", "italic"] });
const sacramento = Sacramento({ variable: "--font-script", subsets: ["latin"], weight: "400" });

export const metadata: Metadata = {
  title: "ivbags | Piezas hechas a mano",
  description: "Bolsos, prendas y accesorios pintados, bordados y estampados a mano en Medellín.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return <html lang="es" className={`${nunito.variable} ${instrument.variable} ${sacramento.variable} h-full antialiased`}><body className="min-h-full"><StoreProvider><AuthProvider><div vaul-drawer-wrapper="">{children}</div></AuthProvider><Toaster /></StoreProvider></body></html>;
}
