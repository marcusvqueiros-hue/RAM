import { redirect } from "next/navigation";
import { LogOut, ShieldCheck } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { getSessao } from "@/lib/sessao";
import { sair } from "../entrar/actions";

/** Área de registro: só o necessário para lançar ações — sem menu de relatórios. */
export default async function RegistroLayout({ children }: { children: React.ReactNode }) {
  const { user, tecnico } = await getSessao();
  if (!user) redirect("/entrar?next=/tecnico");

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line bg-surface/90 px-4 backdrop-blur sm:px-6">
        <span className="grid size-9 place-items-center rounded-xl bg-brand text-brandfg">
          <ShieldCheck size={20} aria-hidden />
        </span>
        <div className="leading-tight">
          <p className="font-bold tracking-tight">RAM · Registro de ações</p>
          <p className="hidden text-xs text-muted sm:block">{tecnico?.nome ?? user.email}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <form action={sair}>
            <button className="btn btn-ghost !min-h-10 !px-3 text-sm" aria-label="Sair">
              <LogOut size={16} aria-hidden /> <span className="hidden sm:inline">Sair</span>
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 p-4 sm:p-6">{children}</main>
    </div>
  );
}
