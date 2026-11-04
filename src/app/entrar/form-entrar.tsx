"use client";

import { useActionState } from "react";
import { LogIn } from "lucide-react";
import { entrar, type EstadoForm } from "./actions";

export function FormEntrar({ next }: { next: string }) {
  const [estado, action, pendente] = useActionState<EstadoForm, FormData>(entrar, {});
  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="next" value={next} />
      <label className="grid gap-1.5 text-sm font-medium">
        E-mail
        <input className="input" name="email" type="email" autoComplete="email" required placeholder="voce@empresa.com" />
      </label>
      <label className="grid gap-1.5 text-sm font-medium">
        Senha
        <input className="input" name="senha" type="password" autoComplete="current-password" required />
      </label>
      {estado.erro && (
        <p role="alert" className="rounded-lg bg-badsoft px-3 py-2 text-sm text-bad">
          {estado.erro}
        </p>
      )}
      <button className="btn" disabled={pendente}>
        <LogIn size={18} aria-hidden /> {pendente ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
