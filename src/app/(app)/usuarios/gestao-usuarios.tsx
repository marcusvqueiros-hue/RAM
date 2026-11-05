"use client";

import { useActionState, useState } from "react";
import { Check, Copy, KeyRound, ShieldCheck, UserPlus } from "lucide-react";
import { alterarPerfil, criarUsuario, redefinirSenha, type EstadoUsuario } from "./actions";

export type UsuarioLinha = {
  id: string;
  nome: string;
  usuario: string;
  perfil: "tecnico" | "consulta" | "gestor";
  ultimoAcesso: string | null;
  eu: boolean;
};

const PERFIL_ROTULO = { tecnico: "Técnico (registra ações)", consulta: "Consulta (só relatórios)", gestor: "Gestor (administra)" } as const;

function Credencial({ c }: { c: NonNullable<EstadoUsuario["credencial"]> }) {
  const [copiado, setCopiado] = useState(false);
  async function copiar() {
    try {
      await navigator.clipboard.writeText(`Usuário: ${c.usuario}\nSenha: ${c.senha}`);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      /* sem permissão de área de transferência */
    }
  }
  return (
    <div className="mt-3 rounded-xl border border-ok bg-oksoft p-3 text-sm" role="status">
      <p className="mb-1 font-semibold text-ok">Anote ou copie agora — a senha não poderá ser consultada depois.</p>
      <p>
        Usuário: <strong className="font-mono">{c.usuario}</strong>
      </p>
      <p>
        Senha: <strong className="font-mono">{c.senha}</strong>
      </p>
      <button type="button" onClick={copiar} className="btn btn-ghost mt-2 !min-h-9 !px-3 text-sm">
        {copiado ? <Check size={16} aria-hidden /> : <Copy size={16} aria-hidden />} {copiado ? "Copiado" : "Copiar usuário e senha"}
      </button>
    </div>
  );
}

function NovoUsuario({ semConta }: { semConta: { id: string; nome: string }[] }) {
  const [estado, action, pendente] = useActionState<EstadoUsuario, FormData>(criarUsuario, {});
  const [vinc, setVinc] = useState("__novo");
  return (
    <section className="card p-5" aria-labelledby="h-novo">
      <h2 id="h-novo" className="mb-4 flex items-center gap-2 text-lg font-bold">
        <UserPlus size={20} className="text-brand" aria-hidden /> Novo usuário
      </h2>
      {/* key novo após sucesso → campos limpos */}
      <form key={estado.ts ?? 0} action={action} className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-1.5 text-sm font-medium">
          Vincular a
          <select className="input" name="vincular" value={vinc} onChange={(e) => setVinc(e.target.value)}>
            <option value="__novo">Novo cadastro</option>
            {semConta.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nome} (técnico existente, sem conta)
              </option>
            ))}
          </select>
        </label>
        {vinc === "__novo" ? (
          <label className="grid gap-1.5 text-sm font-medium">
            Nome
            <input className="input" name="nome" required maxLength={60} placeholder="Nome completo ou curto" />
          </label>
        ) : (
          <div className="grid gap-1.5 text-sm font-medium">
            Nome
            <input type="hidden" name="nome" value={semConta.find((t) => t.id === vinc)?.nome ?? ""} />
            <p className="input flex items-center bg-surface2 text-muted">{semConta.find((t) => t.id === vinc)?.nome}</p>
          </div>
        )}
        <label className="grid gap-1.5 text-sm font-medium">
          Usuário
          <input className="input" name="usuario" required placeholder="@NomeSobrenome" autoCapitalize="none" spellCheck={false} />
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          Senha <span className="font-normal text-muted">(mín. 6 caracteres; prefira 8 ou mais)</span>
          <input className="input font-mono" name="senha" required minLength={6} autoComplete="off" />
        </label>
        <label className="grid gap-1.5 text-sm font-medium md:col-span-2">
          Perfil
          <select className="input" name="perfil" defaultValue="tecnico">
            {Object.entries(PERFIL_ROTULO).map(([v, r]) => (
              <option key={v} value={v}>
                {r}
              </option>
            ))}
          </select>
        </label>
        <div className="md:col-span-2" aria-live="polite">
          {estado.erro && (
            <p role="alert" className="rounded-lg bg-badsoft px-3 py-2 text-sm text-bad">
              {estado.erro}
            </p>
          )}
          {estado.credencial && <Credencial c={estado.credencial} />}
        </div>
        <button className="btn md:col-span-2 md:w-fit" disabled={pendente}>
          <UserPlus size={18} aria-hidden /> {pendente ? "Criando…" : "Criar usuário"}
        </button>
      </form>
    </section>
  );
}

