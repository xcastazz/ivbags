"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

export default function CompleteProfilePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    createClient().auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push("/iniciar-sesion");
      setName(user?.user_metadata.full_name ?? "");
      setPhone(user?.user_metadata.phone ?? "");
    });
  }, [router]);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const supabase = createClient();
    setStatus("Guardando tus datos...");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return setStatus("Tu sesion expiro. Inicia sesion de nuevo.");

    const { error: authError } = await supabase.auth.updateUser({ data: { full_name: name, phone } });
    if (authError) return setStatus(authError.message);
    const { error: profileError } = await supabase.from("profiles").update({ full_name: name, phone }).eq("id", user.id);
    if (profileError) return setStatus(profileError.message);
    router.push("/");
  }

  return <main className="auth-page"><Link className="brand" href="/"><span className="brand-mark">iV</span>bags</Link><section className="auth-panel"><p className="eyebrow">bienvenida al taller</p><h1>Cuéntanos de ti</h1><p>Tu correo ya esta verificado. Completa estos datos para seguir creando tu pieza.</p><form onSubmit={saveProfile}><label htmlFor="name">Nombre completo</label><input id="name" required value={name} onChange={(event) => setName(event.target.value)} placeholder="Tu nombre" /><label htmlFor="phone">Telefono</label><input id="phone" type="tel" required value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="300 000 0000" /><button className="button button-solid" type="submit">Guardar y continuar</button></form>{status && <p className="auth-status" role="status">{status}</p>}</section></main>;
}