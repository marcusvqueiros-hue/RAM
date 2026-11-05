import Link from "next/link";
import { redirect } from "next/navigation";
import { FundoLogin } from "@/components/fundo-login";
import { getSessao } from "@/lib/sessao";
import { destinoPadrao } from "@/lib/usuario";
import { FormEntrar } from "./form-entrar";

export const metadata = { title: "Entrar" };

export default async function Entrar(props: PageProps<"/entrar">) {
  const sp = await props.searchParams;
  const nextRaw = Array.isArray(sp.next) ? sp.next[0] : sp.next;
  const next = nextRaw && nextRaw.startsWith("/") && !nextRaw.startsWith("//") ? nextRaw : "";

  const { user, tecnico } = await getSessao();
  if (user) redirect(next || destinoPadrao(tecnico));

  return (
    <FundoLogin>
      <h1 className="text-2xl font-bold tracking-tight">Bem-vindo</h1>
      <p className="mb-6 mt-1 text-sm text-muted">Entre para registrar ações e acompanhar os resultados.</p>
      <FormEntrar next={next} />
      <p className="mt-6 text-center text-sm text-muted">
        Primeiro acesso?{" "}
        <Link href="/cadastrar" className="font-semibold text-brand underline-offset-4 hover:underline">
          Criar conta
        </Link>
      </p>
    </FundoLogin>
  );
}
