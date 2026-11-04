"use client";

import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Relatorio } from "@/lib/relatorio";

export function Tendencia({ dados }: { dados: Relatorio["tendencia"] }) {
  const d = dados.slice(-18).map((x) => ({ ...x, pct: Math.round(x.pct) }));
  return (
    <figure className="card p-4 sm:p-5">
      <figcaption className="mb-2 text-lg font-bold">Evolução do atingimento da equipe</figcaption>
      <div className="h-64" aria-hidden>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={d} margin={{ top: 10, right: 12, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="gtend" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--brand)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--brand)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis dataKey="rotulo" tickLine={false} axisLine={false} tick={{ fill: "var(--muted)", fontSize: 11 }} minTickGap={16} />
            <YAxis unit="%" tickLine={false} axisLine={false} tick={{ fill: "var(--muted)", fontSize: 11 }} domain={[0, (m: number) => Math.max(120, Math.ceil(m / 10) * 10)]} />
            <ReferenceLine y={100} stroke="var(--warn)" strokeDasharray="4 4" label={{ value: "Meta", fill: "var(--warn)", fontSize: 11, position: "insideTopRight" }} />
            <Tooltip
              contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--fg)" }}
              formatter={(v, _n, p) => [`${v}% (${p.payload.realizado}/${p.payload.meta})`, "Atingimento"]}
            />
            <Area dataKey="pct" stroke="var(--brand)" strokeWidth={2.5} fill="url(#gtend)" isAnimationActive={false} dot={{ r: 3, fill: "var(--brand)" }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </figure>
  );
}
