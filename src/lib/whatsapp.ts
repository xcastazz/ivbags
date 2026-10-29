import { formatAddress, type Shipping } from "./colombia";
import { money } from "./format";
import { ORDER_STATUS, type OrderStatus } from "./types";

/** Mensajes de WhatsApp: *negrita* y saltos de línea, que WhatsApp muestra con formato. */

const OPTION_LABELS: Record<string, string> = { petName: "Nombre de la mascota", pets: "Mascotas" };
const SEP = "━━━━━━━━━━━━";

/** Une las partes del mensaje: ignora las vacías (false/undefined/null) y deja máximo una línea en blanco seguida. */
function compose(parts: unknown[]) {
  return parts.filter((x): x is string => typeof x === "string").join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

/** "tamano: Mediano, petName: Lola" → "Tamaño: Mediano · Nombre de la mascota: Lola" */
export function describeOptions(options?: Record<string, unknown> | null) {
  return Object.entries(options ?? {})
    .filter(([k, v]) => v !== undefined && v !== null && v !== "" && !(k === "pets" && Number(v) <= 1))
    .map(([k, v]) => k === "photos" && Array.isArray(v) ? `Fotos: ${v.join(" ")}` : `${OPTION_LABELS[k] ?? k}: ${v}`)
    .join(" · ");
}

export type MsgLine = { name: string; qty: number; unitCents: number; options?: Record<string, unknown> | null };

function itemsBlock(lines: MsgLine[]) {
  return lines.map((l) => {
    const opts = describeOptions(l.options);
    return `• ${l.qty} × *${l.name}* — ${money(l.unitCents * l.qty)}${opts ? `\n   ${opts}` : ""}`;
  }).join("\n");
}

function shippingBlock(s: Partial<Shipping> & { address?: string }) {
  const address = s.address ?? formatAddress(s as Shipping);
  return compose([
    `Nombre: ${s.name ?? ""}`,
    s.idNumber && `Documento: ${s.idType ?? "CC"} ${s.idNumber}`,
    s.phone && `Celular: ${s.phone}`,
    s.email && `Correo: ${s.email}`,
    `Dirección: ${address}`,
    s.placeType && `Tipo de lugar: ${s.placeType}`,
    s.reference && `Indicaciones: ${s.reference}`,
    s.recipientIsMe === false && s.recipientName && `Recibe: ${s.recipientName}${s.recipientPhone ? ` (${s.recipientPhone})` : ""}`,
  ]);
}

/** De la persona al taller, después de comprar: todo para coordinar pago y envío. */
export function orderToShop(o: { number: number | null; lines: MsgLine[]; subtotalCents: number; shippingCents: number; totalCents: number; shipping: Partial<Shipping> & { address?: string }; payment?: string; notes?: string }) {
  return compose([
    `¡Hola, IV Bags! 🌼`,
    o.number ? `Acabo de hacer el pedido *#${o.number}* en la tienda y quiero coordinar el pago.` : `Quiero hacer este pedido desde la tienda:`,
    "",
    `*🛍️ Mi pedido*`,
    itemsBlock(o.lines),
    SEP,
    `Subtotal: ${money(o.subtotalCents)}`,
    `Envío: ${o.shippingCents ? money(o.shippingCents) : "por coordinar"}`,
    `*Total: ${money(o.totalCents)}*`,
    "",
    `*📦 Datos de envío*`,
    shippingBlock(o.shipping),
    "",
    o.payment && `*💳 Forma de pago:* ${o.payment}`,
    o.notes && `*📝 Notas:* ${o.notes}`,
    "",
    `¿Me envían los datos para pagar? ¡Gracias! ✨`,
  ]);
}

/** Pregunta sobre una pieza, con lo que la persona ya eligió. */
export function productQuestion(p: { name: string; priceCents: number; category: string; options?: Record<string, string>; qty?: number; url: string; available: string }) {
  const opts = describeOptions(p.options);
  return compose([
    `¡Hola, IV Bags! 🌼`,
    `Tengo una pregunta sobre esta pieza:`,
    "",
    `*${p.name}* (${p.category})`,
    `Precio: ${money(p.priceCents)}`,
    `Disponibilidad: ${p.available}`,
    opts && `Lo que elegí: ${opts}`,
    p.qty && p.qty > 1 && `Cantidad: ${p.qty}`,
    p.url,
    "",
    `Mi pregunta es: `,
  ]);
}

/** Cotización de un bolso personalizado. */
export function customIdea(r: { name: string; phone: string; email?: string; idea: string; photos?: string[] }) {
  return compose([
    `¡Hola, IV Bags! 🌼`,
    `Quiero cotizar un *bolso personalizado pintado a mano* (tela beige).`,
    "",
    `*💡 Mi idea*`,
    `“${r.idea}”`,
    r.photos?.length && `*📷 Fotos de referencia*\n${r.photos.join("\n")}`,
    "",
    `*👤 Mis datos*`,
    `Nombre: ${r.name}`,
    `WhatsApp: ${r.phone}`,
    r.email && `Correo: ${r.email}`,
    "",
    `Puedo enviarles fotos o referencias por aquí. ¡Gracias!`,
  ]);
}

/** Mensaje desde la página de contacto. */
export function contactMessage(m: { name: string; contact: string; message: string }) {
  return compose([`¡Hola, IV Bags! 🌼`, `Soy *${m.name}* (${m.contact}).`, "", m.message]);
}

const STATUS_NOTE: Record<OrderStatus, string> = {
  new: "Recibimos tu pedido. Para empezar, te compartimos los datos de pago:",
  quoted: "Te compartimos la cotización de tu pedido:",
  confirmed: "¡Recibimos tu pago! 🙌 Ya quedó confirmado y pronto empezamos a hacerlo.",
  in_production: "Tu pedido ya está en el taller y lo estamos haciendo a mano ✂️🎨.",
  shipped: "¡Tu pedido va en camino! 🚚",
  completed: "Tu pedido aparece como entregado. ¡Esperamos que lo disfrutes mucho!",
  cancelled: "Tu pedido quedó cancelado. Si fue un error, escríbenos y lo revisamos.",
};

/** Del taller a la persona, desde el admin, según el estado del pedido. */
export function orderToCustomer(o: { number: number; name: string; status: OrderStatus; lines: MsgLine[]; totalCents: number; shippingCents: number; address?: string; paymentInstructions?: string }) {
  return compose([
    `¡Hola, ${o.name.split(" ")[0]}! 🌼 Te escribimos de *IV Bags* sobre tu pedido *#${o.number}*.`,
    "",
    STATUS_NOTE[o.status],
    o.status === "new" && o.paymentInstructions,
    "",
    `*🛍️ Tu pedido*`,
    itemsBlock(o.lines),
    SEP,
    o.shippingCents > 0 && `Envío: ${money(o.shippingCents)}`,
    `*Total: ${money(o.totalCents)}*`,
    o.address && "",
    o.address && `*📦 Envío a:* ${o.address}`,
    "",
    `Estado: *${ORDER_STATUS[o.status]}*`,
    `Cualquier duda, nos escribes por aquí. ✨`,
  ]);
}

/** Del taller a la persona que pidió un personalizado. */
export function requestReply(r: { name: string; message: string }) {
  return compose([
    `¡Hola, ${r.name.split(" ")[0]}! 🌼 Te escribimos de *IV Bags*.`,
    `Recibimos tu idea para un bolso personalizado:`,
    `“${r.message}”`,
    "",
    `Nos encantaría hacerla. Para cotizarla, ¿nos cuentas el tamaño que prefieres y nos mandas una foto o referencia si tienes? ✨`,
  ]);
}
