import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Wompi (Bancolombia) — Web Checkout.
 * Docs: https://docs.wompi.co/docs/colombia/widget-checkout-web/
 * Las llaves de prueba empiezan por pub_test_/test_ y usan el sandbox; las de producción, pub_prod_/prod_.
 */
export type WompiStatus = "APPROVED" | "DECLINED" | "VOIDED" | "ERROR" | "PENDING";
export type WompiTransaction = {
  id: string; status: WompiStatus; reference: string; amount_in_cents: number; currency: string;
  payment_method_type?: string; status_message?: string | null; created_at?: string; finalized_at?: string | null;
};

export function wompiConfig() {
  const publicKey = process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY ?? "";
  const integritySecret = process.env.WOMPI_INTEGRITY_SECRET ?? "";
  const eventsSecret = process.env.WOMPI_EVENTS_SECRET ?? "";
  const sandbox = publicKey.startsWith("pub_test_");
  return {
    publicKey, integritySecret, eventsSecret, sandbox,
    ready: Boolean(publicKey && integritySecret),
    apiBase: sandbox ? "https://sandbox.wompi.co/v1" : "https://production.wompi.co/v1",
  };
}

/** SHA-256 en hexadecimal (Web Crypto: funciona en Node y en Cloudflare Workers). */
export async function sha256Hex(text: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Firma de integridad: SHA256(referencia + monto en centavos + moneda + secreto de integridad). */
export function integritySignature(reference: string, amountInCents: number, currency: string, secret: string) {
  return sha256Hex(`${reference}${amountInCents}${currency}${secret}`);
}

type CheckoutInput = {
  reference: string; amountInCents: number; redirectUrl: string;
  customer?: { email?: string; fullName?: string; phone?: string; legalId?: string; legalIdType?: string };
  shipping?: { address?: string; city?: string; region?: string; phone?: string; name?: string };
};

/** URL del checkout de Wompi con la firma de integridad. */
export async function checkoutUrl(input: CheckoutInput) {
  const cfg = wompiConfig();
  const params = new URLSearchParams({
    "public-key": cfg.publicKey,
    currency: "COP",
    "amount-in-cents": String(input.amountInCents),
    reference: input.reference,
    "signature:integrity": await integritySignature(input.reference, input.amountInCents, "COP", cfg.integritySecret),
    "redirect-url": input.redirectUrl,
  });
  const c = input.customer ?? {};
  if (c.email) params.set("customer-data:email", c.email);
  if (c.fullName) params.set("customer-data:full-name", c.fullName);
  if (c.phone) { params.set("customer-data:phone-number", c.phone.replace(/\D/g, "").slice(-10)); params.set("customer-data:phone-number-prefix", "+57"); }
  if (c.legalId) { params.set("customer-data:legal-id", c.legalId); params.set("customer-data:legal-id-type", c.legalIdType ?? "CC"); }
  const s = input.shipping ?? {};
  if (s.address && s.city) {
    params.set("shipping-address:address-line-1", s.address.slice(0, 100));
    params.set("shipping-address:country", "CO");
    params.set("shipping-address:city", s.city);
    params.set("shipping-address:region", s.region ?? s.city);
    if (s.phone) params.set("shipping-address:phone-number", s.phone.replace(/\D/g, "").slice(-10));
    if (s.name) params.set("shipping-address:name", s.name);
  }
  return `https://checkout.wompi.co/p/?${params.toString()}`;
}

/** Consulta una transacción directamente en Wompi (fuente de verdad, no se confía en lo que diga el navegador). */
export async function fetchTransaction(id: string): Promise<WompiTransaction | null> {
  const cfg = wompiConfig();
  try {
    const res = await fetch(`${cfg.apiBase}/transactions/${encodeURIComponent(id)}`, { cache: "no-store" });
    if (!res.ok) return null;
    const json = await res.json();
    return (json?.data ?? null) as WompiTransaction | null;
  } catch {
    return null;
  }
}

const STATUS_MAP: Record<WompiStatus, "approved" | "declined" | "voided" | "error" | "pending"> = {
  APPROVED: "approved", DECLINED: "declined", VOIDED: "voided", ERROR: "error", PENDING: "pending",
};

/**
 * Aplica el resultado de una transacción al pedido. Verifica que la referencia y el monto coincidan.
 * Si se aprobó, el pedido pasa a "Pago confirmado".
 */
export async function applyTransaction(db: SupabaseClient, tx: WompiTransaction) {
  const fields = "id, order_number, total_cents, status, payment_status";
  let { data: order } = await db.from("orders").select(fields).eq("payment_reference", tx.reference).maybeSingle();
  // Si la persona abrió el pago dos veces, la referencia guardada es la del último intento: se busca por el número de pedido.
  const fromRef = /^IV-(\d+)-/.exec(tx.reference)?.[1];
  if (!order && fromRef) ({ data: order } = await db.from("orders").select(fields).eq("order_number", Number(fromRef)).maybeSingle());
  if (!order) return { ok: false as const, reason: "pedido-no-encontrado" };
  if (tx.currency !== "COP" || tx.amount_in_cents !== order.total_cents) return { ok: false as const, reason: "monto-no-coincide", order };
  if (order.payment_status === "approved") return { ok: true as const, order, status: "approved" as const }; // ya aplicado
  const payment_status = STATUS_MAP[tx.status] ?? "pending";
  const change: Record<string, unknown> = {
    payment_status, payment_provider: "wompi", payment_tx_id: tx.id,
    payment_method: tx.payment_method_type ? `Wompi · ${tx.payment_method_type}` : "Wompi",
    payment_details: { status: tx.status, message: tx.status_message ?? null, method: tx.payment_method_type ?? null, finalized_at: tx.finalized_at ?? null },
  };
  if (payment_status === "approved") {
    change.paid_at = tx.finalized_at ?? new Date().toISOString();
    if (["new", "quoted"].includes(order.status)) change.status = "confirmed";
  }
  await db.from("orders").update(change).eq("id", order.id);
  return { ok: true as const, order, status: payment_status };
}

/**
 * Verifica la firma de un evento de Wompi:
 * SHA256(valores de signature.properties concatenados + timestamp + secreto de eventos) === signature.checksum.
 */
export async function verifyEvent(event: { data?: Record<string, unknown>; signature?: { properties?: string[]; checksum?: string }; timestamp?: number }, secret: string) {
  if (!event.signature?.properties || !event.signature.checksum || !event.timestamp || !secret) return false;
  const values = event.signature.properties.map((path) => path.split(".").reduce<unknown>((obj, key) => (obj as Record<string, unknown> | undefined)?.[key], event.data));
  const expected = await sha256Hex(`${values.join("")}${event.timestamp}${secret}`);
  return expected.toLowerCase() === event.signature.checksum.toLowerCase();
}
