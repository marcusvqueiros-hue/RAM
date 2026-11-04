import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { mesAtual } from "@/lib/datas";

/** Vercel Cron (dia 1º de cada mês): cria as metas padrão do novo mês para os técnicos ativos. */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  }
  const { data, error } = await createAdminClient().rpc("rolar_metas", { p_mes: mesAtual() });
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json({ metas_criadas: data });
}
