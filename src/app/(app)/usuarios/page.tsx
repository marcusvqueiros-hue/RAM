import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessao } from "@/lib/sessao";
import { GestaoUsuarios, type UsuarioLinha } from "./gestao-usuarios";

export const metadata = { title: "Usuários" };
export const dynamic = "force-dynamic";

export default async function Usuarios() {
  const { tecnico } = await getSessao();
  if (!tecnico || tecnico.papel !== "gestor" || !tecnico.ativo) redirect("/relatorios");

  const admin = createAdminClient();
  const [{ data: tecnicos }, { data: lista }] = await Promise.all([
    admin.from("ram_tecnicos").select("id, nome, user_id, papel, ativo").order("nome"),
    admin.auth.admin.listUsers({ perPage: 1000 }),
  ]);
  const auth = new Map((lista?.users ?? []).map((u) => [u.id, u]));

  // Só aparecem contas deste sistema (as demais contas do projeto Supabase não são listadas).
  const usuarios: UsuarioLinha[] = (tecnicos ?? [])
    .filter((t) => t.user_id && auth.has(t.user_id))
    .map((t) => {
      const u = auth.get(t.user_id!)!;
      return {
        id: t.id,
        nome: t.nome,
        usuario: "@" + (u.email ?? "").replace(/@ram\.example\.com$/, ""),
        perfil: t.papel === "gestor" ? "gestor" : t.ativo ? "tecnico" : "consulta",
        ultimoAcesso: u.last_sign_in_at ?? null,
        eu: t.id === tecnico.id,
      } satisfies UsuarioLinha;
    })
    .sort((a, b) => a.nome.localeCompare(b.nome));

  const semConta = (tecnicos ?? []).filter((t) => !t.user_id && t.ativo).map((t) => ({ id: t.id, nome: t.nome }));

  return <GestaoUsuarios usuarios={usuarios} semConta={semConta} />;
}
