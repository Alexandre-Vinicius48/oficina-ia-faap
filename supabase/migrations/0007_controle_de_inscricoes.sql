-- ============================================================================
-- LIGAR E DESLIGAR AS INSCRICOES
--
-- Cria uma tabela de configuracao com UMA linha so, que guarda se o
-- formulario de inscricao esta aceitando gente ou nao.
--
-- Rode em SQL Editor -> Create a new snippet -> Run.
-- Pode ser executado mais de uma vez sem quebrar nada.
-- ============================================================================

create table if not exists public.configuracoes (
  -- O truque do "id boolean com check" garante que so existe UMA linha:
  -- qualquer tentativa de inserir outra esbarra na chave primaria.
  id                 boolean     primary key default true,
  inscricoes_abertas boolean     not null    default true,
  atualizado_em      timestamptz not null    default now(),

  constraint configuracoes_linha_unica check (id)
);

comment on table public.configuracoes is
  'Ajustes gerais da oficina. Tem sempre uma linha so.';

drop trigger if exists configuracoes_set_updated_at on public.configuracoes;
create or replace function public.set_atualizado_em()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.atualizado_em := now();
  return new;
end;
$$;

create trigger configuracoes_set_updated_at
  before update on public.configuracoes
  for each row execute function public.set_atualizado_em();

-- ---------------------------------------------------------------------------
-- PROTECAO
-- ---------------------------------------------------------------------------
-- Mesmo padrao do resto: a chave publica que fica no navegador nao recebe
-- privilegio nenhum. Quem le e escreve e o servidor.
alter table public.configuracoes enable row level security;
alter table public.configuracoes force row level security;

revoke all on public.configuracoes from anon;
grant select on public.configuracoes to authenticated;

drop policy if exists "admins_leem_configuracoes"    on public.configuracoes;
drop policy if exists "admins_alteram_configuracoes" on public.configuracoes;

create policy "admins_leem_configuracoes"
  on public.configuracoes for select to authenticated
  using ((select public.is_admin()));

create policy "admins_alteram_configuracoes"
  on public.configuracoes for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- ESTADO INICIAL: INSCRICOES FECHADAS
-- ---------------------------------------------------------------------------
-- Comeca fechado, conforme pedido. Para abrir, use o botao no painel
-- administrativo -- nao precisa voltar aqui.
insert into public.configuracoes (id, inscricoes_abertas)
values (true, false)
on conflict (id) do nothing;

-- Conferencia: uma linha, com inscricoes_abertas = false.
select inscricoes_abertas, atualizado_em from public.configuracoes;
