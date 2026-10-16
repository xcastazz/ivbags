import type { Metadata } from "next";
import Link from "next/link";
import { getContent, getPosts, getProducts } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { Star } from "@/components/store/icons";

export const metadata: Metadata = { title: "Blog | IV Bags", description: "Ferias, talleres y eventos donde encontrarnos." };

export default async function BlogPage() {
  const [posts, c, products] = await Promise.all([getPosts(), getContent(), getProducts()]);
  const insta = products.flatMap((p) => p.images).filter((src, i, all) => all.indexOf(src) === i);
  return (
    <section className="section-blog">
      <div className="blog-inner">
        <div className="blog-head"><div><div className="lb wine">Ferias, talleres y eventos</div><h1 className="d h-lg">Dónde encontrarnos</h1></div><Link className="btn btn-line" href="/contacto">Escríbenos</Link></div>
        {posts.length === 0 && <div className="empty-favs">Pronto publicamos nuestras próximas ferias y talleres. Síguenos en Instagram para enterarte primero.</div>}
        <div className="fairs">
          {posts.map((p, i) => (
            <article key={p.id} className="fair" style={{ rotate: `${[-2, 1.5, -1][i % 3]}deg` }}>
              {p.image_url && <img className="fair-img" src={p.image_url} alt="" />}
              <span className="date-oval d">{formatDate(p.event_date)}</span>
              <span className="lb pink">{p.kind}</span>
              <h2 className="d fair-title">{p.title}</h2>
              {p.place && <small>{p.place}</small>}
              {p.body && <p className="fair-body">{p.body}</p>}
            </article>
          ))}
        </div>
      </div>
      {insta.length > 0 && <div className="insta">
        <a className="insta-head" href={`https://instagram.com/${c.instagram}`} target="_blank" rel="noopener"><Star size={16} /><span className="lb">Síguenos en Instagram · @{c.instagram}</span><Star size={16} variant="burst" /></a>
        <div className="marquee" aria-hidden><div className="itrack">{[...insta, ...insta, ...insta].map((src, i) => <span key={i} className="iph"><img src={src} alt="" /></span>)}</div></div>
      </div>}
    </section>
  );
}
