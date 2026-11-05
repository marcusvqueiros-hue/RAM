"use client";

import { useMemo, useState } from "react";
import { Database, Download } from "lucide-react";
import { baixarCsv } from "@/lib/csv";
import { formataData } from "@/lib/datas";
import { rotuloMesCap } from "@/lib/relatorio";
import { TIPOS, TIPO_INFO, type Linha, type TipoAcao } from "@/lib/tipos";

export type Registro = {
  id: string;
  data: string;
  tecnico: string;
  tipo: TipoAcao;
  quantidade: number;
  local: string | null;
  observacao: string | null;
  origem: string;
  criadoEm: string;
};

const LIMITE = 300;
const ORIGEM: Record<string, string> = { app: "Sistema", importacao_excel: "Planilha (total mensal)" };

export function BaseDeDados({ resumo, registros }: { resumo: Linha[]; registros: Registro[] }) {
  const [modo, setModo] = useState<"resumo" | "registros">("resumo");
  const [ano, setAno] = useState("");
  const [mes, setMes] = useState("");
  const [tecnico, setTecnico] = useState("");
  const [tipo, setTipo] = useState<TipoAcao | "">("");
  const [limite, setLimite] = useState(LIMITE);

  const anos = useMemo(() => [...new Set(resumo.map((r) => r.mes.slice(0, 4)))].sort().reverse(), [resumo]);
  const tecnicos = useMemo(() => [...new Set([...resumo.map((r) => r.tecnico), ...registros.map((r) => r.tecnico)])].sort((a, b) => a.localeCompare(b)), [resumo, registros]);
  const meses = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));

  const passaPeriodo = (iso: string) => (!ano || iso.startsWith(ano)) && (!mes || iso.slice(5, 7) === mes);

  /** Resumo: uma linha por técnico × mês, com as 5 colunas de realizado, total, meta e %. */
  const linhasResumo = useMemo(() => {
    const m = new Map<string, { tecnico: string; mes: string; real: Record<TipoAcao, number>; meta: number }>();
    for (const r of resumo) {
      if (!passaPeriodo(r.mes) || (tecnico && r.tecnico !== tecnico)) continue;
      const k = `${r.mes}|${r.tecnico}`;
      const l = m.get(k) ?? { tecnico: r.tecnico, mes: r.mes, real: Object.fromEntries(TIPOS.map((t) => [t, 0])) as Record<TipoAcao, number>, meta: 0 };
      l.real[r.tipo] += r.realizado;
      l.meta += r.meta;
      m.set(k, l);
    }
    return [...m.values()].sort((a, b) => b.mes.localeCompare(a.mes) || a.tecnico.localeCompare(b.tecnico));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumo, ano, mes, tecnico]);

  const linhasRegistros = useMemo(
    () => registros.filter((r) => passaPeriodo(r.data) && (!tecnico || r.tecnico === tecnico) && (!tipo || r.tipo === tipo)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [registros, ano, mes, tecnico, tipo],
  );

  const totResumo = linhasResumo.reduce((s, l) => s + TIPOS.reduce((x, t) => x + l.real[t], 0), 0);
  const totRegistros = linhasRegistros.reduce((s, r) => s + r.quantidade, 0);

  function exportar() {
    const sufixo = [ano || "todos-anos", mes || "todos-meses", tecnico.replace(/[^\p{L}\p{N}]+/gu, "") || "todos"].join("_");
    if (modo === "resumo") {
      baixarCsv(
        `RAM_base-de-dados_resumo_${sufixo}.csv`,
        ["Técnico", "Ano", "Mês", ...TIPOS.map((t) => `${TIPO_INFO[t].nome} (realizado)`), "Total realizado", "Meta total", "% da meta"],
        linhasResumo.map((l) => {
          const total = TIPOS.reduce((s, t) => s + l.real[t], 0);
          return [l.tecnico, l.mes.slice(0, 4), l.mes.slice(5, 7), ...TIPOS.map((t) => l.real[t]), total, l.meta, l.meta ? Math.round((total / l.meta) * 100) + "%" : ""];
        }),
      );
    } else {
      baixarCsv(
        `RAM_base-de-dados_registros_${sufixo}${tipo ? "_" + tipo : ""}.csv`,
        ["Data", "Técnico", "Tipo de ação", "Quantidade", "Código / local", "Observações", "Origem", "Registrado em"],
        linhasRegistros.map((r) => [
          formataData(r.data),
          r.tecnico,
          TIPO_INFO[r.tipo].nome,
          r.quantidade,
          r.local,
          r.observacao,
          ORIGEM[r.origem] ?? r.origem,
          new Date(r.criadoEm).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }),
        ]),
      );
    }
  }

  const total = modo === "resumo" ? linhasResumo.length : linhasRegistros.length;
  const abaCls = (ativa: boolean) =>
    `rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${ativa ? "bg-brand text-brandfg" : "border border-line text-muted hover:text-fg"}`;

  return (
    <div className="grid w-full gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-brand">
            <Database aria-hidden /> Base de Dados
          </h1>
          <p className="text-muted">O que foi realizado por cada técnico — filtre e exporte em CSV (abre direto no Excel).</p>
        </div>
        <button type="button" onClick={exportar} disabled={total === 0} className="btn !min-h-11">
          <Download size={18} aria-hidden /> Exportar CSV ({total})
        </button>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex gap-2" role="tablist" aria-label="Visão dos dados">
          <button role="tab" aria-selected={modo === "resumo"} className={abaCls(modo === "resumo")} onClick={() => { setModo("resumo"); setLimite(LIMITE); }}>
            Resumo mensal
          </button>
          <button role="tab" aria-selected={modo === "registros"} className={abaCls(modo === "registros")} onClick={() => { setModo("registros"); setLimite(LIMITE); }}>
            Registros detalhados
          </button>
        </div>
        <label className="grid gap-1 text-xs font-medium text-muted">
          Ano
          <select className="input !w-auto" value={ano} onChange={(e) => { setAno(e.target.value); setLimite(LIMITE); }}>
            <option value="">Todos</option>
            {anos.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-xs font-medium text-muted">
          Mês
          <select className="input !w-auto" value={mes} onChange={(e) => { setMes(e.target.value); setLimite(LIMITE); }}>
            <option value="">Todos</option>
            {meses.map((m) => <option key={m} value={m}>{rotuloMesCap(`2026-${m}-01`).split(" ")[0]}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-xs font-medium text-muted">
          Técnico
          <select className="input !w-auto" value={tecnico} onChange={(e) => { setTecnico(e.target.value); setLimite(LIMITE); }}>
            <option value="">Todos</option>
            {tecnicos.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        {modo === "registros" && (
          <label className="grid gap-1 text-xs font-medium text-muted">
            Tipo de ação
            <select className="input !w-auto" value={tipo} onChange={(e) => { setTipo(e.target.value as TipoAcao | ""); setLimite(LIMITE); }}>
              <option value="">Todos</option>
              {TIPOS.map((t) => <option key={t} value={t}>{TIPO_INFO[t].nome}</option>)}
            </select>
          </label>
        )}
      </div>

      <section className="card overflow-x-auto p-5" aria-label="Dados">
        {total === 0 ? (
          <p className="py-6 text-center text-muted">Nenhum dado para os filtros escolhidos.</p>
        ) : modo === "resumo" ? (
          <table className="w-full min-w-[60rem] text-left text-sm">
            <thead className="text-muted">
              <tr className="border-b border-line">
                <th className="py-2 pr-3 font-medium">Técnico</th>
                <th className="py-2 pr-3 font-medium">Mês</th>
                {TIPOS.map((t) => <th key={t} className="px-2 py-2 text-right font-medium">{TIPO_INFO[t].curto}</th>)}
                <th className="px-2 py-2 text-right font-medium">Total</th>
                <th className="px-2 py-2 text-right font-medium">Meta</th>
                <th className="py-2 pl-2 text-right font-medium">%</th>
              </tr>
            </thead>
            <tbody>
              {linhasResumo.slice(0, limite).map((l) => {
                const t = TIPOS.reduce((s, x) => s + l.real[x], 0);
                const p = l.meta ? Math.round((t / l.meta) * 100) : null;
                return (
                  <tr key={`${l.mes}-${l.tecnico}`} className="border-b border-line last:border-0">
                    <td className="py-2 pr-3 font-semibold">{l.tecnico}</td>
                    <td className="py-2 pr-3 text-muted">{rotuloMesCap(l.mes, "curto")}</td>
                    {TIPOS.map((x) => <td key={x} className="px-2 py-2 text-right tabular-nums">{l.real[x]}</td>)}
                    <td className="px-2 py-2 text-right font-bold tabular-nums">{t}</td>
                    <td className="px-2 py-2 text-right tabular-nums text-muted">{l.meta}</td>
                    <td className={`py-2 pl-2 text-right font-semibold tabular-nums ${p == null ? "" : p >= 100 ? "text-ok" : "text-bad"}`}>{p == null ? "—" : `${p}%`}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="font-bold">
                <td className="pt-3 pr-3" colSpan={2}>Total do filtro</td>
                {TIPOS.map((x) => <td key={x} className="px-2 pt-3 text-right tabular-nums">{linhasResumo.reduce((s, l) => s + l.real[x], 0)}</td>)}
                <td className="px-2 pt-3 text-right tabular-nums">{totResumo}</td>
                <td className="px-2 pt-3 text-right tabular-nums">{linhasResumo.reduce((s, l) => s + l.meta, 0)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        ) : (
          <table className="w-full min-w-[56rem] text-left text-sm">
            <thead className="text-muted">
              <tr className="border-b border-line">
                <th className="py-2 pr-3 font-medium">Data</th>
                <th className="py-2 pr-3 font-medium">Técnico</th>
                <th className="py-2 pr-3 font-medium">Tipo de ação</th>
                <th className="py-2 pr-3 text-right font-medium">Qtd</th>
                <th className="py-2 pr-3 font-medium">Código / local</th>
                <th className="py-2 pr-3 font-medium">Observações</th>
                <th className="py-2 font-medium">Origem</th>
              </tr>
            </thead>
            <tbody>
              {linhasRegistros.slice(0, limite).map((r) => (
                <tr key={r.id} className="border-b border-line align-top last:border-0">
                  <td className="py-2 pr-3 tabular-nums">{formataData(r.data)}</td>
                  <td className="py-2 pr-3 font-semibold">{r.tecnico}</td>
                  <td className="py-2 pr-3">{TIPO_INFO[r.tipo].nome}</td>
                  <td className="py-2 pr-3 text-right tabular-nums">{r.quantidade}</td>
                  <td className="py-2 pr-3">{r.local ?? ""}</td>
                  <td className="max-w-xs py-2 pr-3 text-muted">{r.observacao ?? ""}</td>
                  <td className="py-2 text-muted">{ORIGEM[r.origem] ?? r.origem}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-bold">
                <td className="pt-3 pr-3" colSpan={3}>Total de ações no filtro</td>
                <td className="pt-3 pr-3 text-right tabular-nums">{totRegistros}</td>
                <td colSpan={3} />
              </tr>
            </tfoot>
          </table>
        )}
        {total > limite && (
          <div className="mt-4 flex items-center justify-center gap-3 text-sm text-muted">
            Mostrando {limite} de {total} linhas na tela (o CSV leva todas).
            <button type="button" className="btn btn-ghost !min-h-9 !px-3 text-sm" onClick={() => setLimite((l) => l + LIMITE)}>
              Mostrar mais
            </button>
          </div>
        )}
      </section>
      {modo === "registros" && (
        <p className="text-xs text-muted">
          O histórico de 2024 a out/2026 veio da planilha como <strong>total mensal por tipo</strong> (origem “Planilha”). Os lançamentos feitos no sistema aparecem
          um a um, com data, código e observações.
        </p>
      )}
    </div>
  );
}
