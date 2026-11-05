export const TIPOS = [
  "observacao_comportamental",
  "icit_estatico",
  "inspecao_veicular",
  "dss",
  "acao_comunidade",
] as const;

export type TipoAcao = (typeof TIPOS)[number];

export const TIPO_INFO: Record<
  TipoAcao,
  { nome: string; curto: string; descricao: string; referencia: string }
> = {
  observacao_comportamental: {
    nome: "Observações Comportamentais",
    curto: "Observ. Comport.",
    descricao: "Abordagem e feedback sobre comportamentos seguros e de risco.",
    referencia: "Código do Relatório",
  },
  icit_estatico: {
    nome: "ICIT Estático",
    curto: "ICIT Estático",
    descricao: "Inspeção de EPI, EPC e ferramentas.",
    referencia: "Local / equipamento inspecionado",
  },
  inspecao_veicular: {
    nome: "Inspeção Veicular",
    curto: "Insp. Veicular",
    descricao: "Checklist de veículos da operação.",
    referencia: "Placa do veículo",
  },
  dss: {
    nome: "DSS",
    curto: "DSS",
    descricao: "Diálogo Semanal / Diário de Segurança.",
    referencia: "Tema / equipe",
  },
  acao_comunidade: {
    nome: "Ações na Comunidade",
    curto: "Ações Comunidade",
    descricao: "Ações de segurança junto à comunidade.",
    referencia: "Comunidade / local",
  },
};

export type Resumo = {
  tecnico_id: string;
  tecnico: string;
  mes: string; // yyyy-mm-dd (primeiro dia)
  tipo: TipoAcao;
  realizado: number;
  meta: number;
};

export type ResumoEquipe = Omit<Resumo, "tecnico_id" | "tecnico">;

export type Tecnico = {
  id: string;
  nome: string;
  user_id: string | null;
  papel: "tecnico" | "gestor";
  ativo: boolean;
};

/** Linha enxuta usada pelo painel de relatórios. */
export type Linha = Pick<Resumo, "tecnico" | "mes" | "tipo" | "realizado" | "meta">;
