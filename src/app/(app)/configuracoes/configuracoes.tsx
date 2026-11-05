"use client";

import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { Check, Save, Settings2 } from "lucide-react";
import { TIPOS, TIPO_INFO, type TipoAcao } from "@/lib/tipos";
import { salvarMetas, salvarPadrao, type EstadoMetas } from "./actions";

export type LinhaMeta = { id: string; nome: string; metas: Record<TipoAcao, number>; definida: boolean };

function Num({ name, valor, form, rotulo }: { name: string; valor: number; form?: string; rotulo: string }) {
  return (
    <input
      className="input !min-h-10 !w-20 text-center tabular-nums"
      type="number"
      name={name}
      defaultValue={valor}
      min={0}
      max={999}
      inputMode="numeric"
      required
      aria-label={rotulo}
      form={form}
    />
  );
}

function Retorno({ e }: { e: EstadoMetas }) {
  if (e.erro) return <span role="alert" className="text-xs text-bad">{e.erro}</span>;
  if (e.ok) return <span className="flex items-center gap-1 text-xs text-ok"><Check size={14} aria-hidden /> {e.ok}</span>;
  return null;
}

function LinhaTecnico({ l, mes }: { l: LinhaMeta; mes: string }) {
  const [e, action, pend] = useActionState<EstadoMetas, FormData>(salvarMetas, {});
  const total = TIPOS.reduce((s, t) => s + l.metas[t], 0);
  return (
    <tr className="border-b border-line last:border-0">
      <td className="py-2.5 pr-3 font-semibold">
        {l.nome}
        {!l.definida && <span className="ml-2 rounded-full bg-warnsoft px-2 py-0.5 text-xs font-medium text-warn">usando padrão</span>}
      </td>
      {TIPOS.map((t) => (
        <td key={t} className="px-1.5 py-2.5 text-center">
          <Num name={t} valor={l.metas[t]} form={`f-${l.id}`} rotulo={`${TIPO_INFO[t].nome} de ${l.nome}`} />
        </td>
      ))}
      <td className="px-3 py-2.5 text-center font-bold tabular-nums">{total}</td>
      <td className="py-2.5 pl-3 text-right">
        {/* os inputs ficam na mesma linha da tabela; o form os referencia pelo atributo form */}
        <form id={`f-${l.id}`} action={action} className="flex items-center justify-end gap-3">
          <input type="hidden" name="tecnico_id" value={l.id} />
          <input type="hidden" name="mes" value={mes} />
          <Retorno e={e} />
          <button className="btn !min-h-10 !px-3 text-sm" disabled={pend}>
            <Save size={16} aria-hidden /> {pend ? "Salvando…" : "Salvar"}
          </button>
        </form>
      </td>
    </tr>
  );
}

export function Configuracoes({ mes, meses, linhas, padrao }: { mes: string; meses: { valor: string; rotulo: string }[]; linhas: LinhaMeta[]; padrao: Record<TipoAcao, number> }) {
  const router = useRouter();
  const [ep, actionP, pendP] = useActionState<EstadoMetas, FormData>(salvarPadrao, {});
  const totais = TIPOS.map((t) => linhas.reduce((s, l) => s + l.metas[t], 0));

  return (
    <div className="grid w-full gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-brand">
            <Settings2 aria-hidden /> Configurações
          </h1>
          <p className="text-muted">Metas de cada técnico por tipo de ação. Alterações valem para o mês escolhido.</p>
        </div>
        <label className="grid gap-1 text-xs font-medium text-muted">
          Mês das metas
          <select className="input !w-auto" value={mes} onChange={(e) => router.push(`/configuracoes?mes=${e.target.value.slice(0, 7)}`)}>
            {meses.map((m) => (
              <option key={m.valor} value={m.valor}>{m.rotulo}</option>
            ))}
          </select>
        </label>
      </div>

      <section className="card overflow-x-auto p-5" aria-labelledby="h-metas">
        <h2 id="h-metas" className="mb-3 text-lg font-bold">Metas por técnico</h2>
        {linhas.length === 0 ? (
          <p className="text-sm text-muted">Nenhum técnico com meta neste mês.</p>
        ) : (
          <table className="w-full min-w-[56rem] text-left text-sm">
            <thead className="text-muted">
              <tr className="border-b border-line">
                <th className="py-2 pr-3 font-medium">Técnico</th>
                {TIPOS.map((t) => (
                  <th key={t} className="px-1.5 py-2 text-center font-medium">{TIPO_INFO[t].curto}</th>
                ))}
                <th className="px-3 py-2 text-center font-medium">Total</th>
                <th className="py-2 pl-3 text-right font-medium">Ação</th>
              </tr>
            </thead>
            <tbody>
              {linhas.map((l) => (
                <LinhaTecnico key={`${mes}-${l.id}`} l={l} mes={mes} />
              ))}
            </tbody>
            <tfoot>
              <tr className="font-bold">
                <td className="pt-3 pr-3">Meta da equipe</td>
                {totais.map((v, i) => (
                  <td key={TIPOS[i]} className="pt-3 text-center tabular-nums">{v}</td>
                ))}
                <td className="px-3 pt-3 text-center tabular-nums">{totais.reduce((s, v) => s + v, 0)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        )}
      </section>

      <section className="card p-5" aria-labelledby="h-padrao">
        <h2 id="h-padrao" className="mb-1 text-lg font-bold">Metas padrão</h2>
        <p className="mb-4 text-sm text-muted">Aplicadas automaticamente a técnicos novos e aos meses criados pelo sistema a partir de agora (não alteram meses já existentes).</p>
        <form action={actionP} className="flex flex-wrap items-end gap-4">
          {TIPOS.map((t) => (
            <label key={t} className="grid gap-1 text-xs font-medium text-muted">
              {TIPO_INFO[t].nome}
              <Num name={t} valor={padrao[t]} rotulo={`Meta padrão: ${TIPO_INFO[t].nome}`} />
            </label>
          ))}
          <button className="btn !min-h-10" disabled={pendP}>
            <Save size={16} aria-hidden /> {pendP ? "Salvando…" : "Salvar padrão"}
          </button>
          <Retorno e={ep} />
        </form>
      </section>
    </div>
  );
}
