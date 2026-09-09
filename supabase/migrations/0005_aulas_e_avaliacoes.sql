-- ============================================================================
-- AULAS E AVALIACOES
--
-- Permite que o participante avalie a aula do dia, e so a aula do dia.
-- Rode no SQL Editor -> Create a new snippet -> Run.
-- Pode ser executado mais de uma vez sem quebrar nada.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. AULAS
-- ---------------------------------------------------------------------------
-- Uma linha por encontro. A avaliacao de cada aula fica fechada por padrao e
-- e aberta pelo responsavel, no painel, no fim do encontro.
create table if not exists public.aulas (
  id                uuid primary key default gen_random_uuid(),
  numero            smallint    not null unique,
  tema              text        not null,
  data              date        not null,
  -- Enquanto for false, ninguem consegue avaliar esta aula.
  avaliacao_aberta  boolean     not null default false,
  -- Codigo de 4 digitos sorteado toda vez que a avaliacao e aberta.
  -- E ele que prova que a pessoa estava na sala: viaja dentro do QR Code
  -- projetado no fim da aula e muda a cada abertura.
  codigo_presenca   text,
  aberta_em         timestamptz,
  fechada_em        timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  constraint aulas_numero_valido  check (numero between 1 and 20),
  constraint aulas_tema_tamanho   check (char_length(btrim(tema)) between 3 and 120),
  constraint aulas_codigo_formato check (codigo_presenca is null or codigo_presenca ~ '^[0-9]{4}$'),
  -- Aberta sem codigo nao pode existir: seria avaliacao sem prova de presenca.
  constraint aulas_aberta_tem_codigo check (avaliacao_aberta = false or codigo_presenca is not null)
);

comment on table public.aulas is
  'Encontros da oficina. O responsavel abre a avaliacao de cada um no fim da aula.';

drop trigger if exists aulas_set_updated_at on public.aulas;
create trigger aulas_set_updated_at
  before update on public.aulas
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 2. AVALIACOES
-- ---------------------------------------------------------------------------
create table if not exists public.avaliacoes (
  id            uuid primary key default gen_random_uuid(),
  aula_id       uuid        not null references public.aulas (id)       on delete cascade,
  inscricao_id  uuid        not null references public.inscricoes (id)  on delete cascade,
  -- Escala Likert de 5 pontos, do rosto mais triste ao mais feliz.
  nota          smallint    not null,
  comentario    text,
  created_at    timestamptz not null default now(),

  constraint avaliacoes_nota_valida       check (nota between 1 and 5),
  constraint avaliacoes_comentario_tamanho check (comentario is null or char_length(comentario) <= 1200),
  -- Uma avaliacao por pessoa por aula.
  constraint avaliacoes_uma_por_pessoa    unique (aula_id, inscricao_id)
);

comment on table public.avaliacoes is
  'Avaliacoes das aulas. Ligadas a inscricao, mas exibidas sem identificar quem escreveu.';

create index if not exists avaliacoes_aula_idx    on public.avaliacoes (aula_id);
create index if not exists avaliacoes_criacao_idx on public.avaliacoes (created_at desc);

-- ---------------------------------------------------------------------------
-- 3. PROTECAO
-- ---------------------------------------------------------------------------
-- Mesmo padrao do resto do sistema: negar tudo por baixo, liberar so o que
-- precisa, e nunca dar poder algum a chave publica que fica no navegador.
alter table public.aulas       enable row level security;
alter table public.avaliacoes  enable row level security;
alter table public.aulas       force row level security;
alter table public.avaliacoes  force row level security;

-- A chave publica do site nao recebe privilegio nenhum sobre estas tabelas.
-- Quem le e grava e o servidor, com a chave secreta, depois de conferir
-- telefone, codigo de presenca e se a aula esta aberta.
revoke all on public.aulas      from anon;
revoke all on public.avaliacoes from anon;

grant select on public.aulas      to authenticated;
grant select on public.avaliacoes to authenticated;

drop policy if exists "admins_leem_aulas"       on public.aulas;
drop policy if exists "admins_alteram_aulas"    on public.aulas;
drop policy if exists "admins_leem_avaliacoes"  on public.avaliacoes;
drop policy if exists "admins_apagam_avaliacoes" on public.avaliacoes;

create policy "admins_leem_aulas"
  on public.aulas for select to authenticated
  using ((select public.is_admin()));

create policy "admins_alteram_aulas"
  on public.aulas for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "admins_leem_avaliacoes"
  on public.avaliacoes for select to authenticated
  using ((select public.is_admin()));

create policy "admins_apagam_avaliacoes"
  on public.avaliacoes for delete to authenticated
  using ((select public.is_admin()));

-- Nao existe politica de INSERT em avaliacoes: gravar so pela rota do
-- servidor, que confere presenca antes.

-- ---------------------------------------------------------------------------
-- 4. AS QUATRO AULAS DA OFICINA
-- ---------------------------------------------------------------------------
-- Para mudar tema ou data depois, edite aqui e rode de novo: o "on conflict"
-- atualiza a linha existente em vez de criar outra.
insert into public.aulas (numero, tema, data) values
  (1, 'Criando e configurando sua conta no ChatGPT',       date '2026-10-05'),
  (2, 'Como escrever um bom pedido e criar textos',        date '2026-10-06'),
  (3, 'Gerando imagens com Inteligência Artificial',       date '2026-10-08'),
  (4, 'Gerando vídeos com Inteligência Artificial',        date '2026-10-09')
on conflict (numero) do update
  set tema = excluded.tema,
      data = excluded.data;

-- Conferencia: devem aparecer as quatro aulas, todas com avaliacao fechada.
select numero, tema, to_char(data, 'DD/MM/YYYY') as data, avaliacao_aberta
from public.aulas
order by numero;
