"use client";

import { FormEvent, useEffect, useState } from "react";
import { Eye, EyeOff, Pencil, Plus, Trash2 } from "lucide-react";
import type { Post } from "@/lib/types";
import { formatDate } from "@/lib/format";
import { db, Empty, ImageList, LoadError, Loading, mutate, PageHead, useQuery } from "./kit";

const KINDS = ["Feria", "Taller", "Evento", "Nota"];
const EMPTY: Post = { id: "", kind: "Feria", title: "", place: "", event_date: null, body: "", image_url: null, published: true, created_at: "" };

export function BlogAdmin() {
  const { data, loading, failed, reload } = useQuery(async () => db().from("posts").select("*").order("event_date", { ascending: false, nullsFirst: true }));
  const [editing, setEditing] = useState<Post | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const posts = (data ?? []) as Post[];
  // eslint-disable-next-line react-hooks/set-state-in-effect -- sync image when the editor opens
  useEffect(() => { setImages(editing?.image_url ? [editing.image_url] : []); }, [editing]);

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editing) return;
    const f = new FormData(e.currentTarget);
    const row = { kind: String(f.get("kind")), title: String(f.get("title")).trim(), place: String(f.get("place")).trim() || null, event_date: String(f.get("event_date")) || null, body: String(f.get("body")).trim() || null, image_url: images[0] ?? null, published: f.get("published") === "on" };
    setSaving(true);
    const ok = await mutate(editing.id ? db().from("posts").update(row).eq("id", editing.id) : db().from("posts").insert(row), editing.id ? "Publicación actualizada" : "Publicación creada", ["posts"]);
    setSaving(false);
    if (ok) { setEditing(null); reload(); }
  }
  async function toggle(p: Post) { if (await mutate(db().from("posts").update({ published: !p.published }).eq("id", p.id), p.published ? "Oculta del blog" : "Publicada", ["posts"])) reload(); }
  async function remove(p: Post) { if (confirm(`¿Eliminar "${p.title}"?`) && await mutate(db().from("posts").delete().eq("id", p.id), "Publicación eliminada", ["posts"])) reload(); }

  return (
    <>
      <PageHead title="Blog" text="Ferias, talleres y eventos. Se muestran en orden de fecha." action={<button className="button solid" onClick={() => setEditing(EMPTY)}><Plus size={14} />Nueva publicación</button>} />
      <div className="admin-grid">
        <section className="admin-panel">
          {loading ? <Loading /> : failed ? <LoadError text={failed} retry={reload} /> : posts.length === 0 ? <Empty>Aún no hay publicaciones.</Empty> : (
            <div className="admin-table">{posts.map((p) => (
              <div className={`admin-row${p.published ? "" : " muted"}`} key={p.id}>
                {p.image_url ? <img className="row-thumb" src={p.image_url} alt="" /> : <span className="row-thumb num">{p.kind.slice(0, 1)}</span>}
                <span className="row-main"><strong>{p.title}</strong><small>{p.kind} · {formatDate(p.event_date, { day: "numeric", month: "short", year: "numeric" })}{p.place ? ` · ${p.place}` : ""}</small></span>
                <div className="row-actions">
                  <button title={p.published ? "Ocultar" : "Publicar"} onClick={() => toggle(p)}>{p.published ? <Eye size={16} /> : <EyeOff size={16} />}</button>
                  <button title="Editar" onClick={() => setEditing(p)}><Pencil size={16} /></button>
                  <button title="Eliminar" onClick={() => remove(p)}><Trash2 size={16} /></button>
                </div>
              </div>
            ))}</div>
          )}
        </section>
        {editing && (
          <form key={editing.id || "new"} className="admin-panel product-form" onSubmit={save}>
            <h2>{editing.id ? "Editar publicación" : "Nueva publicación"}</h2>
            <div className="form-pair">
              <label>Tipo<select name="kind" defaultValue={editing.kind}>{KINDS.map((k) => <option key={k}>{k}</option>)}</select></label>
              <label>Fecha<input name="event_date" type="date" defaultValue={editing.event_date ?? ""} /></label>
            </div>
            <label>Título<input name="title" required defaultValue={editing.title} placeholder="Feria de diseño local" /></label>
            <label>Lugar<input name="place" defaultValue={editing.place ?? ""} placeholder="Parque del Poblado, Medellín" /></label>
            <label>Texto<textarea name="body" rows={4} defaultValue={editing.body ?? ""} /></label>
            <label>Foto<ImageList value={images} onChange={setImages} folder="posts" max={1} /></label>
            <label className="checkbox"><input name="published" type="checkbox" defaultChecked={editing.published} /> Publicada</label>
            <div className="editor-actions"><button className="button solid" disabled={saving}>{saving ? "Guardando..." : "Guardar"}</button><button type="button" className="text-link" onClick={() => setEditing(null)}>Cancelar</button></div>
          </form>
        )}
      </div>
    </>
  );
}
