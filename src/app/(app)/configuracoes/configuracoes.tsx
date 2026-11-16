"use client";

import { useRouter } from "next/navigation";
import { useActionState, useState } from "react";
import { Check, RotateCcw, Save, Settings2, UserMinus } from "lucide-react";
import { TIPOS, TIPO_INFO, type TipoAcao } from "@/lib/tipos";
import { reativarNoMes, retirarDoMes, salvarMetas, salvarPadrao, type EstadoMetas } from "./actions";

export type LinhaMeta = { id: string; nome: string; metas: Record<TipoAcao, number>; definida: boolean; acoes: number };

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

function LinhaTecnico({ l, mes, rotuloMes }: { l: LinhaMeta; mes: string; rotuloMes: string }) {
  const [e, action, pend] = useActionState<EstadoMetas, FormData>(salvarMetas, {});
  const [eR, retirar, pendR] = useActionState<EstadoMetas, FormData>(retirarDoMes, {});
  const [eA, reativar, pendA] = useActionState<EstadoMetas, FormData>(reativarNoMes, {});
  const [confirmando, setConfirmando] = useState(false);
  const total = TIPOS.reduce((s, t) => s + l.metas[t], 0);
  const fora = l.definida && total === 0; // sem metas no mês = fora do mês (some dos relatórios)
  return (
    <>
      <tr className={`border-b border-line ${fora ? "opacity-60" : ""}`}>
        <td className="py-2.5 pr-3 font-semibold">
          {l.nome}
          {fora && <span className="ml-2 rounded-full bg-badsoft px-2 py-0.5 text-xs font-medium text-bad">fora deste mês</span>}
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
          <form id={`f-${l.id}`} action={action} className="flex items-center justify-end gap-2">
            <input type="hidden" name="tecnico_id" value={l.id} />
            <input type="hidden" name="mes" value={mes} />
            <Retorno e={e} />
            <button className="btn !min-h-10 !px-3 text-sm" disabled={pend}>
              <Save size={16} aria-hidden /> {pend ? "Salvando…" : "Salvar"}
            </button>
            {fora ? (
              <button formAction={reativar} className="btn btn-ghost !min-h-10 !px-3 text-sm" disabled={pendA} title="Voltar com as metas padrão">
                <RotateCcw size={16} aria-hidden /> {pendA ? "…" : "Reativar"}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmando((v) => !v)}
                aria-expanded={confirmando}
                className="btn btn-ghost !min-h-10 !px-3 text-sm text-bad"
                title="Retirar este técnico do mês"
              >
                <UserMinus size={16} aria-hidden /> Retirar
              </button>
            )}
          </form>
          {eA.erro && <p role="alert" className="mt-1 text-xs text-bad">{eA.erro}</p>}
        </td>
      </tr>
      {confirmando && !fora && (
        <tr className="border-b border-line bg-badsoft">
          <td colSpan={8} className="px-4 py-3">
            <form action={retirar} className="flex flex-wrap items-center gap-4">
              <input type="hidden" name="tecnico_id" value={l.id} />
              <input type="hidden" name="mes" value={mes} />
              <p className="text-sm">
                Retirar <strong>{l.nome}</strong> de <strong>{rotuloMes}</strong>? Ele deixa de aparecer nos relatórios, no ranking e na base deste mês.
              </p>
              {l.acoes > 0 && (
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="apagar" className="size-4 accent-[var(--bad)]" />
                  Apagar também as <strong>{l.acoes}</strong> ações lançadas neste mês (não dá para desfazer)
                </label>
              )}
              <div className="ml-auto flex items-center gap-2">
                <button type="button" onClick={() => setConfirmando(false)} className="btn btn-ghost !min-h-10 !px-3 text-sm">Cancelar</button>
                <button className="btn !min-h-10 !px-3 text-sm !bg-[var(--bad)]" disabled={pendR}>
                  <UserMinus size={16} aria-hidden /> {pendR ? "Retirando…" : "Confirmar"}
                </button>
              </div>
            </form>
            {eR.erro && <p role="alert" className="mt-2 text-sm text-bad">{eR.erro}</p>}
          </td>
        </tr>
      )}
    </>
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
          <p className="text-muted">Metas de cada técnico por tipo de ação. Alterações valem para o mês escolhido. Use <strong>Retirar</strong> para tirar um técnico do mês (férias, afastamento, transferência).</p>
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
                <LinhaTecnico key={`${mes}-${l.id}`} l={l} mes={mes} rotuloMes={meses.find((m) => m.valor === mes)?.rotulo ?? mes} />
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
