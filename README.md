# Oficina de Inteligência Artificial — FAAP + Bairro com Vida

Site de inscrição da oficina, com painel administrativo privado para os
responsáveis pelo projeto.

Este guia foi escrito para quem **não é programador**. Siga na ordem, do
começo ao fim. Cada passo diz exatamente onde clicar.

---

## O que este sistema faz

| Endereço | Para que serve | Quem pode ver |
|---|---|---|
| `/` | Página de apresentação da oficina | Todo mundo |
| `/inscricao` | Formulário de matrícula | Todo mundo |
| `/sucesso` | Confirmação da matrícula | Todo mundo |
| `/privacidade` | Explicação sobre o uso dos dados | Todo mundo |
| `/admin` | Tela de login dos responsáveis | Todo mundo vê a tela; só entra quem tem conta |
| `/admin/dashboard` | Lista de inscritos e download do Excel | **Somente administradores** |

Um participante **nunca** vê a inscrição de outro participante. Não existe
nenhum endereço público que mostre a lista.

---

## 1. Criar o projeto no Supabase

O Supabase é onde os dados ficam guardados. O plano gratuito é suficiente
para esta oficina.

1. Acesse **https://supabase.com** e clique em **Start your project**.
   Entre com sua conta do GitHub ou com seu e-mail.
2. Clique em **New project**.
3. Preencha:
   - **Name**: `oficina-ia-faap`
   - **Database Password**: clique em **Generate a password** e **guarde essa
     senha em lugar seguro** (você quase não vai usá-la, mas não dá para
     recuperar depois).
   - **Region**: escolha `South America (São Paulo)`.
4. Clique em **Create new project** e espere alguns minutos.

### 1.1 Criar as tabelas

1. No menu da esquerda, clique em **SQL Editor**.
2. Clique em **New query**.
3. Abra o arquivo `supabase/migrations/0001_init.sql` deste projeto,
   **copie todo o conteúdo** e cole na caixa de texto.
4. Clique em **Run** (ou aperte `Ctrl+Enter`).
5. Deve aparecer **Success. No rows returned**. Pronto: as tabelas e todas as
   regras de segurança foram criadas.

---

## 2. Quais variáveis de ambiente configurar

São três valores. Eles ligam o site ao banco de dados.

| Nome | O que é | Pode aparecer no navegador? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Endereço do seu projeto | Sim, é público |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave pública | Sim, é público |
| `SUPABASE_SERVICE_ROLE_KEY` | **Chave secreta** | **Nunca.** Só o servidor usa |

> **Muito importante:** a chave secreta (`service_role`) dá acesso total ao
> banco. Nunca a envie por WhatsApp, nunca a coloque em um arquivo que vá para
> o GitHub e nunca acrescente `NEXT_PUBLIC_` no nome dela.

---

## 3. Onde encontrar esses valores

1. No Supabase, com o projeto aberto, clique na engrenagem **Settings** (canto
   inferior esquerdo).
