import Link from "next/link";
import { CATEGORIES, type SiteContent } from "@/lib/types";
import { catHref, waLink } from "@/lib/format";
import { PansyBand } from "./bands";
import { Logo } from "./logo";

/** 14 · Footer Deep Olive con la franja de flores. */
export function Footer({ content }: { content: SiteContent }) {
  return (
    <footer className="site-footer">
      <PansyBand olive />
      <div className="footer-grid">
        <div className="footer-brand"><Link href="/" aria-label="IV Bags, inicio"><Logo height={46} tone="crema" /></Link><div className="lb">Hecho a mano</div></div>
        <div className="footer-cols">
          <div><div className="lb">Productos</div>{CATEGORIES.map((c) => <Link key={c} href={catHref(c)}>{c}</Link>)}<Link href="/personaliza">Personaliza tu bolso</Link></div>
          <div><div className="lb">Ayuda</div><Link href="/legal/envios">Envíos</Link><Link href="/legal/cambios-y-devoluciones">Cambios y devoluciones</Link><Link href="/nosotras">Nosotras</Link><Link href="/blog">Blog</Link><Link href="/contacto">Contacto</Link><Link href="/cuenta">Mi cuenta</Link></div>
          <div><div className="lb">Legal</div><Link href="/legal/terminos">Términos y condiciones</Link><Link href="/legal/privacidad">Política de privacidad</Link></div>
        </div>
      </div>
      <div className="footer-base"><span>© 2026 IV Bags · {content.city}</span><span><a href={waLink(content.whatsapp)} target="_blank" rel="noopener">WhatsApp {content.whatsapp.replace(/^57(\d{3})(\d{3})(\d+)$/, "$1 $2 $3")}</a> · <a href={`mailto:${content.email}`}>{content.email}</a> · <a href={`https://instagram.com/${content.instagram}`} target="_blank" rel="noopener">@{content.instagram}</a></span></div>
    </footer>
  );
}
