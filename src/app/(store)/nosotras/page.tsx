import type { Metadata } from "next";
import Link from "next/link";
import { getContent, getProducts } from "@/lib/data";
import { Lace, MushBand } from "@/components/store/bands";
import { Star } from "@/components/store/icons";

export const metadata: Metadata = { title: "Quiénes somos | IV Bags", description: "Un taller familiar: tres oficios, una bolsa." };

export default async function AboutPage() {
  const [c, products] = await Promise.all([getContent(), getProducts()]);
  const photos = products.flatMap((p) => p.images).slice(0, 2);
  return (
    <>
      <section className="section-story">
        <Lace tone="cream" />
        <div className="story-inner">
          <div className="story-photos" aria-hidden>
            {photos[0] && <figure className="framed olive-frame tilt-l"><img src={photos[0]} alt="" /></figure>}
            {photos[1] && <figure className="framed pink-frame tilt-r"><img src={photos[1]} alt="" /></figure>}
            <Star size={44} className="story-star twinkle" />
          </div>
          <div className="story-copy">
            <h1 className="d h-xl">{c.aboutTitle} <i>{c.aboutItalic}</i></h1>
            <p>{c.aboutText}</p>
            <ul className="team">
              {c.team.map((t) => <li key={t.name}><span className="d">{t.name}</span><span><b className="lb">{t.who}</b>{t.craft}</span></li>)}
            </ul>
            <div className="actions left"><Link className="btn btn-line on-dark" href="/tienda">Ver lo que hacemos</Link></div>
          </div>
          <img className="envelope bob" src="/brand/sobre.png" alt="Carta: tres mujeres creando bolsos, prendas y accesorios hechos a mano. Cada pieza se pinta, borda o graba a mano con amor, arte y memoria." />
        </div>
        <Lace tone="cream" />
      </section>
      <MushBand />
    </>
  );
}
