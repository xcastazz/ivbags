import type { Product } from "./types";

const COP = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

export const money = (cents: number) => COP.format(cents / 100);

export const catHref = (cat: string) => `/tienda?cat=${encodeURIComponent(cat)}`;

export const waLink = (phone: string, text?: string) => `https://wa.me/${phone.replace(/\D/g, "")}${text ? `?text=${encodeURIComponent(text)}` : ""}`;

export function availability(p: Pick<Product, "made_to_order" | "inventory_count">) {
  return p.made_to_order || p.inventory_count <= 0
    ? { label: "Hecho por encargo", text: "Lo tenemos listo 2 semanas después de tu pago y ahí te lo despachamos.", bg: "var(--rose)", ink: "var(--wine)" }
    : { label: "Listo para enviar", text: "Lo despachamos 1 día hábil después de tu pago.", bg: "var(--rodham)", ink: "var(--olive)" };
}

export function slugify(text: string) {
  return text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function formatDate(date: string | null, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }) {
  if (!date) return "Próximamente";
  return new Intl.DateTimeFormat("es-CO", { ...opts, timeZone: "UTC" }).format(new Date(date));
}
