"use client";

import { useMemo, useRef, useState } from "react";
import { AlertTriangle, Camera, CheckCircle2, Download, HardHat, Info, Lightbulb, OctagonAlert, Share2, Target, X } from "lucide-react";
import { GraficoTipo } from "./grafico-tipo";
import { Medidor } from "./medidor";
import { SlideFoto } from "./slide-foto";
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

export type FiltroInicial = { ano: number; meses: string[]; tecnico: string | null; tipo: TipoAcao | null };

const ICONE: Record<Insight["tom"], { Icon: typeof Info; cls: string }> = {
  critico: { Icon: OctagonAlert, cls: "bg-badsoft text-bad" },
  atencao: { Icon: AlertTriangle, cls: "bg-warnsoft text-warn" },
  info: { Icon: Info, cls: "bg-infosoft text-info" },
  bom: { Icon: CheckCircle2, cls: "bg-oksoft text-ok" },
};

export function PainelRelatorio({ rows, hoje, inicial }: { rows: Linha[]; hoje: string; inicial: FiltroInicial }) {
  const [f, setF] = useState<FiltroInicial>(inicial);
  const slideRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [capturando, setCapturando] = useState(false);
  const [prev, setPrev] = useState<{ url: string; blob: Blob; nome: string } | null>(null);
  const [aviso, setAviso] = useState("");

  /** Monta o slide 16:9 fora da tela, tira a foto e abre a pré-visualização. */
  async function gerarFoto() {
    setAviso("");
    setCapturando(true);
    try {
      await new Promise((r) => setTimeout(r, 900)); // dá tempo de os gráficos medirem e desenharem
      const el = slideRef.current;
      if (!el) throw new Error("slide");
      const { toBlob } = await import("html-to-image");
      const blob = await toBlob(el, { pixelRatio: 2, cacheBust: true, backgroundColor: "#f6f4f5", width: 1280, height: 720 });
      if (!blob) throw new Error("sem imagem");
      const periodo = f.meses.length ? f.meses.map((m) => m.slice(5, 7)).join("-") : "ano";
      const nome = `RAM-${f.ano}-${periodo}${f.tecnico ? "-" + f.tecnico.replace(/[^\p{L}\p{N}]+/gu, "") : ""}.png`;
      if (prev) URL.revokeObjectURL(prev.url);
      setPrev({ url: URL.createObjectURL(blob), blob, nome });
      dialogRef.current?.showModal();
    } catch {
      setAviso("Não foi possível gerar a imagem. Tente novamente.");
    } finally {
      setCapturando(false);
    }
  }

  function baixarFoto() {
    if (!prev) return;
    const a = document.createElement("a");
    a.href = prev.url;
    a.download = prev.nome;
    a.click();
  }

  async function compartilharFoto() {
    if (!prev) return;
    const arquivo = new File([prev.blob], prev.nome, { type: "image/png" });
    if (navigator.canShare?.({ files: [arquivo] })) {
      try {
        await navigator.share({ files: [arquivo], title: `RAM · ${periodoRotulo}` });
      } catch {
        /* usuário cancelou */
      }
    } else {
      baixarFoto();
      setAviso("Compartilhamento direto indisponível neste aparelho: a imagem foi baixada.");
    }
  }

  function mudar(patch: Partial<FiltroInicial>) {
    const n = { ...f, ...patch };
    setF(n);
    const q = new URLSearchParams({ ano: String(n.ano), mes: n.meses.length ? n.meses.map((m) => m.slice(0, 7)).join(",") : "todos" });
    if (n.tecnico) q.set("tec", n.tecnico);
    if (n.tipo) q.set("tipo", n.tipo);
    window.history.replaceState(null, "", `?${q}`); // URL compartilhável sem recarregar
  }
  const alternaTecnico = (nome: string) => mudar({ tecnico: f.tecnico === nome ? null : nome });
  const alternaTipo = (t: TipoAcao) => mudar({ tipo: f.tipo === t ? null : t });
  const abreMes = (mes: string) => mudar({ ano: Number(mes.slice(0, 4)), meses: [mes] });
  const alternaMes = (m: string) =>
    mudar({ meses: f.meses.includes(m) ? f.meses.filter((x) => x !== m) : [...f.meses, m].sort() });
  const mesUnico = f.meses.length === 1 ? f.meses[0] : null;

  const mesCorrente = hoje.slice(0, 7) + "-01";
  const anos = useMemo(() => [...new Set([...anosDe(rows), Number(hoje.slice(0, 4))])].sort((a, b) => b - a), [rows, hoje]);

  const d = useMemo(() => {
    const periodo = doPeriodo(rows, f.ano, f.meses);
    const equipe = montaRelatorio(periodo);
    const porTipo = periodo.filter((r) => !f.tipo || r.tipo === f.tipo);
    const kpi = montaRelatorio(porTipo.filter((r) => !f.tecnico || r.tecnico === f.tecnico));
    const totais = montaRelatorio(periodo.filter((r) => !f.tecnico || r.tecnico === f.tecnico));
    const rank = montaRelatorio(porTipo);
    const insights = geraInsights(equipe, rows, f.ano, mesUnico, hoje);
    const serie = serieMensal(rows, f.ano, f.tecnico, f.tipo, f.meses.includes(mesCorrente) ? undefined : mesCorrente);
    const nomesAno = [...new Set(rows.filter((r) => r.mes.startsWith(String(f.ano))).map((r) => r.tecnico))].sort((a, b) => a.localeCompare(b));
    const geral = equipe.porTecnico
      .map((x) => ({ tecnico: x.tecnico, realizado: x.realizado, meta: x.meta }))
      .sort((a, b) => b.realizado - a.realizado || a.tecnico.localeCompare(b.tecnico));
    const curtos = nomesCurtos([...new Set(periodo.map((r) => r.tecnico))]);
    return { equipe, geral, kpi, totais, rank, insights, serie, nomesAno, curtos, vazio: equipe.totalMeta === 0 && equipe.totalRealizado === 0 };
  }, [rows, f, hoje, mesCorrente, mesUnico]);

  const meses = Array.from({ length: 12 }, (_, i) => `${f.ano}-${String(i + 1).padStart(2, "0")}-01`);
  const periodoRotulo =
    f.meses.length === 0
      ? `Ano de ${f.ano}`
      : f.meses.length === 1
        ? rotuloMesCap(f.meses[0])
        : `${f.meses.map((m) => rotuloMesCap(m, "curto").split(" ")[0]).join(", ")} de ${f.ano}`;
  const trimestres = [["T1", 0], ["T2", 3], ["T3", 6], ["T4", 9]] as const;
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
          <button
            type="button"
            onClick={gerarFoto}
            disabled={capturando}
            className="btn btn-ghost !min-h-11"
            title="Foto 16:9 dos 6 gráficos principais, com pré-visualização"
          >
            <Camera size={18} aria-hidden /> {capturando ? "Gerando…" : "Foto dos gráficos"}
          </button>
          <label className="grid gap-1 text-xs font-medium text-muted">
            Ano
            <select className="input !w-auto" value={f.ano} onChange={(e) => mudar({ ano: Number(e.target.value), meses: [] })}>
              {anos.map((a) => (
                <option key={a} value={a}>{a}</option>
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

      <div className="mb-4 flex flex-wrap items-center gap-2" role="group" aria-label="Filtro de meses (seleção múltipla)">
        <button
          type="button"
          onClick={() => mudar({ meses: [] })}
          aria-pressed={f.meses.length === 0}
          className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors ${f.meses.length === 0 ? "border-brand bg-brand text-brandfg" : "border-line text-muted hover:text-fg"}`}
        >
          Ano todo
        </button>
        <span className="mx-1 hidden h-5 w-px bg-line sm:block" aria-hidden />
        {meses.map((m) => {
          const on = f.meses.includes(m);
          const futuro = m > mesCorrente;
          return (
            <button
              key={m}
              type="button"
              onClick={() => alternaMes(m)}
              aria-pressed={on}
              title={rotuloMesCap(m)}
              className={`min-w-12 rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors ${
                on ? "border-brand bg-brand text-brandfg" : futuro ? "border-line text-muted/50 hover:text-muted" : "border-line text-muted hover:border-brand hover:text-fg"
              }`}
            >
              {rotuloMesCap(m, "curto").split(" ")[0].replace(".", "")}
            </button>
          );
        })}
        <span className="mx-1 hidden h-5 w-px bg-line sm:block" aria-hidden />
        {trimestres.map(([nome, ini]) => {
          const set = meses.slice(ini, ini + 3);
          const on = set.length === f.meses.length && set.every((m) => f.meses.includes(m));
          return (
            <button
              key={nome}
              type="button"
              onClick={() => mudar({ meses: on ? [] : set })}
              aria-pressed={on}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${on ? "border-brand bg-brandsoft text-brand" : "border-line text-muted hover:text-fg"}`}
            >
              {nome}
            </button>
          );
        })}
      </div>

      <p className="mb-2 h-5 text-right text-sm text-muted" role="status">{aviso}</p>

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

          <section aria-labelledby="h-tot" className="card mb-6 overflow-x-auto p-5">
            <h2 id="h-tot" className="mb-3 text-lg font-bold">
              Totais no período · {periodoRotulo}{f.tecnico ? ` · ${f.tecnico}` : ""}
            </h2>
            <table className="w-full min-w-[30rem] text-left text-sm">
              <thead className="text-muted">
                <tr className="border-b border-line">
                  <th className="py-2 pr-3 font-medium">Tipo de ação</th>
                  <th className="py-2 pr-3 text-right font-medium">Realizado</th>
                  <th className="py-2 pr-3 text-right font-medium">Meta</th>
                  <th className="py-2 pr-3 text-right font-medium">Saldo</th>
                  <th className="py-2 text-right font-medium">%</th>
                </tr>
              </thead>
              <tbody>
                {d.totais.porTipo.map((t) => (
                  <tr key={t.tipo} className={`border-b border-line ${f.tipo === t.tipo ? "bg-brandsoft" : ""}`}>
                    <td className="py-2.5 pr-3 font-medium">
                      <button onClick={() => alternaTipo(t.tipo)} className="text-left hover:text-brand hover:underline" aria-pressed={f.tipo === t.tipo}>
                        {TIPO_INFO[t.tipo].nome}
                      </button>
                    </td>
                    <td className="py-2.5 pr-3 text-right tabular-nums">{t.realizado}</td>
                    <td className="py-2.5 pr-3 text-right tabular-nums">{t.meta}</td>
                    <td className={`py-2.5 pr-3 text-right tabular-nums ${t.realizado >= t.meta ? "text-ok" : "text-bad"}`}>
                      {t.realizado - t.meta > 0 ? "+" : ""}{t.realizado - t.meta}
                    </td>
                    <td className={`py-2.5 text-right font-semibold tabular-nums ${t.realizado >= t.meta ? "text-ok" : "text-bad"}`}>
                      {t.meta ? Math.round((t.realizado / t.meta) * 100) : 0}%
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="font-bold">
                  <td className="pt-3 pr-3">Total</td>
                  <td className="pt-3 pr-3 text-right tabular-nums">{d.totais.totalRealizado}</td>
                  <td className="pt-3 pr-3 text-right tabular-nums">{d.totais.totalMeta}</td>
                  <td className="pt-3 pr-3 text-right tabular-nums">
                    {d.totais.totalRealizado - d.totais.totalMeta > 0 ? "+" : ""}{d.totais.totalRealizado - d.totais.totalMeta}
                  </td>
                  <td className="pt-3 text-right tabular-nums">{Math.round(d.totais.pctBruto)}%</td>
                </tr>
              </tfoot>
            </table>
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
            <GraficoTipo
              titulo="Ações Geral"
              linhas={d.geral}
              curtos={d.curtos}
              tecnicoSel={f.tecnico}
              onTecnico={alternaTecnico}
              tipoSel={f.tipo === null}
              tipoFiltrando={false}
              onTipo={() => mudar({ tipo: null })}
            />
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
            <div className="md:col-span-2 2xl:col-span-3">
            <Tendencia
              titulo={`Evolução do atingimento · ${f.ano}${f.tecnico ? ` · ${f.tecnico}` : ""}${f.tipo ? ` · ${TIPO_INFO[f.tipo].curto}` : ""}`}
              dados={d.serie}
              mesesSel={f.meses}
              mesParcial={mesCorrente}
              onMes={abreMes}
            />
            </div>
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
      {capturando && (
        <div aria-hidden style={{ position: "fixed", left: -10000, top: 0, width: 1280, height: 720, pointerEvents: "none" }}>
          <SlideFoto
            ref={slideRef}
            periodo={periodoRotulo}
            filtros={f.tecnico ? `Técnico: ${f.tecnico}` : ""}
            geral={d.geral}
            porTipo={d.equipe.porTipo}
            curtos={d.curtos}
            tecnicoSel={f.tecnico}
            totais={d.equipe}
            hoje={hoje}
          />
        </div>
      )}

      <dialog
        ref={dialogRef}
        onClose={() => {
          if (prev) URL.revokeObjectURL(prev.url);
          setPrev(null);
        }}
        aria-label="Pré-visualização da foto"
        className="m-auto w-[min(96vw,64rem)] rounded-2xl border border-line bg-surface p-0 text-fg backdrop:bg-black/60"
      >
        <div className="flex items-center gap-3 border-b border-line px-5 py-3">
          <h2 className="text-lg font-bold">Pré-visualização · 16:9</h2>
          <button type="button" onClick={() => dialogRef.current?.close()} className="ml-auto grid size-9 place-items-center rounded-lg text-muted hover:text-fg" aria-label="Fechar">
            <X size={18} aria-hidden />
          </button>
        </div>
        <div className="p-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {prev && <img src={prev.url} alt={`Foto dos gráficos principais — ${periodoRotulo}`} className="aspect-video w-full rounded-xl border border-line bg-white" />}
          <p className="mt-2 text-xs text-muted">Formato 16:9 (2560×1440), pronto para colar no PowerPoint ou enviar pelo WhatsApp.</p>
        </div>
        <div className="flex flex-wrap justify-end gap-2 border-t border-line px-5 py-3">
          <button type="button" onClick={() => dialogRef.current?.close()} className="btn btn-ghost">Fechar</button>
          <button type="button" onClick={compartilharFoto} className="btn btn-ghost"><Share2 size={18} aria-hidden /> Compartilhar</button>
          <button type="button" onClick={baixarFoto} className="btn"><Download size={18} aria-hidden /> Baixar PNG</button>
        </div>
      </dialog>
    </div>
  );
}
