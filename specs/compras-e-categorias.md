# Spec — Compras e categorias

| Campo | Valor |
| ----- | ----- |
| Status | Implementada |
| Criada em | 17/10/2026 |
| Escopo | `src/data/store.ts`, `src/data/api.ts`, `src/pages/dashboard.tsx`, `src/pages/historico.tsx`, `src/index.css`, `FUNCIONALIDADES.md`, `README.md`, `specs/historico-mensal.md`, `specs/multiplos-cartoes.md`, `specs/parcelamento.md` |
| Depende de | [`historico-mensal.md`](historico-mensal.md), [`multiplos-cartoes.md`](multiplos-cartoes.md), [`parcelamento.md`](parcelamento.md) |
| Substitui em parte | As regras de categoria-envelope (orçamento, fechar/abrir, categoria por mês, copiar categorias na virada do mês, parcela fixa em categoria fechada) dessas três specs. O restante delas continua valendo. |
| Substituída em parte por | [`tela-de-categorias.md`](tela-de-categorias.md): o diálogo "Categorias" virou a tela `#/categorias`; as regras das categorias continuam as mesmas. |

> Esta spec é a fonte da verdade da funcionalidade. A implementação segue a seção [Tarefas](#11-tarefas) e só termina quando todos os [Critérios de aceite](#10-critérios-de-aceite) forem atendidos. Mudanças de comportamento entram primeiro aqui e só depois no código.
>
> A aba **Benefícios** (o conceito de saldo por envelope que sai desta tela) é outra funcionalidade, com spec própria (`specs/beneficios.md`), feita depois desta.

---

## 1. Contexto e objetivo

Hoje a aba Cartões gira em torno de **categorias-envelope**: cada categoria pertence a um cartão e a um mês, tem um orçamento que **reserva** o limite, pode ser fechada, e só dentro dela se registram lançamentos. Para registrar uma compra, a pessoa precisa antes montar o planejamento do mês.

**Objetivo:**

1. **Registrar compras direto no cartão**, sem planejamento prévio.
2. Cada compra **consome o limite do cartão pelo valor gasto** (não por orçamento reservado).
3. Compras têm uma **categoria opcional**, de uma **lista global** (a mesma para todos os cartões), usada só para classificar e somar.
4. Ver, por mês, a lista de compras, o resumo por categoria e quanto sobra do limite.
5. Manter o que já existe: vários cartões, histórico por mês, compras parceladas e prévia de meses futuros.

## 2. Glossário

| Termo | Definição |
| ----- | --------- |
| **Compra** | Um gasto no cartão: descrição, valor, data e categoria opcional. Antes era chamada de "lançamento". |
| **Categoria** | Nome global usado para classificar compras. Não tem orçamento, mês nem cartão. |
| **Sem categoria** | Compra com `categoryId: null`. |
| **Usado** | Soma das compras do cartão no mês. Antes era o "comprometido". |
| **Disponível** | Limite do mês − usado. Pode ficar negativo. |
| **Parcela** | Compra gerada por uma compra parcelada (`purchaseId`, `installment`, `installmentCount`). |
| **Compra futura** | Compra comum com data em mês futuro. Já consome o limite desse mês. |
| **Compra parcelada** | O registro único do parcelamento, como em [`parcelamento.md`](parcelamento.md#2-glossário), agora com `categoryId` em vez do nome da categoria. |

Os termos de mês e de cartão seguem [`historico-mensal.md`](historico-mensal.md#2-glossário) e [`multiplos-cartoes.md`](multiplos-cartoes.md#2-glossário).

## 3. Decisões de produto

| # | Decisão | Motivo |
| - | ------- | ------ |
| D1 | **Compras são registradas direto no cartão**, sem categoria-envelope. | Escolha do usuário. Registrar um gasto não deve exigir planejamento. |
| D2 | **Categorias são globais e opcionais.** Uma lista só, para todos os cartões. | Escolha do usuário. A mesma classificação serve a qualquer cartão e, depois, aos benefícios. |
| D3 | **O limite é consumido pelo valor gasto.** Não há reserva de orçamento. Compra acima do limite é permitida e deixa o disponível negativo. | Escolha do usuário. É o comportamento real de um cartão, e igual ao orçamento estourado de hoje. |
| D4 | **O mês começa sozinho**, com o limite atual do cartão, e a pergunta "copiar categorias" deixa de existir. | Sem categorias por mês, não há o que copiar. |
| D5 | **A data da compra define o mês dela, e uma compra comum aceita data em mês futuro** (ex.: um gasto já combinado para o mês que vem). O diálogo não limita a data ao mês aberto. Uma **compra parcelada** continua sem aceitar data em mês futuro. | Escolha do usuário. Permite antecipar gastos conhecidos. As parcelas futuras seguem só previstas (parcelamento D4). |
| D6 | **Excluir uma categoria não apaga compras.** Elas passam a "Sem categoria". | Evita perder dados por limpar a lista de categorias. |
| D7 | **Parcelas até o mês corrente continuam gravadas como compras** (parcelamento D4), na categoria da compra parcelada. Não se cria mais categoria por mês. | Mantém a regra que já funciona. A prévia de meses futuros continua calculada. |
| D8 | **Não existe mais parcela fixa.** Editar ou excluir uma compra parcelada muda todas as parcelas. | A "parcela fixa" só existia por causa da categoria fechada. |
| D9 | **Categorias são gerenciadas num diálogo "Categorias"** aberto pela aba Cartões. | Um lugar único e simples. A aba Benefícios usará a mesma lista. |
| D10 | **O orçamento e o estado aberto/fechado das categorias antigas são descartados** na migração. Os lançamentos viram compras. | Escolha do usuário. |
| D11 | **Migração v5 → v6 automática.** | Ninguém perde os gastos. |
| D12 | **Mês futuro deixa de ser só prévia.** Abre até o último mês com algo previsto ou registrado (parcela prevista ou compra futura), mostra as parcelas previstas e as compras registradas, e aceita "Registrar compra". Um mês futuro **não é iniciado** (não ganha registro em `months`) até chegar, e o limite dele é o limite atual do cartão. | Consequência do D5. Evita congelar um limite que ainda pode mudar. |

## 4. Requisitos

### 4.1 Requisitos funcionais (RF)

| ID | Requisito |
| -- | --------- |
| RF-01 | A aba Cartões não mostra mais categorias-envelope, orçamento, "Nova categoria" nem abas aberto/encerrado. Com um cartão cadastrado, **"Registrar compra"** está sempre disponível, inclusive nos meses futuros que abrem (D12). |
| RF-02 | O diálogo **"Nova compra"** tem descrição, valor, **categoria** (seletor com "Sem categoria" como padrão), data (livre, inclusive em mês futuro; no mês futuro aberto, a data padrão é o dia 1º dele) e o interruptor "Compra parcelada" (campos do parcelamento inalterados). |
| RF-03 | A tela lista as **compras do mês** do cartão selecionado, da mais recente para a mais antiga: descrição, categoria (se houver), data, valor e o selo "k/N" nas parcelas. Cada compra tem editar e excluir. Num mês futuro, a lista traz também as **parcelas previstas**, marcadas "prevista" e sem editar nem excluir. |
| RF-04 | Um **filtro por categoria** (Todas, cada categoria usada no mês e "Sem categoria") restringe a lista e mostra o total do filtro. |
| RF-05 | Um **resumo por categoria** lista, em ordem decrescente de valor, a soma de cada categoria no mês e a participação no usado. Compras sem categoria aparecem como "Sem categoria". |
| RF-06 | O cartão (carrossel) e a faixa "Todos os cartões" mostram **usado, disponível e limite** do mês, com a barra de percentual. |
| RF-07 | O diálogo **"Categorias"** lista, cria, renomeia e exclui categorias. Ao excluir, pede confirmação e informa quantas compras ficarão sem categoria. |
| RF-08 | **Editar** uma compra comum abre "Editar compra" com todos os campos, inclusive a categoria. Editar uma parcela abre "Editar compra parcelada", como hoje. |
| RF-09 | **Excluir** uma compra comum pede confirmação e a remove. Excluir uma parcela pede a confirmação de remover a compra parcelada inteira. |
| RF-10 | **Mês futuro** (`#/mes/AAAA-MM`): a faixa "‹Mês› ainda não começou: aparecem as parcelas previstas e as compras já registradas." fica abaixo da navegação de mês; "Registrar compra" aparece; a lista mostra as compras registradas (com editar e excluir) e as parcelas previstas (somente leitura); o resumo por categoria soma as duas. |
| RF-11 | O **Histórico** mostra, por mês, usado, limite, percentual e a quantidade de compras. A seção "Próximos meses" lista os meses futuros com parcelas previstas ou compras registradas, e cada linha abre aquele mês. |
| RF-12 | Na virada do mês, o app **não pergunta nada**: o mês novo começa sozinho. |

### 4.2 Regras de negócio (RN)

| ID | Regra |
| -- | ----- |
| RN-01 | **Usado (D3):** soma das compras do cartão com data no mês, inclusive as parcelas gravadas. Num mês futuro, soma das compras já registradas nele e das parcelas previstas. |
| RN-02 | **Disponível:** limite do mês − usado. O limite do mês é o do cartão na época; um mês nunca iniciado usa o limite atual (`historico-mensal.md`). |
| RN-03 | **Todos os cartões:** para cada cartão, soma o limite do mês e o usado, e o disponível é a diferença (como em `multiplos-cartoes.md`, RN-02). |
| RN-04 | **Validação da compra comum:** descrição obrigatória, até 200 caracteres; valor ≥ R$ 0,01; data válida (qualquer mês, inclusive futuro, D5); categoria, se informada, precisa existir ("Categoria não encontrada."). |
| RN-05 | **Categorias:** nome obrigatório, até 120 caracteres, único ignorando maiúsculas, minúsculas e espaços nas pontas ("Já existe uma categoria com esse nome."). |
| RN-06 | **Excluir categoria (D6):** as compras e as compras parceladas que a usam passam a `categoryId: null`. |
| RN-07 | **Início do mês (D4):** ao abrir o mês corrente de um cartão sem registro do mês, o app o inicia com o limite atual e grava as parcelas devidas (`syncPurchases`). Registrar uma compra num mês passado não iniciado também o inicia, com o limite atual. Uma compra futura **não** inicia o mês dela (D12). |
| RN-08 | **Parcelamento:** os valores e as datas das parcelas seguem as RN-01 e RN-02 de `parcelamento.md`. Cada parcela gravada é uma compra com a `categoryId` da compra parcelada. Não se cria categoria. |
| RN-09 | **Editar compra parcelada (D8):** apaga todas as parcelas gravadas e as grava de novo com os valores novos (RN-06 de `parcelamento.md`, sem a parte de parcelas fixas). Valem as validações de `parcelamento.md` RN-05 que não dependem de categoria. |
| RN-10 | **Excluir compra parcelada (D8):** remove a compra e todas as parcelas gravadas e previstas. |
| RN-11 | **Parcela não se altera sozinha:** `updateMovement` e `deleteMovement` falham com "Este lançamento é uma parcela. Altere a compra parcelada." (igual a `parcelamento.md`, RN-09). |
| RN-12 | **Excluir cartão:** apaga os meses, as compras e as compras parceladas dele. As categorias globais ficam. |
| RN-13 | **Mês futuro (D12):** abre se for ≤ o último mês futuro com parcela prevista ou compra registrada, de qualquer cartão; depois disso, a rota volta para `/`. O limite é o atual do cartão, e nada é gravado em `months`. Os grupos de parcelas previstas usam o nome da categoria atual da compra parcelada, ou "Sem categoria". |
| RN-14 | **Migração v5 → v6 (D10, D11):** ver [seção 6](#6-modelo-de-dados-e-migração). |
| RN-15 | **Compra parcelada e mês futuro (D5):** a data da compra parcelada não pode estar em mês futuro: "Compra parcelada não aceita data em mês futuro." |

## 5. Cenários (BDD)

Os cenários usam a data de hoje como **17/10/2026**, e o cartão "Nubank" (limite R$ 1.000,00) selecionado.

```gherkin
# language: pt

Funcionalidade: Compras e categorias
  Como pessoa que usa cartão de crédito
  Quero registrar cada compra e ver quanto do limite ela consumiu
  Para saber quanto ainda posso gastar no mês

  Contexto:
    Dado que o cartão "Nubank" tem limite de R$ 1.000,00
    E as categorias "Mercado" e "Lazer" existem

  # --- RF-01 / RF-02 / RF-03 / RN-01 / RN-02 / D1 / D3 --------------------------
  Cenário: Registrar uma compra sem planejar nada
    Dado que não há compras em outubro de 2026
    Quando eu toco em "Registrar compra"
    E informo a descrição "Feira", o valor "120", a categoria "Mercado" e a data 17/10/2026
    E toco em "Adicionar"
    Então a lista de outubro tem "Feira" em "Mercado" com R$ 120,00
    E o usado do Nubank é R$ 120,00 e o disponível é R$ 880,00

  # --- RF-02 / D2 / RN-04 -------------------------------------------------------
  Cenário: Registrar uma compra sem categoria
    Quando eu registro "Farmácia" de R$ 30,00 sem escolher categoria
    Então "Farmácia" aparece na lista sem categoria
    E o resumo por categoria mostra "Sem categoria" com R$ 30,00

  # --- D3 / RN-02 ---------------------------------------------------------------
  Cenário: Compra acima do limite
    Dado que o usado do Nubank é R$ 900,00
    Quando eu registro uma compra de R$ 300,00
    Então o usado é R$ 1.200,00 e o disponível é -R$ 200,00

  # --- RN-04 --------------------------------------------------------------------
  Cenário: Compra com valor inválido
    Quando eu registro uma compra com valor "0"
    Então vejo "Valor deve ser de pelo menos R$ 0,01."

  # --- D5 / D12 / RN-01 / RN-04 / RN-07 ----------------------------------------
  Cenário: Compra em mês futuro
    Quando eu registro "Presente" de R$ 100,00 com data em 20/11/2026
    Então "Presente" não aparece na lista de outubro
    E novembro de 2026 passa a abrir, com "Presente" e o usado de R$ 100,00
    E novembro não ganha registro de mês: o limite dele continua sendo o atual do cartão

  # --- D5 / RN-15 --------------------------------------------------------------
  Cenário: Compra parcelada não aceita mês futuro
    Quando eu registro uma compra parcelada com data em 20/11/2026
    Então vejo "Compra parcelada não aceita data em mês futuro."

  # --- RF-04 --------------------------------------------------------------------
  Cenário: Filtrar a lista por categoria
    Dado que há compras em "Mercado", "Lazer" e sem categoria
    Quando eu escolho o filtro "Mercado"
    Então a lista mostra só as compras de "Mercado" e o total delas

  # --- RF-05 --------------------------------------------------------------------
  Cenário: Resumo por categoria
    Dado que há R$ 300,00 em "Mercado", R$ 100,00 em "Lazer" e R$ 100,00 sem categoria
    Então o resumo mostra "Mercado" R$ 300,00 (60%), "Lazer" R$ 100,00 (20%) e "Sem categoria" R$ 100,00 (20%)

  # --- RF-08 --------------------------------------------------------------------
  Cenário: Editar uma compra
    Dado que existe "Feira" de R$ 120,00 em "Mercado"
    Quando eu edito o valor para "150" e a categoria para "Lazer"
    Então "Feira" mostra R$ 150,00 em "Lazer" e o usado muda

  # --- RF-09 --------------------------------------------------------------------
  Cenário: Excluir uma compra
    Dado que existe "Feira" de R$ 120,00
    Quando eu excluo e confirmo
    Então a compra some e o limite volta a ficar disponível

  # --- RF-06 / RN-03 ------------------------------------------------------------
  Cenário: Todos os cartões
    Dado que o Nubank tem limite de R$ 1.000,00 com R$ 200,00 usados
    E o Inter tem limite de R$ 500,00 com R$ 100,00 usados
    Então "Todos os cartões" mostra usado R$ 300,00, disponível R$ 1.200,00 e limite R$ 1.500,00

  # --- RF-07 / RN-05 -------------------------------------------------------------
  Cenário: Criar e renomear categorias
    Quando eu abro "Categorias" e crio "Transporte"
    Então "Transporte" aparece na lista e no seletor da compra
    Quando eu crio "  mercado "
    Então vejo "Já existe uma categoria com esse nome."
    Quando eu renomeio "Transporte" para "Uber e ônibus"
    Então as compras dessa categoria passam a mostrar "Uber e ônibus"

  # --- RF-07 / RN-06 / D6 -------------------------------------------------------
  Cenário: Excluir uma categoria em uso
    Dado que "Lazer" tem 2 compras
    Quando eu excluo "Lazer"
    Então vejo a confirmação "2 compras ficarão sem categoria."
    E depois de confirmar, as 2 compras aparecem sem categoria
    E o usado do cartão não muda

  # --- RF-12 / RN-07 / D4 -------------------------------------------------------
  Cenário: Virada de mês sem pergunta
    Dado que hoje é 01/11/2026 e novembro nunca foi aberto
    Quando eu abro o app
    Então novembro começa sozinho, com o limite atual do cartão
    E nenhuma pergunta sobre copiar categorias aparece

  # --- RN-07 --------------------------------------------------------------------
  Cenário: Compra num mês passado
    Dado que agosto de 2026 nunca foi aberto
    Quando eu registro uma compra de R$ 50,00 em agosto
    Então agosto passa a existir com o limite atual do cartão
    E o histórico mostra agosto com usado R$ 50,00

  # --- RF-02 / RN-08 / D7 -------------------------------------------------------
  Cenário: Compra parcelada com categoria
    Quando eu registro "Fone" de R$ 100,00 em 3x, categoria "Lazer", em 15/10/2026
    Então outubro tem "Fone" "1/3" de R$ 33,34 em "Lazer"
    E novembro e dezembro têm as parcelas previstas em "Lazer", de R$ 33,33

  # --- RN-08 / D7 ---------------------------------------------------------------
  Cenário: A parcela entra quando o mês começa
    Dado que hoje é 01/11/2026 e "Fone" está em 3x na categoria "Lazer"
    Quando novembro começa
    Então "Fone" "2/3" entra em novembro na categoria "Lazer"
    E nenhuma categoria nova é criada

  # --- RN-09 / D8 ---------------------------------------------------------------
  Cenário: Editar a compra parcelada muda todas as parcelas
    Quando eu edito uma parcela de "Fone" e mudo o valor total para R$ 120,00
    Então todas as parcelas passam a valer R$ 40,00, inclusive as de meses passados

  # --- RN-10 / D8 ---------------------------------------------------------------
  Cenário: Excluir a compra parcelada remove todas as parcelas
    Quando eu excluo uma parcela de "Fone" e confirmo
    Então a compra e todas as suas parcelas somem, passadas e previstas

  # --- RN-11 --------------------------------------------------------------------
  Cenário: Parcela não se altera sozinha
    Quando eu tento alterar ou excluir uma parcela como compra comum
    Então vejo "Este lançamento é uma parcela. Altere a compra parcelada."

  # --- RF-10 / RN-01 / RN-13 / D12 ----------------------------------------------
  Cenário: Mês futuro com parcelas previstas e compras
    Dado que "Fone" tem a parcela "2/3" de R$ 33,33 prevista para novembro
    E registrei "Presente" de R$ 100,00 com data em 20/11/2026
    Quando eu abro novembro de 2026
    Então vejo "Presente", que posso editar e excluir
    E vejo a parcela prevista "Fone" "2/3", sem editar nem excluir
    E o usado de novembro é R$ 133,33 e "Registrar compra" aparece

  # --- RN-13 --------------------------------------------------------------------
  Cenário: Limite de navegação nos meses futuros
    Dado que o último mês com parcela prevista ou compra registrada é dezembro de 2026
    Quando eu abro "#/mes/2027-03"
    Então o app volta para "#/"

  # --- RF-11 --------------------------------------------------------------------
  Cenário: Histórico por mês
    Quando eu abro o Histórico
    Então cada mês mostra usado, limite, percentual e a quantidade de compras
    E a seção "Próximos meses" lista novembro, com a parcela prevista e a compra futura

  # --- RN-12 --------------------------------------------------------------------
  Cenário: Excluir um cartão
    Quando eu excluo o cartão "Inter"
    Então as compras e os meses do "Inter" somem
    E as categorias e os outros cartões continuam como estavam

  # --- RN-14 / D10 / D11 --------------------------------------------------------
  Cenário: Migração de dados antigos
    Dado que o aparelho tem dados na versão 5 com as categorias "Casa" (R$ 500,00, Nubank, outubro) e "casa " (R$ 300,00, Inter, outubro), com lançamentos em cada uma
    Quando eu abro o app
    Então existe uma única categoria "Casa"
    E cada lançamento virou uma compra no cartão em que estava, na categoria "Casa"
    E os orçamentos e o estado aberto/fechado deixam de existir
    E o usado de cada cartão em cada mês é a soma das compras daquele mês
```

### 5.1 Matriz de rastreabilidade

| Requisito | Cenário(s) |
| --------- | ---------- |
| RF-01, RF-02 | Registrar uma compra sem planejar nada; Registrar uma compra sem categoria |
| RF-03 | Registrar uma compra sem planejar nada |
| RF-04 | Filtrar a lista por categoria |
| RF-05 | Resumo por categoria |
| RF-06 | Registrar uma compra sem planejar nada; Todos os cartões |
| RF-07 | Criar e renomear categorias; Excluir uma categoria em uso |
| RF-08 | Editar uma compra |
| RF-09 | Excluir uma compra; Excluir a compra parcelada remove todas as parcelas |
| RF-10 | Mês futuro com parcelas previstas e compras; Compra em mês futuro |
| RF-11 | Histórico por mês |
| RF-12 | Virada de mês sem pergunta |
| RN-01, RN-02 | Registrar uma compra sem planejar nada; Compra acima do limite; Mês futuro com parcelas previstas e compras |
| RN-03 | Todos os cartões |
| RN-04 | Compra com valor inválido; Compra em mês futuro; Registrar uma compra sem categoria |
| RN-05 | Criar e renomear categorias |
| RN-06 | Excluir uma categoria em uso |
| RN-07 | Virada de mês sem pergunta; Compra num mês passado; Compra em mês futuro |
| RN-08 | Compra parcelada com categoria; A parcela entra quando o mês começa |
| RN-09 | Editar a compra parcelada muda todas as parcelas |
| RN-10 | Excluir a compra parcelada remove todas as parcelas |
| RN-11 | Parcela não se altera sozinha |
| RN-12 | Excluir um cartão |
| RN-13 | Mês futuro com parcelas previstas e compras; Limite de navegação nos meses futuros |
| RN-14 | Migração de dados antigos |
| RN-15 | Compra parcelada não aceita mês futuro |
| D5, D12 | Compra em mês futuro; Mês futuro com parcelas previstas e compras |

## 6. Modelo de dados e migração

O estado salvo passa de `version: 5` para `version: 6`:

```ts
// Global (D2): no card, month or budget.
type StoredCategory = { id: number; name: string };

// A purchase on a card. The month is monthOf(date).
type StoredMovement = {
  id: number; cardId: number; categoryId: number | null;
  description: string; amount: number; date: string;
  purchaseId?: number; installment?: number; installmentCount?: number;
};

type StoredPurchase = { /* campos da v5 */ categoryId: number | null }; // substitui categoryName

type State = { /* cards, months, purchases, incomes, incomeExceptions, ... */ version: 6; categories: StoredCategory[]; movements: StoredMovement[] };
```

`months` continua `{ cardId, month, limitAmount }`.

**Migração v5 → v6 (RN-14):**

1. Categorias novas: uma por **nome único** das categorias antigas, comparando sem diferenciar maiúsculas, minúsculas e espaços nas pontas. O nome guardado é o da primeira ocorrência (por `id`, sem os espaços das pontas).
2. Cada lançamento antigo vira uma compra com `cardId` da categoria antiga e `categoryId` da categoria nova de mesmo nome.
3. Cada compra parcelada troca `categoryName` por `categoryId`, pelo mesmo critério. Se o nome não existir mais nas categorias antigas, cria-se a categoria.
4. `isClosed` e `amount` (orçamento) das categorias antigas são descartados.
5. `months`, cartões, entradas e `nextId` seguem como estavam; as categorias novas usam `nextId` para os ids.

## 7. Contrato da camada de dados

Em `src/data/store.ts`:

| Função | Efeito |
| ------ | ------ |
| `getCards(month)` / `getCard` | Cada cartão traz `usedAmount`, `availableAmount`, `percentUsed` e `limitAmount` do mês (RN-01, RN-02). |
| `getConsolidated(month)` / `getConsolidatedHistory()` | RN-03. |
| `getMovements(cardId, month)` | Compras do mês do cartão, da mais recente à mais antiga; cada uma com `categoryName` e, nas parcelas, os dados da compra parcelada. |
| `getCategorySummary(cardId, month)` | Soma e participação por categoria, em ordem decrescente (RF-05). |
| `getCategories()` | Lista global de categorias, com a quantidade de compras de cada uma. |
| `createCategory(input)`, `updateCategory(id, input)`, `deleteCategory(id)` | RN-05 e RN-06. |
| `createMovement(cardId, categoryId, input)`, `updateMovement(id, categoryId, input)`, `deleteMovement(id)` | RN-04 e RN-11. |
| `createPurchase`, `updatePurchase`, `deletePurchase` | RN-08 a RN-10, com `categoryId` no lugar de uma categoria-envelope. |
| `getMonthPreview(cardId, month)` | Parcelas previstas do mês futuro, agrupadas por categoria (somente leitura). |
| `getFutureInstallments(cardId)` | Por mês futuro, soma e quantidade de parcelas previstas **e** compras futuras (RF-11). |
| `getLastFutureMonth()` | Substitui `getLastPlannedMonth`: o último mês futuro com parcela prevista ou compra, de qualquer cartão (RN-13). |
| `getMonthHistory(cardId)` | Resumo por mês: usado, limite, percentual e quantidade de compras. |
| `getMonthStatus` | Passa a ter só `needsStart`; o início do mês é automático (RN-07). |

Saem: `getOverview`, `getCategories(cardId, month)` por mês, `setCategoryClosed`. O `startMonth` deixa de receber `copyFrom`.

Em `src/data/api.ts`: os hooks e as query keys acompanham a tabela acima; as mutações invalidam as consultas de cartões, compras, categorias, histórico e parcelas.

## 8. Interface

- **Aba Cartões** (`src/pages/dashboard.tsx`), de cima para baixo: carrossel e faixa "Todos os cartões" (inalterados), botões "Registrar compra" e "Categorias", filtro por categoria, lista de compras do mês e resumo por categoria.
- **Diálogo de compra:** o diálogo de lançamento atual, com o seletor "Categoria" no lugar de "Em qual envelope?". O título é "Nova compra" (e "Nova compra parcelada" com o interruptor ligado). O interruptor, os campos de parcelas e a prévia da divisão seguem iguais.
- **Diálogo "Categorias":** lista com renomear e excluir em cada linha, e um campo para criar.
- **Mês futuro:** a mesma tela do mês corrente, com a faixa do RF-10, as parcelas previstas misturadas à lista (selo "prevista", sem ações) e "Registrar compra" disponível. O diálogo de compra tem a data livre.
- **Histórico** (`src/pages/historico.tsx`): o cartão de cada mês mostra usado, limite, barra de percentual e a quantidade de compras. A linha "Todos os cartões" mostra o usado somado.
- **Sai:** `MonthStartDialog`, o menu de cada envelope, o orçamento, "fechar/abrir" e as abas aberto/encerrado.
- **Reuso:** `Dialog` e `splitPreview` de `dashboard.tsx`, `Progress`, `CardCarousel`, `AppTabs`, os helpers de `src/lib/format.ts` e o padrão de `refresh` com invalidação por prefixo.

## 9. Fora de escopo

- A aba **Benefícios** e o saldo por envelope (spec própria, a seguir).
- Orçamento ou meta por categoria.
- Categorias com cor ou ícone, e hierarquia de categorias.
- Compras recorrentes (assinaturas) e importação de fatura.
- Pagamento de fatura e saldo devedor entre meses.
- Mudar a categoria de várias compras de uma vez.

## 10. Critérios de aceite

- [ ] RF-01 a RF-12 funcionam como descritos. *Verificados no navegador: RF-01, RF-02, RF-03, RF-05, RF-06, RF-07 (criar e nome repetido), RF-10 e RF-11. Pendentes de conferência manual pela interface: RF-04 (clicar nos filtros), RF-07 (renomear e excluir), RF-08, RF-09 e RF-12 (a lógica está coberta no `store.ts`, mas a virada de mês real não foi simulada).*
- [ ] Todos os cenários da seção 5 passam no navegador (`npm run dev`). *Passaram no navegador: registrar compra com categoria, mês futuro com parcela prevista e compra, compra em mês futuro sem iniciar o mês, Próximos meses, limite de navegação, criar e repetir categoria, Todos os cartões e migração de dados v5. Os demais foram conferidos só na camada de dados.*
- [x] RN-01 a RN-13 e RN-15 exercitadas em `src/data/store.ts`, incluindo compra acima do limite, exclusão de categoria em uso e parcelas.
- [x] Dados `version: 5` abrem sem perda de lançamentos e passam a `version: 6` (RN-14), inclusive com categorias de mesmo nome em cartões e meses diferentes e com compras parceladas.
- [x] Entradas, cartões, limites e meses continuam como estavam após a migração.
- [x] `npm run typecheck` e `npm run build` passam.
- [x] `FUNCIONALIDADES.md` e `README.md` descrevem o app novo, e as specs `historico-mensal.md`, `multiplos-cartoes.md` e `parcelamento.md` têm a nota "Substituída em parte por `compras-e-categorias.md`".

## 11. Tarefas

1. `store.ts`: tipos e `State` v6, `migrateV5`, mapeamento de categorias por nome (RN-14), encadeamento na leitura.
2. `store.ts`: cálculos de usado, disponível, consolidado, histórico e resumo por categoria (RN-01 a RN-03); remover orçamento, `isClosed`, `getOverview` e `copyFrom`.
3. `store.ts`: categorias globais (RN-05, RN-06) e compras comuns (RN-04, RN-11), com início automático do mês (RN-07).
4. `store.ts`: parcelamento sem categoria-envelope nem parcela fixa (RN-08 a RN-10), prévia por categoria (RN-13) e exclusão de cartão (RN-12).
5. `api.ts`: hooks e query keys novos; remover os de envelope.
6. `dashboard.tsx`: lista de compras, filtro, resumo por categoria, diálogos de compra e de categorias; remover `MonthStartDialog` e os menus de envelope; prévia por categoria.
7. `historico.tsx` e `index.css`: o cartão de cada mês e a linha "Todos os cartões".
8. Atualizar `FUNCIONALIDADES.md` (seções 1 a 4 e 9 a 11), `README.md` (tabela de cálculo, `version: 6`, migração) e as notas nas três specs antigas.
9. Rodar o roteiro de verificação; mudar o Status para `Implementada` e marcar só o que foi verificado.

## 12. Roteiro de verificação

1. `npm run typecheck` e `npm run build`.
2. Script de teste de `store.ts` (esbuild com `localStorage` simulado): migração v5 → v6 com categorias repetidas, compras parceladas e categoria fechada; cálculo de usado e disponível; exclusão de categoria em uso; parcelas e prévia.
3. `npm run dev` e percorrer, na ordem, os cenários da seção 5.
4. No console do navegador, gravar um JSON `version: 5` em `controle-cartao:v1`, recarregar e conferir a migração.
5. Conferir que a aba Entradas continua igual.
