import type { Metadata } from "next";
import { Suspense } from "react";
import { PaymentResult } from "@/components/store/payment-result";

export const metadata: Metadata = { title: "Resultado del pago | IV Bags", robots: { index: false } };

export default function PaymentResultPage() {
  return <Suspense fallback={<div className="pay-result" />}><PaymentResult /></Suspense>;
}
