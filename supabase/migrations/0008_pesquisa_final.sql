-- ============================================================================
-- QUESTIONARIO FINAL (Pesquisa de satisfacao dos quatro encontros)
--
-- Mesmo funcionamento da avaliacao de aula: o responsavel libera no painel,
-- projeta o QR Code, e quem esta na sala entra com celular + codigo.
--
-- A diferenca e que a pesquisa NAO pertence a uma aula: ela avalia a oficina
-- inteira. Por isso o estado dela mora em "configuracoes", junto do botao de
-- inscricoes, e nao na tabela de aulas.
--
-- Rode em SQL Editor -> Create a new snippet -> Run.
-- Pode ser executado mais de uma vez sem quebrar nada.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. ESTADO DA PESQUISA (liberada ou nao, e o codigo da vez)
-- ---------------------------------------------------------------------------
alter table public.configuracoes
  add column if not exists pesquisa_aberta boolean not null default false;

alter table public.configuracoes
  add column if not exists pesquisa_codigo text;

alter table public.configuracoes
  add column if not exists pesquisa_aberta_em timestamptz;

-- Mesmo cuidado das aulas: aberta sem codigo seria pesquisa sem prova de
-- presenca, e o codigo tem de ser exatamente quatro digitos.
alter table public.configuracoes
  drop constraint if exists configuracoes_pesquisa_codigo_formato;
alter table public.configuracoes
  add  constraint configuracoes_pesquisa_codigo_formato
  check (pesquisa_codigo is null or pesquisa_codigo ~ '^[0-9]{4}$');

alter table public.configuracoes
  drop constraint if exists configuracoes_pesquisa_aberta_tem_codigo;
alter table public.configuracoes
  add  constraint configuracoes_pesquisa_aberta_tem_codigo
  check (pesquisa_aberta = false or pesquisa_codigo is not null);

-- ---------------------------------------------------------------------------
-- 2. RESPOSTAS
-- ---------------------------------------------------------------------------
-- As 28 afirmacoes ficam em um unico campo jsonb, no formato
--   { "org_bem_organizada": 5, "amb_local_confortavel": 0, ... }
-- onde 5 = Concordo totalmente ... 1 = Discordo totalmente e 0 = Nao sei.
--
-- Por que jsonb em vez de 28 colunas: o texto das perguntas vive no codigo
-- (src/lib/pesquisa.ts), que e quem monta a tela e a planilha. Com colunas
-- fixas, mudar uma pergunta exigiria migracao de banco; com jsonb, a lista
-- de perguntas continua sendo uma coisa so, em um lugar so. Sao poucas
-- dezenas de respostas, entao nao ha ganho de desempenho a perder.
create table if not exists public.pesquisa_respostas (
  id            uuid        primary key default gen_random_uuid(),
  inscricao_id  uuid        not null references public.inscricoes (id) on delete cascade,
  respostas     jsonb       not null default '{}'::jsonb,
  mais_gostou   text,
  melhorar      text,
  como_usar     text,
  created_at    timestamptz not null default now(),

  -- Uma resposta por pessoa.
  constraint pesquisa_uma_por_pessoa unique (inscricao_id),
  constraint pesquisa_respostas_objeto check (jsonb_typeof(respostas) = 'object'),
  constraint pesquisa_mais_gostou_tamanho check (mais_gostou is null or char_length(mais_gostou) <= 1200),
  constraint pesquisa_melhorar_tamanho    check (melhorar    is null or char_length(melhorar)    <= 1200),
  constraint pesquisa_como_usar_tamanho   check (como_usar   is null or char_length(como_usar)   <= 1200)
);

comment on table public.pesquisa_respostas is
  'Questionario final da oficina. Uma linha por participante, com o nome vindo da inscricao.';

create index if not exists pesquisa_respostas_criacao_idx
  on public.pesquisa_respostas (created_at desc);

-- ---------------------------------------------------------------------------
-- 3. PROTECAO
-- ---------------------------------------------------------------------------
-- Mesmo padrao do resto do sistema: a chave publica que fica no navegador
-- nao recebe privilegio nenhum. Quem le e grava e o servidor, com a chave
-- secreta, depois de conferir celular, codigo e se a pesquisa esta aberta.
alter table public.pesquisa_respostas enable row level security;
alter table public.pesquisa_respostas force  row level security;

revoke all    on public.pesquisa_respostas from anon;
grant  select on public.pesquisa_respostas to   authenticated;

drop policy if exists "admins_leem_pesquisa"   on public.pesquisa_respostas;
drop policy if exists "admins_apagam_pesquisa" on public.pesquisa_respostas;

create policy "admins_leem_pesquisa"
  on public.pesquisa_respostas for select to authenticated
  using ((select public.is_admin()));

create policy "admins_apagam_pesquisa"
  on public.pesquisa_respostas for delete to authenticated
  using ((select public.is_admin()));

-- Nao existe politica de INSERT: gravar so pela rota do servidor, que
-- confere presenca antes.

-- ---------------------------------------------------------------------------
-- Conferencia: a pesquisa comeca FECHADA e sem nenhuma resposta.
-- ---------------------------------------------------------------------------
select
  (select pesquisa_aberta from public.configuracoes)    as pesquisa_aberta,
  (select count(*) from public.pesquisa_respostas)      as respostas;
