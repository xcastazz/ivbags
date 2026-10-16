"use client";

import { DEPARTMENTS, formatAddress, formatStreet, ID_TYPES, PLACE_TYPES, STREET_TYPES, type Shipping } from "@/lib/colombia";
import { Star } from "./icons";

export const EMPTY_SHIPPING: Shipping = {
  name: "", phone: "", email: "", idType: "CC", idNumber: "",
  department: "", city: "", neighborhood: "",
  streetType: "Calle", streetNumber: "", crossNumber: "", plate: "", street: "",
  placeType: "Casa", complement: "", reference: "", postalCode: "",
  recipientIsMe: true, recipientName: "", recipientPhone: "", save: true,
};

/** Datos de envío completos, en el orden en que los piden las transportadoras en Colombia. */
export function ShippingForm({ value, onChange }: { value: Shipping; onChange: (v: Shipping) => void }) {
  const set = <K extends keyof Shipping>(key: K, v: Shipping[K]) => onChange({ ...value, [key]: v });
  const cities = DEPARTMENTS[value.department] ?? [];
  const street = formatStreet(value);
  const preview = formatAddress({ ...value, street });
  const needsPlate = !["Kilómetro", "Vereda"].includes(value.streetType);

  return (
    <div className="ship">
      <fieldset className="ship-group">
        <legend><span className="ship-num">1</span>Quién compra</legend>
        <div className="form-cols">
          <Field label="Nombre y apellido" htmlFor="s-name"><input id="s-name" className="field" required autoComplete="name" value={value.name} onChange={(e) => set("name", e.target.value)} placeholder="Como aparece en tu documento" /></Field>
          <Field label="Celular (WhatsApp)" htmlFor="s-phone" hint="Para coordinar el pago y la entrega"><input id="s-phone" className="field" required type="tel" inputMode="tel" autoComplete="tel-national" pattern="[0-9 +]{7,15}" value={value.phone} onChange={(e) => set("phone", e.target.value)} placeholder="300 000 0000" /></Field>
        </div>
        <div className="form-cols">
          <Field label="Correo" htmlFor="s-email"><input id="s-email" className="field" required type="email" autoComplete="email" value={value.email} onChange={(e) => set("email", e.target.value)} /></Field>
          <Field label="Documento" htmlFor="s-id" hint="La transportadora lo pide para entregar">
            <div className="split"><select aria-label="Tipo de documento" className="field" value={value.idType} onChange={(e) => set("idType", e.target.value)}>{ID_TYPES.map((t) => <option key={t}>{t}</option>)}</select><input id="s-id" className="field" required inputMode="numeric" value={value.idNumber} onChange={(e) => set("idNumber", e.target.value.replace(/[^\dA-Za-z]/g, ""))} placeholder="Número" /></div>
          </Field>
        </div>
      </fieldset>

      <fieldset className="ship-group">
        <legend><span className="ship-num">2</span>Dónde lo entregamos</legend>
        <div className="form-cols">
          <Field label="Departamento" htmlFor="s-dep"><select id="s-dep" className="field" required value={value.department} onChange={(e) => onChange({ ...value, department: e.target.value, city: (DEPARTMENTS[e.target.value] ?? [])[0] ?? "" })}><option value="" disabled>Elige…</option>{Object.keys(DEPARTMENTS).map((d) => <option key={d}>{d}</option>)}</select></Field>
          <Field label="Ciudad o municipio" htmlFor="s-city"><input id="s-city" className="field" required list="s-cities" autoComplete="address-level2" value={value.city} onChange={(e) => set("city", e.target.value)} disabled={!value.department} placeholder={value.department ? "Escribe o elige" : "Primero el departamento"} /><datalist id="s-cities">{cities.map((c) => <option key={c} value={c} />)}</datalist></Field>
        </div>
        <div className="addr-row">
          <Field label="Tipo de vía" htmlFor="s-type"><select id="s-type" className="field" value={value.streetType} onChange={(e) => set("streetType", e.target.value)}>{STREET_TYPES.map((t) => <option key={t}>{t}</option>)}</select></Field>
          <Field label="Número" htmlFor="s-n1"><input id="s-n1" className="field" required value={value.streetNumber} onChange={(e) => set("streetNumber", e.target.value)} placeholder="57A" maxLength={12} /></Field>
          {needsPlate && <><span className="addr-sym" aria-hidden>#</span>
            <Field label="Cruce" htmlFor="s-n2"><input id="s-n2" className="field" required value={value.crossNumber} onChange={(e) => set("crossNumber", e.target.value)} placeholder="90" maxLength={12} /></Field>
            <span className="addr-sym" aria-hidden>–</span>
            <Field label="Placa" htmlFor="s-n3"><input id="s-n3" className="field" required value={value.plate} onChange={(e) => set("plate", e.target.value)} placeholder="18" maxLength={8} /></Field></>}
        </div>
        <div className="form-cols">
          <Field label="Barrio" htmlFor="s-hood"><input id="s-hood" className="field" required value={value.neighborhood} onChange={(e) => set("neighborhood", e.target.value)} placeholder="Ej: Laureles" /></Field>
          <Field label="Tipo de lugar" htmlFor="s-place"><select id="s-place" className="field" value={value.placeType} onChange={(e) => set("placeType", e.target.value)}>{PLACE_TYPES.map((t) => <option key={t}>{t}</option>)}</select></Field>
        </div>
        <Field label={value.placeType === "Casa" ? "Complemento (opcional)" : "Torre, apartamento, interior o local"} htmlFor="s-comp"><input id="s-comp" className="field" required={value.placeType === "Apartamento"} value={value.complement} onChange={(e) => set("complement", e.target.value)} placeholder={value.placeType === "Apartamento" ? "Ej: Torre 2, Apto 301, Conjunto Los Pinos" : "Ej: Casa 4, segundo piso"} /></Field>
        <Field label="Indicaciones para el mensajero (opcional)" htmlFor="s-ref"><input id="s-ref" className="field" value={value.reference} onChange={(e) => set("reference", e.target.value)} placeholder="Ej: frente al parque, portón verde, dejar en portería" maxLength={160} /></Field>

        <div className={`addr-preview${street ? " on" : ""}`} aria-live="polite">
          <Star size={16} />
          <div><span className="lb">Así queda tu dirección</span><p>{street ? preview : "Completa los campos y aquí verás tu dirección completa."}</p></div>
        </div>
      </fieldset>

      <fieldset className="ship-group">
        <legend><span className="ship-num">3</span>Quién recibe</legend>
        <label className="check"><input type="checkbox" checked={value.recipientIsMe} onChange={(e) => set("recipientIsMe", e.target.checked)} /><span>Recibo yo</span></label>
        {!value.recipientIsMe && (
          <div className="form-cols step-in">
            <Field label="Nombre de quien recibe" htmlFor="s-rname"><input id="s-rname" className="field" required value={value.recipientName} onChange={(e) => set("recipientName", e.target.value)} placeholder="¿Es un regalo? Pon su nombre" /></Field>
            <Field label="Celular de quien recibe" htmlFor="s-rphone"><input id="s-rphone" className="field" required type="tel" value={value.recipientPhone} onChange={(e) => set("recipientPhone", e.target.value)} /></Field>
          </div>
        )}
        <label className="check"><input type="checkbox" checked={!!value.save} onChange={(e) => set("save", e.target.checked)} /><span>Guardar esta dirección para mis próximas compras</span></label>
      </fieldset>
    </div>
  );
}

function Field({ label, htmlFor, hint, children }: { label: string; htmlFor: string; hint?: string; children: React.ReactNode }) {
  return <div className="fgroup"><label className="lb wine" htmlFor={htmlFor}>{label}</label>{children}{hint && <small className="field-hint">{hint}</small>}</div>;
}
