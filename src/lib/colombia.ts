/** Departamentos de Colombia y sus ciudades principales (sugerencias; se puede escribir cualquier municipio). */
export const DEPARTMENTS: Record<string, string[]> = {
  "Amazonas": ["Leticia", "Puerto Nariño"],
  "Antioquia": ["Medellín", "Bello", "Envigado", "Itagüí", "Sabaneta", "La Estrella", "Caldas", "Copacabana", "Girardota", "Rionegro", "La Ceja", "Marinilla", "El Retiro", "Guarne", "Santa Fe de Antioquia", "Apartadó", "Turbo", "Caucasia"],
  "Arauca": ["Arauca", "Saravena", "Tame"],
  "Atlántico": ["Barranquilla", "Soledad", "Malambo", "Puerto Colombia", "Sabanalarga"],
  "Bogotá D.C.": ["Bogotá"],
  "Bolívar": ["Cartagena", "Magangué", "Turbaco", "El Carmen de Bolívar"],
  "Boyacá": ["Tunja", "Duitama", "Sogamoso", "Chiquinquirá", "Paipa", "Villa de Leyva"],
  "Caldas": ["Manizales", "Villamaría", "Chinchiná", "La Dorada", "Riosucio"],
  "Caquetá": ["Florencia", "San Vicente del Caguán"],
  "Casanare": ["Yopal", "Aguazul", "Villanueva"],
  "Cauca": ["Popayán", "Santander de Quilichao", "Puerto Tejada"],
  "Cesar": ["Valledupar", "Aguachica", "Codazzi"],
  "Chocó": ["Quibdó", "Istmina", "Bahía Solano"],
  "Córdoba": ["Montería", "Cereté", "Sahagún", "Lorica"],
  "Cundinamarca": ["Soacha", "Chía", "Zipaquirá", "Facatativá", "Fusagasugá", "Mosquera", "Madrid", "Funza", "Cajicá", "Girardot", "La Calera", "Sopó", "Tocancipá"],
  "Guainía": ["Inírida"],
  "Guaviare": ["San José del Guaviare"],
  "Huila": ["Neiva", "Pitalito", "Garzón", "La Plata"],
  "La Guajira": ["Riohacha", "Maicao", "Uribia"],
  "Magdalena": ["Santa Marta", "Ciénaga", "Fundación"],
  "Meta": ["Villavicencio", "Acacías", "Granada", "Puerto López"],
  "Nariño": ["Pasto", "Tumaco", "Ipiales"],
  "Norte de Santander": ["Cúcuta", "Ocaña", "Pamplona", "Villa del Rosario", "Los Patios"],
  "Putumayo": ["Mocoa", "Puerto Asís"],
  "Quindío": ["Armenia", "Calarcá", "Montenegro", "Quimbaya", "Salento"],
  "Risaralda": ["Pereira", "Dosquebradas", "Santa Rosa de Cabal", "La Virginia"],
  "San Andrés y Providencia": ["San Andrés", "Providencia"],
  "Santander": ["Bucaramanga", "Floridablanca", "Girón", "Piedecuesta", "Barrancabermeja", "San Gil"],
  "Sucre": ["Sincelejo", "Corozal", "Tolú"],
  "Tolima": ["Ibagué", "Espinal", "Melgar", "Honda"],
  "Valle del Cauca": ["Cali", "Palmira", "Buenaventura", "Tuluá", "Buga", "Cartago", "Jamundí", "Yumbo"],
  "Vaupés": ["Mitú"],
  "Vichada": ["Puerto Carreño"],
};

export const STREET_TYPES = ["Calle", "Carrera", "Avenida", "Avenida Calle", "Avenida Carrera", "Transversal", "Diagonal", "Circular", "Autopista", "Kilómetro", "Vereda"];
export const PLACE_TYPES = ["Casa", "Apartamento", "Oficina", "Local", "Finca"];
export const ID_TYPES = ["CC", "CE", "TI", "PP", "NIT"];

export type Shipping = {
  name: string; phone: string; email: string; idType: string; idNumber: string;
  department: string; city: string; neighborhood: string;
  streetType: string; streetNumber: string; crossNumber: string; plate: string; street: string;
  placeType: string; complement: string; reference: string; postalCode: string;
  recipientIsMe: boolean; recipientName: string; recipientPhone: string; save?: boolean;
};

/** "Calle 57A # 90 - 18" a partir de las partes de la dirección. */
export function formatStreet(s: Pick<Shipping, "streetType" | "streetNumber" | "crossNumber" | "plate">) {
  if (!s.streetNumber) return "";
  if (s.streetType === "Kilómetro" || s.streetType === "Vereda") return `${s.streetType} ${s.streetNumber}${s.crossNumber ? ` ${s.crossNumber}` : ""}`.trim();
  return `${s.streetType} ${s.streetNumber.toUpperCase()}${s.crossNumber ? ` # ${s.crossNumber.toUpperCase()}` : ""}${s.plate ? ` - ${s.plate}` : ""}`;
}

/** Dirección completa en una línea, como la escribiría una transportadora. */
export function formatAddress(s: Shipping) {
  return [formatStreet(s), s.complement, s.neighborhood && `Barrio ${s.neighborhood}`, s.city, s.department].filter(Boolean).join(", ");
}
