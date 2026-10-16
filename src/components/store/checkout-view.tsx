"use client";

import { FormEvent, useEffect, useState } from "react";
import { formatAddress, formatStreet, type Shipping } from "@/lib/colombia";
import { EMPTY_SHIPPING, ShippingForm } from "./shipping-form";
import Link from "next/link";
import { toast } from "sonner";
import { createClient, hasSupabase } from "@/lib/supabase/browser";
import { money, waLink } from "@/lib/format";
import type { SiteContent } from "@/lib/types";
import { lineDetail, syncWithCatalog, useStore } from "./store-provider";
import { Star } from "./icons";
import { useAuth } from "@/components/auth/auth-provider";
import { SignInForm } from "@/components/auth/sign-in-form";

type Done = { number: number | null; total: number; name: string; address: string };
const LOCAL_KEY = "iv-shipping";

export function CheckoutView({ content }: { content: SiteContent }) {
  const { cart, clear, subtotal, replace } = useStore();
  const { guest, user } = useAuth();
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState<Done | null>(null);
  const [ship, setShip] = useState<Shipping>(EMPTY_SHIPPING);
  const [notes, setNotes] = useState("");
  const shipping = content.shippingCents;

  // Rellena con la dirección guardada (cuenta o este navegador) y los datos del perfil.
  useEffect(() => {
    if (!user) return;
    let local: Partial<Shipping> = {};
    try { local = JSON.parse(localStorage.getItem(LOCAL_KEY) ?? "{}"); } catch {}
    createClient().from("profiles").select("*").eq("id", user.id).maybeSingle().then(({ data }) => {
      const saved = (data?.saved_shipping as Partial<Shipping> | null) ?? local;
      setShip((cur) => ({ ...cur, ...saved, email: saved.email || user.email || cur.email, name: saved.name || data?.full_name || cur.name, phone: saved.phone || data?.phone || cur.phone, save: true }));
    });
  }, [user]);

  async function confirm(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!cart.length) return toast.error("Tu bolsa está vacía");
    if (!ship.department || !ship.city) return toast.error("Elige el departamento y la ciudad");
    const street = formatStreet(ship);
    const full: Shipping = { ...ship, street, name: ship.name.trim(), email: ship.email.trim() };
    const address = formatAddress(full);
    const get = (k: "name") => full[k];
    const summary = cart.map((l) => `• ${l.qty} × ${l.name}${lineDetail(l) ? ` (${lineDetail(l)})` : ""}`).join("\n");
    setSending(true);
    if (full.save) { try { localStorage.setItem(LOCAL_KEY, JSON.stringify({ ...full, save: undefined })); } catch {} }

    let number: number | null = null;
    let total = subtotal + shipping;
    if (hasSupabase()) {
      // Revisa la bolsa contra la base justo antes de pagar: nada de piezas que ya no existen.
      const synced = await syncWithCatalog(cart);
      if (synced && synced.removed.length) {
        replace(synced.lines);
        setSending(false);
        return toast.error("Actualizamos tu bolsa", { description: `${synced.removed.join(", ")} ya no está disponible. Revisa tu pedido y confirma de nuevo.` });
      }
      const lines = synced?.lines ?? cart;
      const items = lines.map((l) => ({ product_id: l.productId, quantity: l.qty, customization: { ...l.sel, ...l.extra } }));
      try {
        const db = createClient();
        let { data, error } = await db.rpc("place_order", { p_shipping: { ...full, address }, p_notes: notes.trim() || null, p_payment: "Transferencia o Nequi", p_items: items });
        // Si la base aún no tiene la migración 005, usa la función anterior con la dirección en una línea.
        if (error && (error.code === "PGRST202" || /place_order/.test(error.message))) {
          ({ data, error } = await db.rpc("create_order", {
            p_name: full.name, p_email: full.email, p_phone: full.phone, p_city: full.city, p_address: address,
            p_notes: [notes.trim(), `Documento: ${full.idType} ${full.idNumber}`, !full.recipientIsMe && `Recibe: ${full.recipientName} (${full.recipientPhone})`, full.reference && `Indicaciones: ${full.reference}`].filter(Boolean).join(" · "),
            p_payment: "Transferencia o Nequi", p_items: items,
          }));
        }
        if (error) throw error;
        number = data.order_number; total = data.total_cents;
      } catch (err) {
        setSending(false);
        const msg = err instanceof Error || (err && typeof err === "object" && "message" in err) ? String((err as { message: string }).message) : "";
        const friendly = /permission denied|JWT|not authenticated/i.test(msg) ? "Tu sesión venció. Vuelve a iniciar sesión e intenta de nuevo."
          : /ya no está disponible/i.test(msg) ? "Una pieza de tu bolsa ya no está disponible. Recarga la página."
          : /Faltan datos/i.test(msg) ? "Faltan datos de envío. Revisa nombre, correo y dirección."
          : /fetch|network/i.test(msg) ? "Sin conexión. Revisa tu internet e intenta de nuevo."
          : "Intenta de nuevo o escríbenos por WhatsApp.";
        return toast.error("No pudimos crear tu pedido", { description: friendly });
      }
    }
    setSending(false);
    clear();
    setDone({ number, total, name: get("name"), address });
    window.scrollTo({ top: 0, behavior: "smooth" });
    toast.success(number ? `¡Gracias! Pedido #${number} recibido` : "¡Gracias! Tu pedido está listo para enviar");
    if (!number) window.open(waLink(content.whatsapp, `Hola, soy ${get("name")}. Quiero hacer este pedido:\n${summary}\nEnvío a: ${address}`), "_blank", "noopener");
  }

  if (guest && !done) return (
    <main className="checkout checkout-gate">
      <div className="auth-panel inline"><SignInForm onSignedIn={(needsProfile) => { toast.success("¡Listo! Ya puedes confirmar tu pedido"); if (needsProfile) toast("Completa tus datos después desde tu cuenta"); }} /></div>
      <aside className="order-box">
        <div className="d h-sm">Tu pedido</div>
        {cart.map((line) => <div className="order-line" key={line.key}>{line.image ? <img src={line.image} alt={line.name} /> : <span className="cart-thumb" />}<div><b>{line.name}</b><small>Cantidad {line.qty}</small></div><span>{money(line.priceCents * line.qty)}</span></div>)}
        <div className="totals"><div className="row-between strong"><span>Subtotal</span><span>{money(subtotal)}</span></div></div>
      </aside>
    </main>
  );

  if (done) return (
    <div className="checkout done">
      <Star size={44} className="twinkle" />
      <h1 className="d h-lg">¡Gracias, {done.name.split(" ")[0]}!</h1>
      {done.number && <p className="lb wine">Pedido #{done.number} · {money(done.total)}</p>}
      <p className="hint">Lo enviaremos a: <b>{done.address}</b></p>
      <p className="long">{content.paymentInstructions}</p>
      <div className="actions">
        <a className="btn btn-solid" href={waLink(content.whatsapp, `Hola, acabo de hacer el pedido #${done.number ?? ""} y quiero coordinar el pago.`)} target="_blank" rel="noopener">Coordinar el pago por WhatsApp</a>
        <Link className="btn btn-line" href="/cuenta">Ver mis pedidos</Link>
      </div>
    </div>
  );

  return (
    <main className="checkout">
      <div><div className="lb pink">Ya casi es tuyo</div><h1 className="d h-lg">Finalizar compra</h1></div>
      <form className="checkout-cols" onSubmit={confirm}>
        <div className="checkout-form">
          <ShippingForm value={ship} onChange={setShip} />
          <div className="fgroup"><label className="lb wine" htmlFor="s-notes">Notas para el taller (opcional)</label><textarea id="s-notes" className="field" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ej: es un regalo, no incluyas el precio" rows={2} maxLength={500} /></div>
          <div className="lb wine spaced">Cómo pagas</div>
          <div className="note">{content.paymentInstructions}</div>
          <label className="check"><input type="checkbox" required /><span>Acepto los <Link className="inline-link" href="/legal/terminos" target="_blank">términos y condiciones</Link> y la <Link className="inline-link" href="/legal/privacidad" target="_blank">política de privacidad</Link>.</span></label>
        </div>
        <aside className="order-box">
          <div className="d h-sm">Tu pedido</div>
          {cart.length === 0 && <p>Tu bolsa está vacía. <Link className="inline-link" href="/tienda">Ir a la tienda</Link></p>}
          {cart.map((line) => <div className="order-line" key={line.key}>{line.image ? <img src={line.image} alt={line.name} /> : <span className="cart-thumb" />}<div><b>{line.name}</b><small>{[lineDetail(line), `Cantidad ${line.qty}`].filter(Boolean).join(" · ")}</small></div><span>{money(line.priceCents * line.qty)}</span></div>)}
          <div className="totals">
            <div className="row-between"><span>Subtotal</span><span>{money(subtotal)}</span></div>
            <div className="row-between"><span>Envío</span><span>{shipping ? money(shipping) : "Se coordina por WhatsApp"}</span></div>
            <div className="row-between strong"><span>Total</span><span>{money(subtotal + shipping)}</span></div>
          </div>
          <button className="btn btn-solid tall" type="submit" disabled={sending || !cart.length}>{sending ? "Creando pedido..." : "Confirmar pedido"}</button>
        </aside>
      </form>
    </main>
  );
}
