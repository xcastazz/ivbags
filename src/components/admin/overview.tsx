"use client";

import Link from "next/link";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Box, CircleDollarSign, Inbox, Mail } from "lucide-react";
import { formatDate, money } from "@/lib/format";
import { ORDER_STATUS, type OrderStatus } from "@/lib/types";
import { db, LoadError, Loading, PageHead, useQuery } from "./kit";

type Row = { id: string; order_number: number; customer_name: string; status: OrderStatus; total_cents: number; created_at: string };
const OPEN: OrderStatus[] = ["new", "quoted", "confirmed", "in_production"];

export function Overview() {
  const { data, loading, failed, reload } = useQuery(async () => {
    const client = db();
    const [orders, requests, messages, products] = await Promise.all([
      client.from("orders").select("id, order_number, customer_name, status, total_cents, created_at").order("created_at", { ascending: false }).limit(500),
      client.from("custom_requests").select("id", { count: "exact", head: true }).eq("status", "new"),
      client.from("contact_messages").select("id", { count: "exact", head: true }).eq("status", "new"),
      client.from("products").select("id, name, inventory_count, made_to_order, active").eq("active", true),
    ]);
    const error = orders.error ?? requests.error ?? messages.error ?? products.error;
    return { error, data: { orders: (orders.data ?? []) as Row[], requests: requests.count ?? 0, messages: messages.count ?? 0, lowStock: (products.data ?? []).filter((p) => !p.made_to_order && p.inventory_count <= 1) } };
  });

  if (loading) return <><PageHead title="Buenos días, taller" /><Loading /></>;
  if (failed || !data) return <><PageHead title="Buenos días, taller" /><LoadError text={failed ?? "Sin datos"} retry={reload} /></>;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const valid = data.orders.filter((o) => o.status !== "cancelled");
  const revenue = valid.filter((o) => o.created_at >= monthStart).reduce((n, o) => n + o.total_cents, 0);
  const open = data.orders.filter((o) => OPEN.includes(o.status));
  const days = Array.from({ length: 14 }, (_, i) => { const d = new Date(now); d.setDate(d.getDate() - (13 - i)); return d.toISOString().slice(0, 10); });
  const chart = days.map((day) => ({ day: formatDate(day), pedidos: valid.filter((o) => o.created_at.slice(0, 10) === day).length }));
  const cards = [
    { label: "Ventas del mes", value: money(revenue), icon: CircleDollarSign, tone: "olive", href: "/admin/pedidos" },
    { label: "Pedidos por atender", value: String(open.length), icon: Box, tone: "rose", href: "/admin/pedidos" },
    { label: "Personalizados nuevos", value: String(data.requests), icon: Inbox, tone: "butter", href: "/admin/solicitudes" },
    { label: "Mensajes nuevos", value: String(data.messages), icon: Mail, tone: "sage", href: "/admin/mensajes" },
  ];

  return (
    <>
      <PageHead title="Buenos días, taller" text="Lo que pasa en la tienda, en un vistazo." action={<Link className="button solid" href="/admin/productos?nuevo=1">Nuevo producto</Link>} />
      <div className="metric-grid">{cards.map(({ label, value, icon: Icon, tone, href }) => <Link className={`metric-card ${tone}`} href={href} key={label}><Icon size={20} /><p>{label}</p><strong>{value}</strong></Link>)}</div>
      <div className="admin-grid">
        <section className="admin-panel chart-panel"><h2>Pedidos de las últimas dos semanas</h2><div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><BarChart data={chart}><XAxis dataKey="day" axisLine={false} tickLine={false} fontSize={11} interval={1} /><YAxis hide allowDecimals={false} /><Tooltip cursor={{ fill: "#fbf5ec" }} /><Bar dataKey="pedidos" fill="#6d4546" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div></section>
        <section className="admin-panel">
          <h2>Por atender</h2>
          {open.length === 0 ? <p className="empty-state">No hay pedidos pendientes.</p> : <div className="product-table">{open.slice(0, 6).map((o) => <div key={o.id}><span className="mini-thumb">#{o.order_number}</span><p><strong>{o.customer_name}</strong><small>{ORDER_STATUS[o.status]} · {formatDate(o.created_at)}</small></p><b>{money(o.total_cents)}</b></div>)}</div>}
          {data.lowStock.length > 0 && <><h2 className="spaced">Poco inventario</h2><div className="product-table">{data.lowStock.map((p) => <div key={p.id}><p><strong>{p.name}</strong><small>{p.inventory_count} disponibles</small></p></div>)}</div></>}
        </section>
      </div>
    </>
  );
}
