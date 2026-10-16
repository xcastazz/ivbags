"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/browser";
import { LEGAL_LINKS, TERMS_VERSION } from "@/lib/legal";
import { Logo } from "@/components/store/logo";
import { Star } from "@/components/store/icons";

type Item = { key: "terms" | "data" | "marketing"; required: boolean; title: string; text: React.ReactNode };

const ITEMS: Item[] = [
  { key: "terms", required: true, title: "Términos y condiciones", text: <>Acepto los <a href={LEGAL_LINKS.terms} target="_blank" rel="noopener">términos y condiciones</a> de compra, incluida la política de <a href={LEGAL_LINKS.shipping} target="_blank" rel="noopener">envíos, cambios y devoluciones</a>. Las piezas personalizadas no tienen cambio.</> },
  { key: "data", required: true, title: "Tratamiento de datos personales", text: <>Autorizo a IV Bags a tratar mis datos (nombre, correo, teléfono y dirección) para gestionar mi cuenta y mis pedidos, según la <a href={LEGAL_LINKS.privacy} target="_blank" rel="noopener">política de privacidad</a> y la Ley 1581 de 2012. Puedo consultar, corregir o pedir que los borren cuando quiera.</> },
  { key: "marketing", required: false, title: "Novedades del taller (opcional)", text: <>Quiero recibir correos con piezas nuevas, ferias y talleres. Puedo darme de baja en cualquier momento.</> },
];

/** Pantalla que aparece después de iniciar sesión si la persona no ha aceptado la versión vigente de los términos. */
export function ConsentScreen({ userId, onAccepted }: { userId: string; onAccepted: () => void }) {
  const [checked, setChecked] = useState<Record<Item["key"], boolean>>({ terms: false, data: false, marketing: false });
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const ready = checked.terms && checked.data;

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  async function accept() {
    if (!ready) return toast.error("Necesitamos tu aceptación de los dos puntos obligatorios");
    setSaving(true);
    const now = new Date().toISOString();
    try {
      const { error } = await createClient().from("profiles").update({ terms_accepted_at: now, terms_version: TERMS_VERSION, marketing_opt_in: checked.marketing, marketing_updated_at: now }).eq("id", userId);
      if (error) throw error;
      setLeaving(true);
      setTimeout(onAccepted, 380);
      toast.success("¡Gracias! Ya puedes seguir");
    } catch (e) {
      toast.error("No pudimos guardar tu aceptación", { description: e instanceof Error ? e.message : "Intenta de nuevo." });
      setSaving(false);
    }
  }

  async function decline() {
    await createClient().auth.signOut().catch(() => {});
    toast("Cerraste sesión", { description: "Para comprar necesitamos que aceptes los términos." });
    onAccepted();
    router.push("/");
    router.refresh();
  }

  return (
    <div className={`consent-backdrop${leaving ? " leaving" : ""}`} role="dialog" aria-modal="true" aria-labelledby="consent-title">
      <div className="consent-card">
        <div className="consent-head">
          <Logo height={40} />
          <Star size={26} className="twinkle" />
        </div>
        <h2 id="consent-title" className="d">Antes de seguir, <i>un par de acuerdos</i></h2>
        <p className="consent-intro">Queremos que sepas cómo trabajamos y qué hacemos con tus datos. Marca las casillas para continuar.</p>

        <ul className="consent-list">
          {ITEMS.map((item, i) => (
            <li key={item.key} style={{ animationDelay: `${120 + i * 70}ms` }}>
              <label className={`consent-item${checked[item.key] ? " on" : ""}`}>
                <input type="checkbox" checked={checked[item.key]} onChange={(e) => setChecked({ ...checked, [item.key]: e.target.checked })} />
                <span className="consent-box" aria-hidden><svg viewBox="0 0 16 16"><path d="M3 8.5l3 3 7-7" /></svg></span>
                <span className="consent-copy">
                  <b>{item.title}{item.required && <em> · obligatorio</em>}</b>
                  <span>{item.text}</span>
                </span>
              </label>
            </li>
          ))}
        </ul>

        <div className="consent-actions">
          <button className="btn btn-solid" onClick={accept} disabled={saving || !ready}>{saving ? <><span className="spinner" aria-hidden />Guardando</> : "Aceptar y continuar"}</button>
          <button className="text-link" onClick={decline} disabled={saving}>No acepto, cerrar sesión</button>
        </div>
        <p className="consent-foot">Versión {TERMS_VERSION}. Los documentos se abren en una pestaña nueva.</p>
      </div>
    </div>
  );
}
