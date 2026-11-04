"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, HardHat, Info, Lightbulb, OctagonAlert, Target, X } from "lucide-react";
import { GraficoTipo } from "./grafico-tipo";
import { Medidor } from "./medidor";
import { Tendencia } from "./tendencia";
import {
  anosDe,
  doPeriodo,
  geraInsights,
  montaRelatorio,
  nomesCurtos,
  rotuloMesCap,
  serieMensal,
  type Insight,
} from "@/lib/relatorio";
import { TIPO_INFO, type Linha, type TipoAcao } from "@/lib/tipos";

export type FiltroInicial = { ano: number; mes: string | null; tecnico: string | null; tipo: TipoAcao | null };

const ICONE: Record<Insight["tom"], { Icon: typeof Info; cls: string }> = {
  critico: { Icon: OctagonAlert, cls: "bg-badsoft text-bad" },
  atencao: { Icon: AlertTriangle, cls: "bg-warnsoft text-warn" },
  info: { Icon: Info, cls: "bg-infosoft text-info" },
  bom: { Icon: CheckCircle2, cls: "bg-oksoft text-ok" },
};

export function PainelRelatorio({ rows, hoje, inicial }: { rows: Linha[]; hoje: string; inicial: FiltroInicial }) {
  const [f, setF] = useState<FiltroInicial>(inicial);

  function mudar(patch: Partial<FiltroInicial>) {
    const n = { ...f, ...patch };
    setF(n);
    const q = new URLSearchParams({ ano: String(n.ano), mes: n.mes ? n.mes.slice(0, 7) : "todos" });
    if (n.tecnico) q.set("tec", n.tecnico);
    if (n.tipo) q.set("tipo", n.tipo);
    window.history.replaceState(null, "", `?${q}`); // URL compartilhável sem recarregar
  }
  const alternaTecnico = (nome: string) => mudar({ tecnico: f.tecnico === nome ? null : nome });
  const alternaTipo = (t: TipoAcao) => mudar({ tipo: f.tipo === t ? null : t });
  const abreMes = (mes: string) => mudar({ ano: Number(mes.slice(0, 4)), mes });

  const mesCorrente = hoje.slice(0, 7) + "-01";
  const anos = useMemo(() => [...new Set([...anosDe(rows), Number(hoje.slice(0, 4))])].sort((a, b) => b - a), [rows, hoje]);

  const d = useMemo(() => {
    const periodo = doPeriodo(rows, f.ano, f.mes);
    const equipe = montaRelatorio(periodo);
    const porTipo = periodo.filter((r) => !f.tipo || r.tipo === f.tipo);
    const kpi = montaRelatorio(porTipo.filter((r) => !f.tecnico || r.tecnico === f.tecnico));
    const rank = montaRelatorio(porTipo);
    const insights = geraInsights(equipe, rows, f.ano, f.mes, hoje);
    const serie = serieMensal(rows, f.ano, f.tecnico, f.tipo, f.mes === mesCorrente ? undefined : mesCorrente);
    const nomesAno = [...new Set(rows.filter((r) => r.mes.startsWith(String(f.ano))).map((r) => r.tecnico))].sort((a, b) => a.localeCompare(b));
    const curtos = nomesCurtos([...new Set(periodo.map((r) => r.tecnico))]);
    return { equipe, kpi, rank, insights, serie, nomesAno, curtos, vazio: equipe.totalMeta === 0 && equipe.totalRealizado === 0 };
  }, [rows, f, hoje, mesCorrente]);

  const meses = Array.from({ length: 12 }, (_, i) => `${f.ano}-${String(i + 1).padStart(2, "0")}-01`);
  const periodoRotulo = f.mes ? rotuloMesCap(f.mes) : `Ano de ${f.ano}`;
  const filtrosAtivos = [
    f.tecnico && { k: "tecnico", label: `Técnico: ${f.tecnico}`, limpa: () => mudar({ tecnico: null }) },
    f.tipo && { k: "tipo", label: `Tipo: ${TIPO_INFO[f.tipo].nome}`, limpa: () => mudar({ tipo: null }) },
  ].filter(Boolean) as { k: string; label: string; limpa: () => void }[];

  return (
    <div className="w-full">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-brand">Relatório de Atividades Mensais</h1>
          <p className="text-muted">{periodoRotulo}</p>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <label className="grid gap-1 text-xs font-medium text-muted">
            Ano
            <select className="input !w-auto" value={f.ano} onChange={(e) => mudar({ ano: Number(e.target.value), mes: null })}>
              {anos.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-xs font-medium text-muted">
            Mês
            <select className="input !w-auto" value={f.mes ?? ""} onChange={(e) => mudar({ mes: e.target.value || null })}>
              <option value="">Ano todo</option>
              {meses.map((m) => (
                <option key={m} value={m}>{rotuloMesCap(m)}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-xs font-medium text-muted">
            Técnico
            <select className="input !w-auto" value={f.tecnico ?? ""} onChange={(e) => mudar({ tecnico: e.target.value || null })}>
              <option value="">Todos</option>
              {d.nomesAno.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {filtrosAtivos.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2" aria-label="Filtros ativos">
          {filtrosAtivos.map((c) => (
            <button
              key={c.k}
              onClick={c.limpa}
              className="inline-flex items-center gap-1.5 rounded-full bg-brandsoft px-3 py-1 text-sm font-medium text-brand"
              aria-label={`Remover filtro ${c.label}`}
            >
              {c.label} <X size={14} aria-hidden />
            </button>
          ))}
          <button onClick={() => mudar({ tecnico: null, tipo: null })} className="text-sm text-muted underline-offset-4 hover:underline">
            Limpar tudo
          </button>
        </div>
      )}

      {d.vazio ? (
        <p className="card p-8 text-center text-muted">Sem dados para este período.</p>
      ) : (
        <>
          <section aria-label="Indicadores" className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="card flex items-center gap-4 p-5">
              <span className="grid size-12 place-items-center rounded-xl bg-brandsoft text-brand"><HardHat aria-hidden /></span>
              <div>
                <p className="text-3xl font-bold tabular-nums">{d.kpi.totalRealizado}</p>
                <p className="text-sm text-muted">Realizado</p>
              </div>
            </div>
            <div className="card flex items-center gap-4 p-5">
              <span className="grid size-12 place-items-center rounded-xl bg-brandsoft text-brand"><Target aria-hidden /></span>
              <div>
                <p className="text-3xl font-bold tabular-nums">{d.kpi.totalMeta}</p>
                <p className="text-sm text-muted">Meta</p>
              </div>
            </div>
            <div className="card grid place-items-center p-3"><Medidor valor={d.kpi.pctBruto} rotulo="% Realizado" /></div>
            <div className="card grid place-items-center p-3"><Medidor valor={d.kpi.pctCumprimento} rotulo="% Cumprimento por tipo" /></div>
          </section>

          {d.insights.length > 0 && (
            <section aria-labelledby="h-insights" className="mb-6">
              <h2 id="h-insights" className="mb-3 flex items-center gap-2 text-lg font-bold">
                <Lightbulb size={20} className="text-warn" aria-hidden /> Insights da equipe · {periodoRotulo}
              </h2>
              <ul className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
                {d.insights.map((i) => {
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

          <p className="mb-3 text-sm text-muted">Dica: clique em uma barra ou nome para filtrar por técnico, e no título de um gráfico para filtrar por tipo de ação.</p>
          <section aria-label="Resultados por tipo de ação" className="mb-6 grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {d.equipe.porTipo.map((t) => (
              <GraficoTipo
                key={t.tipo}
                titulo={TIPO_INFO[t.tipo].nome}
                linhas={t.linhas}
                curtos={d.curtos}
                tecnicoSel={f.tecnico}
                onTecnico={alternaTecnico}
                tipoSel={f.tipo === t.tipo}
                tipoFiltrando={f.tipo !== null}
                onTipo={() => alternaTipo(t.tipo)}
              />
            ))}
            <Tendencia
              titulo={`Evolução do atingimento · ${f.ano}${f.tecnico ? ` · ${f.tecnico}` : ""}${f.tipo ? ` · ${TIPO_INFO[f.tipo].curto}` : ""}`}
              dados={d.serie}
              mesSel={f.mes}
              onMes={abreMes}
            />
          </section>

          <section aria-labelledby="h-rank" className="card overflow-x-auto p-5">
            <h2 id="h-rank" className="mb-3 text-lg font-bold">
              Ranking de técnicos{f.tipo ? ` · ${TIPO_INFO[f.tipo].nome}` : ""}
            </h2>
            <table className="w-full min-w-[34rem] text-left text-sm">
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
                {d.rank.porTecnico.map((t, i) => (
                  <tr
                    key={t.tecnico}
                    className={`border-b border-line last:border-0 ${f.tecnico === t.tecnico ? "bg-brandsoft" : ""}`}
                  >
                    <td className="py-2.5 pr-3 tabular-nums text-muted">{i + 1}</td>
                    <td className="py-2.5 pr-3 font-semibold">
                      <button onClick={() => alternaTecnico(t.tecnico)} className="text-left hover:text-brand hover:underline" aria-pressed={f.tecnico === t.tecnico}>
                        {t.tecnico}
                      </button>
                    </td>
                    <td className="py-2.5 pr-3 text-right tabular-nums">{t.realizado}</td>
                    <td className="py-2.5 pr-3 text-right tabular-nums">{t.meta}</td>
                    <td className={`py-2.5 pr-3 text-right font-semibold tabular-nums ${t.pct >= 100 ? "text-ok" : "text-bad"}`}>{Math.round(t.pct)}%</td>
                    <td className="py-2.5 text-muted">
                      {t.tiposAbaixo.length ? t.tiposAbaixo.filter((x) => !f.tipo || x === f.tipo).map((x) => TIPO_INFO[x].curto).join(", ") : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}
    </div>
  );
}
