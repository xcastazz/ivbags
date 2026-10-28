"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient, hasSupabase } from "@/lib/supabase/browser";
import { formatDate, money } from "@/lib/format";
import { ORDER_STATUS, type OrderStatus } from "@/lib/types";
import { onlinePaymentsEnabled, startOnlinePayment } from "@/lib/pay";

type Order = { id: string; order_number: number; status: OrderStatus; total_cents: number; created_at: string; payment_status?: string; order_items: { product_name: string; quantity: number }[] };
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
        db.from("orders").select("*, order_items(product_name, quantity)").eq("customer_id", user.id).order("created_at", { ascending: false }),
      ]);
      setState({ loading: false, email: user.email ?? "", name: profile?.full_name ?? null, role: profile?.role ?? "customer", orders: (orders ?? []) as Order[] });
    });
  }, [router]);

  const [paying, setPaying] = useState<number | null>(null);
  const canPay = (o: Order) => onlinePaymentsEnabled() && o.payment_status !== "approved" && ["new", "quoted"].includes(o.status);
  async function pay(orderNumber: number) {
    setPaying(orderNumber);
    const r = await startOnlinePayment(orderNumber);
    if (!r.ok) { setPaying(null); toast.error("No pudimos abrir el pago", { description: r.error }); }
  }

  const [confirming, setConfirming] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const canDelete = (o: Order) => o.payment_status !== "approved" && ["new", "quoted"].includes(o.status);
  async function remove(o: Order) {
    if (confirming !== o.id) { setConfirming(o.id); return; }
    setDeleting(o.id);
    const { error } = await createClient().rpc("delete_my_order", { p_order_id: o.id });
    setDeleting(null); setConfirming(null);
    if (error) return toast.error("No pudimos eliminar el pedido", { description: /function|schema cache/i.test(error.message) ? "Intenta de nuevo en unos minutos." : error.message });
    setState((st) => st.loading ? st : { ...st, orders: st.orders.filter((x) => x.id !== o.id) });
    toast.success(`Eliminaste el pedido #${o.order_number}`);
  }

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
              <span className="order-badges"><span className={`status s-${o.status}`}>{ORDER_STATUS[o.status]}</span>{o.payment_status === "approved" && <span className="status s-confirmed">Pagado</span>}</span>
              <span className="order-pay"><b className="price">{money(o.total_cents)}</b>{canPay(o) && <button className="btn btn-solid btn-sm" onClick={() => pay(o.order_number)} disabled={paying === o.order_number}>{paying === o.order_number ? "Abriendo…" : "Pagar ahora"}</button>}
                {canDelete(o) && <button className={`order-delete${confirming === o.id ? " sure" : ""}`} onClick={() => remove(o)} onBlur={() => confirming === o.id && setConfirming(null)} disabled={deleting === o.id}>{deleting === o.id ? "Eliminando…" : confirming === o.id ? "¿Seguro? Toca para eliminar" : "Eliminar pedido"}</button>}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
