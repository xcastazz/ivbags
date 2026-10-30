"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Bell, CircleDollarSign, CircleAlert, Inbox, Mail, MessageSquareHeart, ShoppingBag, UserPlus } from "lucide-react";
import { db } from "./kit";

type Notice = { id: string; kind: string; title: string; body: string | null; href: string | null; read_at: string | null; created_at: string };

const ICONS = { order: ShoppingBag, payment: CircleDollarSign, payment_failed: CircleAlert, custom_request: Inbox, message: Mail, customer: UserPlus, comment: MessageSquareHeart } as const;
const LIMIT = 40;

function ago(iso: string) {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "ahora";
  if (s < 3600) return `hace ${Math.floor(s / 60)} min`;
  if (s < 86400) return `hace ${Math.floor(s / 3600)} h`;
  return new Date(iso).toLocaleDateString("es-CO", { day: "numeric", month: "short" });
}

/** Campanita: lista de novedades, contador, aviso en tiempo real y en el título de la pestaña. */
export function AdminNotifications() {
  const router = useRouter();
  const [items, setItems] = useState<Notice[]>([]);
  const [open, setOpen] = useState(false);
  const [missing, setMissing] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const unread = items.filter((n) => !n.read_at).length;

  const load = useCallback(async () => {
    const { data, error } = await db().from("admin_notifications").select("*").order("created_at", { ascending: false }).limit(LIMIT);
    if (error) { setMissing(error.code === "PGRST205" || error.code === "42P01"); return; }
    setItems(data as Notice[]);
  }, []);

  const go = useCallback((n: Notice) => {
    setOpen(false);
    if (!n.read_at) {
      const now = new Date().toISOString();
      setItems((list) => list.map((x) => (x.id === n.id ? { ...x, read_at: now } : x)));
      db().from("admin_notifications").update({ read_at: now }).eq("id", n.id).then();
    }
    if (n.href) router.push(n.href);
  }, [router]);

  // Carga inicial, tiempo real y respaldo cada minuto por si se cae la conexión.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch
    load();
    const client = db();
    const channel = client.channel("admin-notifications")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "admin_notifications" }, ({ new: row }) => {
        const n = row as Notice;
        setItems((list) => (list.some((x) => x.id === n.id) ? list : [n, ...list].slice(0, LIMIT)));
        toast(n.title, { description: n.body ?? undefined, action: n.href ? { label: "Ver", onClick: () => go(n) } : undefined });
        ping();
        if (document.hidden && "Notification" in window && Notification.permission === "granted") new Notification(n.title, { body: n.body ?? undefined, icon: "/icon"});
      })
      .subscribe();
    const timer = setInterval(load, 60000);
    return () => { clearInterval(timer); client.removeChannel(channel); };
  }, [load, go]);

  // Contador en la pestaña del navegador.
  useEffect(() => {
    const base = document.title.replace(/^\(\d+\)\s*/, "");
    document.title = unread ? `(${unread}) ${base}` : base;
  }, [unread]);

  // Se cierra al tocar fuera o con Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("pointerdown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  async function readAll() {
    const now = new Date().toISOString();
    setItems((list) => list.map((x) => (x.read_at ? x : { ...x, read_at: now })));
    await db().from("admin_notifications").update({ read_at: now }).is("read_at", null);
  }

  function toggle() {
    setOpen((o) => !o);
    if ("Notification" in window && Notification.permission === "default") Notification.requestPermission();
  }

  return (
    <div className="notif" ref={ref}>
      <button className="notif-btn" onClick={toggle} aria-expanded={open} aria-controls="notificaciones" aria-label={unread ? `Notificaciones, ${unread} sin leer` : "Notificaciones"}>
        <Bell size={16} /><span>Novedades</span>
        {unread > 0 && <b className="notif-count" key={unread}>{unread > 99 ? "99+" : unread}</b>}
      </button>
      <div id="notificaciones" className="notif-panel" data-open={open} inert={!open} role="dialog" aria-label="Notificaciones">
        <div className="notif-head">
          <strong>Novedades</strong>
          {unread > 0 && <button onClick={readAll}>Marcar todo como leído</button>}
        </div>
        {missing
          ? <p className="notif-empty">Falta activar las notificaciones: ejecuta <code>supabase/migrations/008_admin_notifications.sql</code> en Supabase.</p>
          : items.length === 0
            ? <p className="notif-empty">Todo tranquilo. Aquí verás pedidos, pagos, mensajes y clientas nuevas.</p>
            : <ul>
                {items.map((n) => {
                  const Icon = ICONS[n.kind as keyof typeof ICONS] ?? Bell;
                  return (
                    <li key={n.id}>
                      <button className={n.read_at ? "notif-item" : "notif-item unread"} data-kind={n.kind} onClick={() => go(n)}>
                        <Icon size={16} aria-hidden />
                        <span><span className="t">{n.title}</span>{n.body && <span className="b">{n.body}</span>}<small>{ago(n.created_at)}</small></span>
                      </button>
                    </li>
                  );
                })}
              </ul>}
      </div>
    </div>
  );
}

/** Sonido corto y suave, sin archivos externos. */
function ping() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
    osc.onended = () => ctx.close();
  } catch { /* sin sonido si el navegador lo bloquea */ }
}
