import "server-only";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "./url";

/**
 * Cliente con la service role key: salta las reglas de seguridad (RLS).
 * Solo para el servidor (pagos y webhooks), nunca en el navegador.
 */
export function createAdminClient() {
  const url = SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
