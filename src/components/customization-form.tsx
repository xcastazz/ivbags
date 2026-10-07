"use client";

import { FormEvent, useState } from "react";
import { toast } from "sonner";

export function CustomizationForm() {
  const [idea, setIdea] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = idea.trim();
    if (!message) return toast.error("Cuéntanos primero tu idea.");

    toast.success("Tu idea está lista para compartir.", {
      description: "Abriremos WhatsApp para que puedas enviarla al taller.",
    });
    window.open(`https://wa.me/?text=${encodeURIComponent(`Hola ivbags, quiero personalizar un bolso: ${message}`)}`, "_blank", "noopener,noreferrer");
  }

  return <form onSubmit={submit}><label htmlFor="idea">Cuentanos tu idea</label><input id="idea" value={idea} onChange={(event) => setIdea(event.target.value)} placeholder="Ej: mi nombre con margaritas y una luna" /><button className="button solid" type="submit">Enviar por WhatsApp</button></form>;
}