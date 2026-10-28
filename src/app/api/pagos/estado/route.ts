import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { applyTransaction, fetchTransaction } from "@/lib/wompi";

/**
 * GET ?id=<transacción> → estado verificado en Wompi.
 * Lo usa la página de resultado; además actualiza el pedido por si el webhook aún no llegó.
 */
export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Falta la transacción." }, { status: 400 });

  const tx = await fetchTransaction(id);
  if (!tx) return NextResponse.json({ error: "No encontramos esa transacción en Wompi." }, { status: 404 });

  let orderNumber: number | null = null;
  const admin = createAdminClient();
  if (admin) {
    const result = await applyTransaction(admin, tx);
    if ("order" in result && result.order) orderNumber = result.order.order_number;
  }
  return NextResponse.json({
    status: tx.status, reference: tx.reference, amountInCents: tx.amount_in_cents,
    method: tx.payment_method_type ?? null, message: tx.status_message ?? null, orderNumber,
  });
}
