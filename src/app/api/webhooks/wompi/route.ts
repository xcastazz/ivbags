import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { applyTransaction, fetchTransaction, verifyEvent, wompiConfig, type WompiTransaction } from "@/lib/wompi";

/**
 * Wompi avisa aquí cada vez que una transacción cambia (evento "transaction.updated").
 * Configura esta URL en el panel de Wompi: https://TU-DOMINIO/api/webhooks/wompi
 */
export async function POST(request: NextRequest) {
  const cfg = wompiConfig();
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ ok: false }, { status: 503 });

  const event = await request.json().catch(() => null);
  if (!event || !(await verifyEvent(event, cfg.eventsSecret))) {
    return NextResponse.json({ ok: false, error: "firma inválida" }, { status: 401 });
  }
  if (event.event !== "transaction.updated") return NextResponse.json({ ok: true, ignored: event.event });

  const sent = event.data?.transaction as WompiTransaction | undefined;
  if (!sent?.id) return NextResponse.json({ ok: false }, { status: 400 });

  // Doble verificación: se consulta la transacción directamente en Wompi.
  const tx = (await fetchTransaction(sent.id)) ?? sent;
  const result = await applyTransaction(admin, tx);
  // Siempre 200 para que Wompi no reintente eventos de pedidos que no son de esta tienda.
  return NextResponse.json({ ok: result.ok, status: result.ok ? result.status : result.reason });
}
