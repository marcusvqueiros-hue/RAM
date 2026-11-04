const TZ = "America/Sao_Paulo";

/** Data de hoje (yyyy-mm-dd) no fuso de São Paulo. */
export function hoje(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());
}

export function mesAtual(): string {
  return hoje().slice(0, 7) + "-01";
}

/** Aceita "2026-10" ou "2026-10-01" e devolve "2026-10-01"; inválido → null. */
export function normalizaMes(v?: string | null): string | null {
  if (!v || !/^\d{4}-\d{2}(-\d{2})?$/.test(v)) return null;
  const m = Number(v.slice(5, 7));
  return m >= 1 && m <= 12 ? v.slice(0, 7) + "-01" : null;
}

export function somaMeses(mes: string, n: number): string {
  const d = new Date(Date.UTC(+mes.slice(0, 4), +mes.slice(5, 7) - 1 + n, 1));
  return d.toISOString().slice(0, 10);
}

export function rotuloMes(mes: string, estilo: "longo" | "curto" = "longo"): string {
  const d = new Date(Date.UTC(+mes.slice(0, 4), +mes.slice(5, 7) - 1, 1));
  const s = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
    month: estilo === "longo" ? "long" : "short",
    year: estilo === "longo" ? "numeric" : "2-digit",
  }).format(d);
  return s.replace(".", "");
}

export function diasNoMes(mes: string): number {
  return new Date(Date.UTC(+mes.slice(0, 4), +mes.slice(5, 7), 0)).getUTCDate();
}

export function formataData(iso: string): string {
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;
}

/** Instante atual em ms (isolado para uso em Server Components sem violar a regra de pureza). */
export const agoraMs = () => Date.now();
