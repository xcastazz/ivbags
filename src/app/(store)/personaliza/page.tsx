import type { Metadata } from "next";
import Link from "next/link";
import { getContent } from "@/lib/data";
import { catHref } from "@/lib/format";
import { IdeaForm } from "@/components/store/home-forms";
import { Marquee } from "@/components/store/bands";

export const metadata: Metadata = { title: "Personaliza tu bolso | IV Bags", description: "Cotiza tu idea, pintada a mano en un bolso beige." };
const NUMS = ["uno", "dos", "tres"];

export default async function CustomPage() {
  const c = await getContent();
  return (
    <>
      <section className="section-custom">
        <div className="center-head">
          <h1 className="d h-xl">Personaliza tu bolso</h1>
          <p>{c.customIntro} <Link className="inline-link" href={catHref("Personalizados con mascotas")}>Ver personalizados con mascotas</Link></p>
        </div>
        <div className="sewn">
          <div className="sewn-copy">
            <div className="d sewn-title">Cotiza tu idea, pintada a mano en un bolso <i>beige</i></div>
            <ol className="steps">{c.customSteps.map((s, i) => <li key={i}><span className="d">{NUMS[i] ?? i + 1}</span>{s}</li>)}</ol>
            <div className="beige-pill"><span className="swatch" /><span><span className="lb wine">Solo en tela beige</span><small>La única tela que personalizamos</small></span></div>
          </div>
          <IdeaForm whatsapp={c.whatsapp} />
        </div>
      </section>
      <Marquee phrases={[["Forradas, con bolsillo y cierre", true], ["hechas a mano", false]]} />
    </>
  );
}
