"use client";

import { Bar, Rectangle, CartesianGrid, ComposedChart, LabelList, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { LinhaTecnico } from "@/lib/relatorio";

type DotProps = { cx?: number; cy?: number };
const MetaTraco = ({ cx, cy }: DotProps) =>
  cx == null || cy == null ? null : <line x1={cx - 22} x2={cx + 22} y1={cy} y2={cy} stroke="var(--warn)" strokeWidth={3} strokeLinecap="round" />;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Barra = (p: any) => <Rectangle {...p} fill={p.payload.ok ? "var(--ok)" : "var(--bad)"} />;

export function GraficoTipo({ titulo, linhas }: { titulo: string; linhas: LinhaTecnico[] }) {
  const dados = linhas.map((l) => ({ ...l, ok: l.meta === 0 || l.realizado >= l.meta }));
  return (
    <figure className="card p-4 sm:p-5">
      <figcaption className="mb-2 text-center text-lg font-bold">{titulo}</figcaption>
      <div className="h-64" aria-hidden>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={dados} margin={{ top: 22, right: 8, left: -24, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis dataKey="tecnico" tickLine={false} axisLine={false} tick={{ fill: "var(--muted)", fontSize: 12 }} interval={0} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "var(--muted)", fontSize: 12 }} />
            <Tooltip
              cursor={{ fill: "var(--surface-2)" }}
              contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--fg)" }}
              formatter={(v, n) => [v as number, n === "realizado" ? "Realizado" : "Meta"]}
            />
            <Bar dataKey="realizado" radius={[8, 8, 0, 0]} maxBarSize={72} isAnimationActive={false} shape={Barra}>
              <LabelList dataKey="realizado" position="top" fill="var(--fg)" fontSize={13} fontWeight={700} />
            </Bar>
            <Line dataKey="meta" stroke="none" dot={<MetaTraco />} activeDot={false} isAnimationActive={false} legendType="none" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
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