2. Clique em **API Keys** (em alguns projetos aparece só como **API**).
3. Você verá:
   - **Project URL** → é o `NEXT_PUBLIC_SUPABASE_URL`
     (algo como `https://abcdefghijk.supabase.co`)
   - **anon public** → é o `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** → é o `SUPABASE_SERVICE_ROLE_KEY`
     (clique em **Reveal** para mostrar)
4. Use o botão de copiar ao lado de cada valor.

---

## 4. Criar o primeiro administrador

Administrador é quem pode entrar em `/admin/dashboard` e ver os inscritos.

### Passo 1 — criar a conta

1. No Supabase, menu da esquerda → **Authentication** → **Users**.
2. Clique em **Add user** → **Create new user**.
3. Preencha o **e-mail** e uma **senha forte** (use pelo menos 12 caracteres,
   misturando letras, números e símbolos).
4. Se aparecer uma caixinha **“Auto Confirm User”**, marque. **Se não
   aparecer, siga em frente** — as versões mais novas do painel não mostram
   mais essa opção, e o SQL do Passo 2 já resolve isso.
5. Clique em **Create user**.

### Passo 2 — confirmar o e-mail e dar permissão

Criar a conta ainda **não** dá acesso ao painel. Falta autorizá-la:

1. Menu da esquerda → **SQL Editor** → **Create a new snippet**
   (em versões antigas o botão se chamava *New query*).
2. Cole o conteúdo do arquivo `supabase/migrations/0002_criar_administrador.sql`.
3. **Troque `TROQUE-AQUI@exemplo.com` pelo seu e-mail nos três lugares**
   marcados com `<<<<<<`.
4. Clique em **Run**.
5. O resultado é uma tabela com uma linha. As colunas **email_confirmado** e
   **e_administrador** precisam vir as duas como `true`.

Repita os dois passos para cada responsável que precisar de acesso.

### Para remover o acesso de alguém

No **SQL Editor**, rode:

```sql
delete from public.admin_users where email = 'pessoa@exemplo.com';
```

A pessoa continua com conta, mas perde o acesso ao painel na mesma hora.

---

## 5. Rodar no seu computador

Você precisa do **Node.js 20 ou mais novo** (baixe em https://nodejs.org).

1. Abra o Terminal na pasta do projeto (`oficina-ia`).
2. Instale as dependências:

```bash
npm install
```

3. Crie o arquivo de configuração:

```bash
cp .env.example .env.local
```

4. Abra o `.env.local` em qualquer editor de texto e cole os três valores do
   passo 3. Salve.
5. Ligue o site:

```bash
npm run dev
```

6. Abra **http://localhost:3000** no navegador.

Para parar, aperte `Ctrl+C` no Terminal.

### Conferir se está tudo certo

```bash
npm test
```

```bash
npm run build
```

O primeiro comando roda os testes automáticos. O segundo monta a versão final
e avisa se houver qualquer erro.

---

## 6. Publicar na internet (Vercel)

1. Coloque o projeto no GitHub (crie um repositório e envie a pasta).
   Confira que o arquivo `.env.local` **não** foi enviado — ele já está na
   lista de arquivos ignorados.
2. Acesse **https://vercel.com** e entre com a conta do GitHub.
3. Clique em **Add New…** → **Project**.
4. Escolha o repositório e clique em **Import**.
5. Em **Root Directory**, selecione a pasta `oficina-ia` (se o repositório
   tiver outras pastas dentro).
6. Abra **Environment Variables** e cadastre os três valores, um por vez:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
7. Clique em **Deploy** e aguarde alguns minutos.

> **Cadastre as variáveis ANTES de clicar em Deploy.** Os endereços do
> Supabase ficam gravados dentro do site no momento em que ele é montado. Se
> o Deploy rodar sem eles, o site abre mas o formulário não salva nada. Se
> isso acontecer: cadastre as variáveis e clique em **Redeploy** — só salvar
> não resolve, é preciso montar o site de novo.
8. A Vercel mostra o endereço do site, algo como
   `https://oficina-ia-faap.vercel.app`. O **HTTPS (cadeado)** já vem ligado.

Daí em diante, toda vez que você enviar uma alteração para o GitHub, a Vercel
publica sozinha a nova versão.

---

## 7. Usar um domínio próprio no futuro

1. Compre o domínio (Registro.br, GoDaddy, Hostinger etc.).
2. Na Vercel, abra o projeto → **Settings** → **Domains**.
3. Clique em **Add**, digite o domínio (ex.: `oficinaia.com.br`) e confirme.
4. A Vercel mostra os registros de DNS que você deve cadastrar no site onde
   comprou o domínio. Normalmente:
   - um registro **A** apontando para o IP indicado pela Vercel, e
   - um registro **CNAME** para o `www`.
5. Copie exatamente o que a Vercel mostrar e cadastre lá.
6. Espere de alguns minutos até algumas horas. Quando ficar verde na Vercel,
   está no ar — com cadeado de segurança incluído, sem custo.

---

## 8. Exportar a lista de inscritos

