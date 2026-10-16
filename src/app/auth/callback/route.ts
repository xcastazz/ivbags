import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/** Recibe los enlaces de los correos de Supabase (código PKCE o token_hash) y abre la sesión. */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const requested = params.get("next");
  const next = requested && /^\/(?!\/)/.test(requested) ? requested : "/cuenta/completar-perfil";
  const supabase = await createClient();
  let failed = !supabase;

  const code = params.get("code");
  const tokenHash = params.get("token_hash");
  const type = params.get("type") as EmailOtpType | null;
  if (supabase && code) failed = Boolean((await supabase.auth.exchangeCodeForSession(code)).error);
  else if (supabase && tokenHash && type) failed = Boolean((await supabase.auth.verifyOtp({ token_hash: tokenHash, type })).error);
  else failed = true;

  if (failed) return NextResponse.redirect(new URL("/iniciar-sesion?error=enlace", request.url));
  return NextResponse.redirect(new URL(type === "recovery" ? "/cuenta/completar-perfil" : next, request.url));
}
