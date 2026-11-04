"use client";

import { Area, AreaChart, CartesianGrid, LabelList, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { PontoMensal } from "@/lib/relatorio";

type Props = { titulo: string; dados: PontoMensal[]; mesesSel: string[]; mesParcial: string; onMes: (mes: string) => void };

export function Tendencia({ titulo, dados, mesesSel, mesParcial, onMes }: Props) {
  const d = dados.map((x) => ({ ...x, pct: Math.round(x.pct), rotulo: x.mes === mesParcial ? `${x.rotulo}*` : x.rotulo }));
  const temParcial = d.some((x) => x.mes === mesParcial);
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
              margin={{ top: 38, right: 30, left: -16, bottom: 0 }}
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
              {d
                .filter((x) => mesesSel.includes(x.mes))
                .map((x) => (
                  <ReferenceLine key={x.mes} x={x.rotulo} stroke="var(--brand)" strokeWidth={2} strokeOpacity={0.5} />
                ))}
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
              >
                <LabelList
                  dataKey="pct"
                  content={(p) => {
                    const i = Number(p.index);
                    const x = Number(p.x);
                    const y = Number(p.y);
                    const pt = d[i];
                    if (!pt || Number.isNaN(x) || Number.isNaN(y)) return null;
                    return (
                      <g style={{ pointerEvents: "none" }}>
                        <text x={x} y={y - 22} textAnchor="middle" fontSize={11} fontWeight={700} fill="var(--fg)">{pt.pct}%</text>
                        <text x={x} y={y - 10} textAnchor="middle" fontSize={9.5} fill="var(--muted)">{pt.realizado}/{pt.meta}</text>
                      </g>
                    );
                  }}
                />
              </Area>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
      <p className="mt-1 text-center text-xs text-muted">
        Rótulos: % da meta e realizado/meta no mês · clique em um ponto para abrir o mês{temParcial ? " · * mês em andamento" : ""}
      </p>
    </figure>
  );
}
