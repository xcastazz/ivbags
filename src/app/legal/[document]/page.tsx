import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/store/logo";

/** Un bloque es un párrafo (texto) o una lista (arreglo de textos). */
type Block = string | string[];
type Doc = { title: string; intro?: string; sections: { h: string; body: Block[] }[]; since: string };

const SINCE = "Vigentes desde el 28 de octubre de 2026.";
const EMAIL = "ivbags.taller@gmail.com";
const WA = "313 326 4049";
const OWNER = "Eva Cano González, identificada con cédula 1037119825, con domicilio en Medellín, Antioquia";

const documents: Record<string, Doc> = {
  terminos: {
    title: "Términos y condiciones",
    since: SINCE,
    sections: [
      { h: "1. Aceptación", body: ["Al navegar en ivbagss.com o hacer un pedido, aceptas estos términos. Si no estás de acuerdo con ellos, te pedimos no usar el sitio."] },
      { h: "2. Quiénes somos", body: [`IV Bags es un taller artesanal familiar de Medellín, Colombia, donde tres mujeres hacemos bolsos, prendas y accesorios a mano. La responsable es ${OWNER}. Puedes escribirnos a ${EMAIL} o al WhatsApp ${WA}.`] },
      { h: "3. Productos hechos a mano", body: ["Cada pieza se pinta, se borda o se estampa en serigrafía de forma artesanal. Por eso puede haber pequeñas diferencias de color, trazo o detalle frente a las fotos. Estas variaciones no son defectos y hacen parte de la esencia de cada pieza."] },
      { h: "4. Disponibilidad", body: ["Cada producto indica si está Listo para enviar o es Hecho por encargo. Los productos listos se despachan 1 día hábil después de confirmado el pago. Los hechos por encargo están listos 2 semanas después del pago. Si la talla que eliges no está en inventario, tu pedido pasa a ser hecho por encargo."] },
      { h: "5. Precios y pagos", body: ["Los precios están en pesos colombianos. El pago se hace completo al momento del pedido, a través de Wompi, nuestra pasarela de pago. Tu pedido queda confirmado cuando verificamos el pago. Si un precio aparece con un error evidente, te contactaremos antes de procesar el pedido para que decidas si lo mantienes o lo cancelas con reembolso total."] },
      { h: "6. Pedidos personalizados", body: ["Solo personalizamos bolsos, y solo en tela beige. Al enviarnos fotos, nombres o ideas, confirmas que tienes derecho a usarlos. Podemos rechazar diseños ofensivos o que usen marcas, logos o personajes de terceros. Los productos personalizados no tienen cambio ni devolución, salvo que lleguen con un defecto de fabricación."] },
      { h: "7. Propiedad intelectual", body: ["Las ilustraciones, diseños, fotos y textos del sitio son de IV Bags. No se pueden copiar, reproducir ni vender sin nuestra autorización escrita. Comprar un producto no da derechos sobre el diseño."] },
      { h: "8. Derecho de retracto", body: ["Como la compra se hace a distancia, tienes 5 días hábiles desde que recibes el producto para retractarte, según el artículo 47 de la Ley 1480 de 2011. El producto debe estar sin uso, sin lavar y en su empaque original, y los costos de devolución corren por tu cuenta. Te devolvemos el dinero en un plazo máximo de 30 días calendario. El retracto solo aplica a los productos Listos para enviar. No aplica a productos hechos por encargo ni personalizados."] },
      { h: "9. Reversión del pago", body: ["Si pagaste con tarjeta o medio electrónico y fuiste víctima de fraude, la compra no se solicitó, el producto no llegó o no corresponde a lo pedido, puedes pedir la reversión del pago según el artículo 51 de la Ley 1480. Debes avisarnos y avisar a tu banco dentro de los 5 días hábiles siguientes a conocer el hecho."] },
      { h: "10. Cambios, garantías y envíos", body: ["Se rigen por la Política de envíos y la Política de cambios, devoluciones y garantías de este sitio."] },
      { h: "11. Datos personales", body: ["Tratamos tus datos según nuestra Política de tratamiento de datos personales y privacidad."] },
      { h: "12. Ley aplicable", body: ["Estos términos se rigen por las leyes de Colombia. La autoridad de protección al consumidor es la Superintendencia de Industria y Comercio."] },
      { h: "13. Cambios a estos términos", body: ["Podemos actualizar estos términos. La versión vigente es la publicada en el sitio, con su fecha. Cada pedido se rige por los términos vigentes el día en que se hizo."] },
    ],
  },
  privacidad: {
    title: "Política de tratamiento de datos personales y privacidad",
    intro: "En IV Bags cuidamos tus datos personales y los tratamos según la Ley 1581 de 2012 y el Decreto 1377 de 2013, hoy incluido en el Decreto 1074 de 2015.",
    since: "Vigente desde el 28 de octubre de 2026.",
    sections: [
      { h: "1. Responsable del tratamiento", body: [`IV Bags, representada por ${OWNER}, Colombia. Somos responsables de los datos que recogemos en la página web, por WhatsApp, en redes sociales y en ferias. Para cualquier solicitud o duda escríbenos a ${EMAIL}.`] },
      { h: "2. Datos que recolectamos", body: [[
        "Nombre y apellidos.",
        "Correo electrónico y número de teléfono.",
        "Dirección de envío.",
        "Detalles del pago. Los datos de tarjetas los procesa directamente Wompi, nuestra pasarela de pago; nosotras no los guardamos.",
        "Fotos, nombres y textos que nos envías para un pedido personalizado.",
        "Datos de navegación que se obtienen con cookies y tecnologías similares.",
      ]] },
      { h: "3. Para qué usamos tus datos", body: [[
        "Procesar, elaborar y entregar tus pedidos.",
        "Gestionar los pagos.",
        "Atender tus preguntas, cambios y garantías.",
        "Enviarte novedades y promociones, solo si lo autorizas. Puedes dejar de recibirlas cuando quieras.",
        "Mejorar tu experiencia en el sitio web.",
        "Tener una base de datos de nuestros clientes.",
        "Cumplir obligaciones legales, contables y tributarias.",
      ]] },
      { h: "4. Cookies", body: ["Usamos cookies y tecnologías similares para saber cómo se navega en el sitio, recordar tu bolsa de compras y mejorar la página. Puedes bloquearlas o borrarlas desde tu navegador, aunque algunas funciones podrían dejar de servir."] },
      { h: "5. Autorización", body: ["Al marcar la casilla de aceptación, enviar un formulario o hacer un pedido, nos autorizas a tratar tus datos para las finalidades de esta política."] },
      { h: "6. Fotos de pedidos personalizados con mascotas", body: [
        "Las fotos de tu mascota que nos envías se usan para elaborar tu pedido. Al hacer un pedido personalizado con mascota, aceptas que publiquemos fotos del producto terminado en nuestra página, redes sociales, catálogos y ferias. Las usamos como referencia para mostrar a otras personas cómo es la personalización. Nunca publicamos tus datos de contacto junto a esas fotos.",
        `Si no quieres que usemos la foto de tu mascota ni la de tu pedido, dínoslo al hacer el pedido o escríbenos en cualquier momento a ${EMAIL}. Si ya está publicada, la retiramos de nuestros canales en un plazo máximo de 15 días hábiles. No podemos controlar las copias que otras personas hayan hecho antes del retiro.`,
      ] },
      { h: "7. Protección de tus datos", body: ["Aplicamos medidas técnicas, humanas y administrativas para que personas no autorizadas no puedan ver, cambiar, perder o usar tus datos. Los guardamos en un entorno seguro y solo el personal autorizado del taller tiene acceso a ellos."] },
      { h: "8. Conservación", body: ["Guardamos tus datos mientras sean necesarios para las finalidades de esta política y durante el tiempo que exijan las normas contables y tributarias. Después los eliminamos de forma segura."] },
      { h: "9. Datos compartidos con terceros", body: ["Para cumplir tu pedido compartimos algunos datos con terceros de confianza: la pasarela de pago Wompi, las transportadoras Coordinadora e Interrapidísimo y los servicios que usamos para el sitio web y el correo. Solo compartimos lo necesario para cada servicio. Cada uno tiene su propia política de protección de datos, que puedes consultar en su página. También entregamos datos a autoridades cuando la ley lo exige. Nunca vendemos tus datos."] },
      { h: "10. Tus derechos", body: ["Como titular de tus datos puedes:", [
        "Conocer, actualizar y corregir tus datos.",
        "Pedir prueba de la autorización que nos diste.",
        "Saber cómo hemos usado tus datos.",
        "Pedir que eliminemos uno o todos tus datos, o retirar tu autorización, cuando no tengamos un deber legal de conservarlos.",
        "Pedir que no usemos la foto de tu mascota ni la de tu pedido personalizado.",
        "Acceder gratis a tus datos.",
        "Presentar quejas ante la Superintendencia de Industria y Comercio, después de haber hecho tu solicitud con nosotras.",
      ]] },
      { h: "11. Cómo hacer una solicitud", body: [`Escríbenos a ${EMAIL} con tu nombre, tu correo o teléfono y lo que necesitas. Respondemos las consultas en máximo 10 días hábiles y los reclamos en máximo 15 días hábiles. Si necesitamos más tiempo, te avisamos el motivo y la nueva fecha.`] },
      { h: "12. Cambios en esta política", body: ["Podemos actualizar esta política. La versión vigente es la publicada en el sitio, con su fecha. Si hay cambios importantes, los anunciaremos en la página o por correo."] },
      { h: "13. Contacto", body: [`Si tienes cualquier duda sobre tus datos, escríbenos a ${EMAIL} o al WhatsApp ${WA}.`] },
    ],
  },
  envios: {
    title: "Política de envíos",
    since: "Vigente desde el 28 de octubre de 2026.",
    sections: [
      { h: "1. Cobertura", body: ["Hacemos envíos a todo Colombia con Coordinadora e Interrapidísimo."] },
      { h: "2. Tiempos de preparación", body: [[
        "Listo para enviar: se despacha 1 día hábil después de confirmado el pago.",
        "Hecho por encargo: está listo 2 semanas después del pago.",
        "Personalizados con mascota: están listos 2 semanas después del pago.",
      ], "A estos tiempos se suma el tiempo de transporte, que es de 2 a 5 días hábiles según la ciudad. Si tu pedido mezcla productos listos y por encargo, lo enviamos completo cuando todo esté listo, salvo que acordemos otra cosa."] },
      { h: "3. Costo del envío", body: ["El valor del envío se calcula según tu ciudad y se paga junto con tu pedido, al momento de hacer el pago:", ["Medellín (domiciliario): $12.000.", "Bello, Itagüí, Sabaneta y Envigado: $15.000.", "Resto del país (transportadora): $18.000."]] },
      { h: "4. Seguimiento", body: ["Cuando despachamos tu pedido te enviamos el número de guía por WhatsApp o correo para que puedas rastrearlo."] },
      { h: "5. Dirección de entrega", body: ["Revisa bien tus datos de envío antes de pagar. Si el paquete se devuelve por una dirección incorrecta o porque nadie lo recibió, el nuevo envío corre por tu cuenta."] },
      { h: "6. Al recibir tu pedido", body: [`Revisa el paquete apenas llegue. Si viene dañado o con algo distinto a lo que compraste, envíanos fotos o videos al WhatsApp ${WA} o a ${EMAIL}, como explica nuestra Política de cambios, devoluciones y garantías.`] },
      { h: "7. Retrasos", body: ["Si la transportadora se demora por causas ajenas a nosotras, te ayudamos a hacer el seguimiento hasta que recibas tu pedido."] },
    ],
  },
  "cambios-y-devoluciones": {
    title: "Política de cambios, devoluciones y garantías",
    since: "Vigente desde el 28 de octubre de 2026.",
    sections: [
      { h: "1. Piezas hechas a mano", body: ["Cada producto de IV Bags se pinta, se borda o se estampa en serigrafía a mano. Por eso es probable que no todas las piezas queden exactamente iguales. Puede haber pequeñas diferencias en los colores que ves en las fotos, en el trazo o en los detalles del estampado, el bordado o la pintura. Siempre buscamos que tu pieza sea lo más parecida posible a la foto, pero esas pequeñas diferencias hacen parte de la esencia de lo hecho a mano y no se consideran defectos."] },
      { h: "2. Productos defectuosos o incorrectos", body: [`Si recibes un producto en mal estado, con un error de fabricación, muy diferente a lo prometido o distinto a lo que compraste, tienes 30 días calendario desde que lo recibes para avisarnos. Envíanos fotos o videos al WhatsApp ${WA} o a ${EMAIL} para revisar tu caso. Según lo que encontremos, reparamos el producto, lo cambiamos por uno igual o equivalente, o te devolvemos el dinero. En estos casos nosotras cubrimos el envío.`] },
      { h: "3. Lo que no cubre la garantía", body: [[
        "Daños por uso inadecuado.",
        "Desgaste natural por el uso.",
        "Daños por no seguir las instrucciones de cuidado.",
        "Manipulación incorrecta del producto.",
        "Las variaciones propias del trabajo artesanal descritas en el punto 1.",
      ]] },
      { h: "4. Cambios por talla o referencia", body: ["Puedes cambiar la talla o la referencia dentro de los 15 días calendario siguientes a recibir tu pedido. La pieza debe estar sin uso, sin lavar, con sus etiquetas y en su empaque original. El cambio depende de la disponibilidad; si la talla o referencia no está en inventario, se hace por encargo. Si el nuevo producto cuesta más, pagas la diferencia.", [
        "Si el error fue nuestro, nosotras cubrimos los envíos.",
        "Si fue un error o un cambio de decisión tuyo, tú cubres todos los gastos de envío, de ida y de vuelta.",
      ]] },
      { h: "5. Productos sin cambio", body: ["No tienen cambio por talla, referencia o gusto:", [
        "Los productos personalizados, incluidos los bolsos con mascota.",
        "Los productos en descuento.",
        "Los productos que se vendieron aclarando que tenían detalles.",
      ], "Si alguno de estos productos llega con un defecto que no te informamos, sí aplica la garantía del punto 2."] },
      { h: "6. Derecho de retracto", body: ["En productos Listos para enviar tienes 5 días hábiles desde que los recibes para retractarte de la compra, como explican nuestros Términos y condiciones."] },
      { h: "7. Reembolsos", body: ["Cuando un reembolso es aprobado, lo hacemos por el medio que acordemos contigo, a una cuenta a nombre de quien hizo la compra. Lo hacemos en un plazo máximo de 30 días calendario desde que aprobamos la solicitud."] },
      { h: "8. Cómo pedir un cambio o una garantía", body: [`Escríbenos a ${EMAIL} con:`, [
        "Tu nombre.",
        "El número del pedido.",
        "El producto.",
        "El motivo de la solicitud.",
        "Fotos o videos del producto.",
      ], `Te respondemos en máximo 5 días hábiles con los pasos a seguir. Si tienes dudas, también puedes escribirnos al WhatsApp ${WA}.`] },
    ],
  },
};

