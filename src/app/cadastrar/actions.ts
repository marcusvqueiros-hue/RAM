"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { EstadoForm } from "../entrar/actions";

const schema = z.object({
  codigo: z.string().min(1, "Informe o código da equipe"),
  tecnico: z.string().min(1, "Escolha seu nome"),
  novoNome: z.string().trim().max(60).optional(),
  email: z.string().trim().toLowerCase().email("E-mail inválido"),
  senha: z.string().min(8, "A senha precisa ter ao menos 8 caracteres"),
});

export async function cadastrar(_: EstadoForm, fd: FormData): Promise<EstadoForm> {
  const p = schema.safeParse(Object.fromEntries(fd));
  if (!p.success) return { erro: p.error.issues[0].message };
  const { codigo, tecnico, novoNome, email, senha } = p.data;

  // O cadastro é fechado: só entra quem tem o código da equipe (definido em TEAM_SIGNUP_CODE).
  const esperado = process.env.TEAM_SIGNUP_CODE;
  if (!esperado || codigo.trim() !== esperado) return { erro: "Código da equipe inválido." };

  const admin = createAdminClient();

  let tecnicoId = tecnico;
  if (tecnico === "__novo") {
    if (!novoNome || novoNome.length < 2) return { erro: "Informe seu nome." };
    const { data, error } = await admin
      .from("tecnicos")
      .insert({ nome: novoNome })
      .select("id")
      .single();
    if (error) return { erro: "Não foi possível cadastrar este nome (já existe?)." };
    tecnicoId = data.id;
  } else {
    const { data } = await admin
      .from("tecnicos")
      .select("id")
      .eq("id", tecnico)
      .is("user_id", null)
      .eq("ativo", true)
      .maybeSingle();
    if (!data) return { erro: "Este técnico já possui conta ou está inativo." };
  }

  const { data: criado, error: errUser } = await admin.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
  });
  if (errUser || !criado.user) {
    if (tecnico === "__novo") await admin.from("tecnicos").delete().eq("id", tecnicoId);
    return { erro: errUser?.message.includes("already") ? "E-mail já cadastrado." : "Não foi possível criar a conta." };
  }

  // vínculo atômico: só liga se ainda não houver user_id
  const { data: ligado } = await admin
    .from("tecnicos")
    .update({ user_id: criado.user.id })
    .eq("id", tecnicoId)
    .is("user_id", null)
    .select("id");
  if (!ligado?.length) {
    await admin.auth.admin.deleteUser(criado.user.id);
    return { erro: "Este técnico acabou de ser vinculado a outra conta." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
  if (error) redirect("/entrar");
  redirect("/tecnico");
}
