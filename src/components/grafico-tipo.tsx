"use client";

import { Bar, CartesianGrid, ComposedChart, LabelList, Line, Rectangle, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { LinhaTecnico } from "@/lib/relatorio";

type DotProps = { cx?: number; cy?: number };
const MetaTraco = ({ cx, cy }: DotProps) =>
  cx == null || cy == null ? null : <line x1={cx - 22} x2={cx + 22} y1={cy} y2={cy} stroke="var(--warn)" strokeWidth={3} strokeLinecap="round" />;

type Props = {
  titulo: string;
  linhas: LinhaTecnico[];
  curtos: Map<string, string>;
  tecnicoSel: string | null;
  onTecnico: (nome: string) => void;
  tipoSel: boolean; // este tipo está filtrado
  tipoFiltrando: boolean; // existe algum tipo filtrado
  onTipo: () => void;
};

export function GraficoTipo({ titulo, linhas, curtos, tecnicoSel, onTecnico, tipoSel, tipoFiltrando, onTipo }: Props) {
  const dados = linhas.map((l) => ({ ...l, curto: curtos.get(l.tecnico) ?? l.tecnico, ok: l.meta === 0 || l.realizado >= l.meta }));
  const apagado = tipoFiltrando && !tipoSel;
  const totReal = linhas.reduce((s, l) => s + l.realizado, 0);
  const totMeta = linhas.reduce((s, l) => s + l.meta, 0);
  const totPct = totMeta > 0 ? Math.round((totReal / totMeta) * 100) : 0;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderBarra = (p: any) => (
    <Rectangle
      {...p}
      fill={p.payload.ok ? "var(--ok)" : "var(--bad)"}
      fillOpacity={tecnicoSel && tecnicoSel !== p.payload.tecnico ? 0.25 : 1}
      style={{ cursor: "pointer" }}
      onClick={() => onTecnico(p.payload.tecnico)}
    />
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderTick = ({ x, y, payload }: any) => {
    const d = dados.find((l) => l.curto === payload.value);
    const sel = d && tecnicoSel === d.tecnico;
    return (
      <text
        x={x}
        y={y + 14}
        textAnchor="middle"
        fontSize={12}
        fontWeight={sel ? 700 : 400}
        fill={sel ? "var(--brand)" : "var(--muted)"}
        style={{ cursor: "pointer" }}
        onClick={() => d && onTecnico(d.tecnico)}
      >
        {payload.value}
      </text>
    );
  };

  return (
    <figure className={`card p-4 transition-opacity sm:p-5 ${apagado ? "opacity-45" : ""} ${tipoSel ? "ring-2 ring-brand" : ""}`}>
      <figcaption className="mb-2 text-center">
        <button
          type="button"
          onClick={onTipo}
          aria-pressed={tipoSel}
          title={tipoSel ? "Remover filtro deste tipo" : "Filtrar a página por este tipo"}
          className="rounded-lg px-2 py-0.5 text-lg font-bold transition-colors hover:bg-brandsoft hover:text-brand"
        >
          {titulo}
        </button>
      </figcaption>
      {dados.length === 0 ? (
        <p className="grid h-64 place-items-center text-sm text-muted">Sem dados no período</p>
      ) : (
        <div className="h-64" aria-hidden>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={dados} margin={{ top: 22, right: 8, left: -24, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="curto" tickLine={false} axisLine={false} interval={0} tick={renderTick} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "var(--muted)", fontSize: 12 }} />
              <Tooltip
                cursor={{ fill: "var(--surface-2)" }}
                contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--fg)" }}
                labelFormatter={(_l, p) => p?.[0]?.payload?.tecnico ?? ""}
                formatter={(v, n) => [v as number, n === "realizado" ? "Realizado" : "Meta"]}
              />
              <Bar dataKey="realizado" radius={[8, 8, 0, 0]} maxBarSize={72} isAnimationActive={false} shape={renderBarra}>
                <LabelList dataKey="realizado" position="top" fill="var(--fg)" fontSize={13} fontWeight={700} />
              </Bar>
              <Line dataKey="meta" stroke="none" dot={<MetaTraco />} activeDot={false} isAnimationActive={false} legendType="none" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
      <p className="mt-2 text-center text-sm">
        Total no período: <strong className="tabular-nums">{totReal}</strong> ações · meta <strong className="tabular-nums">{totMeta}</strong> ·{" "}
        <strong className={totPct >= 100 ? "text-ok" : "text-bad"}>{totPct}%</strong>
      </p>
      <div className="mt-1 flex justify-center gap-4 text-xs text-muted" aria-hidden>
        <span className="flex items-center gap-1.5"><i className="size-2.5 rounded-sm bg-ok" /> Meta batida</span>
        <span className="flex items-center gap-1.5"><i className="size-2.5 rounded-sm bg-bad" /> Abaixo</span>
        <span className="flex items-center gap-1.5"><i className="h-0.5 w-4 rounded bg-warn" /> Meta</span>
      </div>
      <table className="sr-only">
        <caption>{titulo}</caption>
        <thead><tr><th>Técnico</th><th>Realizado</th><th>Meta</th></tr></thead>
        <tbody>
          {linhas.map((l) => (
            <tr key={l.tecnico}><td>{l.tecnico}</td><td>{l.realizado}</td><td>{l.meta}</td></tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
