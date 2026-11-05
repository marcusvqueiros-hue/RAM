import Link from "next/link";
import { Creditos } from "@/components/creditos";
import { ArrowRight, BarChart3, ClipboardCheck, ShieldCheck } from "lucide-react";

export default function Home() {
  return (
    <main className="mx-auto grid w-full max-w-4xl flex-1 content-center gap-10 px-4 py-14 sm:px-6">
      <div className="text-center">
        <span className="mx-auto mb-5 grid size-16 place-items-center rounded-2xl bg-brand text-brandfg">
          <ShieldCheck size={34} aria-hidden />
        </span>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">RAM · Atividades de Segurança</h1>
        <p className="mx-auto mt-3 max-w-xl text-muted">
          Registre as ações do mês e acompanhe metas, ranking e insights da equipe em tempo real.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/tecnico" className="card group flex flex-col gap-3 p-6 transition-shadow hover:shadow-lg">
          <span className="grid size-12 place-items-center rounded-xl bg-brandsoft text-brand"><ClipboardCheck aria-hidden /></span>
          <h2 className="text-xl font-bold">Área do técnico</h2>
          <p className="text-sm text-muted">Blitz comportamental, ICIT estático, inspeção veicular, DSS e ações na comunidade.</p>
          <span className="mt-auto inline-flex items-center gap-1 font-semibold text-brand">
            Registrar ações <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" aria-hidden />
          </span>
        </Link>
        <Link href="/relatorios" className="card group flex flex-col gap-3 p-6 transition-shadow hover:shadow-lg">
          <span className="grid size-12 place-items-center rounded-xl bg-brandsoft text-brand"><BarChart3 aria-hidden /></span>
          <h2 className="text-xl font-bold">Relatórios</h2>
          <p className="text-sm text-muted">Resultado mensal por técnico e tipo de ação, evolução histórica e insights.</p>
          <span className="mt-auto inline-flex items-center gap-1 font-semibold text-brand">
            Ver relatório <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" aria-hidden />
          </span>
        </Link>
      </div>
      <Creditos />
    </main>
  );
}
