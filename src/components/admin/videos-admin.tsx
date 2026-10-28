"use client";

import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Eye, EyeOff, Pencil, Plus, Trash2, Video } from "lucide-react";
import type { StoreVideo } from "@/lib/types";
import { db, Empty, explainDbError, ImageList, LoadError, Loading, mutate, PageHead, useQuery, withTimeout } from "./kit";

const MAX_MB = 50;
const EMPTY: StoreVideo = { id: "", title: "", caption: null, video_url: "", poster_url: null, published: true, sort_order: 0, created_at: "" };
const storagePath = (url: string) => url.split("/storage/v1/object/public/videos/")[1];

/** Videos del taller que se muestran (y se reproducen solos) en el inicio. */
export function VideosAdmin() {
  const { data, loading, failed, reload } = useQuery(async () => db().from("store_videos").select("*").order("sort_order").order("created_at", { ascending: false }));
  const [editing, setEditing] = useState<StoreVideo | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [poster, setPoster] = useState<string[]>([]);
  const [progress, setProgress] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const videos = (data ?? []) as StoreVideo[];

  // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza el editor al abrirlo
  useEffect(() => { setVideoUrl(editing?.video_url ?? ""); setPoster(editing?.poster_url ? [editing.poster_url] : []); }, [editing]);

  async function upload(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("video/")) return toast.error("Ese archivo no es un video");
    if (file.size > MAX_MB * 1024 * 1024) return toast.error(`El video pesa más de ${MAX_MB} MB`, { description: "Súbelo más corto o comprímelo (por ejemplo, exportándolo en 720p)." });
    const ext = file.name.split(".").pop()?.toLowerCase() || "mp4";
    const path = `${crypto.randomUUID()}.${ext}`;
    setProgress(`Subiendo ${(file.size / 1024 / 1024).toFixed(1)} MB...`);
    try {
      const client = db();
      const { error } = await withTimeout(client.storage.from("videos").upload(path, file, { contentType: file.type, cacheControl: "31536000" }), 5 * 60000);
      if (error) throw error;
      setVideoUrl(client.storage.from("videos").getPublicUrl(path).data.publicUrl);
      toast.success("Video subido");
    } catch (e) {
      toast.error("No se pudo subir el video", { description: explainDbError(e as Error) });
    } finally {
      setProgress(null);
    }
  }

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editing) return;
    if (!videoUrl) return toast.error("Primero sube el video");
    const f = new FormData(e.currentTarget);
    const row = { title: String(f.get("title")).trim(), caption: String(f.get("caption")).trim() || null, video_url: videoUrl, poster_url: poster[0] ?? null, published: f.get("published") === "on" };
    setSaving(true);
    const ok = await mutate(editing.id ? db().from("store_videos").update(row).eq("id", editing.id) : db().from("store_videos").insert({ ...row, sort_order: videos.length }), editing.id ? "Video actualizado" : "Video publicado", ["videos"]);
    setSaving(false);
    if (ok) { setEditing(null); reload(); }
  }

  async function toggle(v: StoreVideo) { if (await mutate(db().from("store_videos").update({ published: !v.published }).eq("id", v.id), v.published ? "Video oculto" : "Video publicado", ["videos"])) reload(); }
  async function remove(v: StoreVideo) {
    if (!confirm(`¿Eliminar "${v.title}"?`)) return;
    const path = storagePath(v.video_url);
    if (path) await db().storage.from("videos").remove([path]);
    if (await mutate(db().from("store_videos").delete().eq("id", v.id), "Video eliminado", ["videos"])) reload();
  }
  async function move(i: number, dir: -1 | 1) {
    const a = videos[i], b = videos[i + dir];
    if (!a || !b) return;
    await db().from("store_videos").update({ sort_order: i + dir }).eq("id", a.id);
    if (await mutate(db().from("store_videos").update({ sort_order: i }).eq("id", b.id), "Orden actualizado", ["videos"])) reload();
  }

  return (
    <>
      <PageHead title="Videos" text="Se muestran en el inicio y se reproducen solos (sin sonido) cuando la clienta llega a esa parte. El primero es el principal." action={<button className="button solid" onClick={() => setEditing(EMPTY)}><Plus size={14} />Subir video</button>} />
      <div className="admin-grid">
        <section className="admin-panel">
          {loading ? <Loading /> : failed ? <LoadError text={failed} retry={reload} /> : videos.length === 0 ? <Empty>Aún no hay videos. Mientras no subas uno, la sección no aparece en la tienda.</Empty> : (
            <div className="admin-table">{videos.map((v, i) => (
              <div className={`admin-row${v.published ? "" : " muted"}`} key={v.id}>
                {v.poster_url ? <img className="row-thumb" src={v.poster_url} alt="" /> : <video className="row-thumb" src={`${v.video_url}#t=0.5`} muted preload="metadata" />}
                <span className="row-main"><strong>{v.title}</strong><small>{i === 0 ? "Principal · " : ""}{v.published ? "Publicado" : "Oculto"}</small></span>
                <div className="row-actions">
                  <button title="Subir" disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp size={16} /></button>
                  <button title="Bajar" disabled={i === videos.length - 1} onClick={() => move(i, 1)}><ArrowDown size={16} /></button>
                  <button title={v.published ? "Ocultar" : "Publicar"} onClick={() => toggle(v)}>{v.published ? <Eye size={16} /> : <EyeOff size={16} />}</button>
                  <button title="Editar" onClick={() => setEditing(v)}><Pencil size={16} /></button>
                  <button title="Eliminar" onClick={() => remove(v)}><Trash2 size={16} /></button>
                </div>
              </div>
            ))}</div>
          )}
        </section>
        {editing && (
          <form key={editing.id || "new"} className="admin-panel product-form" onSubmit={save}>
            <h2>{editing.id ? "Editar video" : "Nuevo video"}</h2>
            <label>Video
              {videoUrl
                ? <video className="admin-video-preview" src={videoUrl} controls muted playsInline />
                : null}
              <span className="image-add admin-video-add">
                <input type="file" accept="video/mp4,video/webm,video/quicktime" className="sr-only" disabled={!!progress} onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ""; }} />
                <Video size={20} />{progress ?? (videoUrl ? "Cambiar video" : `Elegir video (MP4 o MOV, hasta ${MAX_MB} MB)`)}
              </span>
            </label>
            <label>Título<input name="title" required maxLength={80} defaultValue={editing.title} placeholder="Así pintamos un bolso" /></label>
            <label>Descripción corta<textarea name="caption" rows={2} maxLength={200} defaultValue={editing.caption ?? ""} placeholder="Del boceto al bordado en 30 segundos" /></label>
            <label>Portada <small>(opcional: la imagen que se ve antes de que cargue)</small><ImageList value={poster} onChange={setPoster} folder="videos" max={1} /></label>
            <label className="checkbox"><input name="published" type="checkbox" defaultChecked={editing.published} /> Publicado</label>
            <div className="editor-actions"><button className="button solid" disabled={saving || !!progress}>{saving ? "Guardando..." : "Guardar"}</button><button type="button" className="text-link" onClick={() => setEditing(null)}>Cancelar</button></div>
          </form>
        )}
      </div>
    </>
  );
}
