"use client";

/** ¿Están configurados los pagos en línea? (la llave pública de Wompi es pública por diseño). */
export const onlinePaymentsEnabled = () => Boolean(process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY);

/** Pide al servidor la URL firmada del checkout de Wompi y lleva a la persona allá. */
export async function startOnlinePayment(orderNumber: number): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const res = await fetch("/api/pagos/wompi", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderNumber }) });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.url) return { ok: false, error: json.error ?? "No pudimos abrir el pago. Intenta de nuevo." };
    window.location.assign(json.url);
    return { ok: true };
  } catch {
    return { ok: false, error: "Sin conexión. Revisa tu internet e intenta de nuevo." };
  }
}
