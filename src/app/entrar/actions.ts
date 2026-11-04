"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type EstadoForm = { erro?: string };

const schema = z.object({
  email: z.string().trim().toLowerCase().email("E-mail inválido"),
  senha: z.string().min(1, "Informe a senha"),
});

/** Só aceita caminhos internos — evita open redirect. */
function destinoSeguro(next: FormDataEntryValue | null): string {
  const n = typeof next === "string" ? next : "";
  return n.startsWith("/") && !n.startsWith("//") ? n : "/tecnico";
}

export async function entrar(_: EstadoForm, fd: FormData): Promise<EstadoForm> {
  const p = schema.safeParse({ email: fd.get("email"), senha: fd.get("senha") });
  if (!p.success) return { erro: p.error.issues[0].message };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email: p.data.email, password: p.data.senha });
  if (error) return { erro: "E-mail ou senha incorretos." };
  redirect(destinoSeguro(fd.get("next")));
}

export async function sair() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
