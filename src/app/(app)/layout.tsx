import { redirect } from "next/navigation";
import { Shell, type ItemMenu } from "@/components/shell";
import { getSessao } from "@/lib/sessao";
import { sair } from "../entrar/actions";

/** Painel de relatórios: menu só com Relatórios (e Usuários para o gestor). */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, tecnico } = await getSessao();
  if (!user) redirect("/entrar?next=/relatorios");

  const gestor = tecnico?.papel === "gestor" && tecnico.ativo;
  const itens: ItemMenu[] = [{ href: "/relatorios", label: "Relatórios", icone: "relatorios" }];
  if (gestor) itens.push({ href: "/usuarios", label: "Usuários", icone: "usuarios" });
  const papel = gestor ? "gestor" : tecnico?.ativo ? "técnico" : "consulta";

  return (
    <Shell nome={tecnico?.nome ?? user.email ?? "Usuário"} papel={papel} itens={itens} sair={sair}>
      {children}
    </Shell>
  );
}
