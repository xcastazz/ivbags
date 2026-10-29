"use client";

import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { createClient, hasSupabase } from "@/lib/supabase/browser";
import { waLink } from "@/lib/format";
import { contactMessage, customIdea } from "@/lib/whatsapp";
import { useAuth } from "@/components/auth/auth-provider";
import { CustomPhotos } from "./photo-upload";

/** Cotización de bolso personalizado: queda en el admin (Solicitudes) y abre WhatsApp. */
export function IdeaForm({ whatsapp }: { whatsapp: string }) {
  const [idea, setIdea] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const { guest, user, openSignIn } = useAuth();

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (guest) return openSignIn("custom");
    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    const name = String(form.get("name")).trim();
    const phone = String(form.get("phone")).trim();
    const email = String(form.get("email") || "").trim();
    setSending(true);
    if (hasSupabase()) {
      const { error } = await createClient().from("custom_requests").insert({ customer_id: user?.id, name, email: email || null, phone, message: idea.trim(), ...(photos.length ? { reference_images: photos } : {}) });
      if (error) { setSending(false); return toast.error("No pudimos guardar tu idea", { description: "Intenta de nuevo o escríbenos por WhatsApp." }); }
    }
    setSending(false);
    toast.success("Recibimos tu idea", { description: "Te escribimos para cotizarla.", action: { label: "Abrir WhatsApp", onClick: () => window.open(waLink(whatsapp, customIdea({ name, phone, email, idea: idea.trim(), photos })), "_blank", "noopener") } });
    formEl.reset();
    setIdea("");
    setPhotos([]);
  }

  return (
    <form className="idea-form" onSubmit={submit}>
      <label className="lb wine" htmlFor="idea">Cuéntanos tu idea</label>
      <textarea id="idea" className="field" value={idea} onChange={(e) => setIdea(e.target.value)} placeholder="Ej: mi nombre con margaritas y una luna" required maxLength={800} rows={3} />
      <div className="idea-preview" aria-live="polite">{idea ? `“${idea}”` : "Tu idea aparecerá aquí."}</div>
      <div className="fgroup">
        <span className="lb wine">Fotos de referencia <span className="soft">(opcional, hasta 3)</span></span>
        <CustomPhotos photos={photos} onChange={setPhotos} />
      </div>
      <div className="form-cols">
        <div className="fgroup"><label className="lb wine" htmlFor="idea-name">Nombre</label><input id="idea-name" name="name" className="field" autoComplete="name" required /></div>
        <div className="fgroup"><label className="lb wine" htmlFor="idea-phone">WhatsApp</label><input id="idea-phone" name="phone" type="tel" className="field" autoComplete="tel" required placeholder="300 000 0000" /></div>
      </div>
      <div className="fgroup"><label className="lb wine" htmlFor="idea-email">Correo <span className="soft">(opcional)</span></label><input id="idea-email" name="email" type="email" className="field" autoComplete="email" /></div>
      <button className="btn btn-solid" type="submit" disabled={sending}>{sending ? "Enviando..." : "Enviar mi idea"}</button>
    </form>
  );
}

/** Mensaje de contacto: queda en el admin (Mensajes). */
export function ContactForm({ whatsapp }: { whatsapp: string }) {
  const [sending, setSending] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    const payload = { name: String(form.get("nombre")).trim(), contact: String(form.get("contacto")).trim(), message: String(form.get("mensaje")).trim() };
    setSending(true);
    if (hasSupabase()) {
      const { error } = await createClient().from("contact_messages").insert(payload);
      setSending(false);
      if (error) return toast.error("No pudimos enviar tu mensaje", { description: "Intenta de nuevo o escríbenos por WhatsApp." });
      toast.success("Mensaje enviado", { description: "Te respondemos pronto." });
    } else {
      setSending(false);
      window.open(waLink(whatsapp, contactMessage(payload)), "_blank", "noopener");
    }
    formEl.reset();
  }

  return (
    <form className="contact-form" onSubmit={submit}>
      <div className="form-cols">
        <div className="fgroup"><label className="lb wine" htmlFor="c-nombre">Nombre</label><input id="c-nombre" name="nombre" className="field" placeholder="¿Cómo te llamas?" autoComplete="name" required /></div>
        <div className="fgroup"><label className="lb wine" htmlFor="c-correo">Correo o celular</label><input id="c-correo" name="contacto" className="field" placeholder="Para responderte" required /></div>
      </div>
      <div className="fgroup"><label className="lb wine" htmlFor="c-msg">Mensaje</label><textarea id="c-msg" name="mensaje" className="field" rows={4} placeholder="Cuéntanos" required maxLength={2000} /></div>
      <label className="check"><input type="checkbox" required /><span>Acepto la política de tratamiento de datos personales.</span></label>
      <button className="btn btn-solid" type="submit" disabled={sending}>{sending ? "Enviando..." : "Enviar mensaje"}</button>
    </form>
  );
}
