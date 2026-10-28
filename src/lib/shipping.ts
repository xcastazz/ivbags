/** Tarifas de envío por zona. La base de datos (public.shipping_for) cobra con estas mismas reglas. */
export const SHIPPING_RATES = {
  medellin: { cents: 1_200_000, label: "Medellín · domiciliario" },
  metro: { cents: 1_500_000, label: "Bello, Itagüí, Sabaneta o Envigado" },
  national: { cents: 1_800_000, label: "Nacional · transportadora" },
} as const;

const METRO = ["bello", "itagui", "sabaneta", "envigado"];
const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();

export function shippingZone(city: string, department: string): keyof typeof SHIPPING_RATES | null {
  if (!city.trim() || !department.trim()) return null;
  if (norm(department) === "antioquia") {
    const c = norm(city);
    if (c === "medellin") return "medellin";
    if (METRO.includes(c)) return "metro";
  }
  return "national";
}
