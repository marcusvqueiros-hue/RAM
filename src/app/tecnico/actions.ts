"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getSessao } from "@/lib/sessao";
import { hoje, somaMeses } from "@/lib/datas";
import { TIPOS } from "@/lib/tipos";

export type EstadoRegistro = { erro?: string; ok?: string; ts?: number };

const schema = z.object({
  tipo: z.enum(TIPOS, { error: "Escolha o tipo de ação" }),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
  quantidade: z.coerce.number().int().min(1, "Mínimo 1").max(50, "Máximo 50 por registro"),
  local: z.string().trim().max(120).optional(),
  observacao: z.string().trim().max(500).optional(),
});

export async function registrarAcao(_: EstadoRegistro, fd: FormData): Promise<EstadoRegistro> {
  const p = schema.safeParse(Object.fromEntries(fd));
  if (!p.success) return { erro: p.error.issues[0].message };
  const d = p.data;

  const h = hoje();
  if (d.data > h) return { erro: "A data não pode ser futura." };
  if (d.data < somaMeses(h.slice(0, 7) + "-01", -1)) return { erro: "Só é possível registrar do mês anterior em diante." };

  const { tecnico } = await getSessao();
  if (!tecnico?.ativo) return { erro: "Seu usuário não está vinculado a um técnico ativo." };

  const supabase = await createClient();
  const { error } = await supabase.from("registros").insert({
    tecnico_id: tecnico.id,
    tipo: d.tipo,
    data: d.data,
    quantidade: d.quantidade,
    local: d.local || null,
    observacao: d.observacao || null,
  });
  if (error) return { erro: "Não foi possível salvar. Tente novamente." };

  revalidatePath("/tecnico");
  revalidatePath("/relatorios");
  return { ok: "Ação registrada!", ts: Date.now() };
}

export async function removerRegistro(fd: FormData) {
  const id = z.string().uuid().safeParse(fd.get("id"));
  if (!id.success) return;
  const supabase = await createClient();
  await supabase.from("registros").delete().eq("id", id.data); // RLS: só os próprios (últimos 7 dias)
  revalidatePath("/tecnico");
  revalidatePath("/relatorios");
}
