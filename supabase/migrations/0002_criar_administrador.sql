-- ============================================================================
-- COMO TRANSFORMAR UMA PESSOA EM ADMINISTRADORA DA OFICINA
--
-- PASSO 1 (no site do Supabase): Authentication -> Users -> "Add user"
--         -> "Create new user". Preencha e-mail e senha e marque
--         "Auto Confirm User".
--
-- PASSO 2 (aqui): troque o e-mail abaixo pelo e-mail que voce acabou de criar
--         e execute em SQL Editor -> New query -> Run.
--
-- Repita para cada responsavel que precisar acessar o painel.
-- ============================================================================

insert into public.admin_users (user_id, email, nome)
select u.id, u.email, 'Responsavel pela Oficina'
from auth.users u
where u.email = 'TROQUE-AQUI@exemplo.com'   -- <<<<<< troque este e-mail
on conflict (user_id) do nothing;

-- Confira se deu certo: deve aparecer uma linha com o e-mail.
select email, nome, created_at from public.admin_users order by created_at;


-- ----------------------------------------------------------------------------
-- PARA REMOVER O ACESSO DE ALGUEM (a conta continua existindo, mas perde o
-- acesso ao painel):
--
-- delete from public.admin_users
-- where email = 'pessoa@exemplo.com';
-- ----------------------------------------------------------------------------
