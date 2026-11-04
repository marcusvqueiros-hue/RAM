-- RAM · Relatório de Atividades Mensais — schema inicial
-- Rodar via `supabase db push` ou no SQL Editor do Supabase.

create type public.tipo_acao as enum (
  'observacao_comportamental',
  'icit_estatico',
  'inspecao_veicular',
  'dss',
  'acao_comunidade'
);

create type public.papel as enum ('tecnico', 'gestor');

-- ---------------------------------------------------------------- tabelas
create table public.tecnicos (
  id         uuid primary key default gen_random_uuid(),
  nome       text not null,
  user_id    uuid unique references auth.users(id) on delete set null,
  papel      public.papel not null default 'tecnico',
  ativo      boolean not null default true,
  created_at timestamptz not null default now(),
  constraint tecnicos_nome_unico unique (nome)
);

create table public.registros (
  id          uuid primary key default gen_random_uuid(),
  tecnico_id  uuid not null references public.tecnicos(id) on delete cascade,
  tipo        public.tipo_acao not null,
  data        date not null default current_date,
  quantidade  int  not null default 1 check (quantidade between 1 and 200),
  local       text,
  observacao  text,
  origem      text not null default 'app',   -- 'app' | 'importacao_excel'
  created_at  timestamptz not null default now()
);
create index registros_tecnico_data_idx on public.registros (tecnico_id, data desc);
create index registros_data_tipo_idx    on public.registros (data, tipo);

create table public.metas (
  tecnico_id uuid not null references public.tecnicos(id) on delete cascade,
  mes        date not null check (mes = date_trunc('month', mes)::date),
  tipo       public.tipo_acao not null,
  valor      int  not null check (valor >= 0),
  primary key (tecnico_id, mes, tipo)
);

create table public.metas_padrao (
  tipo  public.tipo_acao primary key,
  valor int not null check (valor >= 0)
);
insert into public.metas_padrao (tipo, valor) values
  ('observacao_comportamental', 15),
  ('icit_estatico',             12),
  ('inspecao_veicular',         15),
  ('dss',                       20),
  ('acao_comunidade',            4);

-- --------------------------------------------------------------- funções
create or replace function public.is_gestor()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.tecnicos where user_id = auth.uid() and papel = 'gestor' and ativo
  );
$$;

create or replace function public.meu_tecnico_id()
returns uuid language sql stable security definer set search_path = public as $$
  select id from public.tecnicos where user_id = auth.uid() and ativo limit 1;
$$;

-- Cria as metas padrão do mês para todos os técnicos ativos (idempotente).
create or replace function public.rolar_metas(p_mes date default date_trunc('month', current_date)::date)
returns int language plpgsql security definer set search_path = public as $$
declare n int;
begin
  insert into public.metas (tecnico_id, mes, tipo, valor)
  select t.id, date_trunc('month', p_mes)::date, p.tipo, p.valor
  from public.tecnicos t cross join public.metas_padrao p
  where t.ativo
  on conflict do nothing;
  get diagnostics n = row_count;
  return n;
end $$;
revoke all on function public.rolar_metas(date) from public, anon, authenticated;

create or replace function public.tg_tecnico_metas()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.ativo then
    insert into public.metas (tecnico_id, mes, tipo, valor)
    select new.id, date_trunc('month', current_date)::date, p.tipo, p.valor
    from public.metas_padrao p
    on conflict do nothing;
  end if;
  return new;
end $$;
create trigger tecnicos_metas_iniciais
  after insert on public.tecnicos
  for each row execute function public.tg_tecnico_metas();

-- ------------------------------------------------------------------ views
create view public.v_resumo_mensal with (security_invoker = true) as
with r as (
  select tecnico_id, date_trunc('month', data)::date as mes, tipo, sum(quantidade)::int as realizado
  from public.registros group by 1, 2, 3
)
select
  coalesce(r.tecnico_id, m.tecnico_id) as tecnico_id,
  t.nome                               as tecnico,
  coalesce(r.mes,  m.mes)              as mes,
  coalesce(r.tipo, m.tipo)             as tipo,
  coalesce(r.realizado, 0)             as realizado,
  coalesce(m.valor, 0)                 as meta
from r
full join public.metas m on m.tecnico_id = r.tecnico_id and m.mes = r.mes and m.tipo = r.tipo
join public.tecnicos t on t.id = coalesce(r.tecnico_id, m.tecnico_id);

create view public.v_resumo_equipe with (security_invoker = true) as
select mes, tipo, sum(realizado)::int as realizado, sum(meta)::int as meta
from public.v_resumo_mensal
group by mes, tipo;

-- -------------------------------------------------------------------- RLS
alter table public.tecnicos     enable row level security;
alter table public.registros    enable row level security;
alter table public.metas        enable row level security;
alter table public.metas_padrao enable row level security;

-- leitura: qualquer usuário autenticado (relatórios da equipe são transparentes)
create policy tecnicos_select  on public.tecnicos     for select to authenticated using (true);
create policy registros_select on public.registros    for select to authenticated using (true);
create policy metas_select     on public.metas        for select to authenticated using (true);
create policy padrao_select    on public.metas_padrao for select to authenticated using (true);

-- técnico registra/remove apenas os próprios registros
create policy registros_insert on public.registros for insert to authenticated
  with check (tecnico_id = public.meu_tecnico_id() or public.is_gestor());
create policy registros_delete on public.registros for delete to authenticated
  using ((tecnico_id = public.meu_tecnico_id() and created_at > now() - interval '7 days') or public.is_gestor());

-- gestão: metas e cadastro de técnicos
create policy metas_gestor    on public.metas        for all to authenticated
  using (public.is_gestor()) with check (public.is_gestor());
create policy padrao_gestor   on public.metas_padrao for all to authenticated
  using (public.is_gestor()) with check (public.is_gestor());
create policy tecnicos_gestor on public.tecnicos     for update to authenticated
  using (public.is_gestor()) with check (public.is_gestor());

grant select on public.v_resumo_mensal, public.v_resumo_equipe to authenticated;
