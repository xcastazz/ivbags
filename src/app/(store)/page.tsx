import Link from "next/link";
import { getContent, getProducts } from "@/lib/data";
import { PansyBand } from "@/components/store/bands";
import { Star } from "@/components/store/icons";
import { GuestWelcome } from "@/components/auth/auth-provider";

export default async function Home() {
  const [c, products] = await Promise.all([getContent(), getProducts()]);
  const preview = products.filter((p) => p.images[0]).slice(0, 3);
  return (
    <section className="hero hero-full">
      <PansyBand />
      <div className="hero-body">
        <Star size={38} className="hero-star a twinkle" />
        <Star size={26} variant="burst" className="hero-star b twinkle" />
        <h1 className="d hero-title">{c.heroTitle}<br /><i>{c.heroItalic}</i></h1>
        <p>{c.heroText}</p>
        <div className="actions"><Link className="btn btn-solid" href="/tienda">Ver la tienda</Link><Link className="btn btn-line" href="/personaliza">Personaliza</Link></div>
        {preview.length > 0 && (
          <Link href="/tienda" className="hero-preview" aria-label="Ver lo que hacemos en la tienda">
            {preview.map((p, i) => <figure key={p.id} className={`polaroid p${i}`}><img src={p.images[0]} alt="" /><figcaption className="h">{p.tag ?? p.category}</figcaption></figure>)}
          </Link>
        )}
      </div>
      <PansyBand reverse />
      <GuestWelcome />
    </section>
  );
}
