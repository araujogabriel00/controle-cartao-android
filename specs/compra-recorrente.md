# Spec — Compra recorrente

| Campo | Valor |
| ----- | ----- |
| Status | Implementada |
| Criada em | 17/10/2026 |
| Escopo | `src/data/store.ts`, `src/data/api.ts`, `src/pages/dashboard.tsx`, `src/pages/historico.tsx`, `FUNCIONALIDADES.md`, `README.md` |
| Depende de | [`compras-e-categorias.md`](compras-e-categorias.md) (compras, usado e mês futuro), [`parcelamento.md`](parcelamento.md) (parcelas gravadas e previstas), [`entradas.md`](entradas.md) (recorrência com escopo "Só este mês" / "Este e os próximos") |

> Esta spec é a fonte da verdade da funcionalidade. A implementação segue a seção [Tarefas](#11-tarefas) e só termina quando todos os [Critérios de aceite](#10-critérios-de-aceite) forem atendidos. Mudanças de comportamento entram primeiro aqui e só depois no código.

---

## 1. Contexto e objetivo

Assinaturas e cobranças que se repetem todo mês no cartão (streaming, academia, seguro, nuvem) hoje precisam ser lançadas à mão a cada mês, e o limite dos meses seguintes não mostra que elas virão.

**Objetivo:**

1. Registrar uma **compra recorrente** uma única vez: valor mensal, dia e categoria opcional.
2. Cada cobrança vira uma **compra comum** no mês em que cai, como as parcelas.
3. Ver as **cobranças dos meses seguintes** como previstas, já consumindo o limite previsto.
4. Alterar ou encerrar a recorrência só num mês ou de um mês em diante (um reajuste não reescreve o passado).

## 2. Glossário

| Termo | Definição |
| ----- | --------- |
| **Compra recorrente** | O registro único da recorrência: cartão, descrição, valor mensal, categoria opcional, dia do mês, mês inicial e mês final opcional. |
| **Cobrança** | A compra recorrente vista num mês específico. |
| **Cobrança gravada** | Cobrança de mês passado ou corrente: existe como compra comum (`recurringId`). |
| **Cobrança prevista** | Cobrança de mês futuro, até 12 meses à frente do corrente. Não é guardada: é calculada. |
| **Exceção** | Ajuste de uma cobrança prevista só: pular o mês, ou mudar descrição, valor ou dia. |

Os termos de compra, usado e mês futuro seguem [`compras-e-categorias.md`](compras-e-categorias.md#2-glossário), e os de parcela gravada e prevista, [`parcelamento.md`](parcelamento.md#2-glossário).

## 3. Decisões de produto

| # | Decisão | Motivo |
| - | ------- | ------ |
| D1 | **A recorrência funciona como o parcelamento:** cada cobrança até o mês corrente é gravada como compra comum, e as dos meses futuros são só previstas (calculadas). | Escolha do usuário. As regras de usado, limite e histórico continuam valendo sem cálculo novo. |
| D2 | **Cadastro por um interruptor "Compra recorrente"** no "Registrar compra", ao lado de "Compra parcelada", com "Até (mês)" opcional. Os dois interruptores não ficam ligados juntos. Sem mês final, repete sem fim. | Escolha do usuário. |
| D3 | **Editar ou excluir pergunta o escopo:** "Só este mês" ou "Este e os próximos". | Escolha do usuário. Um reajuste vale daqui em diante, sem reescrever o passado. |
| D4 | **As previsões vão até 12 meses à frente** do mês corrente, mesmo sem mês final. | Uma recorrência sem fim gera meses sem limite, e é preciso um teto (como em `entradas.md`, D9). |
| D5 | **O mês inicial vem da data** informada, e pode estar no passado (as cobranças desde então são gravadas) ou até 12 meses à frente. | Permite cadastrar uma assinatura que já existe e uma que vai começar. |
| D6 | **Uma cobrança gravada não se altera sozinha como compra comum.** Editar ou excluir passa pela compra recorrente e pelo escopo. | Mesma ideia da parcela (`parcelamento.md`, RN-09). |
| D7 | **"Só este mês" não muda a categoria nem o mês final.** Isso só vale em "Este e os próximos". | Mesma ideia do tipo da entrada (`entradas.md`, RN-05). |
| D8 | **Migração v8 → v9 automática**, só acrescenta listas vazias. | Ninguém perde dados. |

## 4. Requisitos

### 4.1 Requisitos funcionais (RF)

| ID | Requisito |
| -- | --------- |
| RF-01 | No diálogo **"Nova compra"**, o interruptor **"Compra recorrente"** muda o título para "Nova compra recorrente", o valor para "Valor mensal" e mostra o campo opcional **"Até (mês)"**. Ligar um interruptor (parcelada ou recorrente) desliga o outro. |
| RF-02 | Com o interruptor ligado, mostra a prévia "Todo mês, dia ‹d›, a partir de ‹mês› · até ‹mês›" (ou "sem data final"). |
| RF-03 | Na lista de compras, cada cobrança gravada mostra o selo **"Mensal"**. Num mês futuro, a cobrança prevista mostra "Mensal" e "prevista", sem editar nem excluir. |
| RF-04 | **Editar** uma cobrança gravada pergunta o escopo e abre "Editar compra recorrente". Em "Só este mês", o diálogo tem descrição, valor e data (dentro do mês), sem categoria nem "Até". Em "Este e os próximos", tem também a categoria e "Até (mês)". |
| RF-05 | **Excluir** uma cobrança gravada pergunta o escopo e depois confirma. |
| RF-06 | Os meses futuros abrem até 12 meses à frente quando há uma recorrência sem fim, mostrando as cobranças previstas (junto das parcelas previstas e das compras futuras). |
| RF-07 | O Histórico, em "Próximos meses", inclui as cobranças previstas no valor e na contagem de cada mês. |
| RF-08 | Depois de salvar, a mensagem é "Compra recorrente registrada." (criar) ou "Compra recorrente atualizada." (editar). |

### 4.2 Regras de negócio (RN)

| ID | Regra |
| -- | ----- |
| RN-01 | **Cobrança do mês:** a recorrência ocorre em todo mês de `mêsInicial` até `mêsFinal` inclusive, ou sem fim. A data é o `dia` no mês, ajustado para o último dia se o mês não tiver esse dia (como `parcelamento.md`, RN-02). |
| RN-02 | **Gravação (D1):** depois de criar ou editar uma recorrência, e depois de iniciar um mês, toda cobrança de mês ≤ o corrente que ainda não existe e não foi pulada é gravada como compra comum com `recurringId`. Se o mês do cartão não foi iniciado, ele é iniciado com o limite atual. |
| RN-03 | **Previsão (D4):** a cobrança de um mês > o corrente e ≤ o corrente + 12 é prevista. Ela entra no usado do mês futuro, na prévia e nos "Próximos meses", e não é gravada. |
| RN-04 | **Validação:** descrição obrigatória, até 200 caracteres; valor mensal ≥ R$ 0,01; data válida e até o último dia do mês corrente + 12 ("A data deve ser de até 12 meses à frente."); categoria, se informada, precisa existir; "Até (mês)" não pode ser anterior ao mês inicial ("O mês final deve ser igual ou posterior ao mês inicial."). |
| RN-05 | **Editar "Só este mês" (D3, D7):** numa cobrança gravada, atualiza a compra do mês (descrição, valor e data dentro do mês, "A data deve estar dentro de ‹mês›."); numa prevista, grava a exceção do mês. A categoria e o mês final não mudam. |
| RN-06 | **Editar "Este e os próximos" (D3):** se o mês é o inicial, a recorrência é atualizada no lugar; senão, a original termina no mês anterior e nasce uma nova a partir do mês editado. Nos dois casos, as cobranças gravadas da recorrência alterada a partir do mês editado são apagadas e gravadas de novo (RN-02), e as exceções de meses ≥ o mês editado são apagadas. |
| RN-07 | **Excluir "Só este mês":** remove a compra do mês (se gravada) e grava uma exceção "pular", para que ela não seja gravada de novo. |
| RN-08 | **Excluir "Este e os próximos":** se o mês é o inicial, remove a recorrência, todas as cobranças gravadas e as exceções; senão, a recorrência termina no mês anterior e as cobranças gravadas e as exceções de meses ≥ o excluído são removidas. |
| RN-09 | **Cobrança não se altera sozinha (D6):** `updateMovement` e `deleteMovement` falham com "Esta compra é recorrente. Altere a compra recorrente." quando a compra tem `recurringId`. |
| RN-10 | **Excluir cartão:** remove também as recorrências e as exceções dele (complementa `compras-e-categorias.md`, RN-12). |
| RN-11 | **Excluir categoria:** as recorrências que a usam passam a sem categoria, e a contagem do diálogo de categorias soma cada recorrência uma vez (complementa `compras-e-categorias.md`, RN-06). |
| RN-12 | **Mês futuro:** o último mês navegável (`getLastFutureMonth`) considera também as cobranças previstas, até o corrente + 12. |
| RN-13 | A **migração** v8 → v9 é automática, acontece uma vez e não perde dados (D8). |

## 5. Cenários (BDD)

Os cenários usam a data de hoje como **17/10/2026** e o cartão "Nubank" (limite R$ 1.000,00) selecionado.

```gherkin
# language: pt

Funcionalidade: Compra recorrente
  Como pessoa com assinaturas no cartão
  Quero registrar a cobrança uma vez e vê-la cair todo mês
  Para saber quanto do limite já está comprometido nos próximos meses

  # --- RF-01 / RF-02 / RF-08 / RN-01 / RN-02 / D1 -----------------------------------
  Cenário: Registrar uma assinatura
    Quando eu abro "Registrar compra" e ligo "Compra recorrente"
    Então o título é "Nova compra recorrente" e o valor é "Valor mensal"
    Quando eu informo "Streaming", o valor "40" e a data 15/10/2026
    Então a prévia mostra "Todo mês, dia 15, a partir de outubro de 2026 · sem data final"
    Quando eu clico em "Adicionar"
    Então vejo "Compra recorrente registrada."
    E outubro tem "Streaming" de R$ 40,00 em 15/10 com o selo "Mensal"
    E o usado do Nubank em outubro inclui R$ 40,00

  # --- RF-01 -----------------------------------------------------------------------
  Cenário: Recorrente e parcelada não ficam juntas
    Dado que "Compra parcelada" está ligada
    Quando eu ligo "Compra recorrente"
    Então "Compra parcelada" desliga

  # --- RN-03 / RF-06 / D4 -----------------------------------------------------------
  Cenário: Cobranças previstas nos meses seguintes
    Dado que "Streaming" é recorrente sem fim
    Quando eu abro novembro de 2026
    Então vejo "Streaming" de R$ 40,00 com os selos "Mensal" e "prevista", sem editar nem excluir
    E o usado de novembro inclui R$ 40,00
    E o botão "Próximo mês" avança até outubro de 2027

  Cenário: Mês final
    Quando eu registro "Curso" de R$ 100,00 em 10/10/2026 até dezembro de 2026
    Então outubro, novembro e dezembro têm "Curso"
    E janeiro de 2027 não tem

  # --- RN-01 ---------------------------------------------------------------------------
  Cenário: Cobrança no dia 31
    Dado que "Plano" é recorrente no dia 31
    Então em novembro a data é 30/11 e em fevereiro de 2027 é 28/02

  # --- D5 / RN-02 ----------------------------------------------------------------------
  Cenário: Assinatura que já existia
    Quando eu registro "Nuvem" de R$ 10,00 com data 05/08/2026
    Então agosto, setembro e outubro de 2026 têm "Nuvem" como compra gravada
    E agosto passa a existir com o limite atual do cartão, se ainda não existia
    E novembro em diante têm a cobrança prevista

  # --- RN-02 / D1 ----------------------------------------------------------------------
  Cenário: A cobrança entra quando o mês começa
    Dado que hoje é 01/11/2026
    Quando novembro começa
    Então "Streaming" entra em novembro como compra gravada, com o selo "Mensal"

  # --- RN-04 ---------------------------------------------------------------------------
  Cenário: Validação
    Quando eu registro uma compra recorrente com valor "0"
    Então vejo "Valor deve ser de pelo menos R$ 0,01."
    Quando eu informo a data daqui a 14 meses
    Então vejo "A data deve ser de até 12 meses à frente."
    Quando eu informo "Até" antes do mês da data
    Então vejo "O mês final deve ser igual ou posterior ao mês inicial."

  # --- RF-04 / D3 / RN-05 --------------------------------------------------------------
  Cenário: Alterar só um mês
    Dado que "Streaming" vale R$ 40,00 por mês
    Quando eu edito a cobrança de outubro, escolho "Só este mês" e mudo o valor para "55"
    Então o diálogo não tem categoria nem "Até (mês)"
    E outubro mostra R$ 55,00
    E novembro continua R$ 40,00

  Cenário: Cobrança prevista não tem ações
    Dado que novembro mostra "Streaming" prevista de R$ 40,00
    Então a cobrança prevista não tem editar nem excluir
    E, quando novembro chegar, a cobrança gravada pode ser editada com o escopo

  # --- RN-06 / D3 ----------------------------------------------------------------------
  Cenário: Reajuste daqui em diante
    Dado que "Streaming" vale R$ 40,00 desde agosto de 2026
    Quando eu edito a cobrança de outubro, escolho "Este e os próximos" e mudo o valor para "55"
    Então agosto e setembro continuam com R$ 40,00
    E outubro e os meses seguintes têm R$ 55,00

  Cenário: Editar a categoria daqui em diante
    Quando eu edito com "Este e os próximos" e escolho a categoria "Lazer"
    Então as cobranças dali em diante ficam em "Lazer", e as anteriores continuam como estavam

  # --- RF-05 / RN-07 -------------------------------------------------------------------
  Cenário: Pular um mês
    Quando eu excluo a cobrança de outubro com "Só este mês" e confirmo
    Então outubro não tem "Streaming" e o usado diminui R$ 40,00
    E novembro continua com a cobrança prevista

  # --- RN-08 ---------------------------------------------------------------------------
  Cenário: Encerrar uma assinatura
    Dado que "Streaming" começou em agosto de 2026
    Quando eu excluo a cobrança de outubro com "Este e os próximos" e confirmo
    Então agosto e setembro continuam com "Streaming"
    E outubro e os meses seguintes não têm

  Cenário: Excluir a recorrência desde o início
    Quando eu excluo a cobrança do mês inicial com "Este e os próximos"
    Então todas as cobranças, gravadas e previstas, somem

  # --- RN-09 / D6 ----------------------------------------------------------------------
  Cenário: Cobrança não se altera sozinha
    Quando eu tento alterar ou excluir uma cobrança como compra comum
    Então vejo "Esta compra é recorrente. Altere a compra recorrente."

  # --- RF-07 ---------------------------------------------------------------------------
  Cenário: Próximos meses no histórico
    Dado que "Streaming" é recorrente sem fim
    Quando eu abro o Histórico
    Então "Próximos meses" mostra cada mês até outubro de 2027 com a cobrança
    E tocar num mês abre esse mês

  # --- RN-10 / RN-11 --------------------------------------------------------------------
  Cenário: Excluir um cartão ou uma categoria
    Quando eu excluo o cartão "Inter"
    Então as recorrências dele somem, e as dos outros cartões continuam
    Quando eu excluo uma categoria usada por uma recorrência
    Então a recorrência e as cobranças dela ficam sem categoria

  # --- RN-13 ---------------------------------------------------------------------------
  Cenário: Migração de dados antigos
    Dado que o aparelho tem dados salvos na versão 8
    Quando eu abro o app
    Então cartões, compras, parcelas, categorias, entradas, benefícios, contas e gastos continuam como estavam
```

### 5.1 Matriz de rastreabilidade

| Requisito | Cenário(s) |
| --------- | ---------- |
| RF-01 | Registrar uma assinatura; Recorrente e parcelada não ficam juntas |
| RF-02, RF-08 | Registrar uma assinatura |
| RF-03 | Registrar uma assinatura; Cobranças previstas nos meses seguintes |
| RF-04 | Alterar só um mês; Reajuste daqui em diante; Editar a categoria daqui em diante |
| RF-05 | Pular um mês; Encerrar uma assinatura |
| RF-06 | Cobranças previstas nos meses seguintes |
| RF-07 | Próximos meses no histórico |
| RN-01 | Registrar uma assinatura; Mês final; Cobrança no dia 31 |
| RN-02 | Assinatura que já existia; A cobrança entra quando o mês começa |
| RN-03 | Cobranças previstas nos meses seguintes |
| RN-04 | Validação |
| RN-05 | Alterar só um mês; Cobrança prevista não tem ações |
| RN-06 | Reajuste daqui em diante; Editar a categoria daqui em diante |
| RN-07 | Pular um mês |
| RN-08 | Encerrar uma assinatura; Excluir a recorrência desde o início |
| RN-09 | Cobrança não se altera sozinha |
| RN-10, RN-11 | Excluir um cartão ou uma categoria |
| RN-12 | Cobranças previstas nos meses seguintes |
| RN-13 | Migração de dados antigos |
| D1 | Registrar uma assinatura; A cobrança entra quando o mês começa |
| D2 | Registrar uma assinatura; Recorrente e parcelada não ficam juntas |
| D3 | Alterar só um mês; Reajuste daqui em diante; Pular um mês; Encerrar uma assinatura |
| D4 | Cobranças previstas nos meses seguintes |
| D5 | Assinatura que já existia; Validação |
| D6 | Cobrança não se altera sozinha |
| D7 | Alterar só um mês |

## 6. Modelo de dados e migração

O estado salvo passa de `version: 8` para `version: 9`:

```ts
// A monthly charge on a card. The charges up to the current month are recorded
// as purchases (recurringId); later ones are planned, never stored.
type StoredRecurring = {
  id: number; cardId: number; categoryId: number | null;
  description: string; amount: number;
  firstMonth: MonthKey; day: number; lastMonth: MonthKey | null; // null = sem fim
};

// Adjusts or skips a single planned month (RN-05, RN-07).
type StoredRecurringException = {
  recurringId: number; month: MonthKey; skip: boolean;
  description?: string; amount?: number; day?: number;
};

type StoredMovement = { /* campos da v8 */ recurringId?: number };

type State = { /* campos da v8 */ version: 9; recurrings: StoredRecurring[]; recurringExceptions: StoredRecurringException[] };
```

**Migração v8 → v9 (RN-13):** `{ ...old, version: 9, recurrings: [], recurringExceptions: [] }`. Mais uma etapa na cadeia, no estilo de `migrateV7`.

## 7. Contrato da camada de dados

Em `src/data/store.ts`:

| Função | Efeito |
| ------ | ------ |
| `createRecurring(cardId, categoryId, input)` | Cria a recorrência e grava as cobranças devidas (RN-01, RN-02, RN-04). `input`: `description`, `amount`, `date`, `lastMonth?`. |
| `updateRecurring(recurringId, month, scope, categoryId, input)` | `scope`: `'month'` ou `'forward'` (RN-05, RN-06). |
| `deleteRecurring(recurringId, month, scope)` | RN-07 e RN-08. |
| `startMonth(cardId, month)` | Passa a gravar também as cobranças devidas (RN-02). |
| `getMonthPreview`, `getFutureInstallments`, `getLastFutureMonth` | Passam a incluir as cobranças previstas (RN-03, RN-12). Cada previsão traz `kind: 'installment' \| 'recurring'`. |
| `updateMovement`, `deleteMovement` | Falham para compras com `recurringId` (RN-09). |
| `deleteCard`, `deleteCategory`, `getCategories` | RN-10 e RN-11. |
| `getMovements(cardId, month)` | Cada compra traz `recurring` (dados da recorrência) quando tem `recurringId`. |

Em `src/data/api.ts`: `useCreateRecurring`, `useUpdateRecurring`, `useDeleteRecurring`, com as invalidações dos hooks de compras (cartões, compras, resumo por categoria, histórico, parcelas e categorias).

## 8. Interface

- **Diálogo de compra** (`dashboard.tsx`): ao lado do interruptor "Compra parcelada", o interruptor **"Compra recorrente"** com os campos e a prévia do RF-01 e do RF-02.
- **Lista de compras:** selo "Mensal" nas cobranças; nas previstas, "Mensal" e "prevista". Editar e excluir de uma cobrança gravada abrem a pergunta de escopo (mesmo estilo do `ScopeDialog` de Entradas, extraído para um componente compartilhado).
- **Mês futuro e Histórico:** as cobranças previstas entram como as parcelas previstas, com o selo "Mensal".
- **Reuso:** `Dialog` e `splitPreview` de `dashboard.tsx`; `ScopeDialog` de `entradas.tsx` (extraído para `src/components/scope-dialog.tsx`); o padrão de gravação do parcelamento (`syncPurchases`, `placeInstallment`, `plannedOf`) e o de escopo das entradas (`updateIncome`, `deleteIncome`).

## 9. Fora de escopo

- Pausar uma recorrência por alguns meses sem excluir (dá para pular um mês de cada vez).
- Frequências diferentes de mensal (semanal, anual).
- Reajuste automático (inflação) e lembretes de cobrança.
- Recorrência parcelada, ou seja, uma compra que é recorrente e parcelada ao mesmo tempo.
- Editar uma cobrança prevista antes de ela ser gravada (a previsão não tem ações; edita-se quando o mês chegar, ou com o escopo "Este e os próximos" a partir de uma cobrança gravada).

## 10. Critérios de aceite

- [ ] RF-01 a RF-08 funcionam como descritos. *Verificados no navegador: RF-01 (interruptor, título "Nova compra recorrente", "Valor mensal", "Até (mês)" e a exclusão mútua com a parcelada), RF-02 (prévia), RF-03 (selo "Mensal" nas gravadas e "Mensal" + "prevista", sem ações, nas previstas), RF-04 ("Só este mês" sem categoria nem "Até", com o aviso), RF-06 (meses futuros até 12 meses à frente), RF-07 (Histórico com 12 meses) e RF-08 (criar). Pendentes de conferência manual pela interface: salvar a edição e a exclusão (RF-04 e RF-05; cobertos no `store.ts`).*
- [ ] Todos os cenários da seção 5 passam no navegador (`npm run dev`). *Conferidos no navegador: registrar uma assinatura, recorrente e parcelada não ficam juntas, cobranças previstas nos meses seguintes, próximos meses no histórico e o diálogo de edição só neste mês. Os demais foram conferidos só na camada de dados.*
- [x] RN-01 a RN-12 exercitadas em `src/data/store.ts`, incluindo dia 31, assinatura que já existia, escopo "daqui em diante", pular mês sem regravar, o limite de 12 meses e exclusão de cartão e de categoria.
- [x] Dados `version: 8` abrem sem perda e passam a `version: 9` (RN-13).
- [x] Compras comuns, parceladas, contas, entradas e benefícios continuam como estavam.
- [x] `npm run typecheck` e `npm run build` passam.
- [x] `FUNCIONALIDADES.md` e `README.md` atualizados.

## 11. Tarefas

1. `store.ts`: tipos, `State` v9, `emptyState`, `migrateV8` e encadeamento na leitura.
2. `store.ts`: ocorrência, exceção e previsão da recorrência (RN-01, RN-03), integradas a `plannedOf`, `getMonthPreview`, `getFutureInstallments` e `getLastFutureMonth` (RN-12).
3. `store.ts`: gravação das cobranças (RN-02) em `createRecurring`, `updateRecurring` e `startMonth`.
4. `store.ts`: `updateRecurring` e `deleteRecurring` com os dois escopos (RN-05 a RN-08), e o bloqueio de `updateMovement`/`deleteMovement` (RN-09).
5. `store.ts`: `deleteCard`, `deleteCategory` e `getCategories` (RN-10, RN-11).
6. `api.ts`: hooks e invalidações.
7. `scope-dialog.tsx` (extraído de `entradas.tsx`) e `dashboard.tsx`: interruptor, campos, prévia, selos e a pergunta de escopo.
8. Atualizar `FUNCIONALIDADES.md` (seção nova) e `README.md` (versão 9, regras de gravação, estrutura de pastas).
9. Rodar o roteiro de verificação; mudar o Status para `Implementada` e marcar só o que foi verificado.

## 12. Roteiro de verificação

1. `npm run typecheck` e `npm run build`.
2. Script de teste de `store.ts` (esbuild com `localStorage` simulado): gravação e previsão, dia 31 e virada de ano, assinatura que já existia, "só este mês" e "daqui em diante" na edição e na exclusão, bloqueio de `updateMovement`/`deleteMovement`, usado dos meses futuros, exclusão de cartão e de categoria, e a migração v8 → v9.
3. `npm run dev` e percorrer os cenários da seção 5.
4. No console do navegador, gravar um JSON `version: 8` em `controle-cartao:v1`, recarregar e conferir a migração.
5. Conferir que Cartões, Histórico, Entradas e Benefícios continuam iguais.
