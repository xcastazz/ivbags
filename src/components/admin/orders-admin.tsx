"use client";

import { useState } from "react";
import { MessageCircle, Receipt } from "lucide-react";
import { formatDate, money, waLink } from "@/lib/format";
import { ORDER_STATUS, type OrderStatus, type SiteContent } from "@/lib/types";
import { DEFAULT_CONTENT } from "@/lib/defaults";
import { orderToCustomer } from "@/lib/whatsapp";

/** 3001234567 → 573001234567 para el enlace de WhatsApp. */
const PAY_LABEL: Record<string, string> = { declined: "rechazado", voided: "anulado", error: "con error" };
const toCoPhone = (p: string) => { const d = p.replace(/\D/g, ""); return d.length === 10 ? `57${d}` : d; };
import { toast } from "sonner";
import type { Shipping } from "@/lib/colombia";
import { db, Empty, LoadError, Loading, mutate, PageHead, useQuery } from "./kit";

type Item = { id: string; product_name: string; quantity: number; unit_price_cents: number; customization: Record<string, unknown> | null };
type Order = {
  payment_status?: string; payment_tx_id?: string | null; paid_at?: string | null;
  id: string; order_number: number; customer_name: string; customer_email: string; customer_phone: string | null; city: string | null;
  status: OrderStatus; subtotal_cents: number; shipping_cents: number; total_cents: number; notes: string | null; payment_method: string | null;
  shipping_address: (Partial<Shipping> & { address?: string }) | null; created_at: string; order_items: Item[]; invoices: { id: string; invoice_number: string }[] | { id: string; invoice_number: string } | null;
};

const FILTERS: [string, string][] = [["abiertos", "Por atender"], ["todos", "Todos"], ...Object.entries(ORDER_STATUS)];
const OPEN: OrderStatus[] = ["new", "quoted", "confirmed", "in_production"];

