import { notFound } from "next/navigation";
import Link from "next/link";

const documents = {
  privacidad: {
    title: "Politica de privacidad",
    sections: [
      ["Responsable", "ivbags debe completar antes de publicar: razon social, NIT, domicilio, correo de contacto y canal para solicitudes sobre datos personales."],
      ["Datos que tratamos", "Nombre, correo, telefono, direccion de entrega, preferencias de producto y datos necesarios para atender pedidos, pagos, garantias y solicitudes de personalizacion."],
      ["Finalidades", "Usamos los datos para procesar compras, enviar actualizaciones de pedidos, atender PQR, prevenir fraude y, con autorizacion, compartir novedades del taller."],
      ["Tus derechos", "Puedes conocer, actualizar, corregir o solicitar la supresion de tus datos, y revocar autorizaciones no obligatorias. Escribe al canal de privacidad que ivbags publique aqui."],
    ],
  },
  terminos: {
    title: "Terminos y condiciones",
    sections: [
      ["Pedidos hechos a mano", "Las piezas se elaboran artesanalmente. Variaciones menores de color, trazo o ubicacion son parte natural del proceso y se muestran antes de confirmar encargos personalizados."],
      ["Precios y pagos", "Los precios se expresan en pesos colombianos e incluyen o excluyen impuestos segun se informe al cierre de compra. El pedido se confirma tras validacion del pago y disponibilidad."],
      ["Personalizados", "Los encargos personalizados requieren aprobacion escrita del diseno, precio y fecha de entrega. No se inicia produccion sin dicha confirmacion."],
      ["Propiedad intelectual", "Las ilustraciones, fotografias y marca de ivbags no pueden reproducirse ni usarse comercialmente sin autorizacion previa."],
    ],
  },
  "envios-y-devoluciones": {
    title: "Envios, cambios y devoluciones",
    sections: [
      ["Tiempos", "El tiempo de preparacion y entrega se informa antes de pagar. Los encargos hechos a mano pueden tener plazos distintos de los productos listos para enviar."],
      ["Cambios", "Antes de publicar, ivbags debe completar este apartado con los plazos reales, condiciones de producto sin uso y el canal de solicitud, conforme a la normativa aplicable."],
      ["Retracto y garantia", "Las excepciones legales para bienes personalizados y los procedimientos de garantia deben revisarse con asesoria legal local y comunicarse con claridad antes del pago."],
    ],
  },
  cookies: {
    title: "Politica de cookies",
    sections: [
      ["Cookies esenciales", "Usamos cookies necesarias para mantener la sesion, seguridad y funcionamiento de la tienda."],
      ["Analitica y marketing", "No se deben activar herramientas de analitica o publicidad sin informar su finalidad, proveedores y mecanismo de consentimiento cuando sea exigible."],
      ["Gestion", "Puedes controlar cookies desde tu navegador. Al implementar un gestor de consentimiento, esta politica debe reflejar las categorias y proveedores activos."],
    ],
  },
} as const;

export function generateStaticParams() {
  return Object.keys(documents).map((document) => ({ document }));
}

export default async function LegalDocumentPage({ params }: PageProps<"/legal/[document]">) {
  const { document } = await params;
  const item = documents[document as keyof typeof documents];
  if (!item) notFound();
  return <main className="legal-page"><Link className="brand" href="/"><span>iV</span>bags</Link><article><p className="eyebrow">informacion importante</p><h1>{item.title}</h1><p className="legal-note">Plantilla pendiente de completar y revisar con asesoria juridica local antes de su publicacion comercial.</p>{item.sections.map(([heading, copy]) => <section key={heading}><h2>{heading}</h2><p>{copy}</p></section>)}</article></main>;
}
