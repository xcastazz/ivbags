"use client";

import { FormEvent, useState } from "react";
import { Plus, X } from "lucide-react";
import { DEFAULT_CONTENT } from "@/lib/defaults";
import type { SiteContent, TeamMember } from "@/lib/types";
import { centsFromCop, copFromCents, db, Loading, mutate, PageHead, useQuery } from "./kit";

export function ContentAdmin() {
  const { data, loading } = useQuery<{ value: Partial<SiteContent> }>(async () => db().from("site_content").select("value").eq("key", "site").maybeSingle());
  if (loading) return <><PageHead title="Contenido" /><Loading /></>;
  const content = { ...DEFAULT_CONTENT, ...(data?.value ?? {}) };
  return <ContentForm initial={content} />;
}

function ContentForm({ initial }: { initial: SiteContent }) {
  const [team, setTeam] = useState<TeamMember[]>(initial.team);
  const [saving, setSaving] = useState(false);

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const s = (k: string) => String(f.get(k) ?? "").trim();
    const value: SiteContent = {
      topbar: s("topbar"), heroTitle: s("heroTitle"), heroItalic: s("heroItalic"), heroText: s("heroText"),
      aboutTitle: s("aboutTitle"), aboutItalic: s("aboutItalic"), aboutText: s("aboutText"), team: team.filter((t) => t.name.trim()),
      customIntro: s("customIntro"), customSteps: [s("step1"), s("step2"), s("step3")].filter(Boolean),
      whatsapp: s("whatsapp").replace(/\D/g, ""), instagram: s("instagram").replace(/^@/, ""), email: s("email"), city: s("city"),
      shippingCents: centsFromCop(f.get("shipping")), paymentInstructions: s("paymentInstructions"),
      legalName: s("legalName"), taxId: s("taxId"), legalAddress: s("legalAddress"), invoiceNote: s("invoiceNote"),
    };
    setSaving(true);
    await mutate(db().from("site_content").upsert({ key: "site", value, updated_at: new Date().toISOString() }), "Contenido publicado", ["content"]);
    setSaving(false);
  }

  const setMember = (i: number, change: Partial<TeamMember>) => setTeam(team.map((t, k) => (k === i ? { ...t, ...change } : t)));

  return (
    <form className="content-form" onSubmit={save}>
      <PageHead title="Contenido" text="Los textos de cada sección de la tienda." action={<button className="button solid" disabled={saving}>{saving ? "Publicando..." : "Publicar cambios"}</button>} />
      <div className="admin-grid even">
        <fieldset className="admin-panel product-form"><legend>Inicio</legend>
          <label>Franja superior<input name="topbar" defaultValue={initial.topbar} /></label>
          <div className="form-pair"><label>Título<input name="heroTitle" defaultValue={initial.heroTitle} /></label><label>Título en cursiva<input name="heroItalic" defaultValue={initial.heroItalic} /></label></div>
          <label>Texto<textarea name="heroText" rows={3} defaultValue={initial.heroText} /></label>
        </fieldset>
        <fieldset className="admin-panel product-form"><legend>Personaliza</legend>
          <label>Introducción<textarea name="customIntro" rows={2} defaultValue={initial.customIntro} /></label>
          {[0, 1, 2].map((i) => <label key={i}>Paso {["uno", "dos", "tres"][i]}<input name={`step${i + 1}`} defaultValue={initial.customSteps[i] ?? ""} /></label>)}
        </fieldset>
        <fieldset className="admin-panel product-form"><legend>Quiénes somos</legend>
          <div className="form-pair"><label>Título<input name="aboutTitle" defaultValue={initial.aboutTitle} /></label><label>Título en cursiva<input name="aboutItalic" defaultValue={initial.aboutItalic} /></label></div>
          <label>Texto<textarea name="aboutText" rows={3} defaultValue={initial.aboutText} /></label>
          <div className="team-edit">
            {team.map((t, i) => (
              <div key={i} className="team-row">
                <input aria-label="Nombre" value={t.name} onChange={(e) => setMember(i, { name: e.target.value })} placeholder="Nombre" />
                <input aria-label="Quién es" value={t.who} onChange={(e) => setMember(i, { who: e.target.value })} placeholder="Mamá, hermana…" />
                <input aria-label="Oficio" value={t.craft} onChange={(e) => setMember(i, { craft: e.target.value })} placeholder="Qué hace" />
                <button type="button" aria-label="Quitar" onClick={() => setTeam(team.filter((_, k) => k !== i))}><X size={14} /></button>
              </div>
            ))}
            <button type="button" className="text-link" onClick={() => setTeam([...team, { name: "", who: "", craft: "" }])}><Plus size={12} /> Agregar persona</button>
          </div>
        </fieldset>
        <fieldset className="admin-panel product-form"><legend>Contacto y pagos</legend>
          <div className="form-pair"><label>WhatsApp (con 57)<input name="whatsapp" inputMode="numeric" defaultValue={initial.whatsapp} /></label><label>Instagram<input name="instagram" defaultValue={initial.instagram} /></label></div>
          <div className="form-pair"><label>Correo<input name="email" type="email" defaultValue={initial.email} /></label><label>Ciudad<input name="city" defaultValue={initial.city} /></label></div>
          <label>Costo de envío (COP) <span className="soft">0 = se coordina por WhatsApp</span><input name="shipping" inputMode="numeric" defaultValue={copFromCents(initial.shippingCents)} /></label>
          <label>Instrucciones de pago<textarea name="paymentInstructions" rows={3} defaultValue={initial.paymentInstructions} /></label>
        </fieldset>
        <fieldset className="admin-panel product-form"><legend>Datos para facturas</legend>
          <div className="form-pair"><label>Razón social o nombre<input name="legalName" defaultValue={initial.legalName} /></label><label>NIT o cédula <span className="soft">(opcional)</span><input name="taxId" defaultValue={initial.taxId} placeholder="900.000.000-0" /></label></div>
          <label>Dirección del negocio<input name="legalAddress" defaultValue={initial.legalAddress} /></label>
          <label>Nota de agradecimiento<textarea name="invoiceNote" rows={2} defaultValue={initial.invoiceNote} /></label>
        </fieldset>
      </div>
    </form>
  );
}
