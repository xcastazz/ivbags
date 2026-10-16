"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient, hasSupabase } from "@/lib/supabase/browser";
import { formatDate, money } from "@/lib/format";
import { ORDER_STATUS, type OrderStatus } from "@/lib/types";

type Order = { id: string; order_number: number; status: OrderStatus; total_cents: number; created_at: string; order_items: { product_name: string; quantity: number }[] };
type State = { loading: true } | { loading: false; email: string; name: string | null; role: string; orders: Order[] };

export function AccountView() {
  const router = useRouter();
  const [state, setState] = useState<State>({ loading: true });

  useEffect(() => {
    if (!hasSupabase()) return;
    const db = createClient();
    db.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return router.replace("/iniciar-sesion?next=/cuenta");
      const [{ data: profile }, { data: orders }] = await Promise.all([
        db.from("profiles").select("full_name, role").eq("id", user.id).single(),
        db.from("orders").select("id, order_number, status, total_cents, created_at, order_items(product_name, quantity)").eq("customer_id", user.id).order("created_at", { ascending: false }),
      ]);
      setState({ loading: false, email: user.email ?? "", name: profile?.full_name ?? null, role: profile?.role ?? "customer", orders: (orders ?? []) as Order[] });
    });
  }, [router]);

  async function signOut() {
    await createClient().auth.signOut();
    toast("Cerraste sesión");
    router.push("/");
    router.refresh();
  }

  if (!hasSupabase()) return <div className="account"><h1 className="d h-lg">Mi cuenta</h1><p className="long">Las cuentas estarán disponibles cuando la tienda esté conectada.</p></div>;
  if (state.loading) return <div className="account"><h1 className="d h-lg">Mi cuenta</h1><p className="hint">Cargando…</p></div>;

  return (
    <div className="account">
      <div className="account-head">
        <div><div className="lb pink">{state.email}</div><h1 className="d h-lg">Hola{state.name ? `, ${state.name.split(" ")[0]}` : ""}</h1></div>
        <div className="actions left">
          {state.role === "admin" && <Link className="btn btn-solid" href="/admin">Panel del taller</Link>}
          <Link className="btn btn-line" href="/cuenta/completar-perfil">Editar mis datos</Link>
          <button className="text-link" onClick={signOut}>Cerrar sesión</button>
        </div>
      </div>
      <h2 className="d h-md">Mis pedidos</h2>
      {state.orders.length === 0 ? <div className="empty-favs">Aún no tienes pedidos. <Link className="inline-link" href="/tienda">Ir a la tienda</Link></div> : (
        <ul className="order-list">
          {state.orders.map((o) => (
            <li key={o.id}>
              <div><b className="d">Pedido #{o.order_number}</b><small>{formatDate(o.created_at, { day: "numeric", month: "long", year: "numeric" })}</small></div>
              <p>{o.order_items.map((i) => `${i.quantity} × ${i.product_name}`).join(", ")}</p>
              <span className={`status s-${o.status}`}>{ORDER_STATUS[o.status]}</span>
              <b className="price">{money(o.total_cents)}</b>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
