import { TIPOS, TIPO_INFO, type Resumo, type ResumoEquipe, type TipoAcao } from "./tipos";
import { diasNoMes, rotuloMes, somaMeses } from "./datas";

export type Insight = {
  tom: "bom" | "atencao" | "critico" | "info";
  titulo: string;
  texto: string;
};

export type LinhaTecnico = { tecnico: string; realizado: number; meta: number };

export type Relatorio = {
  mes: string;
  totalRealizado: number;
  totalMeta: number;
  /** realizado / meta (pode passar de 100%) — igual ao "% Realizado" do relatório original */
  pctBruto: number;
  /** soma de min(realizado, meta) por técnico/tipo ÷ meta — excedente numa ação não compensa déficit em outra */
  pctCumprimento: number;
  porTipo: { tipo: TipoAcao; linhas: LinhaTecnico[]; realizado: number; meta: number }[];
  porTecnico: { tecnico: string; realizado: number; meta: number; pct: number; tiposAbaixo: TipoAcao[] }[];
  tendencia: { mes: string; rotulo: string; pct: number; realizado: number; meta: number }[];
};

const pct = (r: number, m: number) => (m > 0 ? (r / m) * 100 : 0);
const fmt = (n: number) => `${Math.round(n)}%`;

export function montaRelatorio(mes: string, rows: Resumo[], equipe: ResumoEquipe[]): Relatorio {
  const doMes = rows.filter((r) => r.mes === mes && (r.meta > 0 || r.realizado > 0));

  const porTipo = TIPOS.map((tipo) => {
    const linhas = doMes
      .filter((r) => r.tipo === tipo)
      .map((r) => ({ tecnico: r.tecnico, realizado: r.realizado, meta: r.meta }))
      .sort((a, b) => b.realizado - a.realizado || a.tecnico.localeCompare(b.tecnico));
    return {
      tipo,
      linhas,
      realizado: linhas.reduce((s, l) => s + l.realizado, 0),
      meta: linhas.reduce((s, l) => s + l.meta, 0),
    };
  });

  const totalRealizado = porTipo.reduce((s, t) => s + t.realizado, 0);
  const totalMeta = porTipo.reduce((s, t) => s + t.meta, 0);
  const capado = doMes.reduce((s, r) => s + Math.min(r.realizado, r.meta), 0);

  const nomes = [...new Set(doMes.map((r) => r.tecnico))];
  const porTecnico = nomes
    .map((tecnico) => {
      const mine = doMes.filter((r) => r.tecnico === tecnico);
      const realizado = mine.reduce((s, r) => s + r.realizado, 0);
      const meta = mine.reduce((s, r) => s + r.meta, 0);
      return {
        tecnico,
        realizado,
        meta,
        pct: pct(realizado, meta),
        tiposAbaixo: mine.filter((r) => r.meta > 0 && r.realizado < r.meta).map((r) => r.tipo),
      };
    })
    .sort((a, b) => b.pct - a.pct || b.realizado - a.realizado);

  const meses = [...new Set(equipe.map((e) => e.mes))].sort();
  const tendencia = meses.map((m) => {
    const es = equipe.filter((e) => e.mes === m);
    const realizado = es.reduce((s, e) => s + e.realizado, 0);
    const meta = es.reduce((s, e) => s + e.meta, 0);
    return { mes: m, rotulo: rotuloMes(m, "curto"), pct: pct(realizado, meta), realizado, meta };
  });

  return {
    mes,
    totalRealizado,
    totalMeta,
    pctBruto: pct(totalRealizado, totalMeta),
    pctCumprimento: pct(capado, totalMeta),
    porTipo,
    porTecnico,
    tendencia,
  };
}

