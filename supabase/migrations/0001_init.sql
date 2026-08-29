-- ============================================================================
-- OFICINA DE INTELIGENCIA ARTIFICIAL - FAAP + Bairro com Vida
-- Estrutura completa do banco de dados (PostgreSQL / Supabase)
--
-- COMO USAR:
--   Supabase -> SQL Editor -> New query -> cole TODO este arquivo -> Run.
--   Pode ser executado mais de uma vez sem quebrar nada (e idempotente).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. TABELA DE INSCRICOES
-- ---------------------------------------------------------------------------
-- Decisoes de armazenamento:
--   * cpf     -> guardado SOMENTE com numeros (11 digitos). A mascara
--                000.000.000-00 e aplicada apenas na tela. Isso evita que o
--                mesmo CPF entre duas vezes escrito de formas diferentes.
--   * celular -> guardado SOMENTE com numeros (10 ou 11 digitos), mesma logica.
--   * rg      -> guardado sem pontos/tracos e em MAIUSCULAS, porque o formato
--                do RG muda de estado para estado (alguns tem letra).
--   * email   -> guardado em minusculas.
--   * data_inscricao -> um unico campo timestamptz. "Data" e "hora" separadas
--                sao geradas a partir dele no fuso America/Sao_Paulo (colunas
--                geradas mais abaixo), evitando dois campos que podem divergir.
create table if not exists public.inscricoes (
  id                 uuid primary key default gen_random_uuid(),
  nome_completo      text        not null,
  cpf                text        not null unique,
  rg                 text        not null,
  celular            text        not null,
  email              text        not null,
  consentimento_lgpd boolean     not null default false,
  data_inscricao     timestamptz not null default now(),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),

  -- Validacoes no proprio banco: mesmo que algo passe pelo site, o banco
  -- recusa dados fora do formato.
  constraint inscricoes_cpf_numerico     check (cpf ~ '^[0-9]{11}$'),
  constraint inscricoes_celular_numerico check (celular ~ '^[0-9]{10,11}$'),
  constraint inscricoes_email_formato    check (email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[a-z]{2,}$'),
  constraint inscricoes_nome_tamanho     check (char_length(btrim(nome_completo)) between 3 and 120),
  constraint inscricoes_rg_tamanho       check (char_length(btrim(rg)) between 4 and 20),
  -- Sem consentimento LGPD nao existe inscricao.
  constraint inscricoes_consentimento    check (consentimento_lgpd = true)
);

comment on table public.inscricoes is
  'Inscricoes da Oficina de IA. Contem dados pessoais (LGPD): acesso somente para administradores.';

-- Colunas geradas: data e hora ja no fuso de Sao Paulo, prontas para o Excel.
alter table public.inscricoes
  add column if not exists data_inscricao_local date
    generated always as ((data_inscricao at time zone 'America/Sao_Paulo')::date) stored;

alter table public.inscricoes
  add column if not exists hora_inscricao_local time
    generated always as ((data_inscricao at time zone 'America/Sao_Paulo')::time) stored;

-- Indices: lista sempre ordenada da inscricao mais nova para a mais antiga,
-- e buscas por nome / email / celular no painel administrativo.
create index if not exists inscricoes_created_at_idx on public.inscricoes (created_at desc);
create index if not exists inscricoes_data_local_idx on public.inscricoes (data_inscricao_local);
create index if not exists inscricoes_nome_idx       on public.inscricoes (lower(nome_completo));
create index if not exists inscricoes_email_idx      on public.inscricoes (lower(email));
create index if not exists inscricoes_celular_idx    on public.inscricoes (celular);

-- ---------------------------------------------------------------------------
-- 2. ATUALIZACAO AUTOMATICA DE updated_at
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists inscricoes_set_updated_at on public.inscricoes;
create trigger inscricoes_set_updated_at
  before update on public.inscricoes
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 3. TABELA DE ADMINISTRADORES
-- ---------------------------------------------------------------------------
-- Nao existe senha aqui. A senha fica no Supabase Auth (auth.users), que ja
-- guarda tudo criptografado. Esta tabela apenas diz QUEM, entre os usuarios
-- do Auth, tem permissao de administrador.
create table if not exists public.admin_users (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  email      text not null,
  nome       text,
  created_at timestamptz not null default now()
);

comment on table public.admin_users is
  'Lista de quem pode entrar no painel /admin. Ligada ao usuario do Supabase Auth.';

-- ---------------------------------------------------------------------------
-- 4. FUNCAO AUXILIAR: o usuario logado e administrador?
-- ---------------------------------------------------------------------------
-- SECURITY DEFINER permite que a funcao leia admin_users mesmo quando o
-- usuario nao tem permissao direta de leitura na tabela. search_path travado
-- em string vazia evita ataques de troca de schema.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_users a where a.user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY (RLS)
-- ---------------------------------------------------------------------------
-- Regra do PostgreSQL: com RLS ligada e SEM politica que autorize, a resposta
-- e sempre "nenhuma linha". O padrao aqui e negar tudo.
alter table public.inscricoes  enable row level security;
alter table public.admin_users enable row level security;

-- Forca a RLS a valer inclusive para o dono da tabela.
alter table public.inscricoes  force row level security;
alter table public.admin_users force row level security;

-- 5.1 Privilegios de tabela (camada anterior a RLS).
-- "anon" e a chave publica que fica no navegador. Ela NAO recebe nenhum
-- privilegio sobre inscricoes: mesmo que alguem copie a chave publica do site,
-- nao consegue ler nem gravar nada nesta tabela.
revoke all on public.inscricoes  from anon;
revoke all on public.admin_users from anon;

-- "authenticated" pode ate tentar ler, mas a RLS abaixo so libera para admins.
grant select on public.inscricoes  to authenticated;
grant select on public.admin_users to authenticated;

-- 5.2 Politicas da tabela inscricoes.
drop policy if exists "admins_leem_inscricoes"     on public.inscricoes;
drop policy if exists "admins_atualizam_inscricoes" on public.inscricoes;
drop policy if exists "admins_apagam_inscricoes"    on public.inscricoes;

-- LEITURA: apenas usuarios logados que estao em admin_users.
-- Um participante inscrito NAO consegue ver nenhuma inscricao, nem a propria,
-- porque participantes nem sequer possuem conta de login.
create policy "admins_leem_inscricoes"
  on public.inscricoes for select
  to authenticated
  using ((select public.is_admin()));

-- CORRECAO e EXCLUSAO de dados (direito do titular pela LGPD): so admin.
create policy "admins_atualizam_inscricoes"
  on public.inscricoes for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "admins_apagam_inscricoes"
  on public.inscricoes for delete
  to authenticated
  using ((select public.is_admin()));

-- INSERCAO: nao existe nenhuma politica de INSERT.
-- Ou seja: ninguem consegue gravar uma inscricao usando a chave publica.
-- A matricula do site acontece por uma operacao controlada no servidor
-- (rota /api/inscricoes), que valida tudo antes de gravar e usa a chave
-- secreta service_role - que nunca sai do servidor.

-- 5.3 Politicas da tabela admin_users.
drop policy if exists "admin_le_proprio_registro" on public.admin_users;

create policy "admin_le_proprio_registro"
  on public.admin_users for select
  to authenticated
  using (user_id = (select auth.uid()));

-- Ninguem cria, edita ou apaga administradores pelo site: isso e feito
-- somente pelo painel do Supabase (SQL Editor), por quem tem acesso ao projeto.

-- ============================================================================
-- FIM
-- ============================================================================
