/** URL base del proyecto Supabase, sin "/rest/v1" ni barras al final (por si se pegó la URL de la API). */
export const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim().replace(/\/+$/, "").replace(/\/(rest|auth)\/v1$/, "");
