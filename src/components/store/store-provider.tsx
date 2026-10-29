"use client";

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { Product } from "@/lib/types";
import { createClient, hasSupabase } from "@/lib/supabase/browser";
import { trackProduct } from "@/lib/track";

export type CartLine = {
  key: string; productId: string; slug: string; name: string; priceCents: number; image?: string;
  sel: Record<string, string>; extra: { petName?: string; pets?: number; photos?: string[] }; qty: number;
};

type Store = {
  cart: CartLine[]; favs: Record<string, boolean>; cartCount: number; favCount: number; subtotal: number;
  cartOpen: boolean; setCartOpen: (open: boolean) => void;
  add: (p: Product, sel: Record<string, string>, qty: number, extra?: CartLine["extra"]) => void;
  setQty: (key: string, qty: number) => void; remove: (key: string) => void; clear: () => void; replace: (lines: CartLine[]) => void;
  toggleFav: (p: Pick<Product, "id">) => void;
};

const StoreContext = createContext<Store | null>(null);
const CART_KEY = "iv-cart-v2";
const FAVS_KEY = "iv-favs";

function load<T>(key: string, fallback: T): T {
  try { const raw = localStorage.getItem(key); return raw ? (JSON.parse(raw) as T) : fallback; } catch { return fallback; }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Compara la bolsa con los productos activos de la base: quita los que no existen y pone el precio vigente. */
export async function syncWithCatalog(lines: CartLine[]): Promise<{ lines: CartLine[]; removed: string[] } | null> {
  try {
    const ids = [...new Set(lines.map((l) => l.productId).filter((id) => UUID.test(id)))];
    const { data, error } = ids.length ? await createClient().from("products").select("id, name, slug, price_cents, images").eq("active", true).in("id", ids) : { data: [], error: null };
    if (error) return null;
    const byId = new Map((data ?? []).map((p) => [p.id, p]));
    const kept = lines.filter((l) => byId.has(l.productId)).map((l) => { const p = byId.get(l.productId)!; return { ...l, name: p.name, slug: p.slug, priceCents: p.price_cents, image: p.images?.[0] ?? l.image }; });
    return { lines: kept, removed: lines.filter((l) => !byId.has(l.productId)).map((l) => l.name) };
  } catch {
    return null;
  }
}

export function lineDetail(line: CartLine) {
  const bits = Object.values(line.sel).filter(Boolean);
  if (line.extra.petName) bits.push(`Nombre: ${line.extra.petName}`);
  if ((line.extra.pets ?? 1) > 1) bits.push(`${line.extra.pets} mascotas`);
  if (line.extra.photos?.length) bits.push(`${line.extra.photos.length} ${line.extra.photos.length === 1 ? "foto" : "fotos"}`);
  return bits.join(" · ");
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [favs, setFavs] = useState<Record<string, boolean>>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = load<CartLine[]>(CART_KEY, []).filter((c) => c && c.productId && c.name);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from storage after mount
    setCart(saved);
    // Con la tienda conectada, quita piezas que ya no existen (p. ej. del catálogo de ejemplo) y actualiza precios.
    if (hasSupabase() && saved.length) syncWithCatalog(saved).then((r) => {
      if (!r) return;
      setCart(r.lines);
      if (r.removed.length) toast(`Quitamos de tu bolsa: ${r.removed.join(", ")}`, { description: "Esas piezas ya no están disponibles." });
    });
    setFavs(load(FAVS_KEY, {}));
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); localStorage.setItem(FAVS_KEY, JSON.stringify(favs)); } catch {}
  }, [cart, favs, ready]);

  const value = useMemo<Store>(() => ({
    cart, favs, cartOpen, setCartOpen,
    cartCount: cart.reduce((n, c) => n + c.qty, 0),
    subtotal: cart.reduce((n, c) => n + c.qty * c.priceCents, 0),
    favCount: Object.values(favs).filter(Boolean).length,
    add: (p, sel, qty, extra = {}) => {
      const key = `${p.id}|${JSON.stringify(sel)}|${JSON.stringify(extra)}`;
      setCart((current) => current.some((c) => c.key === key)
        ? current.map((c) => c.key === key ? { ...c, qty: Math.min(20, c.qty + qty) } : c)
        : [...current, { key, productId: p.id, slug: p.slug, name: p.name, priceCents: p.price_cents, image: p.images[0], sel, extra, qty }]);
      toast.success(`${p.name} quedó en tu bolsa`, { action: { label: "Ver bolsa", onClick: () => setCartOpen(true) } });
    },
    setQty: (key, qty) => setCart((current) => current.map((c) => c.key === key ? { ...c, qty: Math.max(1, Math.min(20, qty)) } : c)),
    remove: (key) => setCart((current) => current.filter((c) => c.key !== key)),
    clear: () => setCart([]),
    replace: (lines) => setCart(lines),
    toggleFav: (p) => {
      const on = !favs[p.id];
      setFavs((current) => ({ ...current, [p.id]: on }));
      if (on) trackProduct(p.id, "fav");
      toast(on ? "Guardado en favoritos" : "Quitado de favoritos");
    },
  }), [cart, favs, cartOpen]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const store = useContext(StoreContext);
  if (!store) throw new Error("useStore must be used inside StoreProvider");
  return store;
}