1. Acesse `SEU-ENDERECO/admin`.
2. Entre com o e-mail e a senha de administrador.
3. Clique no botão verde **BAIXAR LISTA DE INSCRITOS**.
4. O arquivo `inscritos_oficina_ia_faap.xlsx` é baixado e abre no Excel, no
   Google Planilhas ou no LibreOffice.

O arquivo traz: Nome completo, CPF, RG, Celular, E-mail, Data da inscrição e
Hora da inscrição.

> Ninguém sem login consegue baixar esse arquivo. O sistema confere quem está
> pedindo **antes** de gerar a planilha.

### Sobre o painel

- **Total de inscritos** e **Inscritos hoje** aparecem no topo.
- O campo de pesquisa procura por nome, CPF, celular ou e-mail.
- CPF e RG aparecem escondidos (`***.456.789-**`). Use **Mostrar CPF e RG**
  para ver por completo quando precisar conferir um documento — e clique de
  novo para esconder.
- A lista mostra sempre as inscrições mais recentes primeiro.
- **SAIR** encerra a sessão.

---

## 8.1 Colocar os logos oficiais

O site já usa as fotos da oficina (pasta `public/fotos`). Para os logos, salve
os dois arquivos com **exatamente estes nomes**:

```
public/logos/faap.svg
public/logos/bairro-com-vida.svg
```

Também funciona `.png` (com fundo transparente) ou `.webp` — o site procura
sozinho, nesta ordem: `.svg`, `.png`, `.webp`, `.jpg`. Prefira SVG: fica
nítido em qualquer tela.

Assim que os arquivos existirem, os logos oficiais aparecem no cabeçalho, na
página inicial, nos selos de parceria e no rodapé. **Não é preciso mexer em
nenhum código.** Rodando local, reinicie o site (`Ctrl+C` e `npm run dev`);
publicado, envie para o GitHub.

Enquanto os arquivos não estiverem lá, o site mostra um selo de texto no
lugar — nada quebra e nada fica com cara de erro.

### Trocar as fotos

As fotos ficam em `public/fotos`. Para trocar uma, salve a nova com o mesmo
nome do arquivo antigo. Para usar outro nome, mude também o campo `foto` em
`src/config/oficina.ts`.

---

## 9. Alterar os textos da oficina

Todos os textos ficam em **um único arquivo**:

```
src/config/oficina.ts
```

Abra-o em qualquer editor. Você pode mudar:

- `titulo` — o título grande da página inicial
- `subtitulo` — a linha “FAAP + Bairro com Vida”
- `chamada` — a frase de destaque
- `descricao` — o parágrafo de apresentação
- `temas` — a lista de assuntos que aparecem em cartões
- `slides` — os quatro destaques do carrossel (título, texto e foto)
- `passos` — os três passos de "Como funciona a matrícula"
- `galeria` — as fotos e legendas da galeria
- `parceria` — as frases institucionais ("Tecnologia que aproxima.")
- `contato` — e-mail e WhatsApp mostrados no rodapé

Altere apenas o texto **entre aspas**. Não apague as vírgulas nem as aspas.

Depois de salvar: se estiver rodando local, a página se atualiza sozinha. Se
já estiver publicado, envie a alteração para o GitHub (`git push`) e a Vercel
publica em poucos minutos.

---

## 10. Alterar data, horário e local da oficina

No mesmo arquivo `src/config/oficina.ts`, procure o trecho `encontro`:

```ts
encontro: {
  data: "",
  horario: "",
  local: "",
  observacao: "A data e o local serão confirmados por telefone ou e-mail.",
},
```

Preencha assim, por exemplo:

```ts
encontro: {
  data: "Sábado, 10 de outubro de 2026",
  horario: "das 14h às 17h",
  local: "FAAP — Rua Alagoas, 903 — Higienópolis, São Paulo",
  observacao: "Chegue 15 minutos antes para o credenciamento.",
},
```

Um bloco **Quando e onde** aparece automaticamente na página inicial.
Se deixar os três campos vazios (`""`), o bloco não aparece — útil enquanto a
data ainda não está definida.

---

## Segurança: o que já está protegido

