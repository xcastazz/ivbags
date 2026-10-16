import type { Metadata } from "next";
import { AdminNav } from "@/components/admin/admin-nav";
import { isConnected } from "@/lib/data";

export const metadata: Metadata = { title: "Panel del taller | IV Bags", robots: { index: false } };

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="admin-shell">
      <AdminNav />
      <section className="admin-content">
        {isConnected() ? children : <div className="admin-panel"><h1 className="d h-md">Conecta Supabase</h1><p>Agrega <code>NEXT_PUBLIC_SUPABASE_URL</code> y <code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> al entorno y ejecuta las migraciones de <code>supabase/migrations</code> para usar el panel.</p></div>}
      </section>
    </div>
  );
}
