import type { Metadata } from "next";
import { getContent } from "@/lib/data";
import { CheckoutView } from "@/components/store/checkout-view";

export const metadata: Metadata = { title: "Finalizar compra | IV Bags" };

export default async function CheckoutPage() {
  return <CheckoutView content={await getContent()} />;
}
