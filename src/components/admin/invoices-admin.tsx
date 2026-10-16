"use client";

import { useEffect, useState } from "react";
import { Printer } from "lucide-react";
import { formatDate, money } from "@/lib/format";
import { db, Empty, LoadError, Loading, mutate, PageHead, useQuery } from "./kit";

type Snapshot = { name?: string; email?: string; phone?: string; address?: { address?: string; city?: string }; items?: { name: string; qty: number; unit: number }[]; shipping?: number };
type Invoice = { id: string; invoice_number: string; status: "draft" | "issued" | "void"; issue_date: string | null; total_cents: number; created_at: string; billing_snapshot: Snapshot; orders: { order_number: number } | null };
const LABEL = { draft: "Borrador", issued: "Emitida", void: "Anulada" };

export function InvoicesAdmin() {
  const { data, loading, failed, reload } = useQuery(async () => db().from("invoices").select("*, orders(order_number)").order("created_at", { ascending: false }));
  const [selected, setSelected] = useState<string | null>(null);
  const invoices = (data ?? []) as Invoice[];
  // eslint-disable-next-line react-hooks/set-state-in-effect -- deep link from an order
  useEffect(() => { setSelected(new URLSearchParams(window.location.search).get("id")); }, []);
  const current = invoices.find((i) => i.id === selected);

  async function setStatus(inv: Invoice, status: Invoice["status"]) {
    const change = status === "issued" ? { status, issue_date: new Date().toISOString().slice(0, 10) } : { status };
    if (await mutate(db().from("invoices").update(change).eq("id", inv.id), `Factura ${LABEL[status].toLowerCase()}`)) reload();
  }

  return (
    <>
      <PageHead title="Facturas" text="Comprobantes internos de cada pedido. Para factura electrónica DIAN conecta un proveedor certificado." />
      <div className="admin-grid">
        <section className="admin-panel">
          {loading ? <Loading /> : failed ? <LoadError text={failed} retry={reload} /> : invoices.length === 0 ? <Empty>Crea facturas desde el detalle de cada pedido.</Empty> : (
            <div className="admin-table">{invoices.map((i) => <button key={i.id} className={`admin-row as-button${selected === i.id ? " on" : ""}`} onClick={() => setSelected(i.id)}><span className="row-main"><strong>{i.invoice_number}</strong><small>Pedido #{i.orders?.order_number} · {i.billing_snapshot.name}</small></span><span className={`status inv-${i.status}`}>{LABEL[i.status]}</span><b className="row-price">{money(i.total_cents)}</b></button>)}</div>
          )}
        </section>
        {current && (
          <section className="admin-panel invoice-sheet" id="invoice-print">
            <div className="row-between"><h2>{current.invoice_number}</h2><span className={`status inv-${current.status}`}>{LABEL[current.status]}</span></div>
            <p>{current.billing_snapshot.name}<br />{current.billing_snapshot.email} · {current.billing_snapshot.phone}<br />{current.billing_snapshot.address?.address}, {current.billing_snapshot.address?.city}</p>
            <p className="hint">Pedido #{current.orders?.order_number} · {current.issue_date ? `Emitida ${formatDate(current.issue_date, { day: "numeric", month: "long", year: "numeric" })}` : "Sin emitir"}</p>
            <table><thead><tr><th>Pieza</th><th>Cant.</th><th>Valor</th></tr></thead><tbody>
              {current.billing_snapshot.items?.map((it, k) => <tr key={k}><td>{it.name}</td><td>{it.qty}</td><td>{money(it.unit * it.qty)}</td></tr>)}
              <tr><td>Envío</td><td></td><td>{money(current.billing_snapshot.shipping ?? 0)}</td></tr>
              <tr className="total"><td>Total</td><td></td><td>{money(current.total_cents)}</td></tr>
            </tbody></table>
            <div className="row-actions wide no-print">
              {current.status === "draft" && <button className="button solid" onClick={() => setStatus(current, "issued")}>Marcar emitida</button>}
              {current.status !== "void" && <button className="button outline-btn" onClick={() => confirm("¿Anular esta factura?") && setStatus(current, "void")}>Anular</button>}
              <button className="button outline-btn" onClick={() => window.print()}><Printer size={14} />Imprimir</button>
            </div>
          </section>
        )}
      </div>
    </>
  );
}
