const DOMINIO_USUARIO = "ram.example.com";

/**
 * O Supabase Auth autentica por e-mail. Quem entra com "usuário" (ex.: @usuario)
 * é mapeado para um e-mail interno determinístico — nenhum e-mail real é enviado.
 */
export function emailDeLogin(entrada: string): string {
  const v = entrada.trim().toLowerCase();
  if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) return v; // já é um e-mail
  const user = v.replace(/^@/, "").replace(/[^a-z0-9._-]/g, "");
  return `${user}@${DOMINIO_USUARIO}`;
}

/** Para onde mandar após o login quando não há destino pedido: gestor/consulta → relatórios; técnico → registro. */
export function destinoPadrao(t: { papel: string; ativo: boolean } | null): string {
  return t && (t.papel === "gestor" || !t.ativo) ? "/relatorios" : "/tecnico";
}
