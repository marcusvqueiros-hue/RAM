// Cria/atualiza o usuário gestor. Uso (credenciais NUNCA ficam no repositório):
//   ADMIN_USUARIO=@fulano ADMIN_SENHA=... ADMIN_NOME="Fulano" node --env-file=.env.local scripts/criar-admin.mjs
import { createClient } from "@supabase/supabase-js";

const { ADMIN_USUARIO, ADMIN_SENHA, ADMIN_NOME } = process.env;
if (!ADMIN_USUARIO || !ADMIN_SENHA || !ADMIN_NOME) throw new Error("Defina ADMIN_USUARIO, ADMIN_SENHA e ADMIN_NOME");

const v = ADMIN_USUARIO.trim().toLowerCase();
const email = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)
  ? v
  : `${v.replace(/^@/, "").replace(/[^a-z0-9._-]/g, "")}@ram.example.com`; // mesmo mapeamento de src/lib/usuario.ts

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

let userId;
const { data: criado, error } = await sb.auth.admin.createUser({ email, password: ADMIN_SENHA, email_confirm: true });
if (error) {
  if (!/already|registered/i.test(error.message)) throw error;
  const { data: lista } = await sb.auth.admin.listUsers({ perPage: 1000 });
  userId = lista.users.find((u) => u.email === email)?.id;
  const { error: e2 } = await sb.auth.admin.updateUserById(userId, { password: ADMIN_SENHA });
  if (e2) throw e2;
} else userId = criado.user.id;

const { data: t, error: e3 } = await sb
  .from("ram_tecnicos")
  .upsert({ nome: ADMIN_NOME, user_id: userId, papel: "gestor", ativo: true }, { onConflict: "nome" })
  .select("id")
  .single();
if (e3) throw e3;
await sb.from("ram_metas").delete().eq("tecnico_id", t.id); // gestor não tem metas
console.log("OK: gestor", ADMIN_NOME, "→ login:", email);
