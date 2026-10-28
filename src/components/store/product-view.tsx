"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import type { Product } from "@/lib/types";
import { availability, catHref, money, waLink } from "@/lib/format";
import { productQuestion } from "@/lib/whatsapp";
import { useStore } from "./store-provider";
import { useAuth } from "@/components/auth/auth-provider";
import { Star } from "./icons";

function Stepper({ value, onChange, label, max = 20 }: { value: number; onChange: (n: number) => void; label: string; max?: number }) {
  return <div className="stepper"><button type="button" onClick={() => onChange(Math.max(1, value - 1))} aria-label={`Menos ${label}`}>−</button><span aria-live="polite">{value}</span><button type="button" onClick={() => onChange(Math.min(max, value + 1))} aria-label={`Más ${label}`}>+</button></div>;
}

export function ProductView({ p, related, whatsapp }: { p: Product; related: Product[]; whatsapp: string }) {
  const { add } = useStore();
  const { guest, openSignIn } = useAuth();
  const [imgIdx, setImgIdx] = useState(0);
  const [sel, setSel] = useState<Record<string, string>>({});
  const [qty, setQty] = useState(1);
  const [pets, setPets] = useState(1);
  const [petName, setPetName] = useState("");
  const [acc, setAcc] = useState(0);
  const av = availability(p);
  const info = [
    p.details && { t: "Detalles", d: p.details },
    { t: "Cuidados", d: "Lava a mano con agua fría, por el revés y sin blanqueador. Seca a la sombra." },
    { t: "Inspiración", d: "Cada pieza nace de la naturaleza, los recuerdos y las cosas pequeñas que nos hacen felices. La pintamos y bordamos a mano, así que ninguna es exactamente igual a otra." },
    { t: "Envíos y tiempos", d: "Enviamos a todo Colombia con Coordinadora e Interrapidísimo. Si está listo, lo despachamos 1 día hábil después de tu pago; si es por encargo, lo tenemos listo en 2 semanas. Al tiempo de preparación se suman de 2 a 5 días hábiles de transporte.", link: ["/legal/envios", "Ver política de envíos"] },
    { t: "Cambios y devoluciones", d: "Cada pieza está hecha a mano, así que puede tener pequeñas diferencias con la foto. Puedes cambiar la talla o la referencia dentro de los 15 días calendario siguientes a recibir tu pedido, con la pieza sin uso y en su empaque. Si te llega con un defecto o distinta a lo que pediste, tienes 30 días para escribirnos con fotos. Los personalizados y los productos en descuento no tienen cambio.", link: ["/legal/cambios-y-devoluciones", "Lee la política completa"] },
  ].filter(Boolean) as { t: string; d: string; link?: [string, string] }[];

  function addCurrent() {
    if (guest) return openSignIn("cart");
    const missing = p.options.find((o) => !sel[o.key]);
    if (missing) return toast.error(`Elige ${missing.label.toLowerCase()} primero`);
    add(p, Object.fromEntries(p.options.map((o) => [o.label, sel[o.key]])), qty, p.is_pet ? { petName: petName.trim() || undefined, pets } : {});
  }

  return (
    <div className="product-page">
      <div className="product-wrap">
        <nav className="crumbs" aria-label="Ruta"><Link href="/">Inicio</Link><span>/</span><Link href="/tienda">Tienda</Link><span>/</span><Link href={catHref(p.category)}>{p.category}</Link><span>/</span><span>{p.name}</span></nav>
        <div className="product-cols">
          <div className="gallery">
            <div className="gallery-main">
              <div className="swap tilt">
                {p.images[imgIdx] ? <img key={imgIdx} className="fade-in" src={p.images[imgIdx]} alt={p.name} /> : <span className="placeholder"><Star size={40} /><span className="lb">Foto pronto</span></span>}
                {p.tag && <span className="h tag big">{p.tag}</span>}
              </div>
              <Star size={40} className="gallery-star twinkle" />
            </div>
            {p.images.length > 1 && <div className="thumbs">{p.images.map((src, i) => <button key={src} onClick={() => setImgIdx(i)} aria-label={`Ver foto ${i + 1}`} aria-pressed={i === imgIdx}><img src={src} alt="" /></button>)}</div>}
          </div>
          <div className="buy">
            <div className="lb pink">{p.category}</div>
            <h1 className="d h-lg">{p.name}</h1>
            <div className="price big">{money(p.price_cents)}</div>
            {p.description && <p className="long">{p.description}</p>}
            <div className="avail-box" style={{ background: av.bg }}><Star size={18} /><div><span className="lb olive">{av.label}</span><span>{av.text}</span></div></div>
            {p.options.map((o) => (
              <div className="opt" key={o.key}>
                <div className="row-between"><span className="lb wine">{o.label}</span>{o.hint && <span className="hint">{o.hint}</span>}</div>
                <div className="chips">{o.values.map((v) => <button key={v} className="chip" aria-pressed={sel[o.key] === v} onClick={() => setSel({ ...sel, [o.key]: v })}>{v}</button>)}</div>
              </div>
            ))}
            {p.is_pet && <>
              <div className="fgroup"><label className="lb wine" htmlFor="pet-name">Nombre de tu mascota <span className="soft">(opcional, sin costo)</span></label><input id="pet-name" className="field" value={petName} onChange={(e) => setPetName(e.target.value)} placeholder="Ej: Lola" maxLength={40} /></div>
              <div className="fgroup"><span className="lb wine">Número de mascotas</span><Stepper value={pets} onChange={setPets} label="mascotas" max={5} /></div>
              <p className="hint">Después de comprar nos mandas 2 o 3 fotos de tu mascota por WhatsApp, con buena luz y donde se vea bien su carita.</p>
            </>}
            <div className="fgroup"><span className="lb wine">Cantidad</span><Stepper value={qty} onChange={setQty} label="unidades" /></div>
            <button className="btn btn-solid tall" onClick={addCurrent}>Agregar a la bolsa · {money(p.price_cents * qty)}</button>
            {guest && <p className="hint center">Entra con tu correo para comprar. Solo toma un minuto.</p>}
            <a className="btn btn-line" href={waLink(whatsapp, productQuestion({
              name: p.name, priceCents: p.price_cents, category: p.category, available: av.label, qty,
              options: { ...Object.fromEntries(p.options.filter((o) => sel[o.key]).map((o) => [o.label, sel[o.key]])), ...(p.is_pet ? { petName: petName.trim(), pets: String(pets) } : {}) },
              url: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/producto/${p.slug}`,
            }))} target="_blank" rel="noopener">Pregúntanos por WhatsApp</a>
            <div className="accs">
              {info.map((it, i) => (
                <div className={`acc tone-${i}`} key={it.t}>
                  <button onClick={() => setAcc(acc === i ? -1 : i)} aria-expanded={acc === i}>{it.t}<span className="acc-sign" aria-hidden>+</span></button>
                  <div className="reveal" data-open={acc === i}><div><p>{it.d}{it.link && <> <Link className="inline-link" href={it.link[0]}>{it.link[1]}</Link></>}</p></div></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {related.length > 0 && <div className="related">
        <div className="lace-olive" aria-hidden />
        <div className="related-inner">
          <h2 className="d h-md">También te puede gustar</h2>
          <div className="rgrid">{related.map((r) => <Link key={r.id} href={`/producto/${r.slug}`} className="rcard"><span className="swap">{r.images[0] && <img src={r.images[0]} alt={r.name} />}</span><span className="d">{r.name}</span><span className="price">{money(r.price_cents)}</span></Link>)}</div>
        </div>
      </div>}
    </div>
  );
}
