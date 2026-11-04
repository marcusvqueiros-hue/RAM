import "server-only";
import { cache } from "react";
import { createClient } from "./supabase/server";
import type { Tecnico } from "./tipos";

/** Usuário logado + ficha de técnico (quando existir). Memoizado por requisição. */
export const getSessao = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { user: null, tecnico: null as Tecnico | null };
  const { data } = await supabase
    .from("ram_tecnicos")
    .select("id, nome, user_id, papel, ativo")
    .eq("user_id", user.id)
    .maybeSingle<Tecnico>();
  return { user, tecnico: data };
});
