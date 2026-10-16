"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Drawer } from "vaul";
import { CATEGORIES } from "@/lib/types";
import { catHref } from "@/lib/format";
import { useStore } from "./store-provider";
import { Bag, Heart, Star, User } from "./icons";
import { CartDrawer } from "./cart-drawer";
import { Logo } from "./logo";
import { useAuth } from "@/components/auth/auth-provider";

const SECTIONS = [["/personaliza", "Personaliza"], ["/nosotras", "Quiénes somos"], ["/blog", "Blog"]] as const;

export function Header({ topbar }: { topbar: string }) {
  const { cartCount, favCount, setCartOpen } = useStore();
  const { guest, user, openSignIn } = useAuth();
  const path = usePathname();
  const current = (href: string) => (path === href || path.startsWith(`${href}/`) ? "page" : undefined);
  return (
    <>
      <div className="topbar lb"><Star size={12} /><span>{topbar}</span><Star size={12} variant="burst" /></div>
      <header className="site-header scal">
        <div className="hdr">
          <nav className="hnav" aria-label="Principal">
            <div className="dd">
              <Link className="navlink" href="/tienda" aria-current={current("/tienda") ?? current("/producto")} aria-haspopup="true">Tienda <span aria-hidden>▾</span></Link>
              <div className="ddmenu">
                {CATEGORIES.map((cat) => <Link className="ddi" key={cat} href={catHref(cat)}>{cat}</Link>)}
                <Link className="ddi ddi-all" href="/tienda">Ver todo</Link>
              </div>
            </div>
            {SECTIONS.map(([href, label]) => <Link className="navlink" key={href} href={href} aria-current={current(href)}>{label}</Link>)}
          </nav>
          <MobileMenu />
          <Link className="hlogo" href="/" aria-label="IV Bags, inicio"><Logo /></Link>
          <div className="hicons">
            <Link className="navlink hide-sm" href="/contacto" aria-current={current("/contacto")}>Contacto</Link>
            {guest
              ? <button className="enter-pill" onClick={() => openSignIn("account")}><User size={16} />Entrar</button>
              : <Link className="icon-btn hide-xs" href="/cuenta" aria-label="Mi cuenta"><User />{user && <span className="user-dot" aria-hidden />}</Link>}
            {guest
              ? <button className="icon-btn" onClick={() => openSignIn("favorites")} aria-label="Favoritos (inicia sesión)"><Heart /></button>
              : <Link className="icon-btn" href={catHref("Favoritos")} aria-label={`Favoritos (${favCount})`}><Heart />{favCount > 0 && <span className="badge badge-pink">{favCount}</span>}</Link>}
            <button className="icon-btn" onClick={() => (guest ? openSignIn("cart") : setCartOpen(true))} aria-label={guest ? "Bolsa (inicia sesión)" : `Abrir bolsa (${cartCount})`}><Bag />{!guest && cartCount > 0 && <span className="badge">{cartCount}</span>}</button>
          </div>
        </div>
      </header>
      <CartDrawer />
    </>
  );
}

function MobileMenu() {
  const links: [string, string][] = [["/tienda", "Tienda"], ...CATEGORIES.map((c): [string, string] => [catHref(c), `· ${c}`]), ...SECTIONS.map(([h, l]): [string, string] => [h, l]), ["/contacto", "Contacto"], ["/cuenta", "Mi cuenta"]];
  return (
    <Drawer.Root>
      <Drawer.Trigger className="menu-trigger" aria-label="Abrir menú"><span /><span /><span /></Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="drawer-overlay" />
        <Drawer.Content className="drawer-content">
          <div className="drawer-handle" aria-hidden />
          <Drawer.Title className="drawer-title d">Menú</Drawer.Title>
          <Drawer.Description className="sr-only">Navegación de IV Bags</Drawer.Description>
          <nav className="drawer-links">{links.map(([href, label]) => <Drawer.Close asChild key={href}><Link href={href} className={label.startsWith("·") ? "sub" : undefined}>{label.replace("· ", "")}</Link></Drawer.Close>)}</nav>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
