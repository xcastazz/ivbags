import type { Metadata } from "next";
import { getContent } from "@/lib/data";
import { MushBand } from "@/components/store/bands";
import { AboutSection, BackHome } from "@/components/store/sections";

export const metadata: Metadata = { title: "Nosotras | IV Bags", description: "Un taller familiar: tres mujeres, tres oficios." };

export default async function AboutPage() {
  const c = await getContent();
  return (
    <>
      <BackHome />
      <AboutSection c={c} heading />
      <MushBand />
    </>
  );
}
