"use client";

import { createClient, hasSupabase } from "./supabase/browser";

export type ProductEvent = "view" | "fav" | "cart" | "whatsapp";

/** Registra una interacción para el ranking de favoritos de la semana. Nunca lanza errores. */
export function trackProduct(productId: string, kind: ProductEvent) {
  if (!hasSupabase()) return;
  try {
    createClient().rpc("track_product_event", { p_product: productId, p_kind: kind }).then(({ error }) => error && console.warn("track", error.message));
  } catch {}
}
