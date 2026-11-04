import { PainelRelatorio } from "@/components/painel-relatorio";
import { createClient } from "@/lib/supabase/server";
import { hoje, mesAtual, normalizaMes } from "@/lib/datas";
import { TIPOS, type Linha, type TipoAcao } from "@/lib/tipos";

export const metadata = { title: "Relatório mensal" };

const um = (v?: string | string[]) => (Array.isArray(v) ? v[0] : v);

export default async function Relatorios(props: PageProps<"/relatorios">) {
  const sp = await props.searchParams;
  const supabase = await createClient();

  // PostgREST limita a 1000 linhas por requisição → pagina até acabar.
  const linhas: Linha[] = [];
  for (let i = 0; ; i += 1000) {
    const { data } = await supabase
      .from("v_ram_resumo_mensal")
      .select("tecnico, mes, tipo, realizado, meta")
      .order("mes")
      .order("tecnico")
      .order("tipo")
      .range(i, i + 999)
      .returns<Linha[]>();
    if (!data?.length) break;
    linhas.push(...data);
    if (data.length < 1000) break;
  }

  const h = hoje();
  const anoP = Number(um(sp.ano));
  const ano = Number.isInteger(anoP) && anoP >= 2020 && anoP <= 2100 ? anoP : Number(h.slice(0, 4));
  const mesRaw = um(sp.mes);
  const meses =
    mesRaw === "todos"
      ? []
      : mesRaw
        ? [...new Set(mesRaw.split(",").map((m) => normalizaMes(m)).filter((m): m is string => !!m))].sort()
        : [mesAtual()];
  const tipoP = um(sp.tipo);
  const tipo = TIPOS.includes(tipoP as TipoAcao) ? (tipoP as TipoAcao) : null;

  return (
    <PainelRelatorio
      rows={linhas}
      hoje={h}
      inicial={{ ano: meses.length ? Number(meses[0].slice(0, 4)) : ano, meses: meses.filter((m) => m.startsWith(String(meses.length ? meses[0].slice(0, 4) : ano))), tecnico: um(sp.tec) ?? null, tipo }}
    />
  );
}
