import { createClient } from "@supabase/supabase-js";
import { cacheLife, cacheTag } from "next/cache";
import { DEFAULT_CONTENT, DEFAULT_PRODUCTS } from "./defaults";
import type { Post, Product, SiteContent } from "./types";

/** Lecturas públicas de la tienda, cacheadas. El admin las refresca con `refreshStore`. */
function publicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  return url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
}

export const isConnected = () => Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

const PRODUCT_FIELDS = "id, slug, name, category, tag, description, details, price_cents, images, options, made_to_order, inventory_count, featured, is_pet, active, sort_order";

export async function getProducts(): Promise<Product[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("products");
  const db = publicClient();
  if (!db) return DEFAULT_PRODUCTS;
  const { data, error } = await db.from("products").select(PRODUCT_FIELDS).eq("active", true).order("sort_order").order("created_at", { ascending: false });
  if (error) { console.error("getProducts", error.message); return []; }
  return (data ?? []) as Product[];
}

export async function getProduct(slug: string) {
  return (await getProducts()).find((p) => p.slug === slug) ?? null;
}

export async function getContent(): Promise<SiteContent> {
  "use cache";
  cacheLife("minutes");
  cacheTag("content");
  const db = publicClient();
  if (!db) return DEFAULT_CONTENT;
  const { data } = await db.from("site_content").select("value").eq("key", "site").maybeSingle();
  return { ...DEFAULT_CONTENT, ...((data?.value as Partial<SiteContent>) ?? {}) };
}

export async function getPosts(): Promise<Post[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("posts");
  const db = publicClient();
  if (!db) return [];
  const { data } = await db.from("posts").select("*").eq("published", true).order("event_date", { ascending: true, nullsFirst: false });
  return (data ?? []) as Post[];
}
