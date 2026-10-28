"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { money } from "@/lib/format";
import { startOnlinePayment } from "@/lib/pay";
import { useStore } from "./store-provider";
import { Star } from "./icons";
import { toast } from "sonner";

type Result = { status: "APPROVED" | "DECLINED" | "VOIDED" | "ERROR" | "PENDING"; amountInCents: number; method: string | null; message: string | null; orderNumber: number | null };
const METHODS: Record<string, string> = { CARD: "tarjeta", PSE: "PSE", NEQUI: "Nequi", BANCOLOMBIA_TRANSFER: "Botón Bancolombia", BANCOLOMBIA_COLLECT: "corresponsal Bancolombia", DAVIPLATA: "Daviplata" };

/** Wompi devuelve a la persona aquí con ?id=<transacción>. El estado se verifica en el servidor con Wompi. */
export function PaymentResult() {
  const id = useSearchParams().get("id");
  const { clear } = useStore();
  const [result, setResult] = useState<Result | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    if (!id) return;
    let stop = false;
    let tries = 0;
    async function check() {
      try {
        const res = await fetch(`/api/pagos/estado?id=${encodeURIComponent(id!)}`, { cache: "no-store" });
        const json = await res.json();
        if (stop) return;
        if (!res.ok) { setFailed(json.error ?? "No pudimos verificar el pago."); return; }
        setResult(json);
        // Algunos pagos (PSE, Bancolombia) tardan unos segundos en confirmarse.
        if (json.status === "PENDING" && tries++ < 20) setTimeout(check, 3000);
      } catch {
        if (!stop) setFailed("Sin conexión. Recarga la página para ver el estado del pago.");
      }
    }
    check();
    return () => { stop = true; };
  }, [id]);

  useEffect(() => { if (result?.status === "APPROVED") clear(); }, [result?.status, clear]);

  async function retry() {
    if (!result?.orderNumber) return;
    setRetrying(true);
    const r = await startOnlinePayment(result.orderNumber);
    if (!r.ok) { setRetrying(false); toast.error("No pudimos abrir el pago", { description: r.error }); }
  }

  const state = !id ? "missing" : failed ? "failed" : !result ? "checking" : result.status;
  const method = result?.method ? METHODS[result.method] ?? result.method.toLowerCase() : null;

  return (
    <main className="checkout done"><div className="pay-result pay-card sewn" data-state={state}>
      <div className="pay-icon" aria-hidden>
        {state === "APPROVED" ? <svg className="check" viewBox="0 0 52 52"><circle cx="26" cy="26" r="24" /><path d="M15 27l7 7 15-16" /></svg>
          : state === "checking" || state === "PENDING" ? <span className="pay-spinner" />
          : <svg className="cross" viewBox="0 0 52 52"><circle cx="26" cy="26" r="24" /><path d="M18 18l16 16M34 18L18 34" /></svg>}
      </div>

      {state === "checking" && <><h1 className="d h-lg">Verificando tu pago…</h1><p className="long">Estamos confirmando con Wompi. No cierres esta página.</p></>}
      {state === "PENDING" && <><h1 className="d h-lg">Tu pago está en proceso</h1><p className="long">Algunos pagos tardan unos minutos en confirmarse. Te avisaremos por WhatsApp y lo verás en tu cuenta.</p></>}
      {state === "APPROVED" && <>
        <h1 className="d h-lg">¡Pago <i>aprobado</i>!</h1>
        <p className="long">Recibimos {result && money(result.amountInCents)}{method ? ` por ${method}` : ""}. Tu pedido{result?.orderNumber ? ` #${result.orderNumber}` : ""} ya quedó confirmado y pronto empezamos a hacerlo a mano.</p>
        {[0, 1, 2, 3, 4, 5].map((i) => <Star key={i} size={14} variant={i % 2 ? "burst" : "spark"} className={`burst-star b${i}`} />)}
      </>}
      {(state === "DECLINED" || state === "VOIDED" || state === "ERROR") && <>
        <h1 className="d h-lg">{state === "DECLINED" ? "El pago fue rechazado" : state === "VOIDED" ? "El pago fue anulado" : "Hubo un problema con el pago"}</h1>
        <p className="long">{result?.message ? `${result.message}. ` : ""}Tu pedido sigue guardado: puedes intentar de nuevo con otro medio de pago.</p>
      </>}
      {state === "failed" && <><h1 className="d h-lg">No pudimos verificar el pago</h1><p className="long">{failed}</p></>}
      {state === "missing" && <><h1 className="d h-lg">No encontramos el pago</h1><p className="long">Revisa el estado de tus pedidos en tu cuenta.</p></>}

      <div className="actions">
        {(state === "DECLINED" || state === "VOIDED" || state === "ERROR") && result?.orderNumber && <button className="btn btn-solid" onClick={retry} disabled={retrying}>{retrying ? <><span className="spinner" aria-hidden />Abriendo pago</> : "Intentar de nuevo"}</button>}
        <Link className={state === "APPROVED" ? "btn btn-solid" : "btn btn-line"} href="/cuenta">Ver mis pedidos</Link>
        <Link className="btn btn-line" href="/">Volver al inicio</Link>
      </div>
    </div></main>
  );
}