/** Regras de insight — determinísticas e explicáveis (nada de caixa-preta). */
export function geraInsights(rel: Relatorio, historico: Resumo[], hojeIso: string): Insight[] {
  const out: Insight[] = [];
  const { mes } = rel;
  if (rel.totalMeta === 0) return out;

  const mesAtual = hojeIso.slice(0, 7) === mes.slice(0, 7);
  const diaDoMes = mesAtual ? Math.max(1, Number(hojeIso.slice(8, 10))) : diasNoMes(mes);
  const totalDias = diasNoMes(mes);

  // 1) Projeção de fechamento (só no mês corrente)
  if (mesAtual && diaDoMes < totalDias) {
    const proj = (rel.totalRealizado / diaDoMes) * totalDias;
    const p = pct(proj, rel.totalMeta);
    out.push({
      tom: p >= 100 ? "bom" : p >= 85 ? "atencao" : "critico",
      titulo: `Projeção de fechamento: ${fmt(p)}`,
      texto: `Com ${rel.totalRealizado} ações em ${diaDoMes} de ${totalDias} dias, o ritmo atual fecha o mês em ≈${Math.round(proj)} ações para uma meta de ${rel.totalMeta}.`,
    });
  }

  // 2) Excedente que mascara déficit (ex.: 111/66 no total mas 2/4 em comunidade)
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
  const comMeta = rel.porTipo.filter((t) => t.meta > 0);
  const pior = [...comMeta].sort((a, b) => pct(a.realizado, a.meta) - pct(b.realizado, b.meta))[0];
  if (pior && pior.realizado < pior.meta) {
    const abaixo = pior.linhas.filter((l) => l.realizado < l.meta).map((l) => l.tecnico);
    out.push({
      tom: pct(pior.realizado, pior.meta) < 70 ? "critico" : "atencao",
      titulo: `Ponto crítico: ${TIPO_INFO[pior.tipo].nome} (${fmt(pct(pior.realizado, pior.meta))})`,
      texto: `${pior.realizado} de ${pior.meta} no total da equipe. Abaixo da meta: ${abaixo.join(", ")}. Priorize agenda para este tipo.`,
    });
  }

  // 4) Técnicos sem nenhum registro em tipo com meta
  const zerados = rel.porTipo.flatMap((t) =>
    t.linhas.filter((l) => l.meta > 0 && l.realizado === 0).map((l) => `${l.tecnico} (${TIPO_INFO[t.tipo].curto})`),
  );
  if (zerados.length && !mesAtual) {
    out.push({
      tom: "critico",
      titulo: "Metas sem nenhum registro",
      texto: zerados.join(" · "),
    });
  }

  // 5) Reincidência: abaixo da meta total por ≥2 meses seguidos
  const ant = [1, 2, 3].map((n) => somaMeses(mes, -n));
  const reinc = rel.porTecnico
    .filter((t) => t.pct < 100)
    .filter((t) =>
      ant.slice(0, mesAtual ? 2 : 1).every((m) => {
        const r = historico.filter((h) => h.tecnico === t.tecnico && h.mes === m);
        const rl = r.reduce((s, x) => s + x.realizado, 0);
        const mt = r.reduce((s, x) => s + x.meta, 0);
        return mt > 0 && rl < mt;
      }),
    )
    .map((t) => t.tecnico);
  if (reinc.length && !mesAtual) {
    out.push({
      tom: "critico",
      titulo: "Abaixo da meta em meses consecutivos",
      texto: `${reinc.join(", ")} — recomenda-se conversa individual e revisão de agenda/obstáculos.`,
    });
  }

  // 6) Concentração: quem faz mais
  const top = rel.porTecnico[0];
  if (top && rel.totalRealizado > 0 && rel.porTecnico.length >= 3) {
    const share = (top.realizado / rel.totalRealizado) * 100;
    if (share >= 100 / rel.porTecnico.length + 12) {
      out.push({
        tom: "info",
        titulo: `Concentração: ${top.tecnico} responde por ${fmt(share)} das ações`,
        texto: `Com ${rel.porTecnico.length} técnicos, o esperado seria ≈${fmt(100 / rel.porTecnico.length)} cada. Avalie redistribuir demanda ou replicar as práticas de ${top.tecnico}.`,
      });
    }
  }

  // 7) Tendência vs. mês anterior
  const t = rel.tendencia;
  const i = t.findIndex((x) => x.mes === mes);
  if (i > 0 && !mesAtual) {
    const delta = t[i].pct - t[i - 1].pct;
    if (Math.abs(delta) >= 3) {
      out.push({
        tom: delta > 0 ? "bom" : "atencao",
        titulo: `${delta > 0 ? "Melhora" : "Queda"} de ${Math.abs(Math.round(delta))} p.p. vs. ${rotuloMes(t[i - 1].mes)}`,
        texto: `De ${fmt(t[i - 1].pct)} para ${fmt(t[i].pct)} de atingimento da meta da equipe.`,
      });
    }
  }

  // 8) Reconhecimento
  const acimaTudo = rel.porTecnico.filter((x) => x.tiposAbaixo.length === 0 && x.meta > 0);
  if (acimaTudo.length && !mesAtual) {
    out.push({
      tom: "bom",
      titulo: `Meta completa em todos os tipos: ${acimaTudo.map((x) => x.tecnico).join(", ")}`,
      texto: "Reconhecer publicamente e compartilhar a rotina que levou ao resultado.",
    });
  }

  const ordem = { critico: 0, atencao: 1, info: 2, bom: 3 } as const;
  return out.sort((a, b) => ordem[a.tom] - ordem[b.tom]);
}
