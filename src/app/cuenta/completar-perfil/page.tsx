"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/browser";
import { Logo } from "@/components/store/logo";
import { Star } from "@/components/store/icons";

export default function CompleteProfilePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);

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
    setSaving(true);
    const fail = (message: string) => { setSaving(false); toast.error("No pudimos guardar tus datos", { description: message }); };
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return fail("Tu sesión expiró. Inicia sesión de nuevo.");

    const { error: authError } = await supabase.auth.updateUser({ password, data: { full_name: name, phone } });
    if (authError) return fail(authError.message);
    const { error: profileError } = await supabase.from("profiles").update({ full_name: name, phone }).eq("id", user.id);
    if (profileError) return fail(profileError.message);
    toast.success("Perfil guardado");
    router.push("/cuenta");
  }

  return (
    <main className="auth-page">
      <Link className="hlogo" href="/" aria-label="Volver a IV Bags"><Logo height={54} /></Link>
      <section className="auth-panel">
        <Star size={28} variant="burst" className="auth-star twinkle" />
        <h1 className="d">Cuéntanos de ti</h1>
        <p>Tu correo ya está verificado. Crea tu clave y completa tus datos para seguir creando tu pieza.</p>
        <form onSubmit={saveProfile}>
          <label className="lb wine" htmlFor="name">Nombre completo</label>
          <input id="name" className="field" autoComplete="name" required value={name} onChange={(event) => setName(event.target.value)} placeholder="Tu nombre" />
          <label className="lb wine" htmlFor="phone">Teléfono</label>
          <input id="phone" className="field" type="tel" autoComplete="tel" required value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="300 000 0000" />
          <label className="lb wine" htmlFor="new-password">Crea una contraseña</label>
          <input id="new-password" className="field" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Mínimo 8 caracteres" />
          <button className="btn btn-solid" type="submit" disabled={saving}>{saving ? "Guardando..." : "Guardar y continuar"}</button>
        </form>
      </section>
    </main>
  );
}
