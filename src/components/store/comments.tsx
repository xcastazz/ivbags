"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { createClient, hasSupabase } from "@/lib/supabase/browser";
import { useAuth } from "@/components/auth/auth-provider";
import { Close, Star } from "./icons";

type Comment = { id: string; user_id: string; author_name: string; body: string; photos: string[]; status: "pending" | "approved" | "rejected"; created_at: string };

const MAX_PHOTOS = 4;
const MAX_MB = 5;
const when = (d: string) => new Date(d).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" });

/** Lo que dicen nuestras clientas: comentarios con fotos, moderados. */
export function CommentsSection() {
  const { user, guest, openSignIn } = useAuth();
  const [items, setItems] = useState<Comment[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [zoom, setZoom] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!hasSupabase()) return setLoaded(true);
    const { data } = await createClient().from("comments").select("*").neq("status", "rejected").order("created_at", { ascending: false }).limit(30);
    setItems((data ?? []) as Comment[]);
    setLoaded(true);
  }, []);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch al montar y al cambiar de sesión
  useEffect(() => { load(); }, [load, user?.id]);

  async function remove(c: Comment) {
    if (!confirm("¿Eliminar tu comentario?")) return;
    const { error } = await createClient().from("comments").delete().eq("id", c.id);
    if (error) return toast.error("No pudimos eliminarlo");
    setItems((list) => list.filter((x) => x.id !== c.id));
  }

  return (
    <section id="comentarios" className="section-comments" aria-labelledby="comments-title">
      <div className="center-head">
        <div className="lb pink-lb"><Star size={11} /> Comunidad IV <Star size={11} /></div>
        <h2 id="comments-title" className="d h-comments">Lo que dicen <i>nuestras clientas</i></h2>
        <p>Cuéntanos cómo te fue con tu pieza y muéstranos cómo la usas.</p>
      </div>

      {guest || !user
        ? <div className="comment-gate"><p>Para comentar necesitas tu cuenta.</p><button className="btn btn-solid" onClick={() => openSignIn("welcome")}>Entrar para comentar</button></div>
        : <CommentForm userId={user.id} defaultName={(user.user_metadata?.full_name as string | undefined) ?? ""} onSent={(c) => setItems((list) => [c, ...list])} />}

      <div className="comment-list" aria-live="polite">
        {loaded && items.length === 0 && <p className="comment-empty">Sé la primera en contarnos cómo te fue.</p>}
        {items.map((c) => (
          <article key={c.id} className="comment-card" data-status={c.status}>
            <header>
              <span className="comment-avatar" aria-hidden>{c.author_name.charAt(0).toUpperCase()}</span>
              <span><strong>{c.author_name}</strong><small>{when(c.created_at)}</small></span>
              {c.status === "pending" && <span className="comment-badge">En revisión · solo tú lo ves</span>}
              {user?.id === c.user_id && <button className="comment-del" onClick={() => remove(c)} aria-label="Eliminar mi comentario"><Close size={14} /></button>}
            </header>
            <p>{c.body}</p>
            {c.photos.length > 0 && (
              <div className="comment-photos">{c.photos.map((src) => <button key={src} onClick={() => setZoom(src)} aria-label="Ver foto en grande"><img src={src} alt={`Foto de ${c.author_name}`} loading="lazy" /></button>)}</div>
            )}
          </article>
        ))}
      </div>

      {zoom && (
        <div className="comment-zoom" role="dialog" aria-label="Foto" onClick={() => setZoom(null)} onKeyDown={(e) => e.key === "Escape" && setZoom(null)}>
          <img src={zoom} alt="" />
          <button autoFocus aria-label="Cerrar" onClick={() => setZoom(null)}><Close size={20} /></button>
        </div>
      )}
    </section>
  );
}

function CommentForm({ userId, defaultName, onSent }: { userId: string; defaultName: string; onSent: (c: Comment) => void }) {
  const [body, setBody] = useState("");
  const [name, setName] = useState(defaultName);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    // eslint-disable-next-line react-hooks/set-state-in-effect -- vistas previas derivadas de los archivos
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);

  function pick(list: FileList | null) {
    if (!list) return;
    const ok = [...list].filter((f) => {
      if (!f.type.startsWith("image/")) { toast.error(`${f.name} no es una imagen`); return false; }
      if (f.size > MAX_MB * 1024 * 1024) { toast.error(`${f.name} pesa más de ${MAX_MB} MB`); return false; }
      return true;
    });
    const next = [...files, ...ok].slice(0, MAX_PHOTOS);
    if (files.length + ok.length > MAX_PHOTOS) toast(`Máximo ${MAX_PHOTOS} fotos`);
    setFiles(next);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (body.trim().length < 3) return toast.error("Escribe un poco más");
    setSending(true);
    const db = createClient();
    try {
      const photos: string[] = [];
      for (const f of files) {
        const ext = (f.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
        const path = `${userId}/${crypto.randomUUID()}.${ext}`;
        const { error } = await db.storage.from("comments").upload(path, f, { contentType: f.type, cacheControl: "31536000" });
        if (error) throw error;
        photos.push(db.storage.from("comments").getPublicUrl(path).data.publicUrl);
      }
      const { data, error } = await db.from("comments").insert({ author_name: name.trim() || "Clienta IV", body: body.trim(), photos }).select().single();
      if (error) throw error;
      const c = data as Comment;
      onSent(c);
      setBody(""); setFiles([]);
      if (c.status === "approved") toast.success("¡Gracias! Tu comentario ya está publicado");
      else toast.success("¡Gracias! Lo publicamos apenas lo revisemos", { description: "Revisamos los comentarios con fotos o enlaces antes de mostrarlos." });
    } catch (err) {
      const msg = (err as { message?: string }).message ?? "";
      toast.error("No pudimos publicar tu comentario", { description: /varios comentarios/.test(msg) ? msg : "Intenta de nuevo en un momento." });
    } finally {
      setSending(false);
    }
  }

  return (
    <form className="comment-form" onSubmit={submit}>
      <div className="fgroup"><label className="lb wine" htmlFor="cm-name">Tu nombre</label><input id="cm-name" className="field" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} required autoComplete="given-name" /></div>
      <div className="fgroup">
        <label className="lb wine" htmlFor="cm-body">Tu comentario</label>
        <textarea id="cm-body" className="field" value={body} onChange={(e) => setBody(e.target.value)} maxLength={800} rows={4} required placeholder="¿Qué pieza tienes? ¿Cómo te ha ido con ella?" />
        <small className="comment-count">{body.length}/800</small>
      </div>
      <div className="comment-files">
        {previews.map((src, i) => (
          <span key={src} className="comment-thumb"><img src={src} alt="" /><button type="button" aria-label="Quitar foto" onClick={() => setFiles((f) => f.filter((_, j) => j !== i))}><Close size={12} /></button></span>
        ))}
        {files.length < MAX_PHOTOS && (
          <label className="comment-add">
            <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => { pick(e.target.files); e.target.value = ""; }} />
            <span aria-hidden>+</span><small>Foto</small>
          </label>
        )}
      </div>
      <p className="comment-rules">Hasta {MAX_PHOTOS} fotos de {MAX_MB} MB. Los comentarios con fotos, enlaces o palabras fuera de lugar pasan por revisión antes de publicarse.</p>
      <button className="btn btn-solid" type="submit" disabled={sending}>{sending ? "Publicando..." : "Publicar comentario"}</button>
    </form>
  );
}
