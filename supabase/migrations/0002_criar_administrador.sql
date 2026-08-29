-- ============================================================================
-- COMO TRANSFORMAR UMA PESSOA EM ADMINISTRADORA DA OFICINA
--
-- PASSO 1 (no site do Supabase): Authentication -> Users -> "Add user"
--         -> "Create new user". Preencha e-mail e uma senha forte.
--
--         Algumas versoes do painel mostram uma caixinha "Auto Confirm User".
--         Se ela aparecer, marque. Se NAO aparecer, tudo bem: o SQL abaixo
--         ja confirma o e-mail sozinho.
--
-- PASSO 2 (aqui): troque o e-mail nas TRES linhas marcadas abaixo pelo e-mail
--         que voce acabou de criar, e execute em
--         SQL Editor -> Create a new snippet -> Run.
--
-- Repita para cada responsavel que precisar acessar o painel.
-- ============================================================================

-- 1. Confirma o e-mail. Sem isso o Supabase recusa o login.
update auth.users
set email_confirmed_at = coalesce(email_confirmed_at, now())
where email = 'TROQUE-AQUI@exemplo.com';          -- <<<<<< troque este e-mail

-- 2. Da permissao de administrador.
insert into public.admin_users (user_id, email, nome)
select u.id, u.email, 'Responsavel pela Oficina'
from auth.users u
where u.email = 'TROQUE-AQUI@exemplo.com'         -- <<<<<< troque este e-mail
on conflict (user_id) do nothing;

-- 3. Confere o resultado. As duas colunas precisam vir "true".
select
  u.email,
  (u.email_confirmed_at is not null) as email_confirmado,
  (a.user_id is not null)            as e_administrador
from auth.users u
left join public.admin_users a on a.user_id = u.id
where u.email = 'TROQUE-AQUI@exemplo.com';        -- <<<<<< troque este e-mail


-- ----------------------------------------------------------------------------
-- PARA REMOVER O ACESSO DE ALGUEM (a conta continua existindo, mas perde o
-- acesso ao painel):
--
-- delete from public.admin_users
-- where email = 'pessoa@exemplo.com';
-- ----------------------------------------------------------------------------
