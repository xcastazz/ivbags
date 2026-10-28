import Link from "next/link";
import type { Post, Product, SiteContent } from "@/lib/types";
import { catHref, formatDate, waLink } from "@/lib/format";
import { Categories } from "./shop";
import { ContactForm, IdeaForm } from "./home-forms";
import { Lace, PansyBand } from "./bands";
import { Star } from "./icons";

const NUMS = ["uno", "dos", "tres"];

/** 3 · Portada: franja de flores, título, texto, dos botones y franja de flores en sentido contrario. */
export function Hero({ c }: { c: SiteContent }) {
  return (
    <section id="inicio" className="hero">
      <PansyBand />
      <div className="herotxt">
        <Star size={35} variant="burst" className="twinkle b hero-star" />
        <h1 className="d hero-title">{c.heroTitle}<br /><i>{c.heroItalic}</i></h1>
        <p>{c.heroText}</p>
        <div className="hero-actions"><Link className="btn btn-solid" href="/#tienda">Ver productos</Link><Link className="btn btn-line" href="/#personaliza">Personaliza tu bolso</Link></div>
      </div>
      <PansyBand reverse />
    </section>
  );
}

/** 4 · Compra por categoría. */
export function CategorySection({ products, title }: { products: Product[]; title?: string }) {
  return (
    <section id="categorias" className="section-cats" aria-label="Compra por categoría">
      {title ? <h1 className="d h-shop">{title}</h1> : <div className="lb pink-lb">Compra por categoría</div>}
      <Categories products={products} />
    </section>
  );
}

/** 8 · Personaliza tu bolso: tarjeta Soft Olive con costura. */
export function CustomSection({ c, heading = "h2" }: { c: SiteContent; heading?: "h1" | "h2" }) {
  const H = heading;
  return (
    <section id="personaliza" className="section-custom">
      <div className="center-head">
        <H className="d h-custom">Personaliza tu bolso</H>
        <p>{c.customIntro.replace(/\s*Si es tu mascota.*$/, "")} Si es tu mascota, mira los <Link className="inline-link" href={catHref("Personalizados con mascotas")}>personalizados con precio fijo</Link>.</p>
      </div>
      <div className="sewn sewn-card">
        <span className="xs" style={{ left: 22, top: 22 }} aria-hidden /><span className="xs" style={{ right: 22, top: 22 }} aria-hidden />
        <span className="xs" style={{ left: 22, bottom: 22 }} aria-hidden /><span className="xs" style={{ right: 22, bottom: 22 }} aria-hidden />
        <div className="sewn-copy">
          <div className="d sewn-title">Cotiza tu idea, pintada a mano en un bolso <i>beige</i></div>
          <ol className="steps">{c.customSteps.map((s, i) => <li key={i}><span className="d">{NUMS[i] ?? i + 1}</span>{s}</li>)}</ol>
          <div className="beige-pill"><span className="swatch" /><span><span className="lb wine">Solo en tela beige</span><small>La única tela que personalizamos</small></span></div>
        </div>
        <IdeaForm whatsapp={c.whatsapp} />
      </div>
    </section>
  );
}

/** 9 · Sobre nosotras: la nota sale del sobre y la estampilla guarda la foto de las tres. */
export function AboutSection({ c, heading }: { c: SiteContent; heading?: boolean }) {
  return (
    <section id="historia" className="section-about">
      {heading ? <h1 className="lb pink-lb">Sobre nosotras</h1> : <div className="lb pink-lb">Sobre nosotras</div>}
      <div className="env">
        <div className="env-back" />
        <div className="env-flap"><div className="env-lining" /></div>
        <div className="env-note bob">
          <div className="d env-title">oficios de cada una</div>
          <div className="env-lines">
            {c.team.map((t) => <span key={t.name}><b className="lb">{t.who}</b> · {t.name}, {t.craft.charAt(0).toLowerCase() + t.craft.slice(1)}</span>)}
            <span className="env-sign">Todo hecho con cariño, desde nuestras habilidades y pasiones.</span>
          </div>
        </div>
        <div className="env-front" />
        <div className="stamp bob b"><div className="stamp-in"><Star size={34} className="twinkle" /></div></div>
      </div>
    </section>
  );
}

