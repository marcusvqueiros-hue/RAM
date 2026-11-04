"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff, LogIn, Lock, User } from "lucide-react";
import { entrar, type EstadoForm } from "./actions";

export function FormEntrar({ next }: { next: string }) {
  const [estado, action, pendente] = useActionState<EstadoForm, FormData>(entrar, {});
  const [ver, setVer] = useState(false);
  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="next" value={next} />
      <label className="grid gap-1.5 text-sm font-medium">
        Usuário
        <span className="relative">
          <User size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
          <input
            className="input !pl-10"
            name="usuario"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            required
            placeholder="@usuario ou e-mail"
          />
        </span>
      </label>
      <label className="grid gap-1.5 text-sm font-medium">
        Senha
        <span className="relative">
          <Lock size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
          <input
            className="input !pl-10 !pr-11"
            name="senha"
            type={ver ? "text" : "password"}
            autoComplete="current-password"
            required
          />
          <button
            type="button"
            onClick={() => setVer((v) => !v)}
            aria-label={ver ? "Ocultar senha" : "Mostrar senha"}
            className="absolute right-1.5 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-muted hover:text-fg"
          >
            {ver ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
          </button>
        </span>
      </label>
      <div aria-live="polite">
        {estado.erro && (
          <p role="alert" className="rounded-lg bg-badsoft px-3 py-2 text-sm text-bad">
            {estado.erro}
          </p>
        )}
      </div>
      <button className="btn btn-shine" disabled={pendente}>
        <LogIn size={18} aria-hidden /> {pendente ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