- **HTTPS** automático na Vercel.
- **Nenhuma senha escrita no código.** As senhas ficam no Supabase Auth,
  guardadas de forma criptografada.
- **A chave secreta nunca vai para o navegador.** O arquivo que a usa é
  marcado como “só servidor”; se alguém tentar usá-la no navegador por engano,
  o projeto nem compila.
- **Row Level Security (RLS)** ligada nas duas tabelas, com o padrão de
  **negar tudo**. As políticas criadas estão explicadas dentro do arquivo
  `supabase/migrations/0001_init.sql`.
- **A chave pública não tem nenhum poder** sobre a tabela de inscrições:
  mesmo copiando a chave que aparece no site, ninguém lê nem grava nada.
- **A matrícula só acontece por uma rota controlada no servidor**, que valida
  tudo de novo antes de gravar.
- **Validação dupla:** no navegador (para avisar rápido) e no servidor
  (que é o que realmente vale), mais restrições no próprio banco.
- **CPF e RG nunca aparecem** em endereços da web, em telas públicas nem nos
  registros técnicos (logs).
- **Proteção contra XSS** com Content Security Policy usando um código
  sorteado a cada visita.
- **Proteção contra excesso de envios** (anti-robô) no formulário.
- **A área administrativa não é indexada** por buscadores.

Para conferir você mesmo, rode `supabase/migrations/0003_conferir_seguranca.sql`
no **SQL Editor** do Supabase. Ele não altera nada — apenas mostra se a
proteção está ligada, com o resultado esperado escrito ao lado de cada teste.

---

## Problemas comuns

**“Variável de ambiente ausente” ao abrir o site**
Falta preencher o `.env.local` (local) ou as Environment Variables (Vercel).
Depois de mudar na Vercel, é preciso clicar em **Redeploy**.

**Entro com a senha certa e aparece “Esta conta não tem permissão”**
A conta existe, mas ainda não foi autorizada. Faça o Passo 2 do item 4.

**“E-mail ou senha incorretos” mesmo com a senha certa**
Confira se a caixa **Auto Confirm User** foi marcada quando a conta foi
criada. Se não foi, apague a conta e crie de novo com ela marcada.

**Alguém precisa corrigir ou apagar a própria inscrição (LGPD)**
No Supabase → **Table Editor** → tabela `inscricoes`, procure pela pessoa e
edite ou apague a linha.

---

## Estrutura do projeto

```
oficina-ia/
├─ src/
│  ├─ app/
│  │  ├─ page.tsx                      página inicial
│  │  ├─ inscricao/page.tsx            formulário
│  │  ├─ sucesso/page.tsx              confirmação
│  │  ├─ privacidade/page.tsx          uso dos dados (LGPD)
│  │  ├─ admin/page.tsx                login
│  │  ├─ admin/dashboard/page.tsx      painel de inscritos
│  │  └─ api/
│  │     ├─ inscricoes/route.ts        grava a matrícula (público)
│  │     └─ admin/                     lista, perfil e exportação (privado)
│  ├─ components/                      peças de tela (carrossel, logos, campos)
│  ├─ config/oficina.ts                TEXTOS DA OFICINA (edite aqui)
│  ├─ lib/                             validação, formatação, segurança
│  └─ middleware.ts                    portão de entrada e CSP
├─ public/
│  ├─ fotos/                          fotos da oficina
│  └─ logos/                          logos da FAAP e do Bairro com Vida
├─ supabase/migrations/                SQL para configurar o banco
├─ tests/                              testes automáticos
└─ .env.example                        modelo das variáveis de ambiente
```

## Tecnologias

Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · Supabase
(PostgreSQL + Auth) · ExcelJS · Vercel

> **Sobre a geração do Excel:** o pedido original citava a biblioteca
> `xlsx` (SheetJS). A versão publicada no npm está abandonada desde 2022 e
> tem duas falhas de segurança graves sem correção. Como este sistema guarda
> dados pessoais, usamos a **ExcelJS**, que é mantida e gera exatamente o
> mesmo formato `.xlsx`. O projeto fecha com **zero vulnerabilidades**
> (`npm audit`).
