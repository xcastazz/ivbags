import type { Product, SiteContent } from "./types";

/** Contenido por defecto: se usa mientras el admin no haya guardado el suyo. */
export const DEFAULT_CONTENT: SiteContent = {
  topbar: "Envíos a toda Colombia",
  heroTitle: "Piezas", heroItalic: "hechas a mano",
  heroText: "Tres mujeres creando bolsos, prendas y accesorios hechos a mano. Cada pieza se pinta, borda o graba.",
  aboutTitle: "Tres oficios,", aboutItalic: "una bolsa",
  aboutText: "IV Bags es un taller familiar. Cada pieza pasa por las manos de las tres antes de llegar a las tuyas.",
  team: [
    { who: "Mamá", name: "Luci", craft: "Confecciona cada pieza: corta, forra y le pone bolsillo y cierre." },
    { who: "Mi hermana", name: "Ale", craft: "Borda flores y detalles, puntada a puntada." },
    { who: "Yo", name: "Eva", craft: "Ilustro, pinto a mano y estampo en serigrafía." },
  ],
  customIntro: "Para cualquier idea que no sea una mascota, te hacemos una cotización. Si es tu mascota, mira los personalizados con precio fijo.",
  customSteps: [
    "Nos cuentas tu idea: una flor, tu cantante, tu serie favorita, lo que imagines.",
    "Definimos juntas el diseño y te mostramos el boceto.",
    "Lo pintamos a mano y te lo enviamos.",
  ],
  whatsapp: "573133264049", instagram: "iv.bags", email: "ivbags.taller@gmail.com", city: "Medellín, Colombia",
  shippingCents: 0,
  paymentInstructions: "Pagas en línea con Wompi: tarjeta, PSE, Nequi, Botón Bancolombia o efectivo. Los productos listos se despachan 1 día hábil después del pago y los hechos por encargo en 2 semanas.",
  legalName: "IV Bags", taxId: "", legalAddress: "Medellín, Colombia",
  invoiceNote: "Gracias por llevarte una pieza hecha a mano. Cada puntada, trazo y estampado lo hicimos pensando en ti.",
};

const img = (name: string) => `/kit/fotos/foto-${name}.jpg`;
const base = { active: true, details: null, inventory_count: 0, made_to_order: false, featured: true, is_pet: false, options: [] };

/** Catálogo de muestra para cuando Supabase no está conectado. */
export const DEFAULT_PRODUCTS: Product[] = [
  { ...base, id: "demo-1", slug: "tote-pensamiento", name: "Tote Pensamiento", category: "Bolsos", tag: "serigrafía", price_cents: 9500000, inventory_count: 3, sort_order: 1, images: [img("tote-detalle"), img("tote")], description: "Tote gris carbón estampado a mano en serigrafía con nuestra ilustración de pensamientos. Forrado, con bolsillo interno y cierre.", details: "Tela gris carbón, forro interno, bolsillo y cierre." },
  { ...base, id: "demo-2", slug: "bolso-mascota", name: "Bolso con tu mascota", category: "Personalizados con mascotas", tag: "pintado a mano", price_cents: 13000000, made_to_order: true, is_pet: true, sort_order: 2, images: [], description: "Pintamos a mano a tu mascota en un bolso de tela cruda (beige), dentro del marco floral que elijas. Puedes agregarle su nombre sin costo.", details: "Tela cruda (beige) con cierre, forro y bolsillos.", options: [{ key: "tamano", label: "Tamaño", values: ["Baguette", "Pequeño", "Mediano", "Grande"], hint: "Mismo precio en todos" }, { key: "marco", label: "Marco floral", values: ["Marco 1", "Marco 2", "Marco 3"], hint: "A tu elección" }] },
  { ...base, id: "demo-3", slug: "camiseta-pensamiento", name: "Camiseta Pensamiento", category: "Prendas", tag: "serigrafía", price_cents: 11000000, inventory_count: 4, sort_order: 3, images: [img("camiseta"), img("tote-detalle")], description: "Vinotinto, estampada en serigrafía: un ramo de pensamientos dentro de un marco festoneado.", details: "Algodón. Estampado en serigrafía.", options: [{ key: "modelo", label: "Modelo", values: ["Camiseta", "Blusa esqueleto"] }, { key: "talla", label: "Talla", values: ["S", "M", "L", "XL"] }] },
  { ...base, id: "demo-5", slug: "camiseta-orquidea", name: "Camiseta Orquídea", category: "Prendas", tag: "serigrafía", price_cents: 11000000, inventory_count: 2, sort_order: 4, images: [img("orquidea"), img("tote")], description: "Camiseta estampada en serigrafía con nuestra orquídea.", details: "Algodón. Estampado en serigrafía.", options: [{ key: "modelo", label: "Modelo", values: ["Camiseta", "Blusa esqueleto"] }, { key: "talla", label: "Talla", values: ["S", "M", "L", "XL"] }] },
  { ...base, id: "demo-4", slug: "cosmetiquera-pintada", name: "Cosmetiquera pintada", category: "Accesorios", tag: "pintado a mano", price_cents: 4800000, made_to_order: true, sort_order: 5, images: [img("cosmetiquera"), img("llavero")], description: "Cosmetiquera en lona con cierre, pintada a mano por encargo. Cada una es única.", details: "Lona con cierre." },
];
