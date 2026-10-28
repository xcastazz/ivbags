import type { Metadata } from "next";
import { getContent, getPosts, getProducts } from "@/lib/data";
import { BlogSection, InstaSection, instaPhotos, BackHome } from "@/components/store/sections";

export const metadata: Metadata = { title: "Blog | IV Bags", description: "Ferias, talleres y eventos donde encontrarnos." };

export default async function BlogPage() {
  const [posts, c, products] = await Promise.all([getPosts(), getContent(), getProducts()]);
  return (
    <>
      <BackHome />
      <BlogSection posts={posts} heading />
      <InstaSection c={c} photos={instaPhotos(products)} />
    </>
  );
}
