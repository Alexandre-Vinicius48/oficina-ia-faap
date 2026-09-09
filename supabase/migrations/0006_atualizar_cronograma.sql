-- ============================================================================
-- ATUALIZAR OS TEMAS E AS DATAS DAS AULAS
--
-- Use este arquivo sempre que o cronograma mudar. Edite os textos e as datas
-- abaixo e rode em SQL Editor -> Create a new snippet -> Run.
--
-- Nao apaga nem mexe nas avaliacoes ja recebidas: so troca o titulo e a data
-- de cada encontro.
-- ============================================================================

insert into public.aulas (numero, tema, data) values
  (1, 'Criando e configurando sua conta no ChatGPT',   date '2026-10-05'),
  (2, 'Como escrever um bom pedido e criar textos',    date '2026-10-06'),
  (3, 'Gerando imagens com Inteligência Artificial',   date '2026-10-08'),
  (4, 'Gerando vídeos com Inteligência Artificial',    date '2026-10-09')
on conflict (numero) do update
  set tema = excluded.tema,
      data = excluded.data;

-- Conferencia: as quatro aulas com os temas novos.
select numero, tema, to_char(data, 'DD/MM/YYYY') as data, avaliacao_aberta
from public.aulas
order by numero;
