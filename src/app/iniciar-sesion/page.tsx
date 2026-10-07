"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/browser";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("Enviando enlace seguro...");
    const { error } = await createClient().auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setStatus(error ? error.message : "Revisa tu correo para confirmar el inicio de sesion.");
  }

  return (
    <main className="auth-page">
      <Link className="brand" href="/" aria-label="Volver a ivbags"><span className="brand-mark">iV</span>bags</Link>
      <section className="auth-panel">
        <p className="eyebrow">tu espacio en el taller</p>
        <h1>Inicia sesion</h1>
        <p>Te enviaremos un enlace de acceso y verificacion a tu correo. Sin contrasenas que recordar.</p>
        <form onSubmit={signIn}>
          <label htmlFor="email">Correo electronico</label>
          <input id="email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="tu@correo.com" />
          <button className="button button-solid" type="submit">Enviar enlace</button>
        </form>
        {status && <p className="auth-status" role="status">{status}</p>}
      </section>
    </main>
  );
}