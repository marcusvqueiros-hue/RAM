"use client";

import { useActionState, useState } from "react";
import { CheckCircle2, Send } from "lucide-react";
import { TIPOS, TIPO_INFO, type TipoAcao } from "@/lib/tipos";
import { registrarAcao, type EstadoRegistro } from "./actions";

function Campos({ hoje, minimo }: { hoje: string; minimo: string }) {
  const [tipo, setTipo] = useState<TipoAcao | "">("");
  return (
    <>
      <fieldset className="grid gap-2">
        <legend className="mb-1 text-sm font-semibold">Tipo de ação</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {TIPOS.map((t) => (
            <label
              key={t}
              className={`flex cursor-pointer flex-col rounded-xl border p-3 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand ${
                tipo === t ? "border-brand bg-brandsoft" : "border-line hover:bg-surface2"
              }`}
            >
              <input
                type="radio"
                name="tipo"
                value={t}
                required
                checked={tipo === t}
                onChange={() => setTipo(t)}
                className="sr-only"
              />
              <span className="font-semibold">{TIPO_INFO[t].nome}</span>
              <span className="text-xs text-muted">{TIPO_INFO[t].descricao}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5 text-sm font-medium">
          Data
          <input className="input" type="date" name="data" defaultValue={hoje} min={minimo} max={hoje} required />
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          Quantidade
          <input className="input" type="number" name="quantidade" defaultValue={1} min={1} max={50} inputMode="numeric" required />
        </label>
      </div>

      <label className="grid gap-1.5 text-sm font-medium">
        <span>
          {tipo ? TIPO_INFO[tipo].referencia : "Local / referência"} <span className="font-normal text-muted">(opcional)</span>
        </span>
        <input className="input" name="local" maxLength={120} />
      </label>
      <label className="grid gap-1.5 text-sm font-medium">
        <span>
          Observações <span className="font-normal text-muted">(opcional)</span>
        </span>
        <textarea className="input !min-h-24 py-2" name="observacao" maxLength={500} rows={3} />
      </label>

    </>
  );
}

export function FormRegistro({ hoje, minimo }: { hoje: string; minimo: string }) {
  const [estado, action, pendente] = useActionState<EstadoRegistro, FormData>(registrarAcao, {});
  return (
    <form action={action} className="card grid gap-5 p-5 sm:p-6">
      {/* key novo após cada sucesso → campos voltam ao estado inicial */}
      <Campos key={estado.ts ?? 0} hoje={hoje} minimo={minimo} />

      <div aria-live="polite" className="min-h-6 text-sm">
        {estado.erro && (
          <p role="alert" className="rounded-lg bg-badsoft px-3 py-2 text-bad">
            {estado.erro}
          </p>
        )}
        {estado.ok && (
          <p className="flex items-center gap-2 rounded-lg bg-oksoft px-3 py-2 text-ok">
            <CheckCircle2 size={18} aria-hidden /> {estado.ok}
          </p>
        )}
      </div>

      <button className="btn" disabled={pendente}>
        <Send size={18} aria-hidden /> {pendente ? "Salvando…" : "Registrar ação"}
      </button>
    </form>
  );
}
