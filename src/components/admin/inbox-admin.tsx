"use client";

import { useState } from "react";
import { Archive, Check, MessageCircle, Trash2 } from "lucide-react";
import { formatDate, waLink } from "@/lib/format";
import { ORDER_STATUS, type OrderStatus } from "@/lib/types";
import { requestReply } from "@/lib/whatsapp";
import { db, Empty, LoadError, Loading, mutate, PageHead, useQuery } from "./kit";

const when = (d: string) => formatDate(d, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
const phoneLink = (p: string, text: string) => waLink(p.replace(/\D/g, "").length === 10 ? `57${p}` : p, text);

type Request = { id: string; name: string; email: string | null; phone: string | null; message: string; reference_images?: string[]; status: OrderStatus; created_at: string };

export function RequestsAdmin() {
  const [showAll, setShowAll] = useState(false);
  const { data, loading, failed, reload } = useQuery(async () => db().from("custom_requests").select("*").order("created_at", { ascending: false }));
  const rows = ((data ?? []) as Request[]).filter((r) => showAll || !["completed", "cancelled"].includes(r.status));
  async function setStatus(r: Request, status: OrderStatus) {
    if (await mutate(db().from("custom_requests").update({ status }).eq("id", r.id), "Solicitud actualizada")) reload();
  }
  return (
    <>
      <PageHead title="Personalizados" text="Ideas que llegan desde “Personaliza tu bolso”." />
      <div className="admin-filters"><button className={!showAll ? "on" : ""} onClick={() => setShowAll(false)}>Abiertas</button><button className={showAll ? "on" : ""} onClick={() => setShowAll(true)}>Todas</button></div>
      <section className="admin-panel">
        {loading ? <Loading /> : failed ? <LoadError text={failed} retry={reload} /> : rows.length === 0 ? <Empty>No hay solicitudes por ahora.</Empty> : (
          <div className="inbox">{rows.map((r) => (
            <article key={r.id} className="inbox-item">
              <header><strong>{r.name}</strong><small>{when(r.created_at)}</small></header>
              <p className="d quote">“{r.message}”</p>
              {!!r.reference_images?.length && <span className="order-photos">{r.reference_images.map((src) => <a key={src} href={src} target="_blank" rel="noopener" download><img src={src} alt="Foto de referencia" /></a>)}</span>}
              <small>{[r.phone, r.email].filter(Boolean).join(" · ")}</small>
              <div className="row-actions wide">
                <select aria-label="Estado" value={r.status} onChange={(e) => setStatus(r, e.target.value as OrderStatus)}>{Object.entries(ORDER_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
                {r.phone && <a className="button solid" href={phoneLink(r.phone, requestReply(r))} target="_blank" rel="noopener"><MessageCircle size={14} />Cotizar por WhatsApp</a>}
              </div>
            </article>
          ))}</div>
        )}
      </section>
    </>
  );
}

type Message = { id: string; name: string; contact: string; message: string; status: "new" | "answered" | "archived"; created_at: string };

export function MessagesAdmin() {
  const [view, setView] = useState<"new" | "answered" | "archived">("new");
  const { data, loading, failed, reload } = useQuery(async () => db().from("contact_messages").select("*").order("created_at", { ascending: false }));
  const all = (data ?? []) as Message[];
  const rows = all.filter((m) => m.status === view);
  async function set(m: Message, status: Message["status"]) { if (await mutate(db().from("contact_messages").update({ status }).eq("id", m.id), status === "answered" ? "Marcado como respondido" : "Archivado")) reload(); }
  async function remove(m: Message) { if (confirm("¿Eliminar este mensaje?") && await mutate(db().from("contact_messages").delete().eq("id", m.id), "Mensaje eliminado")) reload(); }
  const reply = (m: Message) => m.contact.includes("@") ? `mailto:${m.contact}?subject=${encodeURIComponent("IV Bags")}` : phoneLink(m.contact, `Hola ${m.name.split(" ")[0]}, te escribimos de IV Bags.`);
  return (
    <>
      <PageHead title="Mensajes" text="Lo que llega desde la página de contacto." />
      <div className="admin-filters">{([["new", "Nuevos"], ["answered", "Respondidos"], ["archived", "Archivados"]] as const).map(([k, l]) => <button key={k} className={view === k ? "on" : ""} onClick={() => setView(k)}>{l} <small>{all.filter((m) => m.status === k).length}</small></button>)}</div>
      <section className="admin-panel">
        {loading ? <Loading /> : failed ? <LoadError text={failed} retry={reload} /> : rows.length === 0 ? <Empty>No hay mensajes aquí.</Empty> : (
          <div className="inbox">{rows.map((m) => (
            <article key={m.id} className="inbox-item">
              <header><strong>{m.name}</strong><small>{when(m.created_at)}</small></header>
              <p>{m.message}</p>
              <small>{m.contact}</small>
              <div className="row-actions wide">
                <a className="button solid" href={reply(m)} target="_blank" rel="noopener"><MessageCircle size={14} />Responder</a>
                {m.status !== "answered" && <button className="button outline-btn" onClick={() => set(m, "answered")}><Check size={14} />Respondido</button>}
                {m.status !== "archived" && <button className="button outline-btn" onClick={() => set(m, "archived")}><Archive size={14} />Archivar</button>}
                <button className="icon-only" title="Eliminar" onClick={() => remove(m)}><Trash2 size={16} /></button>
              </div>
            </article>
          ))}</div>
        )}
      </section>
    </>
  );
}

type Customer = { id: string; full_name: string | null; phone: string | null; role: "customer" | "admin"; created_at: string };

export function CustomersAdmin() {
  const { data, loading, failed, reload } = useQuery(async () => db().from("profiles").select("*").order("created_at", { ascending: false }));
  const rows = (data ?? []) as Customer[];
  async function toggle(c: Customer) {
    const role = c.role === "admin" ? "customer" : "admin";
    if (!confirm(role === "admin" ? `¿Dar acceso al panel a ${c.full_name ?? "esta persona"}?` : `¿Quitar el acceso al panel a ${c.full_name ?? "esta persona"}?`)) return;
    if (await mutate(db().from("profiles").update({ role }).eq("id", c.id), role === "admin" ? "Ahora es admin" : "Ya no es admin")) reload();
  }
  return (
    <>
      <PageHead title="Clientes" text={`${rows.length} cuentas creadas en la tienda.`} />
      <section className="admin-panel">
        {loading ? <Loading /> : failed ? <LoadError text={failed} retry={reload} /> : rows.length === 0 ? <Empty>Aún no hay cuentas.</Empty> : (
          <div className="admin-table">{rows.map((c) => (
            <div className="admin-row" key={c.id}>
              <span className="row-main"><strong>{c.full_name ?? "Sin nombre"}</strong><small>{c.phone ?? "Sin teléfono"} · desde {formatDate(c.created_at, { month: "short", year: "numeric" })}</small></span>
              {c.role === "admin" && <span className="status s-confirmed">Admin</span>}
              <div className="row-actions">
                {c.phone && <a title="WhatsApp" href={phoneLink(c.phone, "Hola, te escribimos de IV Bags.")} target="_blank" rel="noopener"><MessageCircle size={16} /></a>}
                <button className="button outline-btn" onClick={() => toggle(c)}>{c.role === "admin" ? "Quitar admin" : "Hacer admin"}</button>
              </div>
            </div>
          ))}</div>
        )}
      </section>
    </>
  );
}
