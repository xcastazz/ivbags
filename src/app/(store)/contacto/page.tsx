import type { Metadata } from "next";
import { getContent } from "@/lib/data";
import { ContactSection, BackHome } from "@/components/store/sections";

export const metadata: Metadata = { title: "Contacto | IV Bags", description: "Pedidos al por mayor, regalos o cualquier duda." };

export default async function ContactPage() {
  const c = await getContent();
  return <><BackHome /><ContactSection c={c} heading="h1" /></>;
}
