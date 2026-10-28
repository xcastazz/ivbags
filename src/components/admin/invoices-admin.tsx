"use client";

import { useEffect, useState } from "react";
import { Printer } from "lucide-react";
import { formatDate, money } from "@/lib/format";
import { DEFAULT_CONTENT } from "@/lib/defaults";
import type { Shipping } from "@/lib/colombia";
import type { SiteContent } from "@/lib/types";
import { Logo } from "@/components/store/logo";
import { db, Empty, LoadError, Loading, mutate, PageHead, useQuery } from "./kit";

type Line = { name: string; qty: number; unit: number; options?: string };
type Snapshot = {
  name?: string; email?: string; phone?: string; address?: (Partial<Shipping> & { address?: string }) | null;
  items?: Line[]; shipping?: number; payment?: string | null; orderDate?: string; notes?: string | null;
};
type Invoice = { id: string; invoice_number: string; status: "draft" | "issued" | "void"; issue_date: string | null; subtotal_cents: number; tax_cents: number; total_cents: number; created_at: string; billing_snapshot: Snapshot; orders: { order_number: number; created_at: string } | null };
const LABEL = { draft: "Borrador", issued: "Emitida", void: "Anulada" };
const OPTION_LABELS: Record<string, string> = { petName: "Nombre de la mascota", pets: "Mascotas" };
/** "petName: Lola" → "Nombre de la mascota: Lola" (para facturas creadas antes de este cambio también). */
const prettyOptions = (text?: string) => text?.replace(/b(petName|pets):/g, (_, k: string) => `${OPTION_LABELS[k]}:`);
const prettyPhone = (p: string) => p.replace(/^(57)(d{3})(d{3})(d{4})$/, "+$1 $2 $3 $4");
const longDate = (d?: string | null) => (d ? formatDate(d, { day: "numeric", month: "long", year: "numeric" }) : "—");

export function InvoicesAdmin() {
  const { data, loading, failed, reload } = useQuery(async () => db().from("invoices").select("*, orders(order_number, created_at)").order("created_at", { ascending: false }));
  const { data: site } = useQuery<{ value: Partial<SiteContent> }>(async () => db().from("site_content").select("value").eq("key", "site").maybeSingle());
  const [selected, setSelected] = useState<string | null>(null);
  const invoices = (data ?? []) as Invoice[];
  const business = { ...DEFAULT_CONTENT, ...(site?.value ?? {}) };
  // eslint-disable-next-line react-hooks/set-state-in-effect -- deep link from an order
  useEffect(() => { setSelected(new URLSearchParams(window.location.search).get("id")); }, []);
  const current = invoices.find((i) => i.id === selected) ?? null;

  async function setStatus(inv: Invoice, status: Invoice["status"]) {
    const change = status === "issued" ? { status, issue_date: new Date().toISOString().slice(0, 10) } : { status };
    if (await mutate(db().from("invoices").update(change).eq("id", inv.id), `Factura ${LABEL[status].toLowerCase()}`)) reload();
  }

  function print(inv: Invoice) {
    const previous = document.title;
    document.title = `${inv.invoice_number} - ${inv.billing_snapshot.name ?? "IV Bags"}`; // nombre del PDF al guardar
    window.print();
    setTimeout(() => { document.title = previous; }, 500);
  }

  return (
    <>
      <PageHead title="Facturas" text="Comprobantes de cada pedido, listos para imprimir o guardar en PDF." />
      <div className="invoice-layout">
        <section className="admin-panel invoice-index">
          {loading ? <Loading /> : failed ? <LoadError text={failed} retry={reload} /> : invoices.length === 0 ? <Empty>Crea facturas desde el detalle de cada pedido.</Empty> : (
            <div className="admin-table">{invoices.map((i) => (
              <button key={i.id} className={`admin-row as-button${selected === i.id ? " on" : ""}`} onClick={() => setSelected(i.id)}>
                <span className="row-main"><strong>{i.invoice_number}</strong><small>Pedido #{i.orders?.order_number} · {i.billing_snapshot.name}</small></span>
                <span className={`status inv-${i.status}`}>{LABEL[i.status]}</span>
                <b className="row-price">{money(i.total_cents)}</b>
              </button>
            ))}</div>
          )}
        </section>

        {current ? (
          <div className="invoice-wrap">
            <div className="invoice-toolbar no-print">
              {current.status === "draft" && <button className="button solid" onClick={() => setStatus(current, "issued")}>Marcar emitida</button>}
              <button className="button outline-btn" onClick={() => print(current)}><Printer size={14} />Imprimir o guardar PDF</button>
              {current.status !== "void" && <button className="button outline-btn" onClick={() => confirm("¿Anular esta factura? No se puede deshacer.") && setStatus(current, "void")}>Anular</button>}
            </div>
            <InvoiceDocument inv={current} business={business} />
          </div>
        ) : !loading && invoices.length > 0 && <div className="invoice-placeholder no-print">Elige una factura para verla.</div>}
      </div>
    </>
  );
}

