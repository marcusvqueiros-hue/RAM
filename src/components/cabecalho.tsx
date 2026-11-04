import Link from "next/link";
import { ClipboardCheck, BarChart3, LogOut, ShieldCheck } from "lucide-react";
import { getSessao } from "@/lib/sessao";
import { sair } from "@/app/entrar/actions";

export async function Cabecalho({ ativo }: { ativo?: "tecnico" | "relatorios" }) {
  const { user, tecnico } = await getSessao();
  const link = (href: string, id: string, label: string, Icon: typeof BarChart3) => (
    <Link
      href={href}
      aria-current={ativo === id ? "page" : undefined}
      className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        ativo === id ? "bg-brandsoft text-brand" : "text-muted hover:text-fg"
      }`}
    >
      <Icon size={18} aria-hidden /> {label}
    </Link>
  );

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-surface/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
          <span className="grid size-9 place-items-center rounded-xl bg-brand text-brandfg">
            <ShieldCheck size={20} aria-hidden />
          </span>
          <span className="hidden sm:inline">RAM Segurança</span>
        </Link>
        <nav className="ml-2 flex gap-1" aria-label="Principal">
          {link("/tecnico", "tecnico", "Registrar", ClipboardCheck)}
          {link("/relatorios", "relatorios", "Relatórios", BarChart3)}
        </nav>
        <div className="ml-auto flex items-center gap-3 text-sm">
          {user && (
            <>
              <span className="hidden text-muted md:inline">
                {tecnico?.nome ?? user.email}
                {tecnico?.papel === "gestor" && " · gestor"}
              </span>
              <form action={sair}>
                <button className="btn btn-ghost !min-h-9 !px-3 text-sm" aria-label="Sair">
                  <LogOut size={16} aria-hidden /> <span className="hidden sm:inline">Sair</span>
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