const PLACEHOLDER_POSTS = [["Feria", "Nuestra próxima feria"], ["Taller", "Taller de pintura en tela"], ["Evento", "Nos vemos pronto"]];
const EGGS = [["var(--deep-olive)", "var(--fondo)", -5], ["var(--moroccan-leather)", "var(--fondo)", 3], ["var(--soft-olive)", "var(--texto)", -2]] as const;

/** 11 · Blog: ferias, talleres y eventos en óvalos. */
export function BlogSection({ posts, heading }: { posts: Post[]; heading?: boolean }) {
  const shown = posts.length ? posts : PLACEHOLDER_POSTS.map(([kind, title], i) => ({ id: `p${i}`, kind, title, place: "Medellín", event_date: null }) as Post);
  return (
    <section id="ferias" className="section-blog">
      <svg className="blog-wave" viewBox="0 0 1440 70" preserveAspectRatio="none" aria-hidden><path d="M0 70 L0 34 C 240 2 470 0 720 30 C 970 60 1200 62 1440 22 L1440 70 Z" fill="var(--mantequilla)" /></svg>
      <div className="blog-bg">
        <div className="blog-inner">
          <div className="blog-head">
            <div><div className="lb wine">Ferias, talleres y eventos</div>{heading ? <h1 className="d h-blog">Blog</h1> : <h2 className="d h-blog">Blog</h2>}</div>
            {!heading && <Link className="btn btn-line" href="/blog">Ver el blog</Link>}
          </div>
          <div className="eggs">
            {shown.map((p, i) => {
              const [bg, ink, rot] = EGGS[i % 3];
              return (
                <article key={p.id} className="egg" style={{ background: bg, color: ink, transform: `rotate(${rot}deg)` }}>
                  <span className="lb">{p.kind}</span>
                  <span className="d egg-date">{formatDate(p.event_date)}</span>
                  <span className="d egg-title">{p.title}</span>
                  {p.place && <span className="egg-place">{p.place}</span>}
                </article>
              );
            })}
          </div>
          {heading && posts.some((p) => p.body) && (
            <div className="post-list">{posts.filter((p) => p.body).map((p) => <article key={p.id}>{p.image_url && <img src={p.image_url} alt="" />}<h2 className="d">{p.title}</h2><p>{p.body}</p></article>)}</div>
          )}
        </div>
      </div>
    </section>
  );
}

/** 13 · Hablemos, en Deep Olive con encaje arriba y abajo. */
export function ContactSection({ c, heading = "h2" }: { c: SiteContent; heading?: "h1" | "h2" }) {
  const H = heading;
  return (
    <section id="contacto" className="section-contact">
      <Lace />
      <div className="contact-inner">
        <div className="contact-copy">
          <div className="lb" style={{ color: "var(--rosa-suave)" }}>Escríbenos</div>
          <H className="d h-contact">Hablemos</H>
          <p>Pedidos al por mayor, regalos o cualquier duda.</p>
          <div className="contact-links">
            <a href={waLink(c.whatsapp)} target="_blank" rel="noopener">WhatsApp · +{c.whatsapp.replace(/^(\d{2})(\d{3})(\d{3})(\d+)$/, "$1 $2 $3 $4")}</a>
            <a href={`https://instagram.com/${c.instagram}`} target="_blank" rel="noopener">Instagram · @{c.instagram}</a>
            <a href={`mailto:${c.email}`}>Correo · {c.email}</a>
          </div>
        </div>
        <ContactForm whatsapp={c.whatsapp} />
      </div>
      <Lace />
    </section>
  );
}

/** Enlace para volver a la portada desde las páginas internas. */
export function BackHome() {
  return <div className="page-back"><Link className="back-link" href="/">← Volver al inicio</Link></div>;
}