/** La factura como documento de la marca. Es lo único que se imprime. */
export function InvoiceDocument({ inv, business }: { inv: Invoice; business: SiteContent }) {
  const s = inv.billing_snapshot;
  const a = s.address ?? {};
  const items = s.items ?? [];
  const shipping = s.shipping ?? 0;
  const subtotal = items.reduce((n, i) => n + i.unit * i.qty, 0);
  const address = a.address ?? [a.street, a.complement, a.neighborhood && `Barrio ${a.neighborhood}`, a.city, a.department].filter(Boolean).join(", ");
  const recipient = a.recipientIsMe === false && a.recipientName ? `${a.recipientName}${a.recipientPhone ? ` · ${a.recipientPhone}` : ""}` : null;

  return (
    <article className={`invoice-doc st-${inv.status}`} id="invoice-print">
      <div className="inv-band" aria-hidden />
      {inv.status !== "issued" && <div className="inv-stamp" aria-hidden>{LABEL[inv.status]}</div>}

      <header className="inv-head">
        <div className="inv-brand">
          <Logo height={52} />
          <p><b>{business.legalName}</b>{business.taxId && <><br />NIT/CC {business.taxId}</>}<br />{business.legalAddress}<br />{business.email} · WhatsApp {prettyPhone(business.whatsapp)}</p>
        </div>
        <div className="inv-meta">
          <span className="lb">Factura de venta</span>
          <h2 className="d">{inv.invoice_number}</h2>
          <dl>
            <div><dt>Pedido</dt><dd>#{inv.orders?.order_number}</dd></div>
            <div><dt>Fecha del pedido</dt><dd>{longDate(s.orderDate ?? inv.orders?.created_at)}</dd></div>
            <div><dt>Fecha de emisión</dt><dd>{inv.issue_date ? longDate(inv.issue_date) : "Sin emitir"}</dd></div>
          </dl>
        </div>
      </header>

      <section className="inv-parties">
        <div>
          <span className="lb">Facturado a</span>
          <p><b>{s.name}</b>{a.idNumber && <><br />{a.idType ?? "CC"} {a.idNumber}</>}<br />{s.email}<br />{s.phone}</p>
        </div>
        <div>
          <span className="lb">Enviar a</span>
          <p>{recipient && <><b>{recipient}</b><br /></>}{address || "—"}{a.reference && <><br /><i>{a.reference}</i></>}</p>
        </div>
      </section>

      <table className="inv-table">
        <thead><tr><th>Pieza</th><th className="num">Cant.</th><th className="num">Valor unitario</th><th className="num">Total</th></tr></thead>
        <tbody>
          {items.map((it, k) => (
            <tr key={k}>
              <td><b>{it.name}</b>{it.options && <small>{prettyOptions(it.options)}</small>}</td>
              <td className="num">{it.qty}</td>
              <td className="num">{money(it.unit)}</td>
              <td className="num">{money(it.unit * it.qty)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <section className="inv-bottom">
        <div className="inv-note">
          {s.payment && <p><span className="lb">Forma de pago</span><br />{s.payment}</p>}
          {s.notes && <p><span className="lb">Notas</span><br />{s.notes}</p>}
          <p className="inv-thanks d">{business.invoiceNote}</p>
          <p className="inv-sign"><i>Con cariño,</i><br />el taller de IV Bags</p>
        </div>
        <dl className="inv-totals">
          <div><dt>Subtotal</dt><dd>{money(subtotal)}</dd></div>
          <div><dt>Envío</dt><dd>{shipping ? money(shipping) : "Incluido / coordinado"}</dd></div>
          {inv.tax_cents > 0 && <div><dt>Impuestos</dt><dd>{money(inv.tax_cents)}</dd></div>}
          <div className="grand"><dt>Total</dt><dd>{money(inv.total_cents)}</dd></div>
        </dl>
      </section>

      <footer className="inv-foot">
        <span>Hecho a mano en {business.city} · @{business.instagram}</span>
        <span>Documento soporte de venta. No reemplaza la factura electrónica DIAN.</span>
      </footer>
    </article>
  );
}
