# RAM · Relatório de Atividades Mensais (Segurança)

Sistema para técnicos de segurança registrarem as ações do mês e para a gestão acompanhar metas, ranking e insights.

| Link | Para quê |
| --- | --- |
| `/tecnico` | **Área do técnico** — registrar Blitz Comportamental, ICIT Estático, Inspeção Veicular, DSS e Ações na Comunidade; ver progresso das próprias metas |
| `/relatorios` | **Relatórios** — resultado por técnico/tipo (barras + traço da meta), medidores, evolução histórica, ranking e insights automáticos |
| `/entrar`, `/cadastrar` | Login e primeiro acesso (cadastro fechado por código da equipe) |

## Stack

Next.js 16 (App Router, Server Actions, `proxy.ts`) · React 19 · TypeScript · Tailwind CSS 4 · Supabase (Postgres + Auth + RLS) · Recharts · Zod · Vercel.

## Decisões de arquitetura

- **Segurança em camadas**: o `proxy.ts` valida a sessão (`auth.getUser()`), e o Postgres impõe **RLS** — técnico só insere/remove os *próprios* registros (remoção até 7 dias); metas e cadastro só pelo gestor. A `service_role` fica restrita ao servidor (cadastro e cron).
- **Cadastro fechado**: criar conta exige o `TEAM_SIGNUP_CODE` e vincula o usuário a um técnico existente (atômico, sem duplicar).
- **Dados**: `registros` (1 linha por lançamento), `metas` (por técnico/mês/tipo), `metas_padrao`; views `v_resumo_mensal` e `v_resumo_equipe` (com `security_invoker`) alimentam os relatórios. O histórico da planilha foi importado como totais mensais (`origem = 'importacao_excel'`).
- **Metas mensais automáticas**: Vercel Cron (`/api/cron/metas`, dia 1º) chama `rolar_metas()` e cria as metas padrão para os técnicos ativos.

## Insights (regras explicáveis, em `src/lib/relatorio.ts`)

Além do **% Realizado** do relatório original (total ÷ meta, que pode passar de 100%), o sistema mostra o **% Cumprimento por tipo**, que limita cada tipo à sua meta — assim excedente em uma ação não esconde déficit em outra (ex.: quem fez 111/66 no total, mas 2/4 em Ações na Comunidade).
Também gera: projeção de fechamento do mês, ponto crítico por tipo, metas sem nenhum registro, reincidência (meses seguidos abaixo da meta), concentração de produção, variação vs. mês anterior e reconhecimento de quem bateu todas as metas.

## Rodando localmente

```bash
cp .env.example .env.local   # preencha com as chaves do seu projeto Supabase
npm install
npm run dev
```

## Banco de dados (Supabase)

```bash
npx supabase login
npx supabase link --project-ref <ref>
npx supabase db push                       # aplica supabase/migrations
# seed (histórico 2024-2026): cole supabase/seed.sql no SQL Editor, ou:
npx supabase db query --linked -f supabase/seed.sql
```

`supabase/seed.sql` é gerado por `python -I scripts/gerar_seed.py` a partir de `data/RAM - 2026.xlsx` (planilha não versionada).

Para promover alguém a gestor:

```sql
update public.ram_tecnicos set papel = 'gestor' where nome = 'Fulano';
```

## Deploy (Vercel)

Configure as variáveis de `.env.example` no projeto Vercel (Production + Preview) e faça o deploy; o `vercel.json` já registra o cron mensal.

---

Desenvolvedor: **Marcus Vinicius Silva Queiros**.
