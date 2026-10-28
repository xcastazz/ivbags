import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkoutUrl, wompiConfig } from "@/lib/wompi";

/**
 * POST { orderNumber } → { url } del checkout de Wompi.
 * El monto sale del pedido guardado en la base, nunca de lo que mande el navegador.
 */
export async function POST(request: NextRequest) {
  const cfg = wompiConfig();
  if (!cfg.ready) return NextResponse.json({ error: "Los pagos en línea aún no están configurados." }, { status: 503 });

  const supabase = await createClient();
  const admin = createAdminClient();
  if (!supabase || !admin) return NextResponse.json({ error: "La tienda no está conectada a la base de datos." }, { status: 503 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Inicia sesión para pagar." }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const orderNumber = Number(body.orderNumber);
  if (!Number.isInteger(orderNumber)) return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });

  // Con el cliente de la persona: RLS garantiza que solo puede pagar sus propios pedidos.
  const { data: order } = await supabase.from("orders")
    .select("id, order_number, total_cents, status, payment_status, customer_name, customer_email, customer_phone, city, department, shipping_address")
    .eq("order_number", orderNumber).eq("customer_id", user.id).maybeSingle();
  if (!order) return NextResponse.json({ error: "No encontramos ese pedido en tu cuenta." }, { status: 404 });
  if (order.payment_status === "approved") return NextResponse.json({ error: "Este pedido ya está pagado." }, { status: 409 });
  if (order.status === "cancelled") return NextResponse.json({ error: "Este pedido está cancelado." }, { status: 409 });

  // Cada intento de pago lleva su propia referencia (Wompi no acepta repetirlas).
  const reference = `IV-${order.order_number}-${Date.now().toString(36).toUpperCase()}`;
  const { error } = await admin.from("orders").update({ payment_reference: reference, payment_provider: "wompi" }).eq("id", order.id);
  if (error) return NextResponse.json({ error: "No pudimos preparar el pago. Intenta de nuevo." }, { status: 500 });

  const site = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;
  const ship = (order.shipping_address ?? {}) as Record<string, string | undefined>;
  const url = await checkoutUrl({
    reference, amountInCents: order.total_cents,
    redirectUrl: `${site}/pago/resultado`,
    customer: { email: order.customer_email, fullName: order.customer_name, phone: order.customer_phone ?? undefined, legalId: ship.idNumber, legalIdType: ship.idType },
    shipping: { address: ship.street ?? ship.address, city: order.city ?? ship.city, region: order.department ?? ship.department, phone: order.customer_phone ?? undefined, name: order.customer_name },
  });
  return NextResponse.json({ url });
}
