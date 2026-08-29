-- ============================================================================
-- CONFERENCIA DE SEGURANCA DO BANCO
--
-- Rode este arquivo no SQL Editor do Supabase depois de configurar tudo.
-- Ele nao altera nada: apenas mostra se a protecao esta ligada.
-- Compare cada resultado com o texto "ESPERADO" logo acima da consulta.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. A protecao por linha (RLS) esta ligada nas duas tabelas?
-- ESPERADO: duas linhas, ambas com rls_ligada = true e forcada = true
-- ----------------------------------------------------------------------------
select
  c.relname            as tabela,
  c.relrowsecurity     as rls_ligada,
  c.relforcerowsecurity as forcada
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('inscricoes', 'admin_users')
order by c.relname;


-- ----------------------------------------------------------------------------
-- 2. Quais politicas existem?
-- ESPERADO: 4 linhas.
--   admin_users : admin_le_proprio_registro      (SELECT)
--   inscricoes  : admins_apagam_inscricoes       (DELETE)
--   inscricoes  : admins_atualizam_inscricoes    (UPDATE)
--   inscricoes  : admins_leem_inscricoes         (SELECT)
-- NAO deve existir nenhuma politica de INSERT em inscricoes: gravar so pelo
-- servidor do site.
-- ----------------------------------------------------------------------------
select tablename as tabela, policyname as politica, cmd as operacao, roles
from pg_policies
where schemaname = 'public'
order by tablename, policyname;


-- ----------------------------------------------------------------------------
-- 3. A chave publica (anon) tem algum poder sobre as tabelas?
-- ESPERADO: NENHUMA linha. Se aparecer alguma, a chave publica do site
--           conseguiria mexer nos dados - refaca o arquivo 0001_init.sql.
-- ----------------------------------------------------------------------------
select grantee as quem, table_name as tabela, privilege_type as pode_fazer
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in ('inscricoes', 'admin_users')
  and grantee = 'anon';


-- ----------------------------------------------------------------------------
-- 4. Teste pratico: alguem sem login consegue ler os inscritos?
-- ESPERADO: erro de permissao OU zero linhas. Nunca os dados.
-- ----------------------------------------------------------------------------
do $$
declare
  quantidade integer;
begin
  set local role anon;
  begin
    select count(*) into quantidade from public.inscricoes;
    if quantidade > 0 then
      raise warning 'ATENCAO: visitante sem login leu % linhas!', quantidade;
    else
      raise notice 'OK: visitante sem login leu 0 linhas.';
    end if;
  exception
    when insufficient_privilege then
      raise notice 'OK: visitante sem login foi bloqueado (sem permissao).';
  end;
  reset role;
end $$;


-- ----------------------------------------------------------------------------
-- 5. Teste pratico: alguem sem login consegue GRAVAR uma inscricao direto
--    no banco, pulando o site?
-- ESPERADO: mensagem "OK: ... bloqueado".
-- ----------------------------------------------------------------------------
do $$
begin
  set local role anon;
  begin
    insert into public.inscricoes
      (nome_completo, cpf, rg, celular, email, consentimento_lgpd)
    values ('Teste Invasor', '00000000000', '0000', '11900000000',
            'teste@invasor.com', true);
    raise warning 'ATENCAO: visitante sem login conseguiu gravar!';
    raise exception 'desfazendo';   -- garante que nada fique gravado
  exception
    when insufficient_privilege then
      raise notice 'OK: gravacao direta bloqueada (sem permissao).';
    when others then
      raise notice 'OK: gravacao direta bloqueada (%).', sqlerrm;
  end;
  reset role;
end $$;


-- ----------------------------------------------------------------------------
-- 6. Quem sao os administradores cadastrados hoje?
-- ESPERADO: somente as pessoas que voce mesmo cadastrou.
-- ----------------------------------------------------------------------------
select email, nome, created_at from public.admin_users order by created_at;


-- ----------------------------------------------------------------------------
-- 7. Quantas inscricoes existem? (apenas numeros, sem dados pessoais)
-- ----------------------------------------------------------------------------
select
  count(*) as total_de_inscritos,
  count(*) filter (
    where data_inscricao_local = (now() at time zone 'America/Sao_Paulo')::date
  ) as inscritos_hoje
from public.inscricoes;
