"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

export default function SignInPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"register" | "login">("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const supabase = createClient();
    if (mode === "login") {
      setStatus("Iniciando sesion...");
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return setStatus(error.message);
      router.push("/cuenta/completar-perfil");
      return;
    }

    setStatus("Enviando tu bienvenida...");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/cuenta/completar-perfil` },
    });
    if (error) return setStatus(error.message);
    setStatus("Te enviamos un correo de bienvenida. Abre el enlace para verificar tu cuenta, crear tu clave y completar tu perfil.");
  }

  return (
    <main className="auth-page">
      <Link className="brand" href="/" aria-label="Volver a ivbags"><span className="brand-mark">iV</span>bags</Link>
      <section className="auth-panel">
        <p className="eyebrow">tu espacio en el taller</p>
        <h1>{mode === "register" ? "Crea tu cuenta" : "Inicia sesion"}</h1>
        <p>{mode === "register" ? "Recibe un correo de bienvenida, verifica tu cuenta y despues crea tu clave." : "Ingresa con el correo y la clave que elegiste."}</p>
        <div className="auth-toggle" role="tablist" aria-label="Acceso a cuenta"><button type="button" className={mode === "register" ? "active" : ""} onClick={() => { setMode("register"); setStatus(null); }}>Crear cuenta</button><button type="button" className={mode === "login" ? "active" : ""} onClick={() => { setMode("login"); setStatus(null); }}>Entrar</button></div>
        <form onSubmit={submit}>
          <label htmlFor="email">Correo electronico</label>
          <input id="email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="tu@correo.com" />
          {mode === "login" && <><label htmlFor="password">Contrasena</label><input id="password" type="password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Minimo 8 caracteres" /></>}
          <button className="button button-solid" type="submit">{mode === "register" ? "Enviar bienvenida" : "Entrar"}</button>
        </form>
        {status && <p className="auth-status" role="status">{status}</p>}
      </section>
    </main>
  );
}