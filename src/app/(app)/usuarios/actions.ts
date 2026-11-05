"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessao } from "@/lib/sessao";
import { mesAtual } from "@/lib/datas";
import { emailDeLogin } from "@/lib/usuario";

export type EstadoUsuario = { erro?: string; ok?: string; credencial?: { usuario: string; senha: string }; ts?: number };

const PERFIS = ["tecnico", "consulta", "gestor"] as const;
type Perfil = (typeof PERFIS)[number];

/** perfil → colunas: consulta = só vê relatórios (não registra, não tem metas). */
const colunas = (p: Perfil) => ({ papel: p === "gestor" ? "gestor" : "tecnico", ativo: p !== "consulta" });

/** Metas do mês corrente só para técnicos ativos: cria as que faltam e remove as de gestor/consulta. */
async function ajustaMetas(admin: ReturnType<typeof createAdminClient>) {
  await admin.rpc("ram_rolar_metas", { p_mes: mesAtual() });
  const { data } = await admin.from("ram_tecnicos").select("id").or("papel.eq.gestor,ativo.eq.false");
  const ids = (data ?? []).map((t) => t.id);
  if (ids.length) await admin.from("ram_metas").delete().in("tecnico_id", ids).gte("mes", mesAtual());
}

async function exigeGestor() {
  const { tecnico } = await getSessao();
  if (!tecnico || tecnico.papel !== "gestor" || !tecnico.ativo) throw new Error("Acesso restrito ao gestor");
  return tecnico;
}

const usuarioSchema = z
  .string()
  .trim()
  .regex(/^@?[A-Za-z0-9._-]{3,40}$/, "Usuário: 3 a 40 caracteres (letras, números, ponto, hífen ou _)");

export async function criarUsuario(_: EstadoUsuario, fd: FormData): Promise<EstadoUsuario> {
  try {
    await exigeGestor();
  } catch {
    return { erro: "Acesso restrito ao gestor." };
  }
  const p = z
    .object({
      nome: z.string().trim().min(2, "Informe o nome").max(60),
      usuario: usuarioSchema,
      senha: z.string().min(6, "A senha precisa ter ao menos 6 caracteres").max(72),
      perfil: z.enum(PERFIS),
      vincular: z.string().min(1),
    })
    .safeParse(Object.fromEntries(fd));
  if (!p.success) return { erro: p.error.issues[0].message };
  const { nome, usuario, senha, perfil, vincular } = p.data;
  const login = "@" + usuario.replace(/^@/, "");
  const admin = createAdminClient();

  const { data: criado, error } = await admin.auth.admin.createUser({
    email: emailDeLogin(login),
    password: senha,
    email_confirm: true,
  });
  if (error || !criado.user) {
    return { erro: /already|registered/i.test(error?.message ?? "") ? "Este usuário já existe." : (error?.message ?? "Falha ao criar o usuário.") };
  }

  let falhou = false;
  if (vincular === "__novo") {
    const { error: e } = await admin.from("ram_tecnicos").insert({ nome, user_id: criado.user.id, ...colunas(perfil) });
    falhou = !!e;
  } else {
    const { data: lig, error: e } = await admin
      .from("ram_tecnicos")
      .update({ user_id: criado.user.id, ...colunas(perfil) })
      .eq("id", vincular)
      .is("user_id", null)
      .select("id");
    falhou = !!e || !lig?.length;
  }
  if (falhou) {
    await admin.auth.admin.deleteUser(criado.user.id);
    return { erro: "Não foi possível cadastrar o técnico (nome já existe ou já possui conta)." };
  }

  await ajustaMetas(admin);
  revalidatePath("/usuarios");
  return { ok: "Usuário criado.", credencial: { usuario: login, senha }, ts: Date.now() };
}

export async function redefinirSenha(_: EstadoUsuario, fd: FormData): Promise<EstadoUsuario> {
  try {
    await exigeGestor();
  } catch {
    return { erro: "Acesso restrito ao gestor." };
  }
  const p = z
    .object({ id: z.string().uuid(), senha: z.string().min(6, "A senha precisa ter ao menos 6 caracteres").max(72) })
    .safeParse(Object.fromEntries(fd));
  if (!p.success) return { erro: p.error.issues[0].message };

  const admin = createAdminClient();
  const { data: t } = await admin.from("ram_tecnicos").select("user_id").eq("id", p.data.id).maybeSingle();
  if (!t?.user_id) return { erro: "Usuário sem conta vinculada." };
  const { data: u } = await admin.auth.admin.getUserById(t.user_id);
  const { error } = await admin.auth.admin.updateUserById(t.user_id, { password: p.data.senha });
  if (error) return { erro: error.message };
  const login = "@" + (u.user?.email ?? "").replace(/@ram\.example\.com$/, "");
  return { ok: "Senha redefinida.", credencial: { usuario: login, senha: p.data.senha }, ts: Date.now() };
}

export async function alterarPerfil(_: EstadoUsuario, fd: FormData): Promise<EstadoUsuario> {
  let eu;
  try {
    eu = await exigeGestor();
  } catch {
    return { erro: "Acesso restrito ao gestor." };
  }
  const p = z.object({ id: z.string().uuid(), perfil: z.enum(PERFIS) }).safeParse(Object.fromEntries(fd));
  if (!p.success) return { erro: "Dados inválidos." };
  if (p.data.id === eu.id && p.data.perfil !== "gestor") return { erro: "Você não pode remover o seu próprio perfil de gestor." };

  const admin = createAdminClient();
  const { error } = await admin.from("ram_tecnicos").update(colunas(p.data.perfil)).eq("id", p.data.id);
  if (error) return { erro: "Não foi possível alterar o perfil." };
  await ajustaMetas(admin);
  revalidatePath("/usuarios");
  revalidatePath("/relatorios");
  return { ok: "Perfil atualizado.", ts: Date.now() };
}
