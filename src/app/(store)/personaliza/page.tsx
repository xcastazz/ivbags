import type { Metadata } from "next";
import { getContent } from "@/lib/data";
import { Marquee } from "@/components/store/bands";
import { CustomSection, BackHome } from "@/components/store/sections";

export const metadata: Metadata = { title: "Personaliza tu bolso | IV Bags", description: "Cotiza tu idea, pintada a mano en un bolso beige." };

export default async function CustomPage() {
  const c = await getContent();
  return (
    <>
      <BackHome />
      <CustomSection c={c} heading="h1" />
      <Marquee />
    </>
  );
}
