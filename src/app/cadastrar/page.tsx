import Link from "next/link";
import { FundoLogin } from "@/components/fundo-login";
import { createAdminClient } from "@/lib/supabase/admin";
import { FormCadastrar } from "./form-cadastrar";

export const metadata = { title: "Criar conta" };
export const dynamic = "force-dynamic";

export default async function Cadastrar() {
  // Lista só nomes de técnicos ativos ainda sem conta (nenhum dado sensível).
  const admin = createAdminClient();
  const { data } = await admin
    .from("ram_tecnicos")
    .select("id, nome")
    .eq("ativo", true)
    .eq("papel", "tecnico")
    .is("user_id", null)
    .order("nome");

  return (
    <FundoLogin>
      <h1 className="text-2xl font-bold tracking-tight">Criar conta</h1>
      <p className="mb-6 mt-1 text-sm text-muted">Vincule seu nome e defina e-mail e senha.</p>
      <FormCadastrar opcoes={data ?? []} />
      <p className="mt-6 text-center text-sm text-muted">
        Já tem conta?{" "}
        <Link href="/entrar" className="font-semibold text-brand underline-offset-4 hover:underline">
          Entrar
        </Link>
      </p>
    </FundoLogin>
  );
}