const OTHERS: [string, string][] = [["terminos", "Términos y condiciones"], ["privacidad", "Privacidad"], ["envios", "Envíos"], ["cambios-y-devoluciones", "Cambios y devoluciones"]];

export function generateStaticParams() {
  return [...Object.keys(documents), "envios-y-devoluciones", "cookies"].map((document) => ({ document }));
}

export async function generateMetadata({ params }: PageProps<"/legal/[document]">): Promise<Metadata> {
  const { document } = await params;
  const item = documents[document];
  return item ? { title: `${item.title} | IV Bags` } : {};
}

export default async function LegalDocumentPage({ params }: PageProps<"/legal/[document]">) {
  const { document } = await params;
  // Enlaces viejos.
  if (document === "envios-y-devoluciones") redirect("/legal/cambios-y-devoluciones");
  if (document === "cookies") redirect("/legal/privacidad#cookies");
  const item = documents[document];
  if (!item) notFound();
  return (
    <main className="legal-page">
      <Link className="brand" href="/" aria-label="IV Bags, inicio"><Logo height={48} /></Link>
      <article>
        <p className="eyebrow">Información importante</p>
        <h1>{item.title}</h1>
        {item.intro && <p className="legal-intro">{item.intro}</p>}
        {item.sections.map(({ h, body }) => (
          <section key={h} id={h.toLowerCase().includes("cookies") ? "cookies" : undefined}>
            <h2>{h}</h2>
            {body.map((b, i) => (typeof b === "string" ? <p key={i}>{b}</p> : <ul key={i}>{b.map((li) => <li key={li}>{li}</li>)}</ul>))}
          </section>
        ))}
        <p className="legal-since">{item.since}</p>
        <nav className="legal-nav" aria-label="Otras políticas">{OTHERS.filter(([k]) => k !== document).map(([k, l]) => <Link key={k} href={`/legal/${k}`}>{l}</Link>)}</nav>
      </article>
    </main>
  );
}
