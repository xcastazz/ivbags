"use client";

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Drawer } from "vaul";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";
import { createClient, hasSupabase } from "@/lib/supabase/browser";
import { SignInForm, type SignInIntro } from "./sign-in-form";
import { ConsentScreen } from "./consent-screen";
import { TERMS_VERSION } from "@/lib/legal";

type Reason = "welcome" | "cart" | "checkout" | "favorites" | "preview" | "account" | "custom";
type Auth = { user: User | null; ready: boolean; configured: boolean; guest: boolean; openSignIn: (reason?: Reason) => void };

const AuthContext = createContext<Auth | null>(null);

const COPY: Record<Reason, SignInIntro> = {
  welcome: { eyebrow: "Te damos la bienvenida", title: "Entra al taller", text: "Con tu correo ves todo el catálogo, guardas favoritos y sigues tus pedidos. Te enviamos un código, sin claves." },
  cart: { eyebrow: "Tu bolsa", title: "Entra para comprar", text: "Tu bolsa y tus pedidos quedan guardados en tu cuenta. Solo toma un minuto." },
  custom: { eyebrow: "Tu idea", title: "Entra para enviarla", text: "Así seguimos tu cotización desde tu cuenta y te escribimos con el boceto." },
  checkout: { eyebrow: "Último paso", title: "Entra para confirmar", text: "Tu pedido queda en tu cuenta y ahí ves cómo avanza." },
  favorites: { eyebrow: "Tus favoritos", title: "Guarda lo que te gusta", text: "Entra con tu correo y tus piezas favoritas te esperan en cualquier dispositivo." },
  preview: { eyebrow: "Hay más en el taller", title: "Mira todas las piezas", text: "Estás viendo una vista previa. Entra con tu correo para ver todo el catálogo." },
  account: { eyebrow: "Tu cuenta", title: "Entra al taller", text: "Te enviamos un código a tu correo. Si es tu primera vez, así creas tu cuenta." },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const configured = hasSupabase();
  const [user, setUser] = useState<User | null>(null);
  const [consent, setConsent] = useState<{ userId: string; needed: boolean } | null>(null);
  const path = usePathname();

  // Después de entrar, revisa si la persona ya aceptó la versión vigente de los términos.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    createClient().from("profiles").select("terms_accepted_at, terms_version").eq("id", user.id).maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) { console.warn("consent", error.message); return; }
        setConsent({ userId: user.id, needed: !data?.terms_accepted_at || data.terms_version !== TERMS_VERSION });
      });
    return () => { cancelled = true; };
  }, [user]);
  const [ready, setReady] = useState(!configured);
  const [reason, setReason] = useState<Reason | null>(null);

  useEffect(() => {
    if (!configured) return;
    const db = createClient();
    db.auth.getUser().then(({ data }) => { setUser(data.user); setReady(true); }).catch(() => setReady(true));
    const { data: sub } = db.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => sub.subscription.unsubscribe();
  }, [configured]);

  const openSignIn = useCallback((r: Reason = "welcome") => setReason(r), []);

  const value = useMemo<Auth>(() => ({ user, ready, configured, guest: configured && ready && !user, openSignIn }), [user, ready, configured, openSignIn]);
  const copy = COPY[reason ?? "welcome"];

  return (
    <AuthContext.Provider value={value}>
      {children}
      {user && consent?.userId === user.id && consent.needed && !path.startsWith("/legal") && <ConsentScreen userId={user.id} onAccepted={() => { setConsent({ userId: user.id, needed: false }); router.refresh(); }} />}
      <Drawer.Root open={!!reason} onOpenChange={(o) => !o && setReason(null)}>
        <Drawer.Portal>
          <Drawer.Overlay className="drawer-overlay" />
          <Drawer.Content className="drawer-content signin-sheet">
            <div className="drawer-handle" aria-hidden />
            <Drawer.Title className="sr-only">{copy.title}</Drawer.Title>
            <Drawer.Description className="sr-only">{copy.text}</Drawer.Description>
            {reason && <SignInForm compact intro={copy} onSignedIn={(needsProfile) => {
              setReason(null);
              toast.success("¡Qué bueno tenerte en el taller!");
              if (needsProfile) router.push("/cuenta/completar-perfil");
              else router.refresh();
            }} />}
            <Drawer.Close className="sheet-skip">Ahora no, seguir mirando</Drawer.Close>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error("useAuth must be used inside AuthProvider");
  return auth;
}

/** Invita a entrar una vez por sesión, después de que la visitante vio un poco. */
export function GuestWelcome({ delay = 2200 }: { delay?: number }) {
  const { guest, openSignIn } = useAuth();
  useEffect(() => {
    if (!guest) return;
    try { if (sessionStorage.getItem("iv-welcome")) return; } catch {}
    const t = setTimeout(() => { openSignIn("welcome"); try { sessionStorage.setItem("iv-welcome", "1"); } catch {} }, delay);
    return () => clearTimeout(t);
  }, [guest, openSignIn, delay]);
  return null;
}
