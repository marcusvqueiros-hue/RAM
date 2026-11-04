"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BarChart3, ClipboardCheck, LogOut, PanelLeft, ShieldCheck, X } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";

const ITENS = [
  { href: "/tecnico", label: "Registrar ação", Icon: ClipboardCheck },
  { href: "/relatorios", label: "Relatórios", Icon: BarChart3 },
];

type Props = { nome: string; papel: string; sair: () => Promise<void>; children: React.ReactNode };

export function Shell({ nome, papel, sair, children }: Props) {
  const pathname = usePathname();
  const [recolhido, setRecolhido] = useState(false); // desktop
  const [aberto, setAberto] = useState(false); // mobile (gaveta)
  const titulo = ITENS.find((i) => pathname.startsWith(i.href))?.label ?? "RAM";

  function alternar() {
    if (window.matchMedia("(min-width: 1024px)").matches) setRecolhido((v) => !v);
    else setAberto((v) => !v);
  }

  return (
    <div className="flex min-h-dvh w-full">
      {/* fundo escurecido (mobile) */}
      {aberto && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setAberto(false)} aria-hidden />}

      <aside
        id="menu-lateral"
        className={`fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col border-r border-line bg-surface transition-[transform,margin] duration-300 lg:sticky lg:top-0 lg:h-dvh lg:translate-x-0 ${
          aberto ? "translate-x-0" : "-translate-x-full"
        } ${recolhido ? "lg:-ml-64" : "lg:ml-0"}`}
        aria-label="Menu lateral"
        inert={!aberto && recolhido ? true : undefined}
      >
        <div className="flex h-16 items-center gap-3 border-b border-line px-4">
          <span className="grid size-9 place-items-center rounded-xl bg-brand text-brandfg">
            <ShieldCheck size={20} aria-hidden />
          </span>
          <span className="font-bold tracking-tight">RAM Segurança</span>
          <button className="ml-auto grid size-9 place-items-center rounded-lg text-muted lg:hidden" onClick={() => setAberto(false)} aria-label="Fechar menu">
            <X size={18} aria-hidden />
          </button>
        </div>

        <nav className="flex-1 space-y-1 p-3" aria-label="Principal">
          {ITENS.map(({ href, label, Icon }) => {
            const ativo = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setAberto(false)}
                aria-current={ativo ? "page" : undefined}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  ativo ? "bg-brandsoft text-brand" : "text-muted hover:bg-surface2 hover:text-fg"
                }`}
              >
                <Icon size={19} aria-hidden /> {label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-line p-3">
          <div className="mb-2 px-2">
            <p className="truncate text-sm font-semibold">{nome}</p>
            <p className="text-xs capitalize text-muted">{papel}</p>
          </div>
          <form action={sair}>
            <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-badsoft hover:text-bad">
              <LogOut size={19} aria-hidden /> Sair
            </button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* barra superior: o botão fica FORA do menu, então continua visível com ele recolhido */}
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line bg-surface/90 px-4 backdrop-blur">
          <button
            type="button"
            onClick={alternar}
            aria-label="Abrir ou recolher o menu lateral"
            aria-controls="menu-lateral"
            aria-expanded={recolhido ? false : true}
            className="grid size-10 place-items-center rounded-xl border border-line text-muted transition-colors hover:text-fg"
          >
            <PanelLeft size={18} aria-hidden />
          </button>
          <p className="text-lg font-bold tracking-tight">{titulo}</p>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </header>
        <main className="min-w-0 flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
