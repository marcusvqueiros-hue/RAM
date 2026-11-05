"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getSessao } from "@/lib/sessao";
import { normalizaMes } from "@/lib/datas";
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
