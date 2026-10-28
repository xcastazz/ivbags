export const CATEGORIES = ["Bolsos", "Prendas", "Accesorios", "Personalizados con mascotas"] as const;
export type Category = (typeof CATEGORIES)[number];

export type ProductOption = { key: string; label: string; values: string[]; hint?: string };

export type Product = {
  id: string; slug: string; name: string; category: string; tag: string | null;
  description: string | null; details: string | null; price_cents: number;
  images: string[]; options: ProductOption[]; made_to_order: boolean; inventory_count: number;
  featured: boolean; is_pet: boolean; active: boolean; sort_order: number;
  /** Videos del producto. En la base viven junto a las fotos (columna images) y se separan al leer. */
  videos?: string[];
};

export const isVideoUrl = (url: string) => /\.(mp4|webm|mov|m4v)($|\?)/i.test(url);

/** Separa fotos y videos guardados en la misma lista. */
export function splitMedia<T extends { images: string[] }>(p: T): T & { videos: string[] } {
  return { ...p, images: p.images.filter((u) => !isVideoUrl(u)), videos: p.images.filter(isVideoUrl) };
}

export type Post = {
  id: string; kind: string; title: string; place: string | null; event_date: string | null;
  body: string | null; image_url: string | null; published: boolean; created_at: string;
};

export type TeamMember = { who: string; name: string; craft: string };

export type SiteContent = {
  topbar: string;
  heroTitle: string; heroItalic: string; heroText: string;
  aboutTitle: string; aboutItalic: string; aboutText: string; team: TeamMember[];
  customIntro: string; customSteps: string[];
  whatsapp: string; instagram: string; email: string; city: string;
  shippingCents: number; paymentInstructions: string;
  legalName: string; taxId: string; legalAddress: string; invoiceNote: string;
};

export type OrderStatus = "new" | "quoted" | "confirmed" | "in_production" | "shipped" | "completed" | "cancelled";

export const ORDER_STATUS: Record<OrderStatus, string> = {
  new: "Nuevo", quoted: "Cotizado", confirmed: "Pago confirmado", in_production: "En producción",
  shipped: "Enviado", completed: "Entregado", cancelled: "Cancelado",
};

export type StoreVideo = { id: string; title: string; caption: string | null; video_url: string; poster_url: string | null; published: boolean; sort_order: number; created_at: string };
