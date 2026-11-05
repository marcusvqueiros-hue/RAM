import { createClient } from "@/lib/supabase/server";
import type { Linha } from "@/lib/tipos";
import { BaseDeDados, type Registro } from "./base-de-dados";

export const metadata = { title: "Base de Dados" };

/** PostgREST limita a 1000 linhas por requisição → pagina até acabar. */
async function todas<T>(buscar: (de: number, ate: number) => PromiseLike<{ data: T[] | null }>): Promise<T[]> {
  const out: T[] = [];
  for (let i = 0; ; i += 1000) {
    const { data } = await buscar(i, i + 999);
    if (!data?.length) break;
    out.push(...data);
    if (data.length < 1000) break;
  }
  return out;
}

export default async function Pagina() {
  const supabase = await createClient();

  const [resumo, regs] = await Promise.all([
    todas<Linha>((de, ate) =>
      supabase
        .from("v_ram_resumo_mensal")
        .select("tecnico, mes, tipo, realizado, meta")
        .order("mes")
        .order("tecnico")
        .order("tipo")
        .range(de, ate)
        .returns<Linha[]>(),
    ),
    todas<{
      id: string;
      data: string;
      tipo: Registro["tipo"];
      quantidade: number;
      local: string | null;
      observacao: string | null;
      origem: string;
      created_at: string;
      ram_tecnicos: { nome: string } | { nome: string }[] | null;
    }>((de, ate) =>
      supabase
        .from("ram_registros")
        .select("id, data, tipo, quantidade, local, observacao, origem, created_at, ram_tecnicos(nome)")
        .order("data", { ascending: false })
        .order("created_at", { ascending: false })
        .range(de, ate),
    ),
  ]);

  const registros: Registro[] = regs.map((r) => ({
    id: r.id,
    data: r.data,
    tecnico: (Array.isArray(r.ram_tecnicos) ? r.ram_tecnicos[0]?.nome : r.ram_tecnicos?.nome) ?? "—",
    tipo: r.tipo,
    quantidade: r.quantidade,
    local: r.local,
    observacao: r.observacao,
    origem: r.origem,
    criadoEm: r.created_at,
  }));

  return <BaseDeDados resumo={resumo.filter((l) => l.realizado > 0 || l.meta > 0)} registros={registros} />;
}
