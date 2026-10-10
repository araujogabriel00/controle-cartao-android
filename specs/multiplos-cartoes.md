# Spec — Múltiplos cartões

| Campo | Valor |
| ----- | ----- |
| Status | Implementada |
| Criada em | 10/10/2026 |
| Escopo | `src/data/store.ts`, `src/data/api.ts`, `src/lib/`, `src/components/card-carousel.tsx`, `src/pages/*`, `FUNCIONALIDADES.md`, `specs/historico-mensal.md`, `README.md` |
| Depende de | [`historico-mensal.md`](historico-mensal.md) |

> Esta spec é a fonte da verdade da funcionalidade. A implementação segue a seção [Tarefas](#11-tarefas) e só termina quando todos os [Critérios de aceite](#10-critérios-de-aceite) forem atendidos. Mudanças de comportamento entram primeiro aqui e só depois no código.

---

## 1. Contexto e objetivo

Hoje o app aceita **um único cartão** (`State.card: StoredCard | null`). Meses, categorias e lançamentos ficam todos ligados a ele. Quem tem mais de um cartão precisa escolher qual controlar, ou misturar os gastos de cartões diferentes.

**Objetivo:**

1. Cadastrar **vários cartões**, cada um com o próprio limite, meses, categorias e lançamentos.
2. Trocar de cartão como numa **carteira digital** (Samsung Wallet): um carrossel horizontal de cartões coloridos, em que se desliza para os lados.
3. Ver o **total do mês somando todos os cartões**, no painel e no histórico.

## 2. Glossário

| Termo | Definição |
| ----- | --------- |
| **Cartão selecionado** | O cartão que o painel e o histórico mostram. É o cartão centralizado no carrossel. Fica salvo em `selectedCardId`. |
| **Carrossel** | Faixa horizontal com a face de cada cartão e um slot final "Adicionar cartão". |
| **Face do cartão** | O bloco colorido com o nome, o disponível, o comprometido e o % do limite de um cartão no mês aberto (a antiga "Visão do cartão"). |
| **Cor do cartão** | Uma das cores da paleta fixa (`CardColor`), usada no fundo da face. |
| **Total do mês (todos os cartões)** | A soma de limite, comprometido, disponível e valor do mês de todos os cartões, num mesmo mês. |

Os termos de mês (valor do mês, comprometido, limite do mês etc.) seguem o glossário de [`historico-mensal.md`](historico-mensal.md#2-glossário), agora aplicados **por cartão**.

## 3. Decisões de produto

| # | Decisão | Motivo |
| - | ------- | ------ |
| D1 | **Cada cartão é isolado:** limite, meses, categorias e lançamentos próprios. | Escolha do usuário. As regras de comprometido continuam as mesmas, só que por cartão. |
| D2 | **Troca de cartão por carrossel horizontal (estilo Samsung Wallet):** deslizar até um cartão o seleciona. Os vizinhos aparecem nas bordas, pontinhos abaixo indicam a posição e o último slot é "Adicionar cartão". | Escolha do usuário. Ocupa pouco espaço vertical e é um gesto conhecido. |
| D3 | **Cada cartão tem uma cor**, escolhida pelo usuário numa paleta fixa de 6 cores escuras. Um cartão novo vem com a primeira cor ainda não usada (ou `verde`, se todas estiverem em uso). Dois cartões podem ter a mesma cor. | Escolha do usuário. Cores escuras mantêm o contraste com o texto claro da face. |
| D4 | O **cartão selecionado fica salvo** no estado e é restaurado ao reabrir o app. | Escolha do usuário ("lembrar o último usado"). |
| D5 | A **faixa "Todos os cartões"** aparece no painel só com **2 cartões ou mais**. | Com um cartão, ela repetiria a face do cartão. |
| D6 | O **histórico é do cartão selecionado**. Com 2 cartões ou mais, cada mês mostra também o total de todos os cartões. | Mantém a tela de histórico como está e acrescenta a visão geral. |
| D7 | A **virada de mês é por cartão:** o diálogo "Começou ‹mês›" aparece para o cartão selecionado. Os outros cartões perguntam quando forem selecionados. | Cada cartão tem suas próprias categorias para copiar. |
| D8 | **Remover um cartão** apaga só os meses, categorias e lançamentos dele. A seleção passa para o primeiro cartão restante; se não sobrar nenhum, volta o convite "Vamos anotar o seu cartão?". | Remover um cartão não pode afetar os outros. |
| D9 | **Nomes únicos:** não pode haver dois cartões com o mesmo nome. A comparação ignora maiúsculas e minúsculas e espaços nas pontas. | Evita dois cartões indistinguíveis no carrossel e nos pontinhos. |
| D10 | **As rotas não mudam** (`#/`, `#/mes/AAAA-MM`, `#/historico`). O cartão não vai na URL. | A seleção é um estado salvo (D4), e as rotas atuais continuam válidas. |
| D11 | **Migração v2 → v3 automática:** o cartão que já existe vira o primeiro da lista, é selecionado e recebe a cor `verde`. Os dados v1 continuam migrando, passando pela v2. | Ninguém perde dados, e o app fica com a mesma aparência de antes. |

### 3.1 Paleta de cores

| Chave | Fundo da face | Destaque (valores e barra) |
| ----- | ------------- | -------------------------- |
| `verde` | `#28513f` (cor atual) | `#f0d28b` |
| `azul` | `#22476b` | `#9cc7ef` |
| `roxo` | `#47386b` | `#d2c2f2` |
| `vinho` | `#6a2c39` | `#f2b8b0` |
| `grafite` | `#30363b` | `#d9dcd6` |
| `terracota` | `#8a4a31` | `#f6cf9a` |

Os textos secundários da face continuam em branco translúcido, como hoje, e funcionam sobre todas as cores.

## 4. Requisitos

### 4.1 Requisitos funcionais (RF)

| ID | Requisito |
| -- | --------- |
| RF-01 | Cadastrar mais de um cartão pelo slot **"Adicionar cartão"** do carrossel, que abre o diálogo de cartão. |
| RF-02 | O carrossel mostra cada cartão com **cor, nome, disponível para usar, já comprometido e % do limite** no mês aberto. O cartão selecionado fica centralizado e em tamanho cheio; os vizinhos ficam levemente reduzidos e esmaecidos. |
| RF-03 | **Trocar de cartão** deslizando o carrossel, tocando num pontinho ou usando as setas ←/→ do teclado com o foco no carrossel. A troca atualiza a visão geral, as categorias, os lançamentos e o histórico. |
| RF-04 | Abaixo do carrossel, **pontinhos**: um por cartão (com `aria-label` "Cartão ‹nome›") e um "+" para o slot de adicionar. O pontinho do cartão selecionado aparece destacado. |
| RF-05 | No diálogo do cartão, **escolher a cor** numa linha de amostras redondas, com a cor atual marcada. |
| RF-06 | Com 2 cartões ou mais, a **faixa "Todos os cartões · ‹mês›"** fica acima do carrossel e mostra comprometido, disponível e limite totais, além de uma barra com o % comprometido. |
| RF-07 | No **histórico**, o subtítulo mostra o nome do cartão selecionado. Com 2 cartões ou mais, cada mês ganha a linha "Todos os cartões: valor R$ X · comprometido R$ Y". |
| RF-08 | **Editar e remover** ficam na face do cartão selecionado e agem só sobre ele. A confirmação de remoção diz "Remover o cartão “‹nome›” e todos os seus registros? Esta ação não pode ser desfeita.". |

### 4.2 Regras de negócio (RN)

| ID | Regra |
| -- | ----- |
| RN-01 | Todos os cálculos de [`historico-mensal.md`](historico-mensal.md#42-regras-de-negócio-rn) passam a ser **por cartão e por mês**. |
| RN-02 | O **total consolidado** de um mês soma, para cada cartão: o limite do mês, o comprometido do mês e o valor do mês. Um cartão que ainda não iniciou aquele mês entra com o limite atual e com comprometido e valor iguais a zero. O disponível total é o limite total menos o comprometido total. |
| RN-03 | Criar categoria ou lançamento usa sempre o **cartão selecionado** e o mês aberto. |
| RN-04 | **Nome único** (D9). Se já existir, a operação falha com "Já existe um cartão com esse nome.". A regra vale ao criar e ao editar (editar sem mudar o nome é permitido). |
| RN-05 | Remover um cartão apaga os meses e as categorias com o `cardId` dele e os lançamentos dessas categorias. **Nenhum outro cartão é alterado** (D8). |
| RN-06 | Ao **cadastrar** um cartão, ele passa a ser o selecionado e o mês corrente dele é iniciado com o limite informado. |
| RN-07 | A **migração** é automática, acontece uma vez e não perde dados (D11). |
| RN-08 | A cor precisa ser uma das chaves da paleta (seção 3.1). Se não for, a operação falha com "Cor inválida.". Se a cor não for informada ao criar, o cartão recebe a primeira cor ainda não usada (D3). |
| RN-09 | `selectCard` só aceita o id de um cartão existente. Se o id não existir, a operação falha com "Cartão não encontrado.". |
| RN-10 | Editar o limite de um cartão atualiza o limite **do mês corrente daquele cartão**, sem alterar meses passados nem outros cartões. |

## 5. Cenários (BDD)

Os cenários usam a data de hoje como **10/10/2026**, salvo indicação.

```gherkin
# language: pt

Funcionalidade: Múltiplos cartões
  Como pessoa que usa mais de um cartão de crédito
  Quero controlar cada cartão separadamente e trocar entre eles como numa carteira digital
  Para saber quanto posso gastar em cada um e no total

  # --- RF-01 / RF-04 / RN-06 / D3 --------------------------------------------
  Cenário: Adicionar um segundo cartão
    Dado que tenho o cartão "Nubank" na cor verde, com limite de R$ 5.000,00
    Quando eu deslizo o carrossel até o slot "Adicionar cartão"
    E toco em "Adicionar cartão"
    Então o diálogo de cartão abre com a cor azul já marcada
    Quando eu preencho o nome "Inter" e o limite "3000"
    E clico em "Adicionar"
    Então o carrossel desliza até o cartão "Inter", na cor azul
    E o cartão "Inter" fica selecionado
    E outubro de 2026 é iniciado para "Inter" com limite R$ 3.000,00
    E vejo 2 pontinhos de cartão e um "+"

  # --- RF-02 / RF-03 / RN-03 / D1 --------------------------------------------
  Cenário: Deslizar para outro cartão
    Dado que tenho os cartões "Nubank" e "Inter"
    E que "Nubank" tem a categoria "Mercado" em outubro de 2026
    E que "Inter" tem a categoria "Viagem" em outubro de 2026
    E que o cartão selecionado é "Nubank"
    Quando eu deslizo o carrossel para a esquerda até "Inter"
    Então "Inter" fica centralizado e em tamanho cheio
    E vejo a categoria "Viagem"
    E não vejo a categoria "Mercado"
    Quando eu crio a categoria "Hotel"
    Então "Hotel" pertence ao cartão "Inter"

  # --- RF-03 / RF-04 ---------------------------------------------------------
  Cenário: Trocar de cartão pelos pontinhos
    Dado que tenho os cartões "Nubank", "Inter" e "Itaú"
    E que o cartão selecionado é "Nubank"
    Quando eu toco no pontinho "Cartão Itaú"
    Então o carrossel desliza até "Itaú"
    E o pontinho de "Itaú" fica destacado

  Cenário: Trocar de cartão pelo teclado
    Dado que tenho os cartões "Nubank" e "Inter"
    E que o foco está no carrossel com "Nubank" selecionado
    Quando eu pressiono a seta para a direita
    Então "Inter" fica selecionado

  # --- RF-05 / RN-08 ---------------------------------------------------------
  Cenário: Mudar a cor de um cartão
    Dado que o cartão selecionado é "Inter", na cor azul
    Quando eu toco em "Editar cartão"
    Então vejo as 6 amostras de cor, com azul marcada
    Quando eu escolho roxo e salvo
    Então a face de "Inter" fica roxa

  Cenário: Dois cartões podem ter a mesma cor
    Dado que "Nubank" é verde
    Quando eu edito "Inter" e escolho verde
    Então "Inter" é salvo na cor verde

  # --- D4 --------------------------------------------------------------------
  Cenário: Reabrir o app no último cartão usado
    Dado que tenho os cartões "Nubank" e "Inter"
    E que deixei "Inter" selecionado
    Quando eu fecho e abro o app de novo
    Então o carrossel abre em "Inter", sem animação

  # --- RF-06 / RN-02 / D5 ----------------------------------------------------
  Cenário: Faixa com o total de todos os cartões
    Dado que "Nubank" tem limite de R$ 5.000,00 e R$ 2.100,00 comprometidos em outubro de 2026
    E que "Inter" tem limite de R$ 3.000,00 e R$ 900,00 comprometidos em outubro de 2026
    Quando eu vejo o painel de outubro de 2026
    Então vejo a faixa "Todos os cartões · Outubro de 2026"
    E ela mostra comprometido R$ 3.000,00, disponível R$ 5.000,00 e limite R$ 8.000,00
    E a barra mostra 37,5%

  Cenário: Cartão que ainda não iniciou o mês entra no total
    Dado que "Nubank" iniciou outubro de 2026 com R$ 2.100,00 comprometidos
    E que "Inter", com limite atual de R$ 3.000,00, ainda não iniciou outubro de 2026
    Quando eu vejo a faixa "Todos os cartões · Outubro de 2026"
    Então "Inter" entra no total com limite R$ 3.000,00 e comprometido R$ 0,00

  Cenário: Faixa escondida com um só cartão
    Dado que tenho apenas o cartão "Nubank"
    Quando eu vejo o painel
    Então não vejo a faixa "Todos os cartões"

  # --- RF-07 / D6 ------------------------------------------------------------
  Cenário: Histórico com o total de todos os cartões
    Dado que tenho os cartões "Nubank" e "Inter", com dados em setembro e outubro de 2026
    E que o cartão selecionado é "Nubank"
    Quando eu abro o Histórico
    Então o subtítulo mostra "Nubank"
    E cada mês mostra o valor e o comprometido de "Nubank"
    E cada mês mostra a linha "Todos os cartões" com o valor e o comprometido somados

  # --- D7 --------------------------------------------------------------------
  Cenário: Virada de mês por cartão
    Dado que hoje é 01/11/2026
    E que "Nubank" e "Inter" têm categorias em outubro de 2026
    E que o cartão selecionado é "Nubank"
    Quando eu abro o app
    Então vejo o diálogo "Começou novembro" para "Nubank"
    Quando eu escolho "Copiar categorias"
    Então novembro de 2026 de "Nubank" recebe as categorias de outubro de "Nubank"
    Quando eu deslizo até "Inter"
    Então vejo o diálogo "Começou novembro" para "Inter"

  # --- RN-04 / D9 ------------------------------------------------------------
  Cenário: Recusar cartão com nome repetido
    Dado que tenho o cartão "Nubank"
    Quando eu tento cadastrar um cartão com o nome " nubank "
    Então vejo a mensagem de erro "Já existe um cartão com esse nome."
    E o diálogo continua aberto com os dados preenchidos

  Cenário: Editar um cartão mantendo o próprio nome
    Dado que o cartão selecionado é "Nubank"
    Quando eu edito o limite para "6000" sem mudar o nome
    Então o cartão é salvo

  # --- RF-08 / RN-05 / D8 ----------------------------------------------------
  Cenário: Remover um cartão sem afetar o outro
    Dado que tenho os cartões "Nubank" e "Inter", ambos com categorias e lançamentos
    E que o cartão selecionado é "Inter"
    Quando eu toco em "Remover cartão"
    Então o sistema pede confirmação para "Remover o cartão “Inter” e todos os seus registros? Esta ação não pode ser desfeita."
    Quando eu confirmo
    Então "Inter" sai do carrossel
    E "Nubank" fica selecionado, com as mesmas categorias e lançamentos
    E a faixa "Todos os cartões" some

  Cenário: Remover o último cartão
    Dado que tenho apenas o cartão "Nubank"
    Quando eu removo "Nubank" e confirmo
    Então vejo o convite "Vamos anotar o seu cartão?"
    E o Histórico fica vazio

  # --- RN-10 -----------------------------------------------------------------
  Cenário: Editar o limite de um cartão sem afetar o outro
    Dado que "Nubank" e "Inter" iniciaram outubro de 2026 com limite R$ 5.000,00
    Quando eu edito o limite de "Inter" para R$ 6.000,00
    Então o limite de outubro de 2026 de "Inter" é R$ 6.000,00
    E o limite de outubro de 2026 de "Nubank" continua R$ 5.000,00

  # --- RN-09 -----------------------------------------------------------------
  Cenário: Selecionar um cartão que não existe
    Quando a camada de dados recebe um pedido para selecionar o cartão de id 999
    Então a operação falha com "Cartão não encontrado."
    E o cartão selecionado não muda

  # --- RN-07 / D11 -----------------------------------------------------------
  Cenário: Migrar dados com um cartão (v2)
    Dado que o app tem dados no formato v2 com o cartão "Principal", 2 meses, 4 categorias e 10 lançamentos
    Quando eu abro a nova versão do app
    Então vejo o cartão "Principal" na cor verde, selecionado
    E os 2 meses, as 4 categorias e os 10 lançamentos continuam iguais
    E não vejo a faixa "Todos os cartões"

  Cenário: Migrar dados da versão mais antiga (v1)
    Dado que o app tem dados no formato v1 com um cartão, categorias e lançamentos
    Quando eu abro a nova versão do app
    Então os dados passam pela migração v2 e depois pela v3
    E tudo aparece no mês corrente, no cartão migrado, sem perda
```

### Matriz de cobertura

| Requisito | Cenário(s) |
| --------- | ---------- |
| RF-01, RN-06, D3 | Adicionar um segundo cartão |
| RF-02, RN-03, D1 | Deslizar para outro cartão |
| RF-03 | Deslizar para outro cartão / Trocar de cartão pelos pontinhos / Trocar de cartão pelo teclado |
| RF-04 | Adicionar um segundo cartão / Trocar de cartão pelos pontinhos |
| RF-05, RN-08 | Mudar a cor de um cartão / Dois cartões podem ter a mesma cor |
| D4 | Reabrir o app no último cartão usado |
| RF-06, RN-02, D5 | Faixa com o total de todos os cartões / Cartão que ainda não iniciou o mês entra no total / Faixa escondida com um só cartão |
| RF-07, D6 | Histórico com o total de todos os cartões |
| D7 | Virada de mês por cartão |
| RN-04, D9 | Recusar cartão com nome repetido / Editar um cartão mantendo o próprio nome |
| RF-08, RN-05, D8 | Remover um cartão sem afetar o outro / Remover o último cartão |
| RN-09 | Selecionar um cartão que não existe |
| RN-10 | Editar o limite de um cartão sem afetar o outro |
| RN-01 | Deslizar para outro cartão / Faixa com o total de todos os cartões |
| RN-07, D11 | Migrar dados com um cartão (v2) / Migrar dados da versão mais antiga (v1) |
| D10 | Todos os cenários usam as rotas atuais |

## 6. Modelo de dados e migração

### 6.1 Estado v3 (`src/data/store.ts`)

```ts
export type CardColor = 'verde' | 'azul' | 'roxo' | 'vinho' | 'grafite' | 'terracota';

export type StoredCard = { id: number; name: string; limitAmount: number; color: CardColor };
export type StoredMonth = { cardId: number; month: MonthKey; limitAmount: number };
export type StoredCategory = { id: number; cardId: number; month: MonthKey; name: string; amount: number; isClosed: boolean };
export type StoredMovement = { id: number; categoryId: number; description: string; amount: number; date: string }; // sem mudança

type State = {
  version: 3;
  nextId: number;
  selectedCardId: number | null;
  cards: StoredCard[];          // antes: card: StoredCard | null
  months: StoredMonth[];
  categories: StoredCategory[];
  movements: StoredMovement[];
};

export type Consolidated = {
  month: MonthKey;
  cardCount: number;
  limitAmount: number;
  committedAmount: number;
  availableAmount: number;
  spentAmount: number;
  percentUsed: number;
};
```

Os lançamentos continuam sem `cardId`. O cartão de um lançamento é sempre o cartão da sua categoria, o que evita duas fontes de verdade (mesmo princípio usado para o mês).

### 6.2 Migração

Ela roda dentro de `load()`, encadeada:

1. `version === 3` → usar o estado como está.
2. `version === 2` → `migrateV2`:
   - `cards = v2.card ? [{ ...v2.card, color: 'verde' }] : []`;
   - `months = v2.months.map(m => ({ ...m, cardId: v2.card.id }))`;
   - `categories = v2.categories.map(c => ({ ...c, cardId: v2.card.id }))`;
   - `selectedCardId = v2.card?.id ?? null`;
   - `movements` e `nextId` ficam iguais.
   - Se não houver cartão, `months` e `categories` já estão vazios (remover o cartão apaga tudo na v2).
3. `version === 1` → `migrateV2(migrateV1(v1))`.
4. Qualquer outro valor, ou JSON inválido → `emptyState()`.

O estado migrado é **gravado logo após a migração**, pelo mesmo `persist()` da v2. A chave de armazenamento continua `controle-cartao:v1`.

## 7. Contrato da camada de dados

### 7.1 `src/data/store.ts`

| Função | Mudança |
| ------ | ------- |
| `getCards(month)` | **Nova.** `{ selectedCardId, nextColor, cards: Card[] }`, com usado, disponível e % de cada cartão no `month`, na ordem de cadastro. `nextColor` é a cor que um cartão novo receberia (D3). |
| `selectCard(cardId)` | **Nova.** Valida RN-09 e grava `selectedCardId`. |
| `getConsolidated(month)` | **Nova.** `Consolidated` do mês, seguindo a RN-02. |
| `getConsolidatedHistory()` | **Nova.** Um `Consolidated` por mês iniciado em qualquer cartão, ordenado do mais recente para o mais antigo. |
| `getCard(cardId, month)` | Ganha `cardId`. Devolve `null` se o cartão não existir. |
| `getOverview(cardId, month)`, `getCategories(cardId, month)` | Ganham `cardId`. |
| `getMonthHistory(cardId)`, `getMonthStatus(cardId)` | Ganham `cardId`. O status considera só os meses daquele cartão. |
| `startMonth(cardId, month, copyFrom)` | Ganha `cardId`. Copia só categorias do mesmo cartão. |
| `saveCard(input, 'create')` | Valida RN-04 e RN-08. Cria o cartão (com a próxima cor livre se `input.color` vier vazio), seleciona e inicia o mês corrente (RN-06). |
| `saveCard(input, 'update', cardId)` | Valida RN-04 (ignorando o próprio cartão) e RN-08. Atualiza nome, limite e cor, e aplica a RN-10. |
| `deleteCard(cardId)` | Aplica a RN-05 e ajusta `selectedCardId` (D8). |
| `createCategory(cardId, month, input)` | Ganha `cardId`. Valida se o cartão existe. |
| Lançamentos | Sem mudança de assinatura. O cartão vem da categoria. |

`CardInput` passa a ser `{ name: string; limitAmount: number; color?: CardColor }`.

Os helpers internos (`categoriesOf`, `findMonth`, `monthLimit`, `summaryOf`, `ensureMonth`) passam a receber `cardId`. Um helper novo, `findCard(state, cardId)`, falha com "Cartão não encontrado.".

### 7.2 `src/data/api.ts`

- **Keys com `cardId`:** `['card', cardId, month]`, `['overview', cardId, month]`, `['categories', cardId, month]`, `['months', cardId]` e `['months', cardId, 'status']`.
  - Sem argumentos, as keys continuam funcionando como prefixo. Assim, o `refresh()` do painel invalida tudo, como hoje.
- **Keys novas:** `['cards', month]`, `['consolidated', month]` e `['consolidated', 'history']`.
- **Hooks novos:** `useGetCards`, `useSelectCard`, `useGetConsolidated` e `useGetConsolidatedHistory`.
- **Hooks existentes** ganham `cardId` nos parâmetros ou nas variáveis, seguindo a seção 7.1.
- O `refresh()` também invalida `['cards']` e `['consolidated']`.

## 8. Interface

### 8.1 Carrossel (`src/components/card-carousel.tsx`)

Ele substitui o bloco "Visão do cartão" de `src/pages/dashboard.tsx`.

- **Rolagem:** CSS nativo, sem biblioteca: `flex overflow-x-auto snap-x snap-mandatory`, com a barra de rolagem escondida.
  - Cada slide tem `w-[86%] shrink-0 snap-center`, para os vizinhos aparecerem nas bordas.
  - O espaçamento lateral do container garante que o primeiro e o último slide também possam ficar centralizados.
  - A rolagem horizontal fica só dentro do carrossel: a página não pode ganhar rolagem horizontal.
- **Seleção ao deslizar:** quando a rolagem para (evento `scrollend`, com fallback por debounce de `scroll` de ~120 ms), o slide mais próximo do centro é calculado.
  - Se for um cartão diferente do selecionado, chama `selectCard`.
  - Se for o slot "Adicionar cartão", nada muda; o slot só abre o diálogo ao ser tocado.
- **Posição inicial:** ao montar, rola até o cartão selecionado com `behavior: 'auto'` (sem animação, D4).
  - Quando o cartão selecionado muda por outro motivo (criação, remoção, pontinho, teclado), rola com `behavior: 'smooth'`.
- **Visual dos slides:** os slides que não estão selecionados ficam com `scale-[.94] opacity-70`, com `transition`. O selecionado fica em `scale-100 opacity-100`.
- **Face do cartão:** o markup atual da "Visão do cartão", com o fundo e o destaque da cor do cartão (seção 3.1) e os círculos decorativos. Mostra:
  - nome, em até duas linhas (nomes mais longos terminam em reticências);
  - "Disponível para usar", "Já comprometido" e a barra de "Limite utilizado";
  - a frase "Seu primeiro gasto ainda está por vir…", quando não há nada comprometido;
  - os botões "Editar cartão" e "Remover cartão", só no slide selecionado (nos outros ficam ocultos, para evitar toques acidentais).
- **Slot final:** um cartão com a mesma altura, borda tracejada, ícone `Plus` e o texto "Adicionar cartão". Ao tocar, abre o diálogo de cartão em modo criação.
- **Pontinhos:** abaixo do carrossel, um botão por cartão (`aria-label="Cartão ‹nome›"`, `aria-current` no selecionado) e um botão "+" (`aria-label="Adicionar cartão"`). Tocar num pontinho rola até o slide.
- **Teclado:** o container tem `tabIndex={0}`, `role="region"` e `aria-label="Seus cartões"`. As setas ←/→ selecionam o cartão anterior ou o próximo.

### 8.2 Diálogo de cartão

- Ganha o campo **"Cor do cartão"**: uma linha de 6 amostras redondas (botões com `aria-label` = nome da cor e `aria-pressed`), abaixo do limite.
- Ao criar, vem marcada a próxima cor livre. A camada de dados devolve essa cor em `getCards` (`nextColor`), para a interface marcá-la.
- A paleta fica em `src/lib/card-colors.ts` (`CARD_COLORS: Record<CardColor, { label; background; accent }>`), usada pela face, pelo diálogo e pelos pontinhos.

### 8.3 Faixa "Todos os cartões"

- Fica acima do carrossel, só com 2 cartões ou mais (D5). Usa o visual dos blocos de "O mês em perspectiva".
- Conteúdo:
  - rótulo "Todos os cartões · ‹Mês de AAAA›";
  - três valores: comprometido, disponível e limite;
  - um `Progress` com o % comprometido.
- Em telas estreitas (abaixo de `sm`), os três valores viram linhas, com o rótulo à esquerda e o valor à direita, sem quebra no meio do valor. A partir de `sm`, ficam em 3 colunas.

### 8.4 Outros ajustes no painel

- O convite "Vamos anotar o seu cartão?" aparece só quando não há nenhum cartão.
- A confirmação de remoção usa o nome do cartão (RF-08).
- A mensagem de sucesso ao remover passa a ser "Cartão “‹nome›” removido.".
- O diálogo de virada de mês recebe o `cardId` do cartão selecionado (D7).

### 8.5 Histórico (`src/pages/historico.tsx`)

- O subtítulo passa a ser "‹Nome do cartão› — quanto o cartão somou em cada mês…".
- Com 2 cartões ou mais, cada cartão de mês ganha uma linha no rodapé:
  - "Todos os cartões: valor R$ X · comprometido R$ Y";
  - os valores vêm de `useGetConsolidatedHistory`.
- Meses que existem em outros cartões mas não no selecionado não aparecem na lista (o histórico é do cartão selecionado, D6).

## 9. Fora de escopo

- Categorias compartilhadas entre cartões.
- Transferir categorias ou lançamentos de um cartão para outro.
- Reordenar cartões (a ordem é a de cadastro).
- Bandeira, número, imagem ou cor personalizada fora da paleta.
- Pilha vertical no estilo Google Wallet.
- Data de fechamento ou vencimento por cartão.
- Cartão na URL.

## 10. Critérios de aceite

- [x] Todos os cenários da seção 5 passam. As regras de dados foram verificadas com um script contra `store.ts` (35 verificações). No navegador, foram conferidos o carrossel, os pontinhos, o teclado, as cores, a faixa, o histórico, a remoção e o nome repetido. A virada de mês por cartão foi verificada só pelo script, não na tela.
- [x] `npm run typecheck` e `npm run build` passam sem erros.
- [x] Dados v2 e v1 migram sem perda (verificado com dados de exemplo; falta conferir com os dados reais do aparelho): a quantidade de meses, categorias e lançamentos e a soma dos valores são iguais antes e depois.
- [x] Em 360px de largura, a página não tem rolagem horizontal, e o carrossel desliza só dentro dele.
- [ ] O layout fica correto no Galaxy S25, nas barras do sistema e nas safe areas.
- [ ] O APK de debug instala e abre no aparelho com os dados preservados, e o gesto de deslizar funciona no toque.
- [x] `FUNCIONALIDADES.md`, `specs/historico-mensal.md` e o README foram atualizados.

## 11. Tarefas

1. **Store, modelo:** tipos v3, `migrateV2`, cadeia de migração em `load()`, `findCard` e `cardId` nos helpers.
2. **Store, funções:** `cardId` nas leituras e escritas atuais. Funções novas `getCards`, `selectCard`, `getConsolidated` e `getConsolidatedHistory`. Regras RN-04, RN-05, RN-08, RN-09 e RN-10.
3. **API:** keys com `cardId`, keys e hooks novos, e `refresh()` também invalidando `cards` e `consolidated`.
4. **Cores:** `src/lib/card-colors.ts` e as amostras no diálogo de cartão.
5. **Carrossel:** `src/components/card-carousel.tsx` no lugar da "Visão do cartão": scroll-snap, seleção ao parar, pontinhos, teclado e slot de adicionar.
6. **Faixa consolidada** no painel.
7. **Painel:** queries com o cartão selecionado, virada de mês por cartão, textos de remoção e convite só sem cartões.
8. **Histórico:** subtítulo e linha "Todos os cartões".
9. **Documentação:**
   - `FUNCIONALIDADES.md`: a seção 1 (Cartão) passa a falar de vários cartões, a seção 9 ganha a virada por cartão e entra uma seção 10 nova, com link para esta spec;
   - `specs/historico-mensal.md`: uma nota de revisão dizendo que D8 e RN-07 agora valem por cartão;
   - README: regras por cartão.
10. **Verificação:** percorrer a seção 12 e marcar os critérios de aceite.

## 12. Verificação

1. `npm run typecheck` e `npm run build`.
2. **Script de regras:** um script via Vite SSR (como no histórico mensal) cobrindo:
   - migração v2 e v1;
   - isolamento entre cartões;
   - consolidado, incluindo um cartão sem o mês iniciado;
   - nome repetido, cor inválida, seleção inexistente e remoção.
3. **Navegador** (`npm run build` + `npx vite preview`): definir `CapacitorStorage.controle-cartao:v1` com um estado v2 e recarregar para conferir a migração. Depois:
   - adicionar um segundo cartão e conferir que o carrossel desliza até ele;
   - deslizar entre os cartões, tocar nos pontinhos e usar as setas do teclado;
   - mudar a cor de um cartão;
   - conferir os valores da faixa e do histórico;
   - remover um cartão.
4. **360px:** carregar as telas num iframe de 360px e conferir que `scrollWidth` da página não passa da largura.
5. **Android:** `npm run android:sync`, `gradlew assembleDebug` e `adb install -r`. No aparelho, conferir o gesto de deslizar, a migração com os dados reais e o layout no Galaxy S25.
