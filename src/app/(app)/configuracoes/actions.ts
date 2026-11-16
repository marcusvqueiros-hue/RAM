"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getSessao } from "@/lib/sessao";
import { normalizaMes, somaMeses } from "@/lib/datas";
import { TIPOS } from "@/lib/tipos";

export type EstadoMetas = { erro?: string; ok?: string; ts?: number };

const valor = z.coerce.number().int("Use números inteiros").min(0, "Meta não pode ser negativa").max(999, "Meta máxima: 999");
const camposTipos = Object.fromEntries(TIPOS.map((t) => [t, valor])) as Record<(typeof TIPOS)[number], typeof valor>;

async function exigeGestor() {
  const { tecnico } = await getSessao();
  return !!tecnico && tecnico.papel === "gestor" && tecnico.ativo;
}

/** Metas de um técnico em um mês (5 tipos). A RLS do banco também restringe a escrita ao gestor. */
export async function salvarMetas(_: EstadoMetas, fd: FormData): Promise<EstadoMetas> {
  if (!(await exigeGestor())) return { erro: "Acesso restrito ao gestor." };
  const p = z.object({ tecnico_id: z.string().uuid(), mes: z.string(), ...camposTipos }).safeParse(Object.fromEntries(fd));
  if (!p.success) return { erro: p.error.issues[0].message };
  const mes = normalizaMes(p.data.mes);
  if (!mes) return { erro: "Mês inválido." };

  const supabase = await createClient();
  const { error } = await supabase.from("ram_metas").upsert(
    TIPOS.map((tipo) => ({ tecnico_id: p.data.tecnico_id, mes, tipo, valor: p.data[tipo] })),
    { onConflict: "tecnico_id,mes,tipo" },
  );
  if (error) return { erro: "Não foi possível salvar as metas." };
  revalidatePath("/configuracoes");
  revalidatePath("/relatorios");
  return { ok: "Salvo", ts: Date.now() };
}

/** Metas padrão: valem para técnicos novos e para os meses criados automaticamente a partir de agora. */
export async function salvarPadrao(_: EstadoMetas, fd: FormData): Promise<EstadoMetas> {
  if (!(await exigeGestor())) return { erro: "Acesso restrito ao gestor." };
  const p = z.object(camposTipos).safeParse(Object.fromEntries(fd));
  if (!p.success) return { erro: p.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase
    .from("ram_metas_padrao")
    .upsert(TIPOS.map((tipo) => ({ tipo, valor: p.data[tipo] })), { onConflict: "tipo" });
  if (error) return { erro: "Não foi possível salvar as metas padrão." };
  revalidatePath("/configuracoes");
  return { ok: "Metas padrão salvas", ts: Date.now() };
}

/**
 * Retira o técnico do mês: zera as 5 metas (ele deixa de aparecer em relatórios, ranking e base do mês).
 * Opcionalmente apaga também as ações lançadas por ele naquele mês.
 */
export async function retirarDoMes(_: EstadoMetas, fd: FormData): Promise<EstadoMetas> {
  if (!(await exigeGestor())) return { erro: "Acesso restrito ao gestor." };
  const p = z.object({ tecnico_id: z.string().uuid(), mes: z.string() }).safeParse(Object.fromEntries(fd));
  if (!p.success) return { erro: "Dados inválidos." };
  const mes = normalizaMes(p.data.mes);
  if (!mes) return { erro: "Mês inválido." };
  const apagar = fd.get("apagar") === "on";

  const supabase = await createClient();
  const { error } = await supabase
    .from("ram_metas")
    .upsert(TIPOS.map((tipo) => ({ tecnico_id: p.data.tecnico_id, mes, tipo, valor: 0 })), { onConflict: "tecnico_id,mes,tipo" });
  if (error) return { erro: "Não foi possível retirar o técnico do mês." };

  if (apagar) {
    const { error: e2 } = await supabase
      .from("ram_registros")
      .delete()
      .eq("tecnico_id", p.data.tecnico_id)
      .gte("data", mes)
      .lt("data", somaMeses(mes, 1));
    if (e2) return { erro: "Metas zeradas, mas não foi possível apagar as ações do mês." };
  }
  revalidatePath("/configuracoes");
  revalidatePath("/relatorios");
  revalidatePath("/base-de-dados");
  return { ok: apagar ? "Retirado e ações apagadas" : "Retirado do mês", ts: Date.now() };
}

/** Traz o técnico de volta ao mês com as metas padrão. */
export async function reativarNoMes(_: EstadoMetas, fd: FormData): Promise<EstadoMetas> {
  if (!(await exigeGestor())) return { erro: "Acesso restrito ao gestor." };
  const p = z.object({ tecnico_id: z.string().uuid(), mes: z.string() }).safeParse(Object.fromEntries(fd));
  if (!p.success) return { erro: "Dados inválidos." };
  const mes = normalizaMes(p.data.mes);
  if (!mes) return { erro: "Mês inválido." };

  const supabase = await createClient();
  const { data: padrao } = await supabase.from("ram_metas_padrao").select("tipo, valor");
  const val = Object.fromEntries((padrao ?? []).map((x) => [x.tipo, x.valor]));
  const { error } = await supabase
    .from("ram_metas")
    .upsert(TIPOS.map((tipo) => ({ tecnico_id: p.data.tecnico_id, mes, tipo, valor: val[tipo] ?? 0 })), { onConflict: "tecnico_id,mes,tipo" });
  if (error) return { erro: "Não foi possível reativar o técnico." };
  revalidatePath("/configuracoes");
  revalidatePath("/relatorios");
  return { ok: "Reativado no mês", ts: Date.now() };
}
