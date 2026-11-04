import { TIPOS, TIPO_INFO, type Linha, type TipoAcao } from "./tipos";
import { diasNoMes, rotuloMes, somaMeses } from "./datas";

export type Insight = {
  tom: "bom" | "atencao" | "critico" | "info";
  titulo: string;
  texto: string;
};

export type LinhaTecnico = { tecnico: string; realizado: number; meta: number };

export type Relatorio = {
  totalRealizado: number;
  totalMeta: number;
  /** realizado ÷ meta (pode passar de 100%) — o “% Realizado” do relatório original */
  pctBruto: number;
  /** soma de min(realizado, meta) por técnico/mês/tipo ÷ meta — excedente numa ação não compensa déficit em outra */
  pctCumprimento: number;
  porTipo: { tipo: TipoAcao; linhas: LinhaTecnico[]; realizado: number; meta: number }[];
  porTecnico: { tecnico: string; realizado: number; meta: number; pct: number; tiposAbaixo: TipoAcao[] }[];
};

export type PontoMensal = { mes: string; rotulo: string; pct: number; realizado: number; meta: number };

export const pct = (r: number, m: number) => (m > 0 ? (r / m) * 100 : 0);
const fmt = (n: number) => `${Math.round(n)}%`;

export const capitaliza = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
export const rotuloMesCap = (mes: string, estilo: "longo" | "curto" = "longo") => capitaliza(rotuloMes(mes, estilo));

/** Nome para eixos/rótulos: primeiro nome (nomes duplicados mantêm o nome completo). */
export function nomesCurtos(nomes: string[]): Map<string, string> {
  const primeiro = (n: string) => n.split(" ")[0];
  const cont = new Map<string, number>();
  nomes.forEach((n) => cont.set(primeiro(n), (cont.get(primeiro(n)) ?? 0) + 1));
  return new Map(nomes.map((n) => [n, (cont.get(primeiro(n)) ?? 0) > 1 ? n : primeiro(n)]));
}

// ------------------------------------------------------------------ filtros
export const anosDe = (rows: Linha[]) => [...new Set(rows.map((r) => Number(r.mes.slice(0, 4))))].sort((a, b) => b - a);

export function doPeriodo(rows: Linha[], ano: number, meses: string[]): Linha[] {
  return rows.filter((r) => (meses.length ? meses.includes(r.mes) : r.mes.startsWith(String(ano))) && (r.meta > 0 || r.realizado > 0));
}

// ----------------------------------------------------------------- agregação
export function montaRelatorio(rows: Linha[]): Relatorio {
  const porTipo = TIPOS.map((tipo) => {
    const soma = new Map<string, LinhaTecnico>();
    for (const r of rows.filter((x) => x.tipo === tipo)) {
      const l = soma.get(r.tecnico) ?? { tecnico: r.tecnico, realizado: 0, meta: 0 };
      l.realizado += r.realizado;
      l.meta += r.meta;
      soma.set(r.tecnico, l);
    }
    const linhas = [...soma.values()].sort((a, b) => b.realizado - a.realizado || a.tecnico.localeCompare(b.tecnico));
    return {
      tipo,
      linhas,
      realizado: linhas.reduce((s, l) => s + l.realizado, 0),
      meta: linhas.reduce((s, l) => s + l.meta, 0),
    };
  });

  const totalRealizado = porTipo.reduce((s, t) => s + t.realizado, 0);
  const totalMeta = porTipo.reduce((s, t) => s + t.meta, 0);
  const capado = rows.reduce((s, r) => s + Math.min(r.realizado, r.meta), 0);

  const nomes = [...new Set(rows.map((r) => r.tecnico))];
  const porTecnico = nomes
    .map((tecnico) => {
      const mine = rows.filter((r) => r.tecnico === tecnico);
      const realizado = mine.reduce((s, r) => s + r.realizado, 0);
      const meta = mine.reduce((s, r) => s + r.meta, 0);
      const tiposAbaixo = TIPOS.filter((t) => {
        const m = mine.filter((r) => r.tipo === t);
        return m.reduce((s, r) => s + r.meta, 0) > m.reduce((s, r) => s + r.realizado, 0);
      });
      return { tecnico, realizado, meta, pct: pct(realizado, meta), tiposAbaixo };
    })
    .sort((a, b) => b.pct - a.pct || b.realizado - a.realizado);

  return { totalRealizado, totalMeta, pctBruto: pct(totalRealizado, totalMeta), pctCumprimento: pct(capado, totalMeta), porTipo, porTecnico };
}

