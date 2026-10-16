import type { Metadata } from "next";
import { Suspense } from "react";
import { getProducts } from "@/lib/data";
import { Categories, ShopView } from "@/components/store/shop";
import { MushBand } from "@/components/store/bands";
import { GuestWelcome } from "@/components/auth/auth-provider";

export const metadata: Metadata = { title: "Tienda | IV Bags", description: "Bolsos, prendas y accesorios hechos a mano." };

export default async function ShopPage() {
  const products = await getProducts();
  const pet = products.find((p) => p.is_pet);
  return (
    <>
      <section className="section-cats" aria-label="Compra por categoría">
        <h1 className="d h-xl">La tienda</h1>
        <Categories products={products} />
      </section>
      <MushBand />
      <GuestWelcome delay={3500} />
      <Suspense fallback={<div className="section-shop" />}>
        <ShopView products={products} petPrice={pet?.price_cents} />
      </Suspense>
    </>
  );
}
