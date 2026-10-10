# Spec — Histórico mensal do cartão

| Campo | Valor |
| ----- | ----- |
| Status | Implementada |
| Criada em | 10/10/2026 |
| Escopo | `src/data/store.ts`, `src/data/api.ts`, `src/pages/*`, `src/App.tsx`, `README.md` |

> Esta spec é a fonte da verdade da funcionalidade. A implementação segue a seção [Tarefas](#11-tarefas) e só termina quando todos os [Critérios de aceite](#10-critérios-de-aceite) forem atendidos. Mudanças de comportamento entram primeiro aqui e só depois no código.

---

## 1. Contexto e objetivo

Hoje o app guarda **um único conjunto contínuo** de dados: um cartão, categorias com orçamento (abertas ou fechadas) e lançamentos com data. Não existe a ideia de mês. Com o tempo, as categorias e os lançamentos se acumulam, e não há como responder:

> "Em **Outubro**, quanto o cartão somou, quais categorias eu tinha e o que lancei em cada uma?"

**Objetivo:** organizar os dados por **mês do calendário** e dar ao usuário:

1. Um **painel por mês**: a mesma tela de hoje, mostrando só o mês escolhido.
2. Uma **tela de histórico** com todos os meses e o resumo de cada um.
3. Uma **virada de mês** em que o usuário escolhe se reaproveita as categorias do mês anterior ou começa do zero.

## 2. Glossário

| Termo | Definição |
| ----- | --------- |
| **Mês de referência** | Texto `YYYY-MM` (ex.: `2026-10`) que identifica um mês. |
| **Mês corrente** | Mês da data local do aparelho (`new Date().toLocaleDateString('en-CA').slice(0, 7)`). |
| **Mês iniciado** | Mês que tem uma entrada em `months` no armazenamento. |
| **Valor do mês** | Soma de todos os lançamentos das categorias do mês. É o "quanto o cartão somou". |
| **Planejado do mês** | Soma dos orçamentos das categorias **abertas** do mês. |
| **Comprometido do mês** | Planejado do mês + soma do que foi gasto nas categorias **fechadas** do mês. É a regra do README, aplicada a um mês. |
| **Limite do mês** | Limite do cartão gravado quando o mês foi iniciado. |
| **Disponível do mês** | Limite do mês − comprometido do mês. |

## 3. Decisões de produto

| # | Decisão | Motivo |
| - | ------- | ------ |
| D1 | O ciclo é o **mês do calendário** (dia 1 ao último dia), definido de forma automática. | Escolha do usuário. É simples e previsível. Ciclo por fechamento de fatura fica fora de escopo. |
| D2 | **Cada categoria pertence a um mês.** Um lançamento herda o mês da categoria e precisa ter data dentro dele. | Assim, "categorias de outubro" e "lançamentos de outubro" significam a mesma coisa. |
| D3 | **Meses passados continuam editáveis.** O único bloqueio continua sendo o `isClosed` da categoria. | Permite registrar em 01/11 uma compra feita em 31/10. |
| D4 | **Na virada de mês, o app pergunta na hora:** "Copiar categorias de ‹mês anterior›" ou "Começar do zero". | Escolha do usuário. |
| D5 | Se o mês anterior iniciado **não tem categorias**, o diálogo não aparece e o mês começa vazio. | Não faz sentido perguntar se não há o que copiar. |
| D6 | Cada mês **grava o limite** do cartão ao ser iniciado. Editar o cartão altera o limite global **e o do mês corrente**, nunca o de meses passados. | O histórico precisa refletir o limite da época. |
| D7 | **Meses futuros** não podem ser abertos nem iniciados. | Evita planejar em meses que ainda não existem e mantém o histórico limpo. |
| D8 | **Remover o cartão** apaga tudo, inclusive o histórico. | Mantém a regra atual ("remover o cartão apaga todas as categorias e lançamentos"). |
| D9 | Ao carregar dados antigos (v1), tudo vai para o **mês corrente**, sem perda. | É a migração mais simples e não exige decisão do usuário. |

## 4. Requisitos

### 4.1 Requisitos funcionais (RF)

| ID | Requisito |
| -- | --------- |
| RF-01 | Existe uma tela **Histórico** (`/historico`) com todos os meses iniciados, do mais recente para o mais antigo. Cada item mostra: nome do mês (ex.: "Outubro de 2026"), valor do mês, comprometido, limite do mês, % do limite comprometido, quantidade de categorias e de lançamentos. |
| RF-02 | Tocar em um mês do histórico abre o **painel daquele mês** (`/mes/2026-10`): visão do cartão, visão geral, categorias e lançamentos, todos filtrados pelo mês. |
| RF-03 | O painel tem um **seletor de mês** ‹ ›, que navega para o mês anterior e o seguinte. O botão "seguinte" fica desabilitado no mês corrente. O painel também tem um atalho para o Histórico. |
| RF-04 | A rota `/` mostra sempre o **mês corrente**. |
| RF-05 | Ao abrir o app, se há cartão, o mês corrente não foi iniciado e o último mês iniciado tem categorias, aparece o **diálogo de virada de mês**, com as opções "Copiar categorias de ‹mês›" e "Começar do zero". |
| RF-06 | "Copiar categorias" cria no mês corrente uma cópia de cada categoria do último mês iniciado, com o mesmo nome e orçamento, **aberta** e **sem lançamentos**. |
| RF-07 | Criar categoria ou lançamento usa sempre o **mês que está sendo visto** no painel. |
| RF-08 | No diálogo de lançamento, o campo de data aceita só datas do mês da categoria (`min`/`max`). A data sugerida é hoje, se hoje cair no mês, ou o último dia do mês, se não cair. |
| RF-09 | O painel de um mês sem categorias mostra o estado vazio atual, com a opção de criar a primeira categoria daquele mês. |

### 4.2 Regras de negócio (RN)

| ID | Regra |
| -- | ----- |
| RN-01 | A data de um lançamento **precisa estar dentro do mês da categoria**. Se não estiver, a operação falha com "A data deve estar dentro de ‹outubro de 2026›.". A regra vale ao **criar** e ao **editar**. |
| RN-02 | Valor, planejado, comprometido e disponível do cartão são calculados **só com as categorias do mês** que está sendo visto. |
| RN-03 | Não é possível iniciar, abrir ou criar dados em um mês **posterior** ao mês corrente. A rota `#/mes/‹futuro›` redireciona para `#/`. |
| RN-04 | Um mês é iniciado em uma destas situações: (a) ao escolher uma opção no diálogo de virada; (b) ao criar a primeira categoria nele; (c) ao cadastrar o cartão (o mês corrente é iniciado); (d) na migração v1 → v2. |
| RN-05 | Ao iniciar um mês, `limitAmount` do mês recebe o limite atual do cartão. |
| RN-06 | Editar o limite do cartão atualiza o limite do **mês corrente** (se ele já foi iniciado) e não altera meses passados. |
| RN-07 | Remover o cartão apaga cartão, meses, categorias e lançamentos. |
| RN-08 | A migração v1 → v2 é automática, acontece uma única vez e não perde dados (detalhes na seção 6). |
| RN-09 | Copiar categorias **nunca copia lançamentos** e sempre cria as categorias como abertas, mesmo que a original esteja fechada. |

## 5. Cenários (BDD)

Os cenários usam a data de hoje como **10/10/2026**, salvo indicação.

```gherkin
# language: pt

Funcionalidade: Histórico mensal do cartão
  Como pessoa que controla os gastos do cartão
  Quero ver o cartão mês a mês
  Para saber quanto gastei em cada mês, em quais categorias e com quais lançamentos

  Contexto:
    Dado que tenho o cartão "Principal" com limite de R$ 5.000,00

  # --- RF-01 -----------------------------------------------------------------
  Cenário: Ver a lista do histórico
    Dado que setembro de 2026 tem a categoria "Mercado" (orçamento R$ 800,00, fechada) com lançamentos que somam R$ 750,00
    E que outubro de 2026 tem a categoria "Mercado" (orçamento R$ 900,00, aberta) com lançamentos que somam R$ 300,00
    Quando abro o Histórico
    Então vejo "Outubro de 2026" antes de "Setembro de 2026"
    E "Outubro de 2026" mostra valor R$ 300,00 e comprometido R$ 900,00
    E "Setembro de 2026" mostra valor R$ 750,00 e comprometido R$ 750,00
    E cada mês mostra 1 categoria e a quantidade de lançamentos

  # --- RF-02 / RN-02 ---------------------------------------------------------
  Cenário: Abrir o mês de outubro
    Dado que outubro de 2026 tem as categorias "Mercado" e "Casa"
    E que setembro de 2026 tem a categoria "Viagem"
    Quando abro "Outubro de 2026" no Histórico
    Então vejo o painel de outubro com o nome do mês no título
    E vejo as categorias "Mercado" e "Casa"
    E não vejo a categoria "Viagem"
    E o "Já comprometido" do cartão considera só as categorias de outubro
    E a lista de movimentações mostra os lançamentos da categoria selecionada de outubro

  # --- RF-03 / RN-03 ---------------------------------------------------------
  Cenário: Navegar entre meses no painel
    Dado que estou no painel de outubro de 2026
    Quando toco em "mês anterior"
    Então vejo o painel de setembro de 2026
    E o botão "próximo mês" está habilitado
    Quando toco em "próximo mês"
    Então vejo o painel de outubro de 2026
    E o botão "próximo mês" está desabilitado

  Cenário: Não abrir um mês futuro
    Quando acesso a rota "#/mes/2026-11"
    Então sou levado para o painel do mês corrente

  # --- RF-04 -----------------------------------------------------------------
  Cenário: A tela inicial mostra o mês corrente
    Quando abro o app
    Então vejo o painel de "Outubro de 2026"

  # --- RF-05 / RF-06 / RN-09 -------------------------------------------------
  Cenário: Virada de mês copiando categorias
    Dado que hoje é 01/11/2026
    E que outubro de 2026 tem "Mercado" (R$ 900,00, fechada) e "Casa" (R$ 1.200,00, aberta), ambas com lançamentos
    E que novembro de 2026 ainda não foi iniciado
    Quando abro o app
    Então vejo o diálogo de virada de mês
    Quando escolho "Copiar categorias de outubro"
    Então novembro de 2026 tem "Mercado" com orçamento R$ 900,00 e "Casa" com orçamento R$ 1.200,00
    E as duas categorias estão abertas e sem lançamentos
    E as categorias de outubro continuam com os mesmos lançamentos
    E o diálogo não aparece de novo

  Cenário: Virada de mês começando do zero
    Dado que hoje é 01/11/2026
    E que outubro de 2026 tem categorias
    E que novembro de 2026 ainda não foi iniciado
    Quando abro o app e escolho "Começar do zero"
    Então novembro de 2026 é iniciado sem categorias
    E vejo o estado vazio "Uma categoria de cada vez."

  # --- D5 --------------------------------------------------------------------
  Cenário: Virada de mês sem categorias para copiar
    Dado que hoje é 01/11/2026
    E que outubro de 2026 foi iniciado sem categorias
    Quando abro o app
    Então o diálogo de virada de mês não aparece
    E vejo o painel de novembro vazio

  # --- RF-07 / RN-04 ---------------------------------------------------------
  Cenário: Criar categoria em um mês passado
    Dado que estou no painel de setembro de 2026
    Quando crio a categoria "Farmácia" com orçamento R$ 200,00
    Então "Farmácia" aparece em setembro de 2026
    E não aparece em outubro de 2026

  # --- RN-01 / RF-08 ---------------------------------------------------------
  Cenário: Recusar lançamento com data fora do mês da categoria
    Dado que outubro de 2026 tem a categoria aberta "Mercado"
    Quando tento lançar "Feira" de R$ 50,00 em "Mercado" com data 05/11/2026
    Então vejo o erro "A data deve estar dentro de outubro de 2026."
    E nenhum lançamento é criado

  Cenário: Editar lançamento para uma data fora do mês
    Dado que "Mercado" de outubro de 2026 tem o lançamento "Feira" em 03/10/2026
    Quando edito "Feira" para a data 28/09/2026
    Então vejo o erro "A data deve estar dentro de outubro de 2026."
    E "Feira" continua com a data 03/10/2026

  Cenário: Registrar no começo do mês uma compra do mês anterior
    Dado que hoje é 01/11/2026
    E que outubro de 2026 tem a categoria aberta "Mercado"
    Quando abro o painel de outubro de 2026
    E lanço "Padaria" de R$ 20,00 em "Mercado" com data 31/10/2026
    Então o lançamento é salvo em outubro de 2026
    E o valor de outubro de 2026 aumenta R$ 20,00

  Cenário: Data sugerida no lançamento de um mês passado
    Dado que estou no painel de setembro de 2026
    Quando abro o diálogo de novo lançamento
    Então a data sugerida é 30/09/2026
    E o campo de data só aceita datas de 01/09/2026 a 30/09/2026

  # --- D3 --------------------------------------------------------------------
  Cenário: Categoria fechada de mês passado continua bloqueada
    Dado que setembro de 2026 tem a categoria fechada "Mercado"
    Quando abro o painel de setembro de 2026
    Então não consigo lançar, editar nem excluir lançamentos em "Mercado"

  # --- RN-05 / RN-06 / D6 ----------------------------------------------------
  Cenário: Alterar o limite não reescreve o histórico
    Dado que setembro de 2026 foi iniciado com limite R$ 5.000,00
    E que outubro de 2026 foi iniciado com limite R$ 5.000,00
    Quando altero o limite do cartão para R$ 6.000,00
    Então o limite de outubro de 2026 é R$ 6.000,00
    E o limite de setembro de 2026 continua R$ 5.000,00

  Cenário: Cadastrar o cartão inicia o mês corrente
    Dado que não tenho cartão cadastrado
    Quando cadastro o cartão "Principal" com limite R$ 3.000,00
    Então outubro de 2026 é iniciado com limite R$ 3.000,00
    E o diálogo de virada de mês não aparece

  # --- RN-07 / D8 ------------------------------------------------------------
  Cenário: Remover o cartão apaga o histórico
    Dado que tenho dados em setembro e outubro de 2026
    Quando removo o cartão e confirmo
    Então o Histórico fica vazio
    E vejo o convite "Vamos anotar o seu cartão?"

  # --- RN-08 / D9 ------------------------------------------------------------
  Cenário: Migrar dados da versão anterior
    Dado que o app guardou dados no formato v1 com 3 categorias e 12 lançamentos
    E que alguns lançamentos têm data de agosto de 2026
    Quando abro a nova versão do app em 10/10/2026
    Então as 3 categorias aparecem em outubro de 2026
    E os 12 lançamentos continuam com as datas originais
    E outubro de 2026 foi iniciado com o limite atual do cartão
    E o diálogo de virada de mês não aparece
```

### Matriz de cobertura

| Requisito | Cenário(s) |
| --------- | ---------- |
| RF-01 | Ver a lista do histórico |
| RF-02, RN-02 | Abrir o mês de outubro |
| RF-03 | Navegar entre meses no painel |
| RF-04 | A tela inicial mostra o mês corrente |
| RF-05, RF-06, RN-09 | Virada de mês copiando categorias |
| D4 | Virada de mês começando do zero |
| D5 | Virada de mês sem categorias para copiar |
| RF-07, RN-04(b) | Criar categoria em um mês passado |
| RF-08 | Data sugerida no lançamento de um mês passado |
| RF-09 | Virada de mês começando do zero (estado vazio) |
| RN-01 | Recusar lançamento com data fora do mês / Editar lançamento para uma data fora do mês |
| D3 | Registrar no começo do mês uma compra do mês anterior / Categoria fechada de mês passado continua bloqueada |
| RN-03, D7 | Não abrir um mês futuro |
| RN-04(c), RN-05 | Cadastrar o cartão inicia o mês corrente |
| RN-06, D6 | Alterar o limite não reescreve o histórico |
| RN-07, D8 | Remover o cartão apaga o histórico |
| RN-04(d), RN-08, D9 | Migrar dados da versão anterior |

## 6. Modelo de dados e migração

### 6.1 Estado v2 (`src/data/store.ts`)

```ts
export type MonthKey = string; // 'YYYY-MM'

export type StoredCard = { id: number; name: string; limitAmount: number };
export type StoredMonth = { month: MonthKey; limitAmount: number };
export type StoredCategory = { id: number; month: MonthKey; name: string; amount: number; isClosed: boolean };
export type StoredMovement = { id: number; categoryId: number; description: string; amount: number; date: string };

type State = {
  version: 2;
  nextId: number;
  card: StoredCard | null;
  months: StoredMonth[];
  categories: StoredCategory[];
  movements: StoredMovement[];
};

export type MonthSummary = {
  month: MonthKey;
  limitAmount: number;
  spentAmount: number;      // valor do mês
  plannedAmount: number;    // orçamentos das categorias abertas
  committedAmount: number;  // planejado + gasto das fechadas
  percentUsed: number;      // committed / limit
  categoryCount: number;
  movementCount: number;
};
```

Os lançamentos **não** guardam `month`. O mês de um lançamento é sempre o mês da sua categoria, o que evita duas fontes de verdade.

### 6.2 Migração v1 → v2

Ela roda dentro de `load()`, antes de devolver o estado:

1. `version === 2` → usar o estado como está.
2. `version === 1` → montar o estado v2:
   - `categories = v1.categories.map(c => ({ ...c, month: currentMonth() }))`;
   - `months = v1.card ? [{ month: currentMonth(), limitAmount: v1.card.limitAmount }] : []`;
   - `card`, `movements` e `nextId` ficam iguais.
3. Qualquer outro valor, ou JSON inválido → `emptyState()` (comportamento atual).

O estado migrado é **gravado logo após a migração**, pela mesma fila de escrita (`writeQueue`). Assim, se o app for aberto pela primeira vez em um mês e usado só no mês seguinte, os dados antigos continuam no mês em que foram migrados.

A chave de armazenamento continua `controle-cartao:v1`, para não deixar dados órfãos. O que identifica o formato é o campo `version`.

## 7. Contrato da camada de dados

### 7.1 `src/data/store.ts`

| Função | Mudança |
| ------ | ------- |
| `currentMonth(): MonthKey` | **Nova.** Mês local do aparelho. |
| `monthOf(date: string): MonthKey` | **Nova.** `date.slice(0, 7)`. |
| `monthLabel(month): string` | **Nova.** `Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' })` → "outubro de 2026". |
| `getCard(month)` | Passa a calcular usado, disponível e % com as categorias do `month` e o `limitAmount` do mês. Se o mês não foi iniciado, usa o limite atual do cartão. |
| `getOverview(month)` | `overviewOf` filtra as categorias por `month`. |
| `getCategories(month)` | Filtra por `month`. |
| `getMovements(categoryId)` | Sem mudança. |
| `getMonthHistory(): MonthSummary[]` | **Nova.** Um item por entrada de `months`, ordenado por `month` em ordem decrescente. |
| `getMonthStatus(): { needsStart; previousMonth; previousHasCategories }` | **Nova.** `needsStart` = existe cartão e `currentMonth()` não está em `months`. `previousMonth` = maior `month` iniciado antes do corrente. |
| `startMonth(month, copyFrom: MonthKey \| null)` | **Nova.** Valida RN-03. Não faz nada se o mês já foi iniciado. Cria a entrada com o limite atual. Se `copyFrom` vier preenchido, clona as categorias (com novo `id`, `isClosed: false` e o `month` novo). |
| `saveCard(input, 'create')` | Também inicia o mês corrente (RN-04c). |
| `saveCard(input, 'update')` | Também atualiza o `limitAmount` do mês corrente, se ele existir (RN-06). |
| `deleteCard()` | Também zera `months` (RN-07). |
| `createCategory(month, input)` | Recebe o `month`. Valida RN-03. Inicia o mês se for preciso (RN-04b). |
| `createMovement` / `updateMovement` | Validam RN-01 com `monthOf(date) === category.month`. |

### 7.2 `src/data/api.ts`

- Query keys:
  - `['card', month]`, `['overview', month]`, `['categories', month]`;
  - `['months']` para o histórico e `['months', 'status']` para a virada.
  - As keys sem mês continuam sendo prefixo das keys com mês. Assim, `invalidateQueries({ queryKey: ['card'] })` invalida todos os meses.
- Hooks novos:
  - `useGetMonthHistory()`;
  - `useGetMonthStatus()`;
  - `useStartMonth()`, com as variáveis `{ month, copyFrom }`.
- Hooks alterados:
  - `useGetCard(month)`, `useGetOverview(month)`, `useGetCategories(month)`;
  - `useCreateCategory`, com as variáveis `{ month, data }`.
- O `refresh()` do dashboard também invalida `['months']`.

## 8. Interface

### 8.1 Rotas (`src/App.tsx`, wouter)

| Rota | Tela |
| ---- | ---- |
| `/` | `Dashboard` com `month = currentMonth()` |
| `/mes/:month` | `Dashboard` com `month` da URL. Se o formato for inválido ou o mês for futuro, redireciona para `/` (RN-03). O mês corrente também redireciona para `/`. |
| `/historico` | `Historico` |

As rotas usam **hash** (`useHashLocation` do wouter), ou seja, `#/mes/2026-10`. O bundle usa `base: './'`, e uma rota aninhada sem hash quebraria os caminhos dos assets ao recarregar a página.

### 8.2 Painel (`src/pages/dashboard.tsx`)

- Recebe a prop `month: MonthKey`. Todas as queries e mutações usam esse mês.
- **Seletor de mês** abaixo do cabeçalho: `‹  Outubro de 2026  ›`.
  - "›" desabilitado quando `month === currentMonth()`.
  - Fora do mês corrente, aparece o atalho "Voltar para o mês atual".
- O botão **Histórico** no cabeçalho (ícone `History` do lucide) leva para `/historico`.
- O card "O mês em perspectiva" passa a mostrar o nome do mês como subtítulo.
- `Dialog` de lançamento:
  - o input de data recebe `min = YYYY-MM-01` e `max = último dia do mês`;
  - a data padrão segue a RF-08.
- O **diálogo de virada de mês** é renderizado quando `month === currentMonth()` e `status.needsStart && status.previousHasCategories`. Ele segue o visual do `Dialog` atual:
  - rótulo pequeno "Novo mês" e título "Começou ‹novembro›";
  - texto: "Quer reaproveitar as categorias de ‹outubro›?";
  - botões "Começar do zero" (secundário) e "Copiar categorias" (primário).
- Se `needsStart` for verdadeiro e não houver categorias para copiar, o painel chama `startMonth(current, null)` automaticamente (D5).

### 8.3 Histórico (`src/pages/historico.tsx`)

- Cabeçalho igual ao do painel, com um botão de voltar para `/`.
- Título "Mês a mês" com o rótulo pequeno "Histórico".
- Lista de cartões de mês, um por `MonthSummary`:
  - nome do mês em `font-display`;
  - valor do mês em destaque;
  - linha "comprometido R$ X de R$ Y" e `Progress` com o %;
  - rodapé "N categorias · M lançamentos".
- Tocar em um cartão leva para `/mes/:month`.
- Estado vazio: "Seu histórico começa quando você cadastrar o cartão."

### 8.4 Reaproveitamento

Para usar no painel, no histórico e na camada de dados, mover para `src/lib/format.ts`:
- `money`, `dateLabel` e `today`;
- os novos `currentMonth`, `monthOf`, `monthLabel`, `monthName`, `shiftMonth(month, delta)`, `firstDayOf`, `lastDayOf`, `defaultDateFor` e `monthPath`.

Mover também `Progress` para `src/components/progress.tsx`.

## 9. Fora de escopo

- Ciclo pelo dia de fechamento da fatura ou pelo vencimento.
- Compras parceladas ou recorrentes.
- Gráficos comparativos entre meses.
- Exportar ou compartilhar o histórico.
- Fechar ou travar um mês inteiro.
- Mover uma categoria ou um lançamento de um mês para outro.
- Mais de um cartão.

## 10. Critérios de aceite

- [x] Todos os cenários da seção 5 passam: as regras foram verificadas com um script contra `store.ts`, e a virada, o histórico, a navegação, as datas do diálogo e o redirecionamento de mês futuro foram conferidos no navegador.
- [x] `npm run typecheck` passa sem erros.
- [x] Dados v1 migram sem perda (verificado com dados de exemplo; falta conferir com os dados reais do aparelho): a quantidade de categorias e de lançamentos e a soma dos valores são iguais antes e depois.
- [ ] O layout do seletor de mês, do diálogo de virada e do histórico não se sobrepõe a nada em 360px de largura (sem rolagem horizontal: verificado) nem no Galaxy S25 (barras do sistema e safe areas: pendente).
- [ ] O APK de debug instala e abre no aparelho com os dados preservados.
- [x] O README foi atualizado (regras de cálculo por mês e a seção do histórico).

## 11. Tarefas

1. **Store, modelo:** tipos v2, `currentMonth`/`monthOf`, migração em `load()`, filtros por mês em `toCategory`, `overviewOf`, `getCard` e `getCategories`.
2. **Store, regras:** RN-01 em `createMovement`/`updateMovement`; RN-03 e RN-04 em `createCategory` e `saveCard`; RN-06 em `saveCard('update')`; RN-07 em `deleteCard`.
3. **Store, histórico:** `getMonthHistory`, `getMonthStatus`, `startMonth`.
4. **API:** query keys com mês, hooks novos e alterados.
5. **Utilitários:** extrair `money`, `dateLabel`, `today` e `Progress`; criar `monthLabel`, `shiftMonth` e `lastDayOf`.
6. **Painel:** prop `month`, seletor de mês, botão Histórico, `min`/`max` e data padrão no diálogo de lançamento.
7. **Virada de mês:** diálogo e início automático quando não há o que copiar.
8. **Histórico:** página `/historico` e rotas `/mes/:month` com redirecionamento.
9. **README:** documentar as regras por mês e o histórico.
10. **Verificação:** percorrer a seção 12 e marcar os critérios de aceite.

## 12. Verificação

1. `npm run typecheck`.
2. `npm run dev` e abrir `http://localhost:5173`.
3. **Migração:** no DevTools → Application → Local Storage, definir `CapacitorStorage.controle-cartao:v1` com um estado `version: 1` que tenha categorias e lançamentos. Recarregar e conferir o cenário "Migrar dados da versão anterior".
4. **Histórico e virada:** definir um estado `version: 2` com `months` de `2026-08` e `2026-09` (e categorias nesses meses), sem o mês corrente. Recarregar e conferir:
   - que o diálogo de virada aparece;
   - as duas opções do diálogo, uma de cada vez;
   - a lista do Histórico;
   - a navegação ‹ ›;
   - a rota `/mes/‹futuro›`.
5. **RN-01:** tentar lançar fora do mês, pelo diálogo (mudando a data à mão) e pela edição.
6. **Android:** `npm run android:sync`, `gradlew assembleDebug`, instalar com `adb install -r` e conferir a migração com os dados reais do aparelho.