/** Série mensal do ano (opcionalmente de um técnico/tipo). Meses sem meta nem registro ficam de fora. */
export function serieMensal(rows: Linha[], ano: number, tecnico: string | null, tipo: TipoAcao | null, excluirMes?: string): PontoMensal[] {
  const f = rows.filter((r) => r.mes.startsWith(String(ano)) && (!tecnico || r.tecnico === tecnico) && (!tipo || r.tipo === tipo));
  const meses = [...new Set(f.map((r) => r.mes))].sort();
  return meses
    .filter((m) => m !== excluirMes)
    .map((m) => {
      const mm = f.filter((r) => r.mes === m);
      const realizado = mm.reduce((s, r) => s + r.realizado, 0);
      const meta = mm.reduce((s, r) => s + r.meta, 0);
      return { mes: m, rotulo: capitaliza(rotuloMes(m, "curto")), pct: pct(realizado, meta), realizado, meta };
    })
    .filter((p) => p.meta > 0 || p.realizado > 0);
}

const pctMes = (rows: Linha[], mes: string) => {
  const m = rows.filter((r) => r.mes === mes);
  return { pct: pct(m.reduce((s, r) => s + r.realizado, 0), m.reduce((s, r) => s + r.meta, 0)), meta: m.reduce((s, r) => s + r.meta, 0) };
};

