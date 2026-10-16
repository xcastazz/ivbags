"use client";

import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import type { AuthError } from "@supabase/supabase-js";
import { createClient, hasSupabase } from "@/lib/supabase/browser";
import { Star } from "@/components/store/icons";
import { OtpInput } from "./otp-input";

type Step = "email" | "sending" | "code" | "verifying" | "done";
type Mode = "code" | "password";
const RESEND_SECONDS = 60;
const TIMEOUT_MS = 25000;
/** Debe coincidir con Supabase > Authentication > Providers > Email > Email OTP Length. */
const CODE_LENGTH = 8;

/** Traduce los errores de Supabase Auth a algo que cualquier persona entienda. */
function explain(error: Pick<AuthError, "message" | "status">) {
  const m = error.message.toLowerCase();
  if (m === "timeout") return "El servidor de correo no respondió a tiempo. Intenta de nuevo en un momento.";
  if (error.status === 429 || m.includes("rate limit") || m.includes("security purposes")) return "Pediste muchos correos seguidos. Espera un minuto e intenta de nuevo.";
  if (m.includes("invalid login credentials")) return "El correo o la contraseña no coinciden.";
  if (m.includes("email not confirmed")) return "Primero verifica tu correo con un código.";
  if (m.includes("expired") || m.includes("invalid") || m.includes("otp")) return "El código no es válido o ya venció. Pide uno nuevo.";
  if (m.includes("sending") || m.includes("smtp") || m.includes("mail")) return "No pudimos enviar el correo. Revisa la configuración de correo en Supabase.";
  if (m.includes("fetch") || m.includes("network")) return "No hay conexión con el servidor. Revisa tu internet.";
  return error.message;
}

/** Ejecuta una llamada de Auth con límite de tiempo y sin dejar errores sin atrapar. */
async function safely<T extends { error: AuthError | null }>(run: () => Promise<T>): Promise<{ error: Pick<AuthError, "message" | "status"> | null; result?: T }> {
  try {
    const result = await Promise.race([run(), new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), TIMEOUT_MS))]);
    return { error: result.error, result };
  } catch (e) {
    return { error: { message: e instanceof Error ? e.message : "Error desconocido", status: undefined } };
  }
}

export type SignInIntro = { eyebrow: string; title: string; text: string };

