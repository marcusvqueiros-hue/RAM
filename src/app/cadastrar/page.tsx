import Link from "next/link";
import { UserPlus } from "lucide-react";
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
    .is("user_id", null)
    .order("nome");

  return (
    <main className="grid flex-1 place-items-center px-4 py-12">
      <div className="card w-full max-w-md p-6 sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-xl bg-brand text-brandfg">
            <UserPlus aria-hidden />
          </span>
          <div>
            <h1 className="text-xl font-bold">Criar conta</h1>
            <p className="text-sm text-muted">Vincule seu nome e defina e-mail e senha.</p>
          </div>
        </div>
        <FormCadastrar opcoes={data ?? []} />
        <p className="mt-6 text-center text-sm text-muted">
          Já tem conta?{" "}
          <Link href="/entrar" className="font-semibold text-brand underline-offset-4 hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </main>
  );
}
