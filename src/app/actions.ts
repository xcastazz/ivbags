"use server";

import { updateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const TAGS = ["products", "content", "posts", "videos"] as const;

/** El admin llama esto después de guardar para que la tienda muestre los cambios de inmediato. Nunca lanza errores. */
export async function refreshStore(tags: (typeof TAGS)[number][]): Promise<{ ok: boolean; reason?: string }> {
  try {
    const supabase = await createClient();
    if (!supabase) return { ok: false, reason: "sin-supabase" };
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, reason: "sin-sesion" };
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (profile?.role !== "admin") return { ok: false, reason: "no-admin" };
    tags.filter((t) => TAGS.includes(t)).forEach((t) => updateTag(t));
    return { ok: true };
  } catch (e) {
    console.error("refreshStore", e);
    return { ok: false, reason: "error" };
  }
}
