"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { destinoPadrao, emailDeLogin } from "@/lib/usuario";

export type EstadoForm = { erro?: string };

const schema = z.object({
  usuario: z.string().trim().min(2, "Informe o usuário").max(120),
  senha: z.string().min(1, "Informe a senha"),
});

/** Só aceita caminhos internos — evita open redirect. */
function destinoSeguro(next: FormDataEntryValue | null): string | null {
  const n = typeof next === "string" ? next : "";
  return n.startsWith("/") && !n.startsWith("//") ? n : null;
}

export async function entrar(_: EstadoForm, fd: FormData): Promise<EstadoForm> {
  const p = schema.safeParse({ usuario: fd.get("usuario"), senha: fd.get("senha") });
  if (!p.success) return { erro: p.error.issues[0].message };
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: emailDeLogin(p.data.usuario),
    password: p.data.senha,
  });
  if (error) return { erro: "Usuário ou senha incorretos." };
  const { data: t } = await supabase.from("ram_tecnicos").select("papel, ativo").eq("user_id", data.user.id).maybeSingle();
  redirect(destinoSeguro(fd.get("next")) ?? destinoPadrao(t));
}

export async function sair() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
