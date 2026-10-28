import type { Metadata } from "next";
import { Suspense } from "react";
import { getProducts } from "@/lib/data";
import { ShopView } from "@/components/store/shop";
import { Marquee } from "@/components/store/bands";
import { BackHome } from "@/components/store/sections";
import { GuestWelcome } from "@/components/auth/auth-provider";

export const metadata: Metadata = { title: "Tienda | IV Bags", description: "Bolsos, prendas y accesorios hechos a mano." };

export default async function ShopPage() {
  const products = await getProducts();
  const pet = products.find((p) => p.is_pet);
  return (
    <>
      <BackHome />
      <GuestWelcome delay={3500} />
      <Suspense fallback={<div className="section-shop" />}>
        <ShopView products={products} petPrice={pet?.price_cents} />
      </Suspense>
      <Marquee />
    </>
  );
}