// ------------------------------------------------------------------ insights
/** Regras determinísticas e explicáveis (nada de caixa-preta). `rel` = equipe toda no período. */
export function geraInsights(rel: Relatorio, todas: Linha[], ano: number, mes: string | null, hojeIso: string): Insight[] {
  const out: Insight[] = [];
  if (rel.totalMeta === 0) return out;

  const mesCorrente = hojeIso.slice(0, 7) + "-01";
  const emAndamento = mes === mesCorrente;

  // 1) Projeção de fechamento (mês corrente)
  if (mes && emAndamento) {
    const dia = Math.max(1, Number(hojeIso.slice(8, 10)));
    const total = diasNoMes(mes);
    if (dia < total) {
      const proj = (rel.totalRealizado / dia) * total;
      const p = pct(proj, rel.totalMeta);
      out.push({
        tom: p >= 100 ? "bom" : p >= 85 ? "atencao" : "critico",
        titulo: `Projeção de fechamento: ${fmt(p)}`,
        texto: `Com ${rel.totalRealizado} ações em ${dia} de ${total} dias, o ritmo atual fecha o mês em ≈${Math.round(proj)} ações para uma meta de ${rel.totalMeta}. Registros costumam ser lançados no fim do mês — acompanhe o ritmo semanal.`,
      });
    }
  }

  // 2) Excedente que mascara déficit
  const mascarados = rel.porTecnico.filter((t) => t.pct >= 100 && t.tiposAbaixo.length > 0);
  if (mascarados.length) {
    const t = mascarados[0];
    out.push({
      tom: "atencao",
      titulo: "Excedente não compensa déficit por tipo de ação",
      texto: `${mascarados.map((m) => m.tecnico).join(", ")} ${mascarados.length > 1 ? "superaram" : "superou"} a meta total, mas ${mascarados.length > 1 ? "ficaram" : "ficou"} abaixo em ao menos um tipo (ex.: ${t.tecnico} em ${TIPO_INFO[t.tiposAbaixo[0]].nome}). O cumprimento real da equipe é ${fmt(rel.pctCumprimento)}, contra ${fmt(rel.pctBruto)} no total bruto.`,
    });
  } else if (rel.pctBruto - rel.pctCumprimento >= 10) {
    out.push({
      tom: "info",
      titulo: "Distribuição desigual entre os tipos de ação",
      texto: `O total bruto é ${fmt(rel.pctBruto)}, mas limitando cada tipo à sua meta o cumprimento é ${fmt(rel.pctCumprimento)}.`,
    });
  }

  // 3) Tipo de ação mais crítico
  const pior = rel.porTipo.filter((t) => t.meta > 0).sort((a, b) => pct(a.realizado, a.meta) - pct(b.realizado, b.meta))[0];
  if (pior && pior.realizado < pior.meta) {
    const abaixo = pior.linhas.filter((l) => l.realizado < l.meta).map((l) => l.tecnico);
    out.push({
      tom: pct(pior.realizado, pior.meta) < 70 ? "critico" : "atencao",
      titulo: `Ponto crítico: ${TIPO_INFO[pior.tipo].nome} (${fmt(pct(pior.realizado, pior.meta))})`,
      texto: `${pior.realizado} de ${pior.meta} no total da equipe. Abaixo da meta: ${abaixo.join(", ")}. Priorize agenda para este tipo.`,
    });
  }

  // 4) Metas sem nenhum registro (meses encerrados)
  if (!emAndamento && !(mes === null && String(ano) === hojeIso.slice(0, 4))) {
    const zerados = rel.porTipo.flatMap((t) =>
      t.linhas.filter((l) => l.meta > 0 && l.realizado === 0).map((l) => `${l.tecnico} (${TIPO_INFO[t.tipo].curto})`),
    );
    if (zerados.length) out.push({ tom: "critico", titulo: "Metas sem nenhum registro", texto: zerados.join(" · ") });
  }

  // 5) Reincidência: abaixo da meta total em meses consecutivos (visão mensal)
  if (mes) {
    const anteriores = [1, 2].slice(0, emAndamento ? 2 : 1).map((n) => somaMeses(mes, -n));
    const reinc = rel.porTecnico
      .filter((t) => t.pct < 100)
      .filter((t) =>
        anteriores.every((m) => {
          const r = todas.filter((h) => h.tecnico === t.tecnico && h.mes === m);
          const mt = r.reduce((s, x) => s + x.meta, 0);
          return mt > 0 && r.reduce((s, x) => s + x.realizado, 0) < mt;
        }),
      )
      .map((t) => t.tecnico);
    if (reinc.length && !emAndamento) {
      out.push({
        tom: "critico",
        titulo: "Abaixo da meta em meses consecutivos",
        texto: `${reinc.join(", ")} — recomenda-se conversa individual e revisão de agenda/obstáculos.`,
      });
    }
  }

  // 6) Concentração (precisa de volume mínimo)
  const top = rel.porTecnico[0];
  if (top && rel.totalRealizado >= 30 && rel.porTecnico.length >= 3) {
    const share = (top.realizado / rel.totalRealizado) * 100;
    if (share >= 100 / rel.porTecnico.length + 12) {
      out.push({
        tom: "info",
        titulo: `Concentração: ${top.tecnico} responde por ${fmt(share)} das ações`,
        texto: `Com ${rel.porTecnico.length} técnicos, o esperado seria ≈${fmt(100 / rel.porTecnico.length)} cada. Avalie redistribuir demanda ou replicar as práticas de ${top.tecnico}.`,
      });
    }
  }

  // 7) Tendência vs. mês anterior (visão mensal, mês encerrado)
  if (mes && !emAndamento) {
    const a = pctMes(todas, mes);
    const b = pctMes(todas, somaMeses(mes, -1));
    if (b.meta > 0 && Math.abs(a.pct - b.pct) >= 3) {
      const delta = a.pct - b.pct;
      out.push({
        tom: delta > 0 ? "bom" : "atencao",
        titulo: `${delta > 0 ? "Melhora" : "Queda"} de ${Math.abs(Math.round(delta))} p.p. vs. ${capitaliza(rotuloMes(somaMeses(mes, -1)))}`,
        texto: `De ${fmt(b.pct)} para ${fmt(a.pct)} de atingimento da meta da equipe.`,
      });
    }
  }

  // 8) Melhor/pior mês do ano (visão anual)
  if (!mes) {
    const s = serieMensal(todas, ano, null, null, mesCorrente);
    if (s.length >= 3) {
      const melhor = [...s].sort((a, b) => b.pct - a.pct)[0];
      const pi = [...s].sort((a, b) => a.pct - b.pct)[0];
      out.push({
        tom: "info",
        titulo: `Melhor mês de ${ano}: ${capitaliza(rotuloMes(melhor.mes))} (${fmt(melhor.pct)})`,
        texto: `Pior mês: ${capitaliza(rotuloMes(pi.mes))} (${fmt(pi.pct)}). Clique num ponto da evolução para abrir o mês.`,
      });
    }
  }

  // 9) Reconhecimento
  const completos = rel.porTecnico.filter((x) => x.tiposAbaixo.length === 0 && x.meta > 0);
  if (completos.length && !emAndamento) {
    out.push({
      tom: "bom",
      titulo: `Meta completa em todos os tipos: ${completos.map((x) => x.tecnico).join(", ")}`,
      texto: "Reconhecer publicamente e compartilhar a rotina que levou ao resultado.",
    });
  }

  const ordem = { critico: 0, atencao: 1, info: 2, bom: 3 } as const;
  return out.sort((a, b) => ordem[a.tom] - ordem[b.tom]);
}
