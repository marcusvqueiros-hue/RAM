"use client";

import { useActionState, useState } from "react";
import { UserPlus } from "lucide-react";
import type { EstadoForm } from "../entrar/actions";
import { cadastrar } from "./actions";

export function FormCadastrar({ opcoes }: { opcoes: { id: string; nome: string }[] }) {
  const [estado, action, pendente] = useActionState<EstadoForm, FormData>(cadastrar, {});
  const [sel, setSel] = useState("");
  return (
    <form action={action} className="grid gap-4">
      <label className="grid gap-1.5 text-sm font-medium">
        Código da equipe
        <input className="input" name="codigo" required autoComplete="off" placeholder="Fornecido pelo seu gestor" />
      </label>
      <label className="grid gap-1.5 text-sm font-medium">
        Quem é você?
        <select className="input" name="tecnico" required value={sel} onChange={(e) => setSel(e.target.value)}>
          <option value="" disabled>
            Selecione seu nome…
          </option>
          {opcoes.map((o) => (
            <option key={o.id} value={o.id}>
              {o.nome}
            </option>
          ))}
          <option value="__novo">Não estou na lista (novo técnico)</option>
        </select>
      </label>
      {sel === "__novo" && (
        <label className="grid gap-1.5 text-sm font-medium">
          Seu nome
          <input className="input" name="novoNome" required maxLength={60} />
        </label>
      )}
      <label className="grid gap-1.5 text-sm font-medium">
        E-mail
        <input className="input" name="email" type="email" required autoComplete="email" />
      </label>
      <label className="grid gap-1.5 text-sm font-medium">
        Senha <span className="font-normal text-muted">(mín. 8 caracteres)</span>
        <input className="input" name="senha" type="password" required minLength={8} autoComplete="new-password" />
      </label>
      {estado.erro && (
        <p role="alert" className="rounded-lg bg-badsoft px-3 py-2 text-sm text-bad">
          {estado.erro}
        </p>
      )}
      <button className="btn" disabled={pendente}>
        <UserPlus size={18} aria-hidden /> {pendente ? "Criando…" : "Criar conta"}
      </button>
    </form>
  );
}