export function OrdersAdmin() {
  const [filter, setFilter] = useState("abiertos");
  const [openId, setOpenId] = useState<string | null>(null);
  const { data, loading, failed, reload } = useQuery(async () => db().from("orders").select("*, order_items(*), invoices(id, invoice_number)").order("created_at", { ascending: false }));
  const { data: site } = useQuery<{ value: Partial<SiteContent> }>(async () => db().from("site_content").select("value").eq("key", "site").maybeSingle());
  const payInfo = site?.value?.paymentInstructions ?? DEFAULT_CONTENT.paymentInstructions;
  const orders = (data ?? []) as Order[];
  const shown = orders.filter((o) => filter === "todos" ? true : filter === "abiertos" ? OPEN.includes(o.status) : o.status === filter);

  async function setStatus(o: Order, status: OrderStatus) {
    if (await mutate(db().from("orders").update({ status }).eq("id", o.id), `Pedido #${o.order_number}: ${ORDER_STATUS[status]}`)) reload();
  }
  async function invoice(o: Order) {
    const ok = await mutate(db().from("invoices").insert({
      order_id: o.id, subtotal_cents: o.subtotal_cents + o.shipping_cents, total_cents: o.total_cents, tax_cents: 0,
      billing_snapshot: { name: o.customer_name, email: o.customer_email, phone: o.customer_phone, address: o.shipping_address, items: o.order_items.map((i) => ({ name: i.product_name, qty: i.quantity, unit: i.unit_price_cents, options: Object.entries(i.customization ?? {}).filter(([, v]) => v).map(([k, v]) => `${k === "petName" ? "Nombre de la mascota" : k === "pets" ? "Mascotas" : k}: ${v}`).join(" · ") })), shipping: o.shipping_cents, payment: o.payment_method, orderDate: o.created_at, notes: o.notes },
    }), "Factura creada en borrador");
    if (ok) reload();
  }

  return (
    <>
      <PageHead title="Pedidos" text="Cambia el estado a medida que avanzas: el cliente lo ve en su cuenta." />
      <div className="admin-filters">{FILTERS.map(([k, label]) => <button key={k} className={filter === k ? "on" : ""} onClick={() => setFilter(k)}>{label}</button>)}</div>
      <section className="admin-panel">
        {loading ? <Loading /> : failed ? <LoadError text={failed} retry={reload} /> : shown.length === 0 ? <Empty>No hay pedidos en esta vista.</Empty> : (
          <div className="admin-table">
            {shown.map((o) => {
              const inv = Array.isArray(o.invoices) ? o.invoices[0] : o.invoices;
              const open = openId === o.id;
              return (
                <div className="order-card" key={o.id}>
                  <button className="admin-row as-button" onClick={() => setOpenId(open ? null : o.id)} aria-expanded={open}>
                    <span className="row-thumb num">#{o.order_number}</span>
                    <span className="row-main"><strong>{o.customer_name}</strong><small>{formatDate(o.created_at, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })} · {o.order_items.reduce((n, i) => n + i.quantity, 0)} piezas</small></span>
                    {o.payment_status === "approved" ? <span className="status pay-ok">Pagado</span> : o.payment_status && o.payment_status !== "pending" ? <span className="status pay-bad">Pago {PAY_LABEL[o.payment_status] ?? o.payment_status}</span> : null}
                    <span className={`status s-${o.status}`}>{ORDER_STATUS[o.status]}</span>
                    <b className="row-price">{money(o.total_cents)}</b>
                  </button>
                  <div className="reveal" data-open={open}><div>
                    <div className="order-detail">
                      <div>
                        <h3>Piezas</h3>
                        <ul>{o.order_items.map((i) => <li key={i.id}><b>{i.quantity} × {i.product_name}</b> · {money(i.unit_price_cents * i.quantity)}{i.customization && Object.keys(i.customization).length > 0 && <small>{Object.entries(i.customization).filter(([, v]) => v).map(([k, v]) => `${k === "petName" ? "Nombre de la mascota" : k === "pets" ? "Mascotas" : k}: ${v}`).join(" · ")}</small>}</li>)}</ul>
                        <p className="pay-line">{o.payment_status === "approved" ? <>✅ <b>Pagado</b> · {o.payment_method}{o.paid_at && ` · ${formatDate(o.paid_at, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}`}{o.payment_tx_id && <small> · Transacción {o.payment_tx_id}</small>}</> : <>⏳ <b>Pago pendiente</b> · {o.payment_method ?? "sin método"}</>}</p>
                        <p className="totals-mini">Subtotal {money(o.subtotal_cents)} · Envío {money(o.shipping_cents)} · <b>Total {money(o.total_cents)}</b></p>
                        {o.notes && <p><b>Notas:</b> {o.notes}</p>}
                      </div>
                      <div>
                        <h3>Cliente</h3>
                        <ShipInfo o={o} />
                        <label className="status-select">Estado<select value={o.status} onChange={(e) => setStatus(o, e.target.value as OrderStatus)}>{Object.entries(ORDER_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
                        <div className="row-actions wide">
                          {o.customer_phone && <a className="button solid" href={waLink(toCoPhone(o.customer_phone), orderToCustomer({
                            number: o.order_number, name: o.customer_name, status: o.status, totalCents: o.total_cents, shippingCents: o.shipping_cents,
                            lines: o.order_items.map((i) => ({ name: i.product_name, qty: i.quantity, unitCents: i.unit_price_cents, options: i.customization })),
                            address: o.shipping_address?.address ?? [o.shipping_address?.street, o.shipping_address?.complement, o.shipping_address?.neighborhood, o.shipping_address?.city ?? o.city, o.shipping_address?.department].filter(Boolean).join(", "),
                            paymentInstructions: payInfo,
                          }))} target="_blank" rel="noopener"><MessageCircle size={14} />WhatsApp: {ORDER_STATUS[o.status].toLowerCase()}</a>}
                          {inv ? <a className="button outline-btn" href={`/admin/facturas?id=${inv.id}`}><Receipt size={14} />{inv.invoice_number}</a> : <button className="button outline-btn" onClick={() => invoice(o)}><Receipt size={14} />Crear factura</button>}
                        </div>
                      </div>
                    </div>
                  </div></div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}

/** Datos de envío del pedido, listos para copiar a la guía de la transportadora. */
function ShipInfo({ o }: { o: Order }) {
  const s = o.shipping_address ?? {};
  const address = s.address ?? [s.street, s.complement, s.neighborhood && `Barrio ${s.neighborhood}`, s.city ?? o.city, s.department].filter(Boolean).join(", ");
  const rows: [string, string | undefined | null][] = [
    ["Cliente", o.customer_name], ["Correo", o.customer_email], ["Celular", o.customer_phone],
    ["Documento", s.idNumber ? `${s.idType ?? "CC"} ${s.idNumber}` : undefined],
    ["Dirección", address], ["Lugar", s.placeType], ["Indicaciones", s.reference],
    ["Recibe", s.recipientIsMe === false ? `${s.recipientName} · ${s.recipientPhone}` : undefined],
  ];
  return (
    <dl className="ship-info">
      {rows.filter(([, v]) => v).map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
      <button type="button" className="text-link" onClick={() => { navigator.clipboard?.writeText(`${o.customer_name}\n${s.idNumber ? `${s.idType} ${s.idNumber}\n` : ""}${o.customer_phone ?? ""}\n${address}${s.reference ? `\n${s.reference}` : ""}`); toast.success("Datos copiados"); }}>Copiar para la guía</button>
    </dl>
  );
}
