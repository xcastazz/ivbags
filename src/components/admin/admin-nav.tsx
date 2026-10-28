"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Clapperboard, FileText, Inbox, LayoutTemplate, Mail, MessageSquareHeart, Newspaper, ShoppingBag, Store, Users } from "lucide-react";
import { Logo } from "@/components/store/logo";
import { AdminNotifications } from "./notifications";

const LINKS = [
  ["/admin", "Resumen", BarChart3], ["/admin/pedidos", "Pedidos", ShoppingBag], ["/admin/productos", "Productos", Store],
  ["/admin/solicitudes", "Personalizados", Inbox], ["/admin/mensajes", "Mensajes", Mail], ["/admin/comentarios", "Comentarios", MessageSquareHeart], ["/admin/blog", "Blog", Newspaper], ["/admin/videos", "Videos", Clapperboard],
  ["/admin/contenido", "Contenido", LayoutTemplate], ["/admin/clientes", "Clientes", Users], ["/admin/facturas", "Facturas", FileText],
] as const;

export function AdminNav() {
  const path = usePathname();
  return (
    <aside className="admin-sidebar">
      <Link className="hlogo light" href="/admin" aria-label="Panel IV Bags"><Logo height={44} tone="crema" /></Link>
      <p>Taller · admin</p>
      <AdminNotifications />
      <nav aria-label="Admin">
        {LINKS.map(([href, label, Icon]) => <Link key={href} href={href} className={path === href ? "selected" : undefined} aria-current={path === href ? "page" : undefined} title={label}><Icon size={16} /><span>{label}</span></Link>)}
      </nav>
      <Link className="admin-store-link" href="/" target="_blank">Ver la tienda ↗</Link>
    </aside>
  );
}
