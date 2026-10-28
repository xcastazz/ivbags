"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CATEGORIES, type Product } from "@/lib/types";
import { catHref, money } from "@/lib/format";
import { useStore } from "./store-provider";
import { Bag, Close, Star, User } from "./icons";
import { CartDrawer } from "./cart-drawer";
import { Logo } from "./logo";
import { useAuth } from "@/components/auth/auth-provider";

const SECTIONS = [["/", "Inicio"], ["/tienda", "Tienda"], ["/blog", "Blog"], ["/contacto", "Contacto"]] as const;

/** Barra Soft Olive + cabecera festoneada: nube "Menú", logo al centro, lupa y bolsa. */
export function Header({ topbar, products }: { topbar: string; products: Product[] }) {
  const { cartCount, setCartOpen } = useStore();
  const { guest, openSignIn } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const path = usePathname();

  // Al cambiar de página se cierran el menú y la búsqueda.
  // eslint-disable-next-line react-hooks/set-state-in-effect -- reset UI on navigation
  useEffect(() => { setMenuOpen(false); setSearchOpen(false); }, [path]);

  return (
    <>
      <div className="topbar lb"><Star size={11} /><span>{topbar}</span><Star size={11} /></div>
      <header className="site-header scal">
        <div className="hdr2">
          <CloudMenu open={menuOpen} setOpen={(o) => { setMenuOpen(o); if (o) setSearchOpen(false); }} />
          <Link className="hlogo" href="/" aria-label="IV Bags, inicio"><Logo className="hlogo2" height={58} /></Link>
          <div className="hicons">
            {guest
              ? <button className="icon-btn acct-btn" onClick={() => openSignIn("account")} aria-label="Iniciar sesión"><User /><span>Entrar</span></button>
              : <Link className="icon-btn acct-btn" href="/cuenta" aria-label="Mi cuenta"><User /><span>Mi cuenta</span></Link>}
            <button className="icon-btn" aria-label={searchOpen ? "Cerrar búsqueda" : "Buscar"} aria-expanded={searchOpen} aria-controls="buscar" onClick={() => { setSearchOpen((o) => !o); setMenuOpen(false); }}>
              {searchOpen ? <Close size={20} /> : <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden><circle cx="10.5" cy="10.5" r="6.5" /><path d="M15.5 15.5 20 20" /></svg>}
            </button>
            <button className="icon-btn" onClick={() => (guest ? openSignIn("cart") : setCartOpen(true))} aria-label={guest ? "Bolsa (inicia sesión)" : `Abrir bolsa (${cartCount})`}><Bag /><span className="badge" key={cartCount}>{guest ? 0 : cartCount}</span></button>
          </div>
        </div>
        <SearchBar open={searchOpen} products={products} onClose={() => setSearchOpen(false)} />
      </header>
      <CartDrawer />
    </>
  );
}

function CloudMenu({ open, setOpen }: { open: boolean; setOpen: (open: boolean) => void }) {
  const { guest, openSignIn } = useAuth();
  const ref = useRef<HTMLDivElement>(null);
  const [shopOpen, setShopOpen] = useState(false);

  // Se cierra al tocar fuera o con Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("pointerdown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open, setOpen]);

  const close = () => setOpen(false);
  return (
    <div className="mwrap" ref={ref}>
      <button className="mbtn" aria-expanded={open} aria-controls="menu-principal" onClick={() => setOpen(!open)}>Menú</button>
      <nav id="menu-principal" className="mpanel" data-open={open} aria-label="Principal" inert={!open}>
        {SECTIONS.map(([href, label]) => href === "/tienda"
          ? (
            <div key={href} className="msub" data-open={shopOpen}>
              <button className="ddi msub-btn" aria-expanded={shopOpen} aria-controls="menu-tienda" onClick={() => setShopOpen(!shopOpen)}>
                {label}<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden><path d="m3 4.5 3 3 3-3" /></svg>
              </button>
              <div id="menu-tienda" className="msub-list" inert={!shopOpen}>
                <div>
                  <Link className="ddi" href="/tienda" onClick={close}>Ver todo</Link>
                  {CATEGORIES.map((c) => <Link className="ddi" key={c} href={catHref(c)} onClick={close}>{c === "Personalizados con mascotas" ? "Con mascotas" : c}</Link>)}
                </div>
              </div>
            </div>
          )
          : <Link className="ddi" key={href} href={href} onClick={close}>{label}</Link>)}
        <hr className="msep" />
        {guest
          ? <button className="ddi" onClick={() => { close(); openSignIn("account"); }}>Entrar</button>
          : <Link className="ddi" href="/cuenta" onClick={close}>Mi cuenta</Link>}
      </nav>
    </div>
  );
}

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

/** Barra de búsqueda debajo de la cabecera: filtra por nombre, categoría o técnica. */
function SearchBar({ open, products, onClose }: { open: boolean; products: Product[]; onClose: () => void }) {
  const [q, setQ] = useState("");
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => { if (open) input.current?.focus(); }, [open]);
  const term = norm(q.trim());
  const results = term ? products.filter((p) => [p.name, p.category, p.tag ?? ""].some((v) => norm(v).includes(term))) : [];

  return (
    <div id="buscar" className="searchbar" data-open={open} inert={!open}>
      <div>
        <div className="search-inner">
          <form role="search" onSubmit={(e) => e.preventDefault()} className="search-form">
            <label className="sr-only" htmlFor="q">Buscar</label>
            <input id="q" ref={input} className="field" type="search" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Escape" && onClose()} placeholder="Busca por nombre, categoría o técnica" autoComplete="off" />
          </form>
          {term && (
            <div className="search-results" aria-live="polite">
              <div className="lb pink-lb">{results.length ? <>Resultados para “{q.trim()}”</> : <>No encontramos piezas para “{q.trim()}”</>}</div>
              {results.length === 0 && <p className="search-empty">Prueba con “bolso”, “serigrafía” o “bordado a mano”.</p>}
              <div className="search-grid">
                {results.slice(0, 8).map((p) => (
                  <Link key={p.id} href={`/producto/${p.slug}`} className="search-item" onClick={onClose}>
                    <span className="search-thumb">{p.images[0] ? <img src={p.images[0]} alt="" /> : <Star size={20} />}</span>
                    <span><span className="d">{p.name}</span><small>{p.tag ?? p.category} · {money(p.price_cents)}</small></span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
