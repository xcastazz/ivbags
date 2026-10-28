"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/auth-provider";
import { Drawer } from "vaul";
import { money } from "@/lib/format";
import { lineDetail, useStore } from "./store-provider";
import { Close, Star, Trash } from "./icons";

export function CartDrawer() {
  const { cart, cartOpen, setCartOpen, remove, setQty, subtotal } = useStore();
  const { guest, openSignIn } = useAuth();

  // La bolsa es solo para quien inició sesión: si alguien la abre sin cuenta, le pedimos entrar.
  useEffect(() => {
    if (cartOpen && guest) { setCartOpen(false); openSignIn("cart"); }
  }, [cartOpen, guest, setCartOpen, openSignIn]);

  return (
    <Drawer.Root direction="right" open={cartOpen && !guest} onOpenChange={setCartOpen}>
      <Drawer.Portal>
        <Drawer.Overlay className="drawer-overlay" />
        <Drawer.Content className="cart-panel" aria-describedby={undefined}>
          <div className="cart-head">
            <Drawer.Title className="d cart-title">Tu bolsa</Drawer.Title>
            <Drawer.Close className="round-btn" aria-label="Cerrar"><Close /></Drawer.Close>
          </div>
          <div className="lace-pink" aria-hidden />
          <div className="cart-body">
            {cart.length === 0 && <div className="cart-empty"><Star size={40} className="twinkle" /><div className="d">Tu bolsa está vacía</div><p>Agrega una pieza y aparecerá aquí.</p><Drawer.Close asChild><Link className="btn btn-line" href="/tienda">Ir a la tienda</Link></Drawer.Close></div>}
            {cart.map((line) => (
              <div className="cart-line" key={line.key}>
                {line.image ? <img src={line.image} alt={line.name} /> : <span className="cart-thumb" />}
                <div>
                  <Drawer.Close asChild><Link className="d" href={`/producto/${line.slug}`}>{line.name}</Link></Drawer.Close>
                  {lineDetail(line) && <small>{lineDetail(line)}</small>}
                  <div className="cart-qty">
                    <div className="stepper sm"><button onClick={() => setQty(line.key, line.qty - 1)} aria-label={`Menos ${line.name}`}>−</button><span>{line.qty}</span><button onClick={() => setQty(line.key, line.qty + 1)} aria-label={`Más ${line.name}`}>+</button></div>
                    <b>{money(line.priceCents * line.qty)}</b>
                  </div>
                </div>
                <button className="round-btn ghost" onClick={() => remove(line.key)} aria-label={`Quitar ${line.name}`}><Trash /></button>
              </div>
            ))}
          </div>
          <div className="cart-foot">
            <div className="row-between strong"><span>Subtotal</span><span>{money(subtotal)}</span></div>
            {cart.length > 0 ? <Link className="btn btn-solid" href="/checkout" onClick={() => setCartOpen(false)}>Finalizar compra</Link> : <button className="btn btn-solid" disabled>Finalizar compra</button>}
            <Drawer.Close className="text-link">Seguir comprando</Drawer.Close>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
