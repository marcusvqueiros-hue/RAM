import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSessao } from "@/lib/sessao";
import { mesAtual, normalizaMes, somaMeses } from "@/lib/datas";
import { rotuloMesCap } from "@/lib/relatorio";
import { TIPOS, type TipoAcao } from "@/lib/tipos";
import { Configuracoes, type LinhaMeta } from "./configuracoes";

export const metadata = { title: "Configurações" };

export default async function Pagina(props: PageProps<"/configuracoes">) {
  const { tecnico } = await getSessao();
  if (!tecnico || tecnico.papel !== "gestor" || !tecnico.ativo) redirect("/relatorios");

  const sp = await props.searchParams;
  const mesParam = normalizaMes(Array.isArray(sp.mes) ? sp.mes[0] : sp.mes);
  const atual = mesAtual();
  const mes = mesParam ?? atual;

  const supabase = await createClient();
  const [{ data: ativos }, { data: metas }, { data: padrao }, { data: acoes }] = await Promise.all([
    supabase.from("ram_tecnicos").select("id, nome").eq("ativo", true).eq("papel", "tecnico").order("nome"),
    supabase.from("ram_metas").select("tecnico_id, tipo, valor, ram_tecnicos(nome)").eq("mes", mes),
    supabase.from("ram_metas_padrao").select("tipo, valor"),
    supabase.from("ram_registros").select("tecnico_id, quantidade").gte("data", mes).lt("data", somaMeses(mes, 1)),
  ]);
  const acoesPor = new Map<string, number>();
  for (const r of acoes ?? []) acoesPor.set(r.tecnico_id, (acoesPor.get(r.tecnico_id) ?? 0) + r.quantidade);

  const padraoMap = Object.fromEntries((padrao ?? []).map((p) => [p.tipo, p.valor])) as Partial<Record<TipoAcao, number>>;
  const linhas = new Map<string, LinhaMeta>();
  // técnicos ativos sempre aparecem; meses antigos também mostram quem tinha meta naquele mês
  for (const t of ativos ?? []) {
    linhas.set(t.id, { id: t.id, nome: t.nome, metas: Object.fromEntries(TIPOS.map((x) => [x, padraoMap[x] ?? 0])) as Record<TipoAcao, number>, definida: false, acoes: acoesPor.get(t.id) ?? 0 });
  }
  for (const m of metas ?? []) {
    const nome = (m.ram_tecnicos as unknown as { nome: string } | null)?.nome ?? "—";
    const l =
      linhas.get(m.tecnico_id) ??
      ({ id: m.tecnico_id, nome, metas: Object.fromEntries(TIPOS.map((x) => [x, 0])) as Record<TipoAcao, number>, definida: true, acoes: acoesPor.get(m.tecnico_id) ?? 0 } satisfies LinhaMeta);
    l.metas[m.tipo as TipoAcao] = m.valor;
    l.definida = true;
    linhas.set(l.id, l);
  }

  const meses = Array.from({ length: 10 }, (_, i) => somaMeses(atual, i - 6)).map((m) => ({ valor: m, rotulo: rotuloMesCap(m) }));
  if (!meses.some((m) => m.valor === mes)) meses.push({ valor: mes, rotulo: rotuloMesCap(mes) });

  return (
    <Configuracoes
      mes={mes}
      meses={meses.sort((a, b) => a.valor.localeCompare(b.valor))}
      linhas={[...linhas.values()].sort((a, b) => a.nome.localeCompare(b.nome))}
      padrao={Object.fromEntries(TIPOS.map((t) => [t, padraoMap[t] ?? 0])) as Record<TipoAcao, number>}
    />
  );
}
