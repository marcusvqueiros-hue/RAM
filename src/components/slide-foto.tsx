import type { Ref } from "react";
import { GraficoTipo } from "./grafico-tipo";
import { TIPO_INFO } from "@/lib/tipos";
import { formataData } from "@/lib/datas";
import type { LinhaTecnico, Relatorio } from "@/lib/relatorio";

type Props = {
  ref?: Ref<HTMLDivElement>;
  periodo: string;
  filtros: string;
  geral: LinhaTecnico[];
  porTipo: Relatorio["porTipo"];
  curtos: Map<string, string>;
  tecnicoSel: string | null;
  totais: Relatorio;
  hoje: string;
};

const nada = () => {};

/** Slide 16:9 (1280×720) com os 6 gráficos principais — sempre em tema claro, ideal para PowerPoint/WhatsApp. */
export function SlideFoto({ ref, periodo, filtros, geral, porTipo, curtos, tecnicoSel, totais, hoje }: Props) {
  const comum = { curtos, tecnicoSel, onTecnico: nada, tipoFiltrando: false, tipoSel: false, onTipo: nada, compacto: true } as const;
  return (
    <div ref={ref} className="login-light flex flex-col" style={{ width: 1280, height: 720, background: "#f6f4f5", padding: 18, gap: 10 }}>
      <div className="grid items-end" style={{ gridTemplateColumns: "1fr auto 1fr" }}>
        <div>
          <p className="text-2xl font-extrabold leading-tight text-brand">Relatório de Atividades Mensais</p>
          <p className="text-sm text-muted">
            {periodo}
            {filtros ? ` · ${filtros}` : ""}
          </p>
        </div>
        <div className="flex items-center justify-center gap-8 text-center">
          <div>
            <p className="text-2xl font-extrabold tabular-nums leading-none">{totais.totalRealizado}</p>
            <p className="text-xs text-muted">Realizado</p>
          </div>
          <div>
            <p className="text-2xl font-extrabold tabular-nums leading-none">{totais.totalMeta}</p>
            <p className="text-xs text-muted">Meta</p>
          </div>
          <div>
            <p className="text-2xl font-extrabold tabular-nums leading-none text-brand">{Math.round(totais.pctBruto)}%</p>
            <p className="text-xs text-muted">% Realizado</p>
          </div>
          <div>
            <p className="text-2xl font-extrabold tabular-nums leading-none">{Math.round(totais.pctCumprimento)}%</p>
            <p className="text-xs text-muted">Cumprimento por tipo</p>
          </div>
        </div>
        <div aria-hidden />
      </div>

      <div className="grid flex-1 grid-cols-3 gap-3" style={{ gridTemplateRows: "repeat(2, 1fr)" }}>
        <GraficoTipo titulo="Ações Geral" linhas={geral} {...comum} />
        {porTipo.map((t) => (
          <GraficoTipo key={t.tipo} titulo={TIPO_INFO[t.tipo].nome} linhas={t.linhas} {...comum} />
        ))}
      </div>

      <div className="flex items-center justify-between text-xs text-muted">
        <span className="flex items-center gap-4">
          <span className="flex items-center gap-1.5"><i className="size-2.5 rounded-sm bg-ok" /> Meta batida</span>
          <span className="flex items-center gap-1.5"><i className="size-2.5 rounded-sm bg-bad" /> Abaixo da meta</span>
          <span className="flex items-center gap-1.5"><i className="h-0.5 w-4 rounded bg-warn" /> Meta</span>
        </span>
        <span>RAM Segurança · gerado em {formataData(hoje)}</span>
      </div>
    </div>
  );
}
