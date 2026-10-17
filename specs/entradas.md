# Spec — Entradas

| Campo | Valor |
| ----- | ----- |
| Status | Implementada |
| Criada em | 17/10/2026 |
| Escopo | `src/data/store.ts`, `src/data/api.ts`, `src/App.tsx`, `src/pages/entradas.tsx` (novo), `src/pages/dashboard.tsx`, `src/pages/historico.tsx`, `src/index.css`, `FUNCIONALIDADES.md`, `README.md` |
| Depende de | [`historico-mensal.md`](historico-mensal.md) (conceito de mês e rotas) |
| Substituída em parte por | [`contas-e-gastos.md`](contas-e-gastos.md): a decisão D3 (entradas fora de qualquer cálculo) e a RN-09 (intervalo de navegação). A tela passa a ter também contas fixas, gastos do dia a dia e o saldo do mês, e as entradas continuam sem alterar os cartões. |

> Esta spec é a fonte da verdade da funcionalidade. A implementação segue a seção [Tarefas](#11-tarefas) e só termina quando todos os [Critérios de aceite](#10-critérios-de-aceite) forem atendidos. Mudanças de comportamento entram primeiro aqui e só depois no código.

---

## 1. Contexto e objetivo

Hoje o app só controla **gastos** no cartão. A pessoa não tem onde registrar o dinheiro que **entra** (salário, pró-labore, bônus) nem ver quanto entra em cada mês.

**Objetivo:**

1. Registrar **entradas** de dinheiro, num lugar **separado dos cartões** (aba própria).
2. Ver, por mês, a lista de entradas e o total.
3. Registrar uma entrada que **se repete todo mês** (ex.: salário) uma única vez.
4. Alterar ou apagar uma entrada recorrente só num mês ou daquele mês em diante.

## 2. Glossário

| Termo | Definição |
| ----- | --------- |
| **Entrada** | Dinheiro que a pessoa recebe: tipo, descrição, valor, mês e dia. Não pertence a cartão. |
| **Tipo** | Salário, Pró-labore, Bônus ou Outro. |
| **Entrada recorrente** | Entrada com repetição mensal: vale do mês inicial até o mês final (ou sem fim). |
| **Ocorrência** | A entrada vista num mês específico. Uma entrada avulsa tem 1 ocorrência. |
| **Exceção** | Ajuste de uma ocorrência só: pular o mês ou mudar valor, descrição ou dia daquele mês. |
| **Total do mês** | Soma dos valores das ocorrências do mês. |

Os termos de mês seguem [`historico-mensal.md`](historico-mensal.md#2-glossário).

## 3. Decisões de produto

| # | Decisão | Motivo |
| - | ------- | ------ |
| D1 | **Entradas são globais**, sem cartão. | Escolha do usuário. Salário não pertence a um cartão. |
| D2 | **Aba própria** "Entradas", antes de "Cartões" na barra de abas. Nenhuma tela de cartões mostra entradas. | Escolha do usuário. São conceitos separados. |
| D3 | **Nesta versão, entradas não entram em nenhum cálculo dos cartões** (limite, comprometido, disponível). | Mantém o escopo pequeno; cruzar os dois fica para uma spec futura. |
| D4 | **Tipos fixos:** Salário, Pró-labore, Bônus, Outro. A descrição é opcional. | Cobre os casos pedidos sem cadastro de tipos. |
| D5 | **Recorrência mensal** com mês final opcional. Sem mês final, repete sem fim. | Escolha do usuário. |
| D6 | **Ocorrências não são gravadas.** São calculadas da regra a cada leitura, inclusive de meses passados. | Como as parcelas previstas do parcelamento: um só registro, sem duplicar dados. |
| D7 | **Editar ou excluir uma recorrente pergunta o escopo:** "Só este mês" ou "Este e os próximos". | Evita mudar o passado sem querer (ex.: aumento de salário vale daqui em diante). |
| D8 | **"Este e os próximos" divide a entrada:** a original termina no mês anterior e, na edição, nasce uma nova a partir do mês escolhido. | Preserva os meses passados como estavam. |
| D9 | **Navegação de mês:** passado sem limite (até o mês da primeira entrada); futuro até 12 meses à frente do mês corrente. | Recorrente sem fim gera meses sem limite; é preciso um teto. |
| D10 | **Dia da entrada:** se o mês não tem o dia, vale o último dia do mês. | Mesma regra do parcelamento (RN-02). |
| D11 | **Migração v4 → v5 automática:** acrescenta `incomes: []` e `incomeExceptions: []`. | Ninguém perde dados. |

## 4. Requisitos

### 4.1 Requisitos funcionais (RF)

| ID | Requisito |
| -- | --------- |
| RF-01 | O app tem uma **barra de abas** "Entradas" e "Cartões" (nessa ordem) no topo das telas de cartões (painel e histórico) e da tela de entradas. |
| RF-02 | A tela **Entradas** (`#/entradas`) mostra o mês corrente, com navegação de mês (anterior/próximo), o **total do mês** e a lista de ocorrências ordenada por dia. |
| RF-03 | Cada linha mostra o tipo, a descrição (se houver), o dia e o valor. Ocorrências de entrada recorrente mostram o selo "Mensal". |
| RF-04 | O botão **"Nova entrada"** abre o diálogo com tipo, descrição (opcional), valor, data e o interruptor **"Repetir todo mês"**. Ligado, mostra o campo opcional "Até (mês)". |
| RF-05 | **Editar** uma entrada avulsa abre o diálogo preenchido e salva a mudança. |
| RF-06 | **Editar** uma ocorrência recorrente pergunta o escopo (D7) e então abre o diálogo preenchido com os valores daquele mês. |
| RF-07 | **Excluir** uma entrada avulsa pede confirmação e a remove. |
| RF-08 | **Excluir** uma ocorrência recorrente pergunta o escopo (D7), depois confirma. |
| RF-09 | Mês sem ocorrências mostra "Nenhuma entrada neste mês." e total R$ 0,00. |

### 4.2 Regras de negócio (RN)

| ID | Regra |
| -- | ----- |
| RN-01 | **Ocorrência (D6):** uma entrada avulsa ocorre só no `mêsInicial`. Uma recorrente ocorre em todo mês de `mêsInicial` até `mêsFinal` (inclusive), ou sem fim se não houver `mêsFinal`. A data da ocorrência é o `dia` no mês, ajustado pela D10. |
| RN-02 | **Exceção (D7):** uma exceção de um mês, se existir, substitui valor, descrição e dia daquela ocorrência, ou a remove (pular). Só existe para entrada recorrente e para meses dentro do intervalo da RN-01. |
| RN-03 | **Total do mês:** soma das ocorrências do mês após aplicar as exceções. Valores em centavos, sem arredondamento. |
| RN-04 | **Validação:** valor > 0 ("Valor deve ser maior que zero."); tipo obrigatório; descrição até 200 caracteres; data válida; "Até (mês)" não pode ser anterior ao mês da data ("O mês final deve ser igual ou posterior ao mês inicial."). |
| RN-05 | **Editar "só este mês":** grava (ou atualiza) a exceção do mês com os valores informados. O tipo e a repetição não mudam. |
| RN-06 | **Editar "este e os próximos" (D8):** se o mês é o mês inicial, a entrada é atualizada no lugar (incluindo tipo, repetição e mês final). Senão, a original passa a terminar no mês anterior, e é criada uma nova entrada com os valores informados, a partir do mês editado. As exceções da original de meses ≥ o mês editado são apagadas nos dois casos. |
| RN-07 | **Excluir "só este mês":** grava exceção "pular" no mês. |
| RN-08 | **Excluir "este e os próximos":** se o mês é o mês inicial, a entrada e suas exceções são removidas. Senão, a entrada passa a terminar no mês anterior, e as exceções de meses ≥ o mês excluído são apagadas. |
| RN-09 | **Navegação (D9):** meses fora do intervalo [mês da entrada mais antiga, mês corrente + 12] redirecionam para `#/entradas`. Sem nenhuma entrada, só o mês corrente abre. |
| RN-10 | **Isolamento (D3):** nenhum valor de cartão, mês ou categoria muda por causa de entradas. Remover um cartão não afeta entradas. |
| RN-11 | A **migração** v4 → v5 é automática, acontece uma vez e não perde dados (D11). |

## 5. Cenários (BDD)

Os cenários usam a data de hoje como **17/10/2026**.

```gherkin
# language: pt

Funcionalidade: Entradas
  Como pessoa que recebe salário, pró-labore e bônus
  Quero registrar minhas entradas separadas dos cartões
  Para saber quanto entra em cada mês

  # --- RF-01 / RF-02 / D2 -------------------------------------------------------
  Cenário: Abrir a aba de entradas
    Dado que estou no painel de um cartão
    Quando eu toco na aba "Entradas"
    Então vejo a tela de entradas de outubro de 2026
    E o painel do cartão não mostra nenhuma entrada

  # --- RF-09 -------------------------------------------------------------------
  Cenário: Mês sem entradas
    Dado que não há entradas
    Quando eu abro a aba "Entradas"
    Então vejo "Nenhuma entrada neste mês." e o total R$ 0,00

  # --- RF-04 / RF-03 / RN-01 / RN-03 ---------------------------------------------
  Cenário: Registrar uma entrada avulsa
    Quando eu toco em "Nova entrada"
    E escolho o tipo "Bônus", o valor "1500" e a data 20/10/2026
    E toco em "Adicionar"
    Então a lista de outubro de 2026 tem "Bônus" no dia 20 com R$ 1.500,00
    E o total do mês é R$ 1.500,00
    E novembro de 2026 não tem essa entrada

  # --- RF-04 / D5 / RN-01 ------------------------------------------------------
  Cenário: Registrar um salário que se repete todo mês
    Quando eu toco em "Nova entrada"
    E escolho o tipo "Salário", o valor "5000", a data 05/10/2026
    E ligo "Repetir todo mês"
    E toco em "Adicionar"
    Então outubro, novembro e dezembro de 2026 têm "Salário" de R$ 5.000,00 com o selo "Mensal"
    E setembro de 2026 não tem essa entrada

  # --- D5 / RN-01 / RN-04 ------------------------------------------------------
  Cenário: Repetição com mês final
    Dado que registro "Pró-labore" de R$ 3.000,00 em 10/10/2026 repetindo até dezembro de 2026
    Então outubro, novembro e dezembro de 2026 têm a entrada
    E janeiro de 2027 não tem

  Cenário: Mês final antes do mês inicial
    Quando eu registro uma entrada em 10/10/2026 repetindo até setembro de 2026
    Então vejo "O mês final deve ser igual ou posterior ao mês inicial."

  # --- D10 / RN-01 -------------------------------------------------------------
  Cenário: Entrada no dia 31 em mês mais curto
    Dado que registro "Salário" de R$ 5.000,00 em 31/10/2026 repetindo todo mês
    Então em novembro de 2026 a data é 30/11
    E em fevereiro de 2027 a data é 28/02

  # --- RN-04 -------------------------------------------------------------------
  Cenário: Valor inválido
    Quando eu registro uma entrada com valor "0"
    Então vejo "Valor deve ser maior que zero."

  # --- RF-05 -------------------------------------------------------------------
  Cenário: Editar uma entrada avulsa
    Dado que existe o "Bônus" avulso de R$ 1.500,00
    Quando eu edito o valor para "1800" e salvo
    Então o bônus mostra R$ 1.800,00 e o total do mês muda

  # --- RF-06 / D7 / RN-05 ------------------------------------------------------
  Cenário: Editar só um mês de uma entrada recorrente
    Dado que o "Salário" de R$ 5.000,00 se repete desde outubro de 2026
    Quando eu edito a ocorrência de novembro, escolho "Só este mês" e mudo o valor para "5500"
    Então novembro mostra R$ 5.500,00
    E outubro e dezembro continuam com R$ 5.000,00

  # --- D8 / RN-06 --------------------------------------------------------------
  Cenário: Reajuste de salário daqui em diante
    Dado que o "Salário" de R$ 5.000,00 se repete desde outubro de 2026
    Quando eu edito a ocorrência de dezembro, escolho "Este e os próximos" e mudo o valor para "5800"
    Então outubro e novembro continuam com R$ 5.000,00
    E dezembro e os meses seguintes mostram R$ 5.800,00

  Cenário: Editar o mês inicial com "Este e os próximos"
    Dado que o "Salário" se repete desde outubro de 2026
    Quando eu edito a ocorrência de outubro, escolho "Este e os próximos" e mudo o tipo para "Pró-labore"
    Então todos os meses, a partir de outubro, mostram "Pró-labore"

  # --- RF-07 -------------------------------------------------------------------
  Cenário: Excluir uma entrada avulsa
    Dado que existe o "Bônus" avulso de R$ 1.500,00
    Quando eu excluo e confirmo
    Então a entrada some da lista e o total do mês diminui

  # --- RF-08 / D7 / RN-07 ------------------------------------------------------
  Cenário: Pular um mês de uma entrada recorrente
    Dado que o "Salário" se repete desde outubro de 2026
    Quando eu excluo a ocorrência de novembro, escolho "Só este mês" e confirmo
    Então novembro não tem o salário
    E outubro e dezembro continuam com ele

  # --- RN-08 -------------------------------------------------------------------
  Cenário: Encerrar uma entrada recorrente
    Dado que o "Salário" se repete desde outubro de 2026
    Quando eu excluo a ocorrência de dezembro, escolho "Este e os próximos" e confirmo
    Então outubro e novembro continuam com o salário
    E dezembro e os meses seguintes não têm

  Cenário: Excluir a entrada recorrente desde o início
    Dado que o "Salário" se repete desde outubro de 2026
    Quando eu excluo a ocorrência de outubro, escolho "Este e os próximos" e confirmo
    Então nenhum mês tem o salário

  # --- RN-09 / D9 --------------------------------------------------------------
  Cenário: Limite de navegação
    Quando eu abro "#/entradas/mes/2028-10"
    Então o app volta para "#/entradas"

  # --- RN-10 / D3 --------------------------------------------------------------
  Cenário: Entradas não mexem nos cartões
    Dado que o cartão "Nubank" tem R$ 800,00 usados em outubro de 2026
    Quando eu registro um salário de R$ 5.000,00
    Então o usado e o disponível do "Nubank" continuam iguais

  # --- RN-11 -------------------------------------------------------------------
  Cenário: Migração de dados antigos
    Dado que o aparelho tem dados salvos na versão 4
    Quando eu abro o app
    Então todos os cartões, categorias, lançamentos e compras continuam como estavam
    E a aba "Entradas" abre vazia
```

### 5.1 Matriz de rastreabilidade

| Requisito | Cenário(s) |
| --------- | ---------- |
| RF-01, RF-02, D2 | Abrir a aba de entradas |
| RF-03 | Registrar um salário que se repete todo mês |
| RF-04 | Registrar uma entrada avulsa; Registrar um salário que se repete todo mês |
| RF-05 | Editar uma entrada avulsa |
| RF-06 | Editar só um mês de uma entrada recorrente; Reajuste de salário daqui em diante |
| RF-07 | Excluir uma entrada avulsa |
| RF-08 | Pular um mês de uma entrada recorrente; Encerrar uma entrada recorrente |
| RF-09 | Mês sem entradas |
| RN-01 | Registrar uma entrada avulsa; Registrar um salário que se repete todo mês; Repetição com mês final; Entrada no dia 31 em mês mais curto |
| RN-02 | Editar só um mês de uma entrada recorrente; Pular um mês de uma entrada recorrente |
| RN-03 | Registrar uma entrada avulsa; Editar uma entrada avulsa |
| RN-04 | Valor inválido; Mês final antes do mês inicial |
| RN-05 | Editar só um mês de uma entrada recorrente |
| RN-06 | Reajuste de salário daqui em diante; Editar o mês inicial com "Este e os próximos" |
| RN-07 | Pular um mês de uma entrada recorrente |
| RN-08 | Encerrar uma entrada recorrente; Excluir a entrada recorrente desde o início |
| RN-09 | Limite de navegação |
| RN-10 | Entradas não mexem nos cartões |
| RN-11 | Migração de dados antigos |

## 6. Modelo de dados e migração

O estado salvo passa de `version: 4` para `version: 5`:

```ts
type IncomeKind = 'salario' | 'prolabore' | 'bonus' | 'outro';

type StoredIncome = {
  id: number;
  kind: IncomeKind;
  description: string;      // pode ser vazia
  amount: number;
  firstMonth: MonthKey;
  day: number;              // 1..31, ajustado ao mês (D10)
  recurring: boolean;
  lastMonth: MonthKey | null; // só se recurring; null = sem fim
};

// Ajuste de uma ocorrência (RN-02). skip=true remove a ocorrência.
type StoredIncomeException = {
  incomeId: number;
  month: MonthKey;
  skip: boolean;
  amount?: number;
  description?: string;
  day?: number;
};

type State = { /* ...campos da v4... */ version: 5; incomes: StoredIncome[]; incomeExceptions: StoredIncomeException[] };
```

**Migração v4 → v5 (RN-11):** `{ ...old, version: 5, incomes: [], incomeExceptions: [] }`. Mais uma etapa na cadeia v1 → v2 → v3 → v4 → v5, no mesmo estilo de `migrateV3`.

## 7. Contrato da camada de dados

Em `src/data/store.ts`:

| Função | Efeito |
| ------ | ------ |
| `getIncomes(month)` | Devolve `{ month, totalAmount, items }`, com `items` ordenados por dia. Cada item: `incomeId`, `kind`, `description`, `amount`, `date`, `recurring`. Aplica RN-01 e RN-02. |
| `getIncomeRange()` | Devolve `{ first: MonthKey, last: MonthKey }` para a navegação (RN-09). |
| `createIncome(input)` | Cria a entrada (RN-04). |
| `updateIncome(incomeId, month, scope, input)` | `scope`: `'month'` ou `'forward'`. RN-05 e RN-06. |
| `deleteIncome(incomeId, month, scope)` | `scope`: `'month'` ou `'forward'`. RN-07 e RN-08. |

Em `src/data/api.ts`: `useGetIncomes`, `useGetIncomeRange`, `useCreateIncome`, `useUpdateIncome`, `useDeleteIncome`, com as respectivas query keys. As mutações invalidam as consultas de entradas, e só elas.

## 8. Interface

- **Barra de abas** (RF-01): dois botões "Cartões" e "Entradas" abaixo do cabeçalho; a aba ativa fica destacada. "Cartões" leva a `#/`, "Entradas" a `#/entradas`.
- **Tela Entradas** (`src/pages/entradas.tsx`): navegação de mês igual à do painel, cartão de total do mês, lista de ocorrências e o botão "Nova entrada".
- **Rotas:** `#/entradas` (mês corrente) e `#/entradas/mes/AAAA-MM`. Mês inválido ou fora do intervalo da RN-09 volta para `#/entradas`.
- **Diálogo de entrada:** tipo (seletor), descrição, valor, data, interruptor "Repetir todo mês" e "Até (mês)". Na edição de recorrente, antes do diálogo, uma pergunta com "Só este mês" e "Este e os próximos".
- **Reuso:** o estilo dos diálogos, da navegação de mês e dos cartões vem do `dashboard.tsx` e do `index.css`; os helpers de mês, de `src/lib/format.ts`.

## 9. Fora de escopo

- Cruzar entradas com limite, comprometido ou disponível dos cartões (D3).
- Categorias de entrada personalizadas e metas.
- Entradas em outras moedas; frequências diferentes de mensal (semanal, anual).
- Marcar uma entrada como "recebida" ou "prevista".
- Gráficos e totais anuais.

## 10. Critérios de aceite

- [ ] RF-01 a RF-09 funcionam como descritos. *Verificados no navegador: RF-01, RF-02, RF-03 (selo "Mensal"), RF-04 (entrada recorrente), RF-06 (pergunta de escopo e edição "Este e os próximos") e RF-09. Pendentes de conferência manual: RF-05, RF-07 e RF-08 pela interface (a lógica foi exercitada no `store.ts`).*
- [ ] Todos os cenários da seção 5 passam no navegador (`npm run dev`). *Passaram no navegador: abrir a aba, mês sem entradas, salário recorrente, reajuste daqui em diante, limite de navegação e cartões sem entradas. Os demais foram conferidos só na camada de dados.*
- [x] RN-01 a RN-10 exercitadas em `src/data/store.ts`, incluindo dia 31 e virada de ano.
- [x] Dados `version: 4` abrem sem perda e passam a `version: 5` (RN-11).
- [ ] Painel e Histórico dos cartões não mudam de comportamento (RN-10). *A aba Cartões abre sem entradas e nenhum cálculo de cartão foi alterado, mas o painel e o Histórico não foram percorridos de ponta a ponta.*
- [x] `npm run typecheck` e `npm run build` passam.
- [x] `FUNCIONALIDADES.md` e `README.md` atualizados.

## 11. Tarefas

1. `store.ts`: tipos, `State` v5, `emptyState`, `migrateV4` e encadeamento na leitura.
2. `store.ts`: expansão de ocorrências (RN-01, RN-02, D10), `getIncomes`, `getIncomeRange`.
3. `store.ts`: `createIncome`, `updateIncome`, `deleteIncome` com validações (RN-04 a RN-08).
4. `api.ts`: hooks e query keys das entradas.
5. `App.tsx`: rotas `#/entradas` e `#/entradas/mes/:month`, com o redirecionamento da RN-09.
6. `entradas.tsx` e `index.css`: tela, lista, diálogos e pergunta de escopo.
7. Barra de abas em `dashboard.tsx`, `historico.tsx` e `entradas.tsx`.
8. Atualizar `FUNCIONALIDADES.md` (seção e sumário) e `README.md` (versão 5, estrutura, migração).
9. Rodar o roteiro de verificação; mudar o Status para `Implementada` e marcar só o que foi verificado.

## 12. Roteiro de verificação

1. `npm run typecheck` e `npm run build`.
2. `npm run dev` e percorrer, na ordem, os cenários da seção 5.
3. No console do navegador, gravar um JSON `version: 4` em `controle-cartao:v1`, recarregar e conferir a migração e a preservação dos dados.
4. Conferir que o painel do cartão e o Histórico exibem os mesmos valores de antes de criar entradas.
