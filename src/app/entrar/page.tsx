import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { getSessao } from "@/lib/sessao";
import { FormEntrar } from "./form-entrar";

export const metadata = { title: "Entrar" };

export default async function Entrar(props: PageProps<"/entrar">) {
  const sp = await props.searchParams;
  const nextRaw = Array.isArray(sp.next) ? sp.next[0] : sp.next;
  const next = nextRaw && nextRaw.startsWith("/") && !nextRaw.startsWith("//") ? nextRaw : "/tecnico";

  const { user } = await getSessao();
  if (user) redirect(next);

  return (
    <main className="grid flex-1 place-items-center px-4 py-12">
      <div className="card w-full max-w-md p-6 sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-xl bg-brand text-brandfg">
            <ShieldCheck aria-hidden />
          </span>
          <div>
            <h1 className="text-xl font-bold">Entrar</h1>
            <p className="text-sm text-muted">Acesse com seu e-mail e senha.</p>
          </div>
        </div>
        <FormEntrar next={next} />
        <p className="mt-6 text-center text-sm text-muted">
          Primeiro acesso?{" "}
          <Link href="/cadastrar" className="font-semibold text-brand underline-offset-4 hover:underline">
            Criar conta
          </Link>
        </p>
      </div>
    </main>
  );
}
