"use client";

import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ImagePlus, X } from "lucide-react";
import { createClient } from "@/lib/supabase/browser";
import { refreshStore } from "@/app/actions";

export const db = () => createClient();

type DbError = { message: string; code?: string; details?: string | null };
const TIMEOUT_MS = 20000;

/** Ninguna operación del panel puede quedarse esperando para siempre. */
export function withTimeout<T>(work: PromiseLike<T>, ms = TIMEOUT_MS): Promise<T> {
  return Promise.race([Promise.resolve(work), new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), ms))]);
}

/** Traduce los errores de Supabase a algo que se entienda y diga cómo arreglarlo. */
export function explainDbError(error: DbError | Error) {
  const msg = error.message ?? "";
  const code = "code" in error ? error.code : undefined;
  if (msg === "timeout") return "La base de datos no respondió a tiempo. Revisa tu conexión e intenta de nuevo.";
  if (code === "42501" || /row-level security|permission denied/i.test(msg)) return "Tu cuenta no tiene permiso de admin. En Supabase, cambia tu rol a 'admin' en la tabla profiles.";
  if (code === "23505") return "Ya existe un registro igual (por ejemplo, otro producto con el mismo enlace).";
  if (code === "23502") return "Falta un dato obligatorio.";
  if (code === "23514" || code === "22P02") return "Algún dato no tiene el formato correcto (revisa precios y números).";
  if (code === "PGRST204" || code === "PGRST205" || code === "42703") return "La base de datos no está actualizada. Ejecuta supabase/instalar_todo.sql en el SQL Editor.";
  if (/JWT|expired|not authenticated/i.test(msg)) return "Tu sesión venció. Vuelve a iniciar sesión.";
  if (/Failed to fetch|NetworkError|network/i.test(msg)) return "Sin conexión con el servidor. Revisa tu internet.";
  if (/Bucket not found/i.test(msg)) return "Falta el espacio para fotos ('media'). Ejecuta supabase/instalar_todo.sql en el SQL Editor.";
  return msg || "Error desconocido";
}

/** Lee una consulta y expone `reload`. Siempre termina, aunque falle. */
export function useQuery<T>(run: () => PromiseLike<{ data: T | null; error: DbError | null }>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState<string | null>(null);
  const runRef = useRef(run);
  useEffect(() => { runRef.current = run; });
  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await withTimeout(runRef.current());
      if (error) throw error;
      setData(data);
      setFailed(null);
    } catch (e) {
      const text = explainDbError(e as DbError);
      setFailed(text);
      toast.error("No pudimos cargar los datos", { description: text });
    } finally {
      setLoading(false);
    }
  }, []);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch
  useEffect(() => { reload(); }, [reload]);
  return { data, loading, failed, reload, setData };
}

/** Refresca la tienda pública en segundo plano: nunca bloquea al panel. */
function refreshInBackground(tags: Parameters<typeof refreshStore>[0]) {
  if (!tags.length) return;
  withTimeout(refreshStore(tags), 15000)
    .then((r) => { if (!r?.ok) console.warn("refreshStore: la tienda se actualizará en unos minutos"); })
    .catch((e) => console.warn("refreshStore", e));
}

/** Ejecuta un cambio con límite de tiempo, avisa con un toast y refresca la tienda. Siempre devuelve true/false. */
export async function mutate(action: PromiseLike<{ error: DbError | null }>, ok: string, tags: Parameters<typeof refreshStore>[0] = []) {
  try {
    const { error } = await withTimeout(action);
    if (error) throw error;
  } catch (e) {
    toast.error("No se pudo guardar", { description: explainDbError(e as DbError) });
    return false;
  }
  refreshInBackground(tags);
  toast.success(ok);
  return true;
}

/** Aviso dentro del panel cuando una lista no pudo cargar. */
export function LoadError({ text, retry }: { text: string; retry: () => void }) {
  return <div className="load-error" role="alert"><p>{text}</p><button className="button outline-btn" onClick={retry}>Reintentar</button></div>;
}

export function PageHead({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return <header className="admin-heading"><div><h1>{title}</h1>{text && <p>{text}</p>}</div>{action}</header>;
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="empty-state">{children}</p>;
}

export function Loading() {
  return <div className="admin-loading" aria-live="polite"><span /><span /><span /></div>;
}

export async function uploadImage(file: File, folder: string) {
  if (file.size > 5 * 1024 * 1024) { toast.error("La imagen pesa más de 5 MB"); return null; }
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const client = db();
  try {
    const { error } = await withTimeout(client.storage.from("media").upload(path, file, { contentType: file.type || "image/jpeg", upsert: false }), 60000);
    if (error) throw error;
    return client.storage.from("media").getPublicUrl(path).data.publicUrl;
  } catch (e) {
    toast.error("No se pudo subir la imagen", { description: explainDbError(e as DbError) });
    return null;
  }
}

/** Lista de imágenes con subir, pegar URL, reordenar (la primera es la portada) y quitar. */
export function ImageList({ value, onChange, folder, max = 6 }: { value: string[]; onChange: (v: string[]) => void; folder: string; max?: number }) {
  const [busy, setBusy] = useState(false);
  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    const urls: string[] = [];
    for (const file of Array.from(files).slice(0, max - value.length)) { const url = await uploadImage(file, folder); if (url) urls.push(url); }
    setBusy(false);
    onChange([...value, ...urls]);
  }
  return (
    <div className="image-list">
      {value.map((src, i) => (
        <div className="image-tile" key={src}>
          <img src={src} alt="" />
          {i === 0 && <span className="cover">Portada</span>}
          <div className="tile-actions">
            {i > 0 && <button type="button" onClick={() => onChange([src, ...value.filter((s) => s !== src)])}>Portada</button>}
            <button type="button" aria-label="Quitar foto" onClick={() => onChange(value.filter((s) => s !== src))}><X size={14} /></button>
          </div>
        </div>
      ))}
      {value.length < max && <label className="image-add"><input type="file" accept="image/*" multiple={max > 1} className="sr-only" onChange={(e) => { onFiles(e.target.files); e.target.value = ""; }} disabled={busy} /><ImagePlus size={20} />{busy ? "Subiendo..." : "Subir foto"}</label>}
      {value.length < max && <input className="image-url" placeholder="o pega una URL y presiona Enter" onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); const v = e.currentTarget.value.trim(); if (/^https?:\/\//.test(v)) { onChange([...value, v]); e.currentTarget.value = ""; } } }} />}
    </div>
  );
}

export const copFromCents = (cents: number) => String(Math.round(cents / 100));
export const centsFromCop = (cop: FormDataEntryValue | null) => Math.max(0, Math.round(Number(String(cop ?? "0").replace(/[^\d]/g, "")) * 100));