export function SignInForm({ onSignedIn, compact, intro }: { onSignedIn: (needsProfile: boolean) => void; compact?: boolean; intro?: SignInIntro }) {
  const [mode, setMode] = useState<Mode>("code");
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [invalid, setInvalid] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [busy, setBusy] = useState(false);
  const configured = hasSupabase();

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function complete() {
    setStep("done");
    const db = createClient();
    const { data: { user } } = await db.auth.getUser();
    const { data: profile } = user ? await db.from("profiles").select("full_name").eq("id", user.id).maybeSingle() : { data: null };
    setTimeout(() => onSignedIn(!profile?.full_name), 900);
  }

  async function sendCode(e?: FormEvent) {
    e?.preventDefault();
    if (!configured) return toast.error("La tienda aún no está conectada a Supabase", { description: "Falta configurar las claves de Supabase en el entorno." });
    const address = email.trim().toLowerCase();
    setStep("sending");
    const { error } = await safely(() => createClient().auth.signInWithOtp({
      email: address,
      options: { shouldCreateUser: true, emailRedirectTo: `${window.location.origin}/auth/callback?next=/cuenta` },
    }));
    if (error) { setStep("email"); return toast.error("No pudimos enviar el código", { description: explain(error) }); }
    setEmail(address);
    setCode("");
    setCooldown(RESEND_SECONDS);
    setStep("code");
  }

  async function verify(token = code) {
    if (token.length < CODE_LENGTH) return;
    setStep("verifying");
    const { error } = await safely(() => createClient().auth.verifyOtp({ email, token, type: "email" }));
    if (error) {
      setStep("code"); setInvalid(true); setTimeout(() => setInvalid(false), 450); setCode("");
      return toast.error("Código incorrecto", { description: explain(error) });
    }
    await complete();
  }

  async function withPassword(e: FormEvent) {
    e.preventDefault();
    if (!configured) return toast.error("La tienda aún no está conectada a Supabase");
    setBusy(true);
    const { error } = await safely(() => createClient().auth.signInWithPassword({ email: email.trim().toLowerCase(), password }));
    setBusy(false);
    if (error) return toast.error("No pudimos entrar", { description: explain(error) });
    await complete();
  }

  async function forgot() {
    const address = email.trim().toLowerCase();
    if (!address) return toast.error("Escribe tu correo primero");
    setBusy(true);
    const { error } = await safely(() => createClient().auth.resetPasswordForEmail(address, { redirectTo: `${window.location.origin}/auth/callback?next=/cuenta/completar-perfil` }));
    setBusy(false);
    if (error) return toast.error("No pudimos enviar el correo", { description: explain(error) });
    toast.success("Revisa tu correo", { description: "Te enviamos un enlace para crear una clave nueva." });
  }

  const head = step === "done" ? null
    : step === "code" || step === "verifying"
      ? { eyebrow: "Revisa tu correo", title: "Escribe tu código", text: <>Enviamos {CODE_LENGTH} dígitos a <b>{email}</b>. Si no lo ves, busca en spam o promociones.</> }
      : mode === "password"
        ? { eyebrow: intro?.eyebrow ?? "Tu cuenta", title: "Entra con tu clave", text: <>Usa el correo y la clave que creaste.</> }
        : { eyebrow: intro?.eyebrow ?? "Tu espacio en el taller", title: intro?.title ?? "Entra al taller", text: <>{intro?.text ?? "Te enviamos un código a tu correo. Si es tu primera vez, así creas tu cuenta."}</> };

  return (
    <div className={`signin${compact ? " compact" : ""}`} data-step={step}>
      {head && (
        <header className="signin-head" key={`${step === "code" || step === "verifying" ? "code" : "email"}-${mode}`}>
          <Envelope step={step} />
          <div className="step-in">
            <span className="lb pink">{head.eyebrow}</span>
            <h2 className="d">{head.title}</h2>
            <p>{head.text}</p>
          </div>
        </header>
      )}

      {step === "done" ? (
        <div className="step-in signin-done">
          <svg className="check" viewBox="0 0 52 52" aria-hidden><circle cx="26" cy="26" r="24" /><path d="M15 27l7 7 15-16" /></svg>
          <h2 className="d">¡Ya estás en el taller!</h2>
          {[0, 1, 2, 3, 4, 5].map((i) => <Star key={i} size={14} variant={i % 2 ? "burst" : "spark"} className={`burst-star b${i}`} />)}
        </div>
      ) : step === "code" || step === "verifying" ? (
        <div className="step-in" key="code">
          <OtpInput length={CODE_LENGTH} value={code} onChange={(v) => { setCode(v); if (v.length === CODE_LENGTH) verify(v); }} disabled={step === "verifying"} invalid={invalid} />
          <button className="btn btn-solid" onClick={() => verify()} disabled={step === "verifying" || code.length < CODE_LENGTH}>
            {step === "verifying" ? <><span className="spinner" aria-hidden />Verificando</> : "Entrar"}
          </button>
          <div className="auth-links">
            <button className="text-link" onClick={() => sendCode()} disabled={cooldown > 0}>{cooldown > 0 ? `Reenviar en ${cooldown}s` : "Reenviar código"}</button>
            <button className="text-link" onClick={() => setStep("email")}>Usar otro correo</button>
          </div>
        </div>
      ) : (
        <div className="step-in" key="email">
          <div className="auth-toggle" role="tablist" aria-label="Forma de entrar" data-active={mode}>
            <span className="toggle-pill" aria-hidden />
            <button type="button" role="tab" aria-selected={mode === "code"} onClick={() => setMode("code")}>Con código</button>
            <button type="button" role="tab" aria-selected={mode === "password"} onClick={() => setMode("password")}>Con contraseña</button>
          </div>
          <form onSubmit={mode === "code" ? sendCode : withPassword}>
            <label className="lb wine" htmlFor="signin-email">Correo electrónico</label>
            <input id="signin-email" className="field" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@correo.com" />
            {mode === "password" && <><label className="lb wine" htmlFor="signin-password">Contraseña</label><input id="signin-password" className="field" type="password" autoComplete="current-password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 8 caracteres" /></>}
            <button className="btn btn-solid send-btn" type="submit" disabled={step === "sending" || busy}>
              {step === "sending" ? <><span className="spinner" aria-hidden />Enviando tu código</> : busy ? <><span className="spinner" aria-hidden />Entrando</> : mode === "code" ? "Enviarme el código" : "Entrar"}
            </button>
          </form>
          {mode === "password" && <div className="auth-links"><button className="text-link" onClick={forgot} disabled={busy}>Olvidé mi contraseña</button></div>}
          {!configured && <p className="hint warn">La tienda todavía no está conectada a Supabase en este entorno.</p>}
        </div>
      )}
    </div>
  );
}

/** Sobre ilustrado que reacciona a cada paso: se cierra al enviar, vuela y se abre con el código. */
function Envelope({ step }: { step: Step }) {
  return (
    <div className="env-anim" data-step={step} aria-hidden>
      <svg viewBox="0 0 120 84">
        <rect className="env-body" x="6" y="22" width="108" height="58" rx="5" />
        <path className="env-letter" d="M20 12h80v52H20z" />
        <path className="env-lines" d="M30 26h60M30 34h48M30 42h54" />
        <path className="env-front" d="M6 30l54 34 54-34v45a5 5 0 0 1-5 5H11a5 5 0 0 1-5-5z" />
        <path className="env-flap" d="M8 22h104L60 58z" />
      </svg>
      <span className="env-trail" />
    </div>
  );
}
