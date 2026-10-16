"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Logo } from "@/components/store/logo";
import { Star } from "@/components/store/icons";
import { SignInForm } from "@/components/auth/sign-in-form";

function nextPath() {
  const requested = new URLSearchParams(window.location.search).get("next");
  return requested && /^\/(?!\/)/.test(requested) ? requested : "/cuenta";
}

export default function SignInPage() {
  const router = useRouter();

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("error") === "enlace") toast.error("Ese enlace ya venció o no es válido", { description: "Pide un código nuevo aquí abajo." });
  }, []);

  return (
    <main className="auth-page">
      <Link className="hlogo" href="/" aria-label="Volver a IV Bags"><Logo height={54} /></Link>
      <section className="auth-panel">
        <Star size={28} className="auth-star twinkle" />
        <SignInForm onSignedIn={(needsProfile) => { router.push(needsProfile ? "/cuenta/completar-perfil" : nextPath()); router.refresh(); }} />
      </section>
      <Link className="text-link" href="/">Volver a la tienda</Link>
    </main>
  );
}
