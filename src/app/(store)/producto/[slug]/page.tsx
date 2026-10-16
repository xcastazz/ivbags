import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getContent, getProduct, getProducts } from "@/lib/data";
import { ProductView } from "@/components/store/product-view";

export async function generateStaticParams() {
  const products = await getProducts();
  return products.length ? products.map((p) => ({ slug: p.slug })) : [{ slug: "pronto" }];
}

export async function generateMetadata({ params }: PageProps<"/producto/[slug]">): Promise<Metadata> {
  const p = await getProduct((await params).slug);
  return { title: p ? `${p.name} | IV Bags` : "IV Bags", description: p?.description ?? undefined, openGraph: p?.images[0] ? { images: [p.images[0]] } : undefined };
}

export default async function ProductPage({ params }: PageProps<"/producto/[slug]">) {
  const { slug } = await params;
  const [p, products, content] = await Promise.all([getProduct(slug), getProducts(), getContent()]);
  if (!p) notFound();
  const related = [...products.filter((r) => r.id !== p.id && r.category === p.category), ...products.filter((r) => r.id !== p.id && r.category !== p.category)].slice(0, 4);
  return <ProductView p={p} related={related} whatsapp={content.whatsapp} />;
}
