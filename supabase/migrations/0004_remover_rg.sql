-- ============================================================================
-- REMOVER O CAMPO RG DAS INSCRICOES
--
-- Motivo: minimizacao de dados. A LGPD orienta coletar apenas o necessario,
-- e o CPF sozinho ja identifica o participante. Menos dado coletado significa
-- menos risco em caso de incidente e um formulario mais curto para preencher.
--
-- ATENCAO: esta operacao APAGA a coluna e tudo que estiver nela.
-- O bloco abaixo mostra antes quantos registros seriam afetados, e recusa a
-- remocao se houver algum RG gravado — assim voce nao perde dado sem querer.
--
-- Se houver registros e voce quiser mesmo remover: baixe primeiro a planilha
-- pelo painel administrativo, depois troque PROTEGER para false na linha
-- indicada e rode de novo.
-- ============================================================================

do $$
declare
  proteger  boolean := true;   -- <<<<<< troque para false para forcar a remocao
  existe    boolean;
  com_rg    integer := 0;
begin
  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name   = 'inscricoes'
      and column_name  = 'rg'
  ) into existe;

  if not existe then
    raise notice 'A coluna rg ja nao existe. Nada a fazer.';
    return;
  end if;

  execute 'select count(*) from public.inscricoes where rg is not null and btrim(rg) <> ''''' into com_rg;

  if com_rg > 0 and proteger then
    raise exception
      'Existem % inscricoes com RG preenchido. Baixe a planilha antes e depois troque proteger para false.', com_rg;
  end if;

  -- Remove a restricao de tamanho junto com a coluna.
  alter table public.inscricoes drop constraint if exists inscricoes_rg_tamanho;
  alter table public.inscricoes drop column if exists rg;

  raise notice 'Coluna rg removida. Registros afetados: %.', com_rg;
end $$;


-- Conferencia: a lista abaixo NAO deve mais conter "rg".
select column_name as colunas_da_tabela
from information_schema.columns
where table_schema = 'public' and table_name = 'inscricoes'
order by ordinal_position;
