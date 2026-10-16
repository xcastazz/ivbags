import type { Metadata } from "next";
import { getContent } from "@/lib/data";
import { waLink } from "@/lib/format";
import { ContactForm } from "@/components/store/home-forms";
import { Lace } from "@/components/store/bands";

export const metadata: Metadata = { title: "Contacto | IV Bags", description: "Pedidos al por mayor, regalos o cualquier duda." };

export default async function ContactPage() {
  const c = await getContent();
  return (
    <section className="section-contact">
      <Lace tone="cream" />
      <div className="contact-inner">
        <div className="contact-copy">
          <div className="lb rose-ink">Escríbenos</div>
          <h1 className="d h-xl">Hablemos</h1>
          <p>Pedidos al por mayor, regalos o cualquier duda. Te respondemos pronto.</p>
          <div className="contact-links">
            <a href={waLink(c.whatsapp)} target="_blank" rel="noopener">WhatsApp · +{c.whatsapp.replace(/^(\d{2})(\d{3})(\d{3})(\d+)$/, "$1 $2 $3 $4")}</a>
            <a href={`https://instagram.com/${c.instagram}`} target="_blank" rel="noopener">Instagram · @{c.instagram}</a>
            <a href={`mailto:${c.email}`}>Correo · {c.email}</a>
          </div>
        </div>
        <ContactForm whatsapp={c.whatsapp} />
      </div>
    </section>
  );
}
