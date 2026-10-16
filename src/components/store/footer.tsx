import Link from "next/link";
import { CATEGORIES, type SiteContent } from "@/lib/types";
import { catHref, waLink } from "@/lib/format";
import { PansyBand } from "./bands";
import { Logo } from "./logo";

export function Footer({ content }: { content: SiteContent }) {
  return (
    <footer className="site-footer">
      <PansyBand olive />
      <div className="footer-grid">
        <div className="footer-brand"><Link className="hlogo light" href="/" aria-label="IV Bags, inicio"><Logo height={58} /></Link><div className="lb">Hecho a mano</div></div>
        <div className="footer-cols">
          <div><div className="lb">Tienda</div>{CATEGORIES.map((c) => <Link key={c} href={catHref(c)}>{c}</Link>)}<Link href="/personaliza">Personaliza tu bolso</Link></div>
          <div><div className="lb">El taller</div><Link href="/nosotras">Quiénes somos</Link><Link href="/blog">Ferias y eventos</Link><Link href="/contacto">Contacto</Link><Link href="/cuenta">Mi cuenta</Link></div>
          <div><div className="lb">Legal</div><Link href="/legal/terminos">Términos y condiciones</Link><Link href="/legal/privacidad">Política de privacidad</Link><Link href="/legal/envios-y-devoluciones">Envíos, cambios y devoluciones</Link></div>
        </div>
      </div>
      <div className="footer-base"><span>© {2026} IV Bags · {content.city}</span><span><a href={waLink(content.whatsapp)} target="_blank" rel="noopener">WhatsApp</a> · <a href={`mailto:${content.email}`}>{content.email}</a> · <a href={`https://instagram.com/${content.instagram}`} target="_blank" rel="noopener">@{content.instagram}</a></span></div>
    </footer>
  );
}
