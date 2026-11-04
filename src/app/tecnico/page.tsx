import { redirect } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Cabecalho } from "@/components/cabecalho";
import { createClient } from "@/lib/supabase/server";
import { getSessao } from "@/lib/sessao";
import { agoraMs, formataData, hoje, mesAtual, rotuloMes, somaMeses } from "@/lib/datas";
import { TIPOS, TIPO_INFO, type Resumo, type TipoAcao } from "@/lib/tipos";
import { FormRegistro } from "./form-registro";
import { removerRegistro } from "./actions";

export const metadata = { title: "Registrar ação" };

export default async function AreaTecnico() {
  const { user, tecnico } = await getSessao();
  if (!user) redirect("/entrar?next=/tecnico");

  const supabase = await createClient();
  const mes = mesAtual();

  const [{ data: resumo }, { data: recentes }] = tecnico
    ? await Promise.all([
        supabase.from("v_resumo_mensal").select("tipo, realizado, meta").eq("tecnico_id", tecnico.id).eq("mes", mes),
        supabase
          .from("registros")
          .select("id, tipo, data, quantidade, local, created_at")
          .eq("tecnico_id", tecnico.id)
          .order("data", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(8),
      ])
    : [{ data: [] }, { data: [] }];

  const prog = new Map((resumo as Pick<Resumo, "tipo" | "realizado" | "meta">[] | null)?.map((r) => [r.tipo, r]));
  const limiteRemocao = agoraMs() - 7 * 864e5;

  return (
    <>
      <Cabecalho ativo="tecnico" />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Olá, {tecnico?.nome ?? "técnico"} 👷</h1>
          <p className="text-muted">Registre suas ações de segurança de {rotuloMes(mes)}.</p>
        </div>

        {!tecnico && (
          <p className="card mb-6 border-warn bg-warnsoft p-4 text-warn">
            Seu usuário ainda não está vinculado a um técnico. Peça ao gestor para concluir o cadastro.
          </p>
        )}

        <section aria-label="Meu progresso no mês" className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {TIPOS.map((t) => {
            const r = prog.get(t as TipoAcao);
            const real = r?.realizado ?? 0;
            const meta = r?.meta ?? 0;
            const p = meta ? Math.min(100, (real / meta) * 100) : 0;
            const ok = meta > 0 && real >= meta;
            return (
              <div key={t} className="card p-4">
                <p className="text-sm font-medium text-muted">{TIPO_INFO[t].nome}</p>
                <p className="mt-1 text-2xl font-bold tabular-nums">
                  {real}
                  <span className="text-base font-medium text-muted"> / {meta}</span>
                </p>
                <div
                  className="mt-2 h-2 overflow-hidden rounded-full bg-surface2"
                  role="progressbar"
                  aria-valuenow={Math.round(p)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${TIPO_INFO[t].nome}: ${real} de ${meta}`}
                >
                  <div className={`h-full rounded-full ${ok ? "bg-ok" : "bg-brand"}`} style={{ width: `${p}%` }} />
                </div>
                <p className={`mt-1 text-xs ${ok ? "text-ok" : "text-muted"}`}>
                  {ok ? "Meta batida ✓" : meta ? `Faltam ${meta - real}` : "Sem meta"}
                </p>
              </div>
            );
          })}
        </section>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <FormRegistro hoje={hoje()} minimo={somaMeses(mes, -1)} />

          <section className="card p-5 sm:p-6" aria-label="Últimos registros">
            <h2 className="mb-3 font-semibold">Meus últimos registros</h2>
            {!recentes?.length ? (
              <p className="text-sm text-muted">Nada registrado ainda. Seu primeiro registro aparece aqui.</p>
            ) : (
              <ul className="divide-y divide-line">
                {recentes.map((r) => (
                  <li key={r.id} className="flex items-center gap-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {TIPO_INFO[r.tipo as TipoAcao].nome}
                        {r.quantidade > 1 && <span className="text-muted"> × {r.quantidade}</span>}
                      </p>
                      <p className="truncate text-xs text-muted">
                        {formataData(r.data)}
                        {r.local ? ` · ${r.local}` : ""}
                      </p>
                    </div>
                    {new Date(r.created_at).getTime() > limiteRemocao && (
                      <form action={removerRegistro}>
                        <input type="hidden" name="id" value={r.id} />
                        <button
                          className="grid size-9 place-items-center rounded-lg text-muted hover:bg-badsoft hover:text-bad"
                          aria-label={`Remover registro de ${TIPO_INFO[r.tipo as TipoAcao].nome}`}
                          title="Remover"
                        >
                          <Trash2 size={16} aria-hidden />
                        </button>
                      </form>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
