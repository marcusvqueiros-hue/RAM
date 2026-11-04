-- Gestores não possuem metas de produção: ficam fora do rolar_metas() e do trigger de novos técnicos.
create or replace function public.ram_rolar_metas(p_mes date default date_trunc('month', current_date)::date)
returns int language plpgsql security definer set search_path = public as $$
declare n int;
begin
  insert into public.ram_metas (tecnico_id, mes, tipo, valor)
  select t.id, date_trunc('month', p_mes)::date, p.tipo, p.valor
  from public.ram_tecnicos t cross join public.ram_metas_padrao p
  where t.ativo and t.papel = 'tecnico'
  on conflict do nothing;
  get diagnostics n = row_count;
  return n;
end $$;

create or replace function public.ram_tg_tecnico_metas()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.ativo and new.papel = 'tecnico' then
    insert into public.ram_metas (tecnico_id, mes, tipo, valor)
    select new.id, date_trunc('month', current_date)::date, p.tipo, p.valor
    from public.ram_metas_padrao p
    on conflict do nothing;
  end if;
  return new;
end $$;

delete from public.ram_metas where tecnico_id in (select id from public.ram_tecnicos where papel = 'gestor');
