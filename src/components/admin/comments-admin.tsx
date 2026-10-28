"use client";

import { useState } from "react";
import { Check, EyeOff, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/format";
import { db, Empty, LoadError, Loading, mutate, PageHead, useQuery } from "./kit";

type Status = "pending" | "approved" | "rejected";
type Comment = { id: string; author_name: string; body: string; photos: string[]; status: Status; review_reason: string | null; created_at: string };

const when = (d: string) => formatDate(d, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
const TABS = [["pending", "Por revisar"], ["approved", "Publicados"], ["rejected", "Ocultos"]] as const;

/** Moderación: aprobar, ocultar o borrar lo que comentan las clientas. */
export function CommentsAdmin() {
  const [view, setView] = useState<Status>("pending");
  const { data, loading, failed, reload } = useQuery(async () => db().from("comments").select("*").order("created_at", { ascending: false }));
  const all = (data ?? []) as Comment[];
  const rows = all.filter((c) => c.status === view);

  async function set(c: Comment, status: Status) {
    if (await mutate(db().from("comments").update({ status }).eq("id", c.id), status === "approved" ? "Comentario publicado" : "Comentario oculto")) reload();
  }
  async function remove(c: Comment) {
    if (!confirm("¿Eliminar este comentario y sus fotos?")) return;
    const paths = c.photos.map((u) => u.split("/storage/v1/object/public/comments/")[1]).filter(Boolean);
    if (paths.length) await db().storage.from("comments").remove(paths);
    if (await mutate(db().from("comments").delete().eq("id", c.id), "Comentario eliminado")) reload();
  }

  return (
    <>
      <PageHead title="Comentarios" text="Lo limpio se publica solo. Lo que trae fotos, enlaces o palabras fuera de lugar espera tu revisión." />
      <div className="admin-filters">{TABS.map(([k, l]) => <button key={k} className={view === k ? "on" : ""} onClick={() => setView(k)}>{l} <small>{all.filter((c) => c.status === k).length}</small></button>)}</div>
      <section className="admin-panel">
        {loading ? <Loading /> : failed ? <LoadError text={failed} retry={reload} /> : rows.length === 0 ? <Empty>{view === "pending" ? "Nada por revisar." : "No hay comentarios aquí."}</Empty> : (
          <div className="inbox">{rows.map((c) => (
            <article key={c.id} className="inbox-item">
              <header><strong>{c.author_name}</strong><small>{when(c.created_at)}</small></header>
              {c.review_reason && c.status === "pending" && <span className="status s-new">{c.review_reason}</span>}
              <p>{c.body}</p>
              {c.photos.length > 0 && <div className="admin-comment-photos">{c.photos.map((src) => <a key={src} href={src} target="_blank" rel="noopener"><img src={src} alt="" /></a>)}</div>}
              <div className="row-actions wide">
                {c.status !== "approved" && <button className="button solid" onClick={() => set(c, "approved")}><Check size={14} />Publicar</button>}
                {c.status !== "rejected" && <button className="button outline-btn" onClick={() => set(c, "rejected")}><EyeOff size={14} />Ocultar</button>}
                <button className="icon-only" title="Eliminar" onClick={() => remove(c)}><Trash2 size={16} /></button>
              </div>
            </article>
          ))}</div>
        )}
      </section>
    </>
  );
}
