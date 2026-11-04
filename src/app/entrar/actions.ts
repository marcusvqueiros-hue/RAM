"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { emailDeLogin } from "@/lib/usuario";

export type EstadoForm = { erro?: string };

const schema = z.object({
  usuario: z.string().trim().min(2, "Informe o usuário").max(120),
  senha: z.string().min(1, "Informe a senha"),
});

/** Só aceita caminhos internos — evita open redirect. */
function destinoSeguro(next: FormDataEntryValue | null): string {
  const n = typeof next === "string" ? next : "";
  return n.startsWith("/") && !n.startsWith("//") ? n : "/tecnico";
}

export async function entrar(_: EstadoForm, fd: FormData): Promise<EstadoForm> {
  const p = schema.safeParse({ usuario: fd.get("usuario"), senha: fd.get("senha") });
  if (!p.success) return { erro: p.error.issues[0].message };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: emailDeLogin(p.data.usuario),
    password: p.data.senha,
  });
  if (error) return { erro: "Usuário ou senha incorretos." };
  redirect(destinoSeguro(fd.get("next")));
}

export async function sair() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
