import { redirect } from "next/navigation";
import { AlertTriangle, CheckCircle2, Info, Lightbulb, OctagonAlert, Target, HardHat } from "lucide-react";
import { Cabecalho } from "@/components/cabecalho";
import { GraficoTipo } from "@/components/grafico-tipo";
import { Medidor } from "@/components/medidor";
import { SeletorMes } from "@/components/seletor-mes";
import { Tendencia } from "@/components/tendencia";
import { createClient } from "@/lib/supabase/server";
import { getSessao } from "@/lib/sessao";
import { hoje, mesAtual, normalizaMes, rotuloMes, somaMeses } from "@/lib/datas";
import { geraInsights, montaRelatorio, type Insight } from "@/lib/relatorio";
import { TIPO_INFO, type Resumo, type ResumoEquipe } from "@/lib/tipos";

export const metadata = { title: "Relatório mensal" };

const ICONE: Record<Insight["tom"], { Icon: typeof Info; cls: string }> = {
  critico: { Icon: OctagonAlert, cls: "bg-badsoft text-bad" },
  atencao: { Icon: AlertTriangle, cls: "bg-warnsoft text-warn" },
  info: { Icon: Info, cls: "bg-infosoft text-info" },
  bom: { Icon: CheckCircle2, cls: "bg-oksoft text-ok" },
};

export default async function Relatorios(props: PageProps<"/relatorios">) {
  const { user } = await getSessao();
  if (!user) redirect("/entrar?next=/relatorios");

  const sp = await props.searchParams;
  const mesParam = normalizaMes(Array.isArray(sp.mes) ? sp.mes[0] : sp.mes);
  const supabase = await createClient();

  const { data: equipe } = await supabase
    .from("v_ram_resumo_equipe")
    .select("mes, tipo, realizado, meta")
    .order("mes")
    .returns<ResumoEquipe[]>();

  const atual = mesAtual();
  const meses = [...new Set([...(equipe ?? []).map((e) => e.mes), atual])].sort().reverse();
  const mes = mesParam && meses.includes(mesParam) ? mesParam : atual;

  const { data: linhas } = await supabase
    .from("v_ram_resumo_mensal")
    .select("tecnico_id, tecnico, mes, tipo, realizado, meta")
    .gte("mes", somaMeses(mes, -3))
    .lte("mes", mes)
    .returns<Resumo[]>();

  const rel = montaRelatorio(mes, linhas ?? [], equipe ?? []);
  const insights = geraInsights(rel, (linhas ?? []).filter((l) => l.mes !== mes), hoje());
  const vazio = rel.totalMeta === 0 && rel.totalRealizado === 0;

  return (
    <>
      <Cabecalho ativo="relatorios" />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-brand">Relatório de Atividades Mensais</h1>
            <p className="capitalize text-muted">{rotuloMes(mes)}</p>
          </div>
          <SeletorMes atual={mes} meses={meses} />
        </div>

        {vazio ? (
          <p className="card p-8 text-center text-muted">Sem dados para este mês.</p>
        ) : (
          <>
            <section aria-label="Indicadores" className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="card flex items-center gap-4 p-5">
                <span className="grid size-12 place-items-center rounded-xl bg-brandsoft text-brand"><HardHat aria-hidden /></span>
                <div>
                  <p className="text-3xl font-bold tabular-nums">{rel.totalRealizado}</p>
                  <p className="text-sm text-muted">Realizado</p>
                </div>
              </div>
              <div className="card flex items-center gap-4 p-5">
                <span className="grid size-12 place-items-center rounded-xl bg-brandsoft text-brand"><Target aria-hidden /></span>
                <div>
                  <p className="text-3xl font-bold tabular-nums">{rel.totalMeta}</p>
                  <p className="text-sm text-muted">Meta</p>
                </div>
              </div>
              <div className="card grid place-items-center p-3"><Medidor valor={rel.pctBruto} rotulo="% Realizado" /></div>
              <div className="card grid place-items-center p-3"><Medidor valor={rel.pctCumprimento} rotulo="% Cumprimento por tipo" /></div>
            </section>

            {insights.length > 0 && (
              <section aria-labelledby="h-insights" className="mb-6">
                <h2 id="h-insights" className="mb-3 flex items-center gap-2 text-lg font-bold">
                  <Lightbulb size={20} className="text-warn" aria-hidden /> Insights do mês
                </h2>
                <ul className="grid gap-3 md:grid-cols-2">
                  {insights.map((i) => {
                    const { Icon, cls } = ICONE[i.tom];
                    return (
                      <li key={i.titulo} className="card flex gap-3 p-4">
                        <span className={`grid size-9 shrink-0 place-items-center rounded-lg ${cls}`}><Icon size={18} aria-hidden /></span>
                        <div>
                          <p className="font-semibold">{i.titulo}</p>
                          <p className="text-sm text-muted">{i.texto}</p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}

            <section aria-label="Resultados por tipo de ação" className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {rel.porTipo.map((t) => (
                <GraficoTipo key={t.tipo} titulo={TIPO_INFO[t.tipo].nome} linhas={t.linhas} />
              ))}
              <div className="md:col-span-2 xl:col-span-1"><Tendencia dados={rel.tendencia} /></div>
            </section>

            <section aria-labelledby="h-rank" className="card overflow-x-auto p-5">
              <h2 id="h-rank" className="mb-3 text-lg font-bold">Ranking de técnicos</h2>
              <table className="w-full min-w-[32rem] text-left text-sm">
                <thead className="text-muted">
                  <tr className="border-b border-line">
                    <th className="py-2 pr-3 font-medium">#</th>
                    <th className="py-2 pr-3 font-medium">Técnico</th>
                    <th className="py-2 pr-3 text-right font-medium">Realizado</th>
                    <th className="py-2 pr-3 text-right font-medium">Meta</th>
                    <th className="py-2 pr-3 text-right font-medium">%</th>
                    <th className="py-2 font-medium">Abaixo da meta em</th>
                  </tr>
                </thead>
                <tbody>
                  {rel.porTecnico.map((t, i) => (
                    <tr key={t.tecnico} className="border-b border-line last:border-0">
                      <td className="py-2.5 pr-3 tabular-nums text-muted">{i + 1}</td>
                      <td className="py-2.5 pr-3 font-semibold">{t.tecnico}</td>
                      <td className="py-2.5 pr-3 text-right tabular-nums">{t.realizado}</td>
                      <td className="py-2.5 pr-3 text-right tabular-nums">{t.meta}</td>
                      <td className={`py-2.5 pr-3 text-right font-semibold tabular-nums ${t.pct >= 100 ? "text-ok" : "text-bad"}`}>{Math.round(t.pct)}%</td>
                      <td className="py-2.5 text-muted">
                        {t.tiposAbaixo.length ? t.tiposAbaixo.map((x) => TIPO_INFO[x].curto).join(", ") : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </>
        )}
      </main>
    </>
  );
}
