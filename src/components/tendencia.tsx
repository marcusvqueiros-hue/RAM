"use client";

import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { PontoMensal } from "@/lib/relatorio";

type Props = { titulo: string; dados: PontoMensal[]; mesSel: string | null; onMes: (mes: string) => void };

export function Tendencia({ titulo, dados, mesSel, onMes }: Props) {
  const d = dados.map((x) => ({ ...x, pct: Math.round(x.pct) }));
  return (
    <figure className="card p-4 sm:p-5">
      <figcaption className="mb-2 text-lg font-bold">{titulo}</figcaption>
      {d.length === 0 ? (
        <p className="grid h-64 place-items-center text-sm text-muted">Sem meses encerrados neste ano</p>
      ) : (
        <div className="h-64" aria-hidden>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={d}
              margin={{ top: 10, right: 12, left: -16, bottom: 0 }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              onClick={(s: any) => {
                const i = Number(s?.activeIndex);
                if (Number.isInteger(i) && d[i]) onMes(d[i].mes);
              }}
              style={{ cursor: "pointer" }}
            >
              <defs>
                <linearGradient id="gtend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--brand)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--brand)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="rotulo" tickLine={false} axisLine={false} tick={{ fill: "var(--muted)", fontSize: 11 }} minTickGap={12} />
              <YAxis unit="%" tickLine={false} axisLine={false} tick={{ fill: "var(--muted)", fontSize: 11 }} domain={[0, (m: number) => Math.max(120, Math.ceil(m / 10) * 10)]} />
              <ReferenceLine y={100} stroke="var(--warn)" strokeDasharray="4 4" label={{ value: "Meta", fill: "var(--warn)", fontSize: 11, position: "insideTopRight" }} />
              {mesSel && d.some((x) => x.mes === mesSel) && (
                <ReferenceLine x={d.find((x) => x.mes === mesSel)!.rotulo} stroke="var(--brand)" strokeWidth={2} strokeOpacity={0.5} />
              )}
              <Tooltip
                contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--fg)" }}
                formatter={(v, _n, p) => [`${v}% (${p.payload.realizado}/${p.payload.meta})`, "Atingimento"]}
              />
              <Area
                dataKey="pct"
                stroke="var(--brand)"
                strokeWidth={2.5}
                fill="url(#gtend)"
                isAnimationActive={false}
                dot={{ r: 3.5, fill: "var(--brand)" }}
                activeDot={{ r: 6 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
      <p className="mt-1 text-center text-xs text-muted">Clique em um ponto para abrir o mês</p>
    </figure>
  );
}
