"use client";

import { useRouter } from "next/navigation";
import { rotuloMes } from "@/lib/datas";

export function SeletorMes({ atual, meses }: { atual: string; meses: string[] }) {
  const router = useRouter();
  return (
    <label className="flex items-center gap-2 text-sm font-medium">
      <span className="text-muted">Mês</span>
      <select
        className="input !w-auto capitalize"
        value={atual}
        onChange={(e) => router.push(`/relatorios?mes=${e.target.value.slice(0, 7)}`)}
      >
        {meses.map((m) => (
          <option key={m} value={m}>
            {rotuloMes(m)}
          </option>
        ))}
      </select>
    </label>
  );
}