function LinhaUsuario({ u }: { u: UsuarioLinha }) {
  const [est, redef, pend] = useActionState<EstadoUsuario, FormData>(redefinirSenha, {});
  const [estP, mudaPerfil, pendP] = useActionState<EstadoUsuario, FormData>(alterarPerfil, {});
  const [aberto, setAberto] = useState(false);
  return (
    <>
      <tr className="border-b border-line align-top">
        <td className="py-3 pr-3 font-semibold">
          {u.nome} {u.eu && <span className="ml-1 rounded-full bg-brandsoft px-2 py-0.5 text-xs font-medium text-brand">você</span>}
        </td>
        <td className="py-3 pr-3 font-mono text-sm">{u.usuario}</td>
        <td className="py-3 pr-3">
          <form action={mudaPerfil} className="flex items-center gap-2">
            <input type="hidden" name="id" value={u.id} />
            <select
              name="perfil"
              defaultValue={u.perfil}
              disabled={u.eu || pendP}
              aria-label={`Perfil de ${u.nome}`}
              className="input !min-h-9 !w-auto !py-1 text-sm"
              onChange={(e) => e.currentTarget.form?.requestSubmit()}
            >
              {Object.entries(PERFIL_ROTULO).map(([v, r]) => (
                <option key={v} value={v}>
                  {r}
                </option>
              ))}
            </select>
          </form>
          {estP.erro && <p className="mt-1 text-xs text-bad">{estP.erro}</p>}
        </td>
        <td className="py-3 pr-3 text-sm text-muted">
          <span title="As senhas são guardadas criptografadas e não podem ser exibidas. Use “Redefinir senha”.">••••••••</span>
        </td>
        <td className="py-3 pr-3 text-sm text-muted">
          {u.ultimoAcesso ? new Date(u.ultimoAcesso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" }) : "nunca"}
        </td>
        <td className="py-3 text-right">
          <button type="button" onClick={() => setAberto((v) => !v)} className="btn btn-ghost !min-h-9 !px-3 text-sm" aria-expanded={aberto}>
            <KeyRound size={16} aria-hidden /> Redefinir senha
          </button>
        </td>
      </tr>
      {aberto && (
        <tr className="border-b border-line bg-surface2">
          <td colSpan={6} className="px-3 py-3">
            <form key={est.ts ?? 0} action={redef} className="flex flex-wrap items-end gap-3">
              <input type="hidden" name="id" value={u.id} />
              <label className="grid gap-1 text-sm font-medium">
                Nova senha para {u.usuario}
                <input className="input font-mono !w-64" name="senha" required minLength={6} autoComplete="off" />
              </label>
              <button className="btn !min-h-11" disabled={pend}>
                {pend ? "Salvando…" : "Salvar nova senha"}
              </button>
            </form>
            {est.erro && <p role="alert" className="mt-2 text-sm text-bad">{est.erro}</p>}
            {est.credencial && <Credencial c={est.credencial} />}
          </td>
        </tr>
      )}
    </>
  );
}

export function GestaoUsuarios({ usuarios, semConta }: { usuarios: UsuarioLinha[]; semConta: { id: string; nome: string }[] }) {
  return (
    <div className="grid w-full gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-brand">Usuários</h1>
        <p className="text-muted">Cadastro de acessos ao sistema: usuário, perfil e redefinição de senha.</p>
      </div>

      <section className="card overflow-x-auto p-5" aria-labelledby="h-lista">
        <h2 id="h-lista" className="mb-3 flex items-center gap-2 text-lg font-bold">
          <ShieldCheck size={20} className="text-brand" aria-hidden /> Acessos cadastrados ({usuarios.length})
        </h2>
        <table className="w-full min-w-[56rem] text-left text-sm">
          <thead className="text-muted">
            <tr className="border-b border-line">
              <th className="py-2 pr-3 font-medium">Nome</th>
              <th className="py-2 pr-3 font-medium">Usuário</th>
              <th className="py-2 pr-3 font-medium">Perfil</th>
              <th className="py-2 pr-3 font-medium">Senha</th>
              <th className="py-2 pr-3 font-medium">Último acesso</th>
              <th className="py-2 text-right font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <LinhaUsuario key={u.id} u={u} />
            ))}
          </tbody>
        </table>
        <p className="mt-3 text-xs text-muted">
          As senhas ficam criptografadas no banco e <strong>não podem ser exibidas</strong> — nem por você. Para dar acesso a alguém, crie o usuário ou
          redefina a senha: ela é mostrada uma única vez, para você repassar.
        </p>
      </section>

      <NovoUsuario semConta={semConta} />
    </div>
  );
}
