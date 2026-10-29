import { Suspense } from "react";
import { getContent, getPosts, getVideos, getWeeklyFavorites } from "@/lib/data";
import { Marquee, MushBand } from "@/components/store/bands";
import { ShopView } from "@/components/store/shop";
import { AboutSection, BlogSection, CategorySection, CustomSection, Hero } from "@/components/store/sections";
import { CommentsSection } from "@/components/store/comments";
import { VideoSection } from "@/components/store/videos";
import { GuestWelcome } from "@/components/auth/auth-provider";

/** Inicio en el orden del kit: portada, categorías, honguitos, favoritos, cinta, personaliza, nosotras, honguitos, videos, blog y comentarios. */
export default async function Home() {
  const [c, { products, ranked, hasActivity }, posts, videos] = await Promise.all([getContent(), getWeeklyFavorites(), getPosts(), getVideos()]);
  // Con actividad de la semana mandan los más vistos y comprados; si no, los destacados del admin.
  const featured = hasActivity ? ranked.slice(0, 10) : products.filter((p) => p.featured);
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
      <VideoSection videos={videos} c={c} />
      <BlogSection posts={posts.slice(0, 3)} />
      <CommentsSection />
      <GuestWelcome delay={3500} />
    </>
  );
}
