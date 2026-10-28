"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CATEGORIES, type Product } from "@/lib/types";
import { availability, catHref, money } from "@/lib/format";
import { useStore } from "./store-provider";
import { useAuth } from "@/components/auth/auth-provider";
import { Heart, Star } from "./icons";

/** Piezas visibles antes de iniciar sesión (una fila completa del catálogo). */
const PREVIEW = 5;

const TABS: [string, string][] = [["Todos", "Todos"], ["Bolsos", "Bolsos"], ["Prendas", "Prendas"], ["Accesorios", "Accesorios"], ["Personalizados con mascotas", "Con mascotas"], ["Favoritos", "Favoritos"]];
const TITLES: Record<string, string> = { Todos: "Todo el taller", Favoritos: "Tus favoritos" };

export function Categories({ products }: { products: Product[] }) {
  return (
    <div className="cats">
      {CATEGORIES.map((cat, i) => {
        const imgs = products.filter((p) => p.category === cat).flatMap((p) => p.images);
        return (
          <Link className="cat" key={cat} href={`${catHref(cat)}#productos`} aria-label={`Ver ${cat.toLowerCase()}`} style={{ marginTop: i % 2 ? 40 : 0 }}>
            <span className="swap ccard" style={{ background: imgs[0] ? "var(--rosa-suave)" : "var(--soft-olive)" }}>
              {imgs[0] ? <><img src={imgs[0]} alt="" />{imgs[1] && <img className="alt" src={imgs[1]} alt="" />}</>
                : <span className="placeholder"><Star size={34} className="twinkle" /><span className="lb">Pronto</span></span>}
            </span>
            <span className="d cat-name">{cat}</span>
            <span className="lb cat-more">Ver todo →</span>
          </Link>
        );
      })}
    </div>
  );
}

/** Catálogo con filtros. En el inicio se llama "Favoritos de la semana" y filtra sin salir de la portada. */
export function ShopView({ products, petPrice, home }: { products: Product[]; petPrice?: number; home?: boolean }) {
  const params = useSearchParams();
  const cat = params.get("cat") ?? "Todos";
  const { favs } = useStore();
  const { guest, openSignIn } = useAuth();
  const list = products.filter((p) => cat === "Favoritos" ? favs[p.id] : cat === "Todos" ? true : p.category === cat);
  const tabHref = (value: string) => home ? (value === "Todos" ? "/#tienda" : `/?cat=${encodeURIComponent(value)}#tienda`) : `${value === "Todos" ? "/tienda" : catHref(value)}#productos`;
  const Title = home ? "h2" : "h1";

  return (
    <section className="section-shop" id={home ? "tienda" : "productos"}>
      <div className="shop-head">
        <Star size={28} className="twinkle" />
        <div className="lb pink-lb">Recién salidos del taller</div>
        <Title className="d h-shop">{home && cat === "Todos" ? "Favoritos de la semana" : TITLES[cat] ?? cat}</Title>
        <div className="tabs" role="group" aria-label="Filtrar por categoría">
          {TABS.map(([value, label]) => <Link key={value} scroll={false} replace className="navlink" aria-pressed={value === cat} href={tabHref(value)}>{label}</Link>)}
        </div>
      </div>
      {cat === "Personalizados con mascotas" && <div className="pet-note"><div><span className="lb wine">Precio fijo{petPrice ? ` · ${money(petPrice)}` : ""}</span><p>El mismo precio en los 4 tamaños, con el nombre incluido sin costo. Se entrega en 2 semanas.</p></div><Link className="btn btn-line" href="/personaliza">¿Otra idea? Cotízala</Link></div>}
      {guest && cat === "Favoritos" && <div className="gate-card standalone"><Star size={26} className="twinkle" /><h3 className="d">Tus favoritos te esperan</h3><p>Entra con tu correo para guardar y ver las piezas que te gustan.</p><button className="btn btn-solid" onClick={() => openSignIn("favorites")}>Entrar</button></div>}
      {list.length === 0 && !(guest && cat === "Favoritos") && <div className="empty-favs">{cat === "Favoritos" ? "Todavía no tienes favoritos. Toca el corazón de una pieza para guardarla aquí." : "Pronto habrá piezas en esta categoría."}</div>}
      <div className="pgrid">{(guest ? list.slice(0, PREVIEW) : list).map((p, i) => <ProductCard key={p.id} p={p} index={i} />)}</div>
      {guest && list.length > PREVIEW && (
        <div className="preview-gate">
          <div className="pgrid ghost" aria-hidden>{list.slice(PREVIEW, PREVIEW + 5).map((p) => <div key={p.id} className="ghost-card">{p.images[0] && <img src={p.images[0]} alt="" />}</div>)}</div>
          <div className="gate-card">
            <Star size={30} className="twinkle" />
            <h3 className="d">Hay {list.length - PREVIEW} piezas más en el taller</h3>
            <p>Estás viendo una vista previa. Entra con tu correo para ver todo, guardar favoritos y comprar.</p>
            <button className="btn btn-solid" onClick={() => openSignIn("preview")}>Entrar para ver todo</button>
          </div>
        </div>
      )}
    </section>
  );
}

export function ProductCard({ p, index = 0 }: { p: Product; index?: number }) {
  const { favs, toggleFav } = useStore();
  const { guest, openSignIn } = useAuth();
  const av = availability(p);
  const href = `/producto/${p.slug}`;
  return (
    <article className="pcard" style={{ animationDelay: `${Math.min(index, 8) * 50}ms` }}>
      <div className="swap pimg">
        <Link href={href} aria-label={`Ver ${p.name}`} className="pimg-link">
          {p.images[0] ? <img src={p.images[0]} alt={p.name} /> : <span className="placeholder" style={{ background: "var(--soft-olive)" }}><Star size={30} /><span className="lb">Foto pronto</span></span>}
          {p.images[1] && <img className="alt" src={p.images[1]} alt="" />}
        </Link>
        <span className="avail" style={{ background: av.bg, color: av.ink }}>{av.label}</span>
        {p.tag && <span className="h tag">{p.tag}</span>}
        <button className="fav-btn" onClick={() => (guest ? openSignIn("favorites") : toggleFav(p))} aria-label={`Guardar ${p.name} en favoritos`} aria-pressed={!!favs[p.id]}><Heart size={18} filled={!!favs[p.id]} /></button>
      </div>
      <div className="lb pink-lb small">{p.category}</div>
      <Link className="pname" href={href}>{p.name}</Link>
      <div className="price">{money(p.price_cents)}</div>
      <Link className="btn btn-line btn-sm" href={href}>{p.is_pet ? "Personalizar" : p.options.some((o) => o.key === "talla") ? "Elegir talla" : "Ver detalles"}</Link>
    </article>
  );
}
