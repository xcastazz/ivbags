import { MobileMenu } from "@/components/mobile-menu";
import { CustomizationForm } from "@/components/customization-form";

export default function Home() {
  const products = [
    ["Tote Pensamiento", "Bolsos", "$95.000", "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=800&q=85"],
    ["Bolso con tu mascota", "Personalizado", "Desde $120.000", "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=85"],
    ["Camiseta Orquidea", "Prendas", "$110.000", "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=85"],
    ["Cosmetiquera pintada", "Accesorios", "$48.000", "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=800&q=85"],
  ];
  return <main>
    <header className="nav-shell"><nav className="nav"><a className="brand" href="#inicio"><span>iV</span>bags</a><div className="nav-links"><a href="#productos">Productos</a><a href="#personaliza">Personaliza</a><a href="/nosotras">Nosotras</a><a href="/blog">Blog</a></div><div className="nav-actions"><MobileMenu /><a href="/contacto">Contacto</a><a href="/iniciar-sesion" aria-label="Mi cuenta">♡</a><a href="/carrito" aria-label="Carrito">▢</a></div></nav></header>
    <div className="folklore">❀ ✿ ❁ ❀ ✿ ❁ ❀ ✿ ❁ ❀ ✿ ❁ ❀ ✿ ❁ ❀ ✿ ❁</div>
    <section id="inicio" className="hero"><i className="spark one">✦</i><i className="spark two">✧</i><p className="eyebrow">hecho lento, pensado bonito</p><h1>Piezas<br /><em>hechas a mano</em></h1><p>Tres mujeres creando bolsos, prendas y accesorios<br />con historias, pintura, bordado y mucho grabado.</p><div className="actions"><a className="button solid" href="#productos">Ver productos</a><a className="button outline" href="#personaliza">Personaliza tu bolso</a></div></section>
    <div className="folklore flip">❀ ✿ ❁ ❀ ✿ ❁ ❀ ✿ ❁ ❀ ✿ ❁ ❀ ✿ ❁ ❀ ✿ ❁</div>
    <section id="productos" className="section"><p className="eyebrow">compra por categoria</p><div className="categories"><a style={{ backgroundImage: "url('https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=700&q=85')" }} href="/tienda?categoria=bolsos">Bolsos<small>ver todo ↗</small></a><a style={{ backgroundImage: "url('https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=700&q=85')" }} href="/tienda?categoria=prendas">Prendas<small>ver todo ↗</small></a><a style={{ backgroundImage: "url('https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=700&q=85')" }} href="/tienda?categoria=accesorios">Accesorios<small>ver todo ↗</small></a><a className="custom-category" href="#personaliza">✦<br /><b>Personalizados<br />con mascotas</b><small>ver todo ↗</small></a></div></section>
    <div className="mushrooms">⌁ ♧ ⌁ ♧ ⌁ ♧ ⌁ ♧ ⌁ ♧ ⌁ ♧ ⌁ ♧ ⌁ ♧ ⌁</div>
    <section className="section favourites"><p className="eyebrow">recien salidos del taller</p><h2>Favoritos de la semana</h2><div className="filters"><button>Todos</button><button>Bolsos</button><button>Prendas</button><button>Accesorios</button></div><div className="products">{products.map(([name, kind, price, image]) => <article key={name}><div className="product-image" style={{ backgroundImage: `url('${image}')` }}><button aria-label={`Favorito ${name}`}>♡</button><span>listo para enviar</span></div><p>{kind}</p><h3>{name}</h3><small>{price}</small><a href="/tienda">{kind === "Personalizado" ? "Personalizar" : "Ver detalles"}</a></article>)}</div></section>
    <div className="ticker">✦ hechas a mano ✦ forradas, con bolsillo y cierre ✦ hechas a mano ✦ forradas, con bolsillo y cierre ✦</div>
    <section id="personaliza" className="custom-section"><p className="eyebrow">una pieza que es solo tuya</p><h2>Personaliza tu bolso</h2><p className="intro">Para cualquier idea que no sea un producto, usa este espacio. Si es tu mascota, mira los <a href="/personalizados">personalizados con precio fijo.</a></p><div className="custom-card"><div><h3>Cotiza tu idea, pintada a mano en un bolso beige</h3><p><b>uno</b><b>dos</b><b>tres</b></p><small>Nos cuentas tu idea favorita. Confirmamos detalles. Lo pintamos a mano y te lo enviamos.</small></div><CustomizationForm /></div></section>
  </main>;
}
