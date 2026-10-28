import type { Metadata } from "next";
import { getPosts } from "@/lib/data";
import { BlogSection, BackHome } from "@/components/store/sections";

export const metadata: Metadata = { title: "Blog | IV Bags", description: "Ferias, talleres y eventos donde encontrarnos." };

export default async function BlogPage() {
  const posts = await getPosts();
  return (
    <>
      <BackHome />
      <BlogSection posts={posts} heading />
    </>
  );
}
