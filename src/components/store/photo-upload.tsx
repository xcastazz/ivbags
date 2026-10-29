"use client";

import { useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/browser";
import { useAuth } from "@/components/auth/auth-provider";
import { Close } from "./icons";

const MAX_PHOTOS = 3;
const MAX_MB = 10;

/** Fotos para un bolso personalizado: se suben apenas se eligen y devuelven su URL pública. */
export function CustomPhotos({ photos, onChange }: { photos: string[]; onChange: (photos: string[]) => void }) {
  const { user, guest, openSignIn } = useAuth();
  const [uploading, setUploading] = useState(0);

  async function pick(list: FileList | null) {
    if (!list) return;
    if (guest || !user) return openSignIn("cart");
    const room = MAX_PHOTOS - photos.length;
    const ok = [...list].filter((f) => {
      if (!f.type.startsWith("image/")) { toast.error(`${f.name} no es una imagen`); return false; }
      if (f.size > MAX_MB * 1024 * 1024) { toast.error(`${f.name} pesa más de ${MAX_MB} MB`); return false; }
      return true;
    });
    if (ok.length > room) toast(`Máximo ${MAX_PHOTOS} fotos`);
    const db = createClient();
    let next = photos;
    setUploading(Math.min(ok.length, room));
    for (const f of ok.slice(0, room)) {
      const ext = (f.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
      const { error } = await db.storage.from("custom-photos").upload(path, f, { contentType: f.type, cacheControl: "31536000" });
      if (error) { toast.error(`No pudimos subir ${f.name}`, { description: "Intenta de nuevo o envíanosla por WhatsApp." }); continue; }
      next = [...next, db.storage.from("custom-photos").getPublicUrl(path).data.publicUrl];
      onChange(next);
    }
    setUploading(0);
  }

  return (
    <div className="comment-files">
      {photos.map((src) => (
        <span key={src} className="comment-thumb"><img src={src} alt="" /><button type="button" aria-label="Quitar foto" onClick={() => onChange(photos.filter((p) => p !== src))}><Close size={12} /></button></span>
      ))}
      {Array.from({ length: uploading }, (_, i) => <span key={`u${i}`} className="comment-thumb uploading" aria-label="Subiendo foto" />)}
      {photos.length + uploading < MAX_PHOTOS && (
        <label className="comment-add">
          <input type="file" accept="image/*" multiple className="sr-only" disabled={uploading > 0} onChange={(e) => { pick(e.target.files); e.target.value = ""; }} />
          <span aria-hidden>+</span><small>Foto</small>
        </label>
      )}
    </div>
  );
}
