import { Suspense } from "react";
import { getContent, getPosts, getProducts } from "@/lib/data";
import { Marquee, MushBand } from "@/components/store/bands";
import { ShopView } from "@/components/store/shop";
import { AboutSection, BlogSection, CategorySection, CustomSection, Hero } from "@/components/store/sections";
import { CommentsSection } from "@/components/store/comments";
import { GuestWelcome } from "@/components/auth/auth-provider";

/** Inicio en el orden del kit: portada, categorías, honguitos, favoritos, cinta, personaliza, nosotras, honguitos, blog y comentarios. */
export default async function Home() {
  const [c, products, posts] = await Promise.all([getContent(), getProducts(), getPosts()]);
  const featured = products.filter((p) => p.featured);
  const pet = products.find((p) => p.is_pet);
  return (
    <>
      <Hero c={c} />
      <CategorySection products={products} />
      <MushBand />
      <Suspense fallback={<div className="section-shop" />}>
        <ShopView home products={featured.length ? featured : products} petPrice={pet?.price_cents} />
      </Suspense>
      <Marquee />
      <CustomSection c={c} />
      <AboutSection c={c} />
      <MushBand />
      <BlogSection posts={posts.slice(0, 3)} />
      <CommentsSection />
      <GuestWelcome delay={3500} />
    </>
  );
}
