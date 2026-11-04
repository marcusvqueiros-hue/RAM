import { redirect } from "next/navigation";
import { Shell } from "@/components/shell";
import { getSessao } from "@/lib/sessao";
import { sair } from "../entrar/actions";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, tecnico } = await getSessao();
  if (!user) redirect("/entrar");
  const papel = tecnico?.papel === "gestor" ? "gestor" : tecnico?.ativo ? "técnico" : "consulta";
  return (
    <Shell nome={tecnico?.nome ?? user.email ?? "Usuário"} papel={papel} sair={sair}>
      {children}
    </Shell>
  );
}
