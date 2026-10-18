# Spec — Cartão sem limite (fatura do mês)

| Campo | Valor |
| ----- | ----- |
| Status | Implementada |
| Criada em | 18/10/2026 |
| Escopo | `src/data/store.ts`, `src/data/api.ts`, `src/components/card-carousel.tsx`, `src/pages/dashboard.tsx`, `src/pages/historico.tsx`, `src/pages/entradas.tsx`, `FUNCIONALIDADES.md`, `README.md`, `specs/historico-mensal.md`, `specs/multiplos-cartoes.md`, `specs/compras-e-categorias.md` |
| Depende de | [`compras-e-categorias.md`](compras-e-categorias.md) (compras no cartão), [`multiplos-cartoes.md`](multiplos-cartoes.md), [`historico-mensal.md`](historico-mensal.md) |
| Substitui em parte | Tudo o que trata de **limite**, **disponível** e **percentual usado** nessas três specs, e a faixa "Todos os cartões" e o painel "O mês em perspectiva". O resto continua valendo. |

> Esta spec é a fonte da verdade da funcionalidade. A implementação segue a seção [Tarefas](#11-tarefas) e só termina quando todos os [Critérios de aceite](#10-critérios-de-aceite) forem atendidos. Mudanças de comportamento entram primeiro aqui e só depois no código.

---

## 1. Contexto e objetivo

A aba Cartões foi pensada para controlar o **limite**: o cartão mostra o disponível, a barra de limite utilizado, o painel "O mês em perspectiva" e a faixa "Todos os cartões" repetem usado, disponível e limite. O uso real é outro: **lançar as compras e ver quanto elas deram no mês**, ou seja, o total da fatura.

**Objetivo:**

1. Tirar o **limite** do cartão: o cartão tem só nome e cor.
2. Mostrar, para cada cartão e mês, o **total da fatura** e a quantidade de compras.
3. Tirar da aba Cartões a faixa **"Todos os cartões"** e o painel **"O mês em perspectiva"**.
4. Manter o resto: carrossel, lista de compras, filtro e resumo por categoria, compras parceladas e recorrentes, meses futuros, Histórico e o saldo da aba Entradas.

## 2. Glossário

| Termo | Definição |
| ----- | --------- |
| **Fatura do mês** | A soma das compras de um cartão com data naquele mês (compras comuns, parcelas e cobranças recorrentes gravadas). Num mês futuro, soma também as parcelas e as cobranças previstas. É o antigo "usado". |
| **Total das faturas** | A soma das faturas de todos os cartões num mês. É o valor "Cartões" do resumo da aba Entradas. |
| **Mês do calendário** | O mês da data da compra. A fatura não usa dia de fechamento. |

Os termos de compra, parcela e mês futuro seguem [`compras-e-categorias.md`](compras-e-categorias.md#2-glossário), [`parcelamento.md`](parcelamento.md#2-glossário) e [`compra-recorrente.md`](compra-recorrente.md#2-glossário).

## 3. Decisões de produto

| # | Decisão | Motivo |
| - | ------- | ------ |
| D1 | **O cartão não tem limite.** O cadastro e a edição pedem só nome e cor. | Escolha do usuário: só lançar as compras e ver o total da fatura. |
| D2 | **O limite sai de vez dos dados.** A migração v9 → v10 apaga o limite do cartão e dos meses. O valor não se recupera depois. | Escolha do usuário. Evita um dado morto no aparelho. |
| D3 | **A face do cartão mostra a fatura do mês e a quantidade de compras**, sem disponível, sem barra e sem "limite utilizado". | O que a pessoa quer ver. |
| D4 | **A aba Cartões não tem mais a faixa "Todos os cartões" nem o painel "O mês em perspectiva".** O carrossel ocupa a largura toda. | Escolha do usuário. Os dois só repetiam usado, disponível e limite. |
| D5 | **O Histórico mostra, por mês, a fatura e a quantidade de compras.** Com 2 cartões ou mais, a linha "Todos os cartões" vira o total das faturas do mês. | Escolha do usuário. Mantém a visão por mês sem o limite. |
| D6 | **A fatura é do mês do calendário**, sem dia de fechamento. | Mantém o modelo atual de mês. Dia de fechamento pode virar uma spec futura. |
| D7 | **Os meses do cartão continuam existindo** (o mês começa sozinho, e o Histórico lista os meses que começaram), só que sem limite. | A virada de mês, as parcelas gravadas e o Histórico dependem deles. |
| D8 | **A aba Entradas não muda:** "Cartões" continua sendo o total das faturas do mês, e o saldo continua igual. | Só muda o nome interno. |
| D9 | **Sem aviso nem bloqueio por valor.** Não existe mais "acima do limite". | Consequência do D1. |

## 4. Requisitos

### 4.1 Requisitos funcionais (RF)

| ID | Requisito |
| -- | --------- |
| RF-01 | O formulário do cartão ("Seu cartão" e "Ajustar cartão") tem **nome e cor**, sem o campo de limite. |
| RF-02 | A **face do cartão** no carrossel mostra o nome, a cor, a **fatura do mês** (valor e o rótulo "Fatura de ‹mês›"; em mês futuro, "Fatura prevista de ‹mês›") e a quantidade de compras ("1 compra", "n compras"). Sem compras, mostra "Nenhuma compra neste mês.". |
| RF-03 | A aba Cartões **não mostra** a faixa "Todos os cartões" nem o painel "O mês em perspectiva". |
| RF-04 | O **carrossel** ocupa a largura toda. Abaixo dele ficam a lista de compras do mês e o resumo por categoria, como hoje. |
| RF-05 | O **Histórico** mostra, em cada mês, a **fatura** e a **quantidade de compras** do cartão selecionado, sem barra, limite nem disponível. Com 2 cartões ou mais, cada mês traz a linha "Todos os cartões: fatura ‹total›". |
| RF-06 | O cadastro de um cartão novo continua abrindo o mês corrente dele, sem pedir nenhum valor além de nome e cor. |

### 4.2 Regras de negócio (RN)

| ID | Regra |
| -- | ----- |
| RN-01 | **Fatura do mês (D2 do glossário):** soma das compras do cartão com data no mês. Num mês futuro, soma também as parcelas e as cobranças previstas. |
| RN-02 | **Total das faturas:** soma das faturas de todos os cartões no mês. É usado na linha "Todos os cartões" do Histórico (RF-05) e no valor "Cartões" do resumo das Entradas (RN-05 de `contas-e-gastos.md`). |
| RN-03 | **Validação do cartão:** nome obrigatório, até 120 caracteres e único sem diferenciar maiúsculas, minúsculas e espaços ("Já existe um cartão com esse nome."); cor válida. Não há mais validação de limite. |
| RN-04 | **Editar cartão:** muda nome e cor. Nenhum valor de compra, fatura ou mês muda. |
| RN-05 | **Excluir cartão:** como hoje (apaga meses, compras, parcelamentos e recorrências do cartão). |
| RN-06 | **Mês do cartão (D7):** continua começando sozinho no mês corrente e ao registrar uma compra num mês passado, mas sem guardar limite. As parcelas e as cobranças recorrentes devidas continuam sendo gravadas ao iniciar o mês. |
| RN-07 | **Migração v9 → v10 (D2):** remove `limitAmount` de cada cartão e de cada mês. Cartões, meses, compras, categorias, entradas, benefícios, contas e o resto não mudam. |
| RN-08 | **Isolamento (D8):** o saldo da aba Entradas, os benefícios e as categorias dão o mesmo resultado de antes. |

## 5. Cenários (BDD)

Os cenários usam a data de hoje como **18/10/2026**.

```gherkin
# language: pt

Funcionalidade: Cartão sem limite
  Como pessoa que lança as compras do cartão
  Quero ver o total da fatura de cada mês
  Para saber quanto as compras deram, sem controlar limite

  # --- RF-01 / D1 -----------------------------------------------------------------
  Cenário: Cadastrar um cartão só com nome e cor
    Quando eu clico em "Cadastrar cartão"
    Então o formulário "Seu cartão" abre com nome e cor, e sem campo de limite
    Quando eu preencho "Nubank", escolho uma cor e clico em "Adicionar"
    Então vejo a face do cartão "Nubank" no carrossel, selecionada

  Cenário: Editar o cartão
    Quando eu clico em "Editar cartão" na face do cartão
    Então o formulário "Ajustar cartão" abre com o nome e a cor, e sem limite
    Quando eu mudo o nome e salvo
    Então a face mostra o nome novo, e as compras e a fatura continuam iguais

  # --- RF-02 / RN-01 / D3 ----------------------------------------------------------
  Cenário: A face do cartão mostra a fatura do mês
    Dado que o "Nubank" tem as compras de R$ 120,00 e R$ 80,00 em outubro de 2026
    Então a face mostra "Fatura de outubro de 2026" com R$ 200,00 e "2 compras"
    E não mostra disponível, limite nem barra de limite utilizado

  Cenário: Cartão sem compras no mês
    Dado que o "Nubank" não tem compras em outubro de 2026
    Então a face mostra a fatura R$ 0,00 e "Nenhuma compra neste mês."

  Cenário: A fatura inclui parcelas e cobranças recorrentes
    Dado que o "Nubank" tem a compra de R$ 100,00, a parcela "1/3" de R$ 33,34 e a cobrança recorrente de R$ 40,00 em outubro
    Então a fatura de outubro é R$ 173,34

  Cenário: Mês futuro mostra a fatura prevista
    Dado que o "Nubank" tem a parcela "2/3" de R$ 33,33 e a cobrança recorrente de R$ 40,00 previstas para novembro
    Quando eu abro novembro de 2026
    Então a face mostra "Fatura prevista de novembro de 2026" com R$ 73,33

  # --- RF-03 / RF-04 / D4 ----------------------------------------------------------
  Cenário: A aba Cartões sem a faixa e sem o painel do mês
    Dado que existem 2 cartões
    Quando eu abro a aba "Cartões"
    Então não vejo "Todos os cartões" nem "O mês em perspectiva"
    E o carrossel ocupa a largura toda, com a lista de compras abaixo

  # --- RF-05 / RN-02 / D5 ----------------------------------------------------------
  Cenário: O Histórico mostra a fatura de cada mês
    Dado que o "Nubank" tem R$ 200,00 em outubro e R$ 150,00 em setembro
    Quando eu abro o Histórico
    Então outubro mostra "Fatura" R$ 200,00 e "2 compras", e setembro mostra R$ 150,00
    E não há barra, limite nem disponível

  Cenário: Todos os cartões no Histórico
    Dado que o "Nubank" tem R$ 200,00 e o "Inter" R$ 100,00 em outubro
    Quando eu abro o Histórico com "Nubank" selecionado
    Então outubro mostra "Todos os cartões: fatura R$ 300,00"
    Mas com um só cartão essa linha não aparece

  # --- D8 / RN-08 -----------------------------------------------------------------
  Cenário: O saldo da aba Entradas não muda
    Dado que os cartões somam R$ 300,00 de faturas em outubro
    Então "Cartões" no resumo da aba Entradas mostra R$ 300,00
    E o saldo é o mesmo de antes da mudança

  # --- RN-06 ----------------------------------------------------------------------
  Cenário: O mês começa sozinho sem limite
    Dado que hoje é 01/11/2026 e novembro nunca foi aberto
    Quando eu abro o app
    Então novembro começa, e as parcelas e cobranças devidas entram como compras

  # --- RN-05 ----------------------------------------------------------------------
  Cenário: Remover um cartão
    Quando eu removo o cartão "Inter" e confirmo
    Então as compras e os meses do "Inter" somem
    E os outros cartões e as categorias continuam como estavam

  # --- RN-07 / D2 -----------------------------------------------------------------
  Cenário: Migração de dados antigos
    Dado que o aparelho tem dados salvos na versão 9, com cartões e meses com limite
    Quando eu abro o app
    Então os cartões e os meses perdem o limite
    E todas as compras, parcelas, recorrências, categorias, entradas, benefícios, contas e gastos continuam como estavam
    E as faturas de cada mês são as mesmas somas de antes
```

### 5.1 Matriz de rastreabilidade

| Requisito | Cenário(s) |
| --------- | ---------- |
| RF-01, D1, RN-03, RN-04 | Cadastrar um cartão só com nome e cor; Editar o cartão |
| RF-02, D3, RN-01 | A face do cartão mostra a fatura do mês; Cartão sem compras no mês; A fatura inclui parcelas e cobranças recorrentes; Mês futuro mostra a fatura prevista |
| RF-03, RF-04, D4 | A aba Cartões sem a faixa e sem o painel do mês |
| RF-05, RN-02, D5 | O Histórico mostra a fatura de cada mês; Todos os cartões no Histórico |
| RF-06 | Cadastrar um cartão só com nome e cor |
| RN-05 | Remover um cartão |
| RN-06, D7 | O mês começa sozinho sem limite |
| RN-07, D2 | Migração de dados antigos |
| RN-08, D8 | O saldo da aba Entradas não muda |
| D6 | A face do cartão mostra a fatura do mês |
| D9 | A face do cartão mostra a fatura do mês |

## 6. Modelo de dados e migração

O estado salvo passa de `version: 9` para `version: 10`:

```ts
type StoredCard = { id: number; name: string; color: CardColor };            // sem limitAmount
type StoredMonth = { cardId: number; month: MonthKey };                      // sem limitAmount
type State = { /* campos da v9 */ version: 10; cards: StoredCard[]; months: StoredMonth[] };
```

**Migração v9 → v10 (RN-07):** para cada cartão e cada mês, descarta `limitAmount`; o resto do estado não muda. Mais uma etapa na cadeia, no estilo de `migrateV8`.

## 7. Contrato da camada de dados

Em `src/data/store.ts`:

| Função | Efeito |
| ------ | ------ |
| `getCards(month)` / `getCard(cardId, month)` | Cada cartão traz `invoiceAmount` (RN-01) e `movementCount`, no lugar de `usedAmount`, `availableAmount`, `percentUsed`, `limitAmount` e `currentLimitAmount`. |
| `saveCard(input, mode, cardId?)` | `input` é `{ name, color? }` (RN-03, RN-04). |
| `getMonthHistory(cardId)` | `{ month, invoiceAmount, movementCount }` por mês iniciado (RF-05). |
| `getConsolidatedHistory()` | `{ month, cardCount, invoiceAmount }` por mês iniciado de qualquer cartão (RN-02). |
| `getConsolidated(month)` | Removida: só a faixa "Todos os cartões", que saiu, usava. |
| `getMonthCash(month)` | Sem mudança de resultado: `cardsAmount` é o total das faturas (RN-02). |

Em `src/data/api.ts`: os hooks e tipos acompanham; sai `useGetConsolidated`.

## 8. Interface

- **Face do cartão** (`card-carousel.tsx`): nome, "Fatura de ‹mês›" (ou "Fatura prevista de ‹mês›"), o valor em destaque e "n compras"; sai o "Disponível para usar", o "Limite utilizado" e a barra.
- **Aba Cartões** (`dashboard.tsx`): sai a faixa "Todos os cartões" e o painel "O mês em perspectiva"; o carrossel ocupa a largura toda; o formulário do cartão perde o campo de limite.
- **Histórico** (`historico.tsx`): cada mês mostra "Fatura" e a quantidade de compras, e a linha "Todos os cartões: fatura ‹total›" com 2 cartões ou mais; saem a barra, o limite e o disponível.
- **Entradas** (`entradas.tsx`): sem mudança visível; só passa a ler `invoiceAmount` do total das faturas.
- **360 px:** a face do cartão e o Histórico continuam sem estourar a largura.

## 9. Fora de escopo

- Dia de fechamento e de vencimento da fatura (D6).
- Aviso de gasto alto, meta ou orçamento por cartão.
- Marcar a fatura como paga.
- Qualquer mudança no saldo, nos benefícios e nas categorias.

## 10. Critérios de aceite

- [x] RF-01 a RF-06 funcionam como descritos. *Verificados no navegador: formulário só com nome e cor, cadastro de cartão novo (a face mostra "Nenhuma compra neste mês."), face com "Fatura de ‹mês›" e número de compras, aba sem a faixa e sem o painel, Histórico com a fatura e a linha "Todos os cartões". Conferido só pelo script e pelo código: a "Fatura prevista" de mês futuro na tela.*
- [x] RN-01 a RN-06 exercitadas em `src/data/store.ts` (fatura com compra, mês futuro com cobrança recorrente prevista, total das faturas, validação e edição do cartão, remoção de cartão). *Parcelas na fatura seguem cobertas pelo teste de parcelamento.*
- [x] Dados `version: 9` abrem sem perda e passam a `version: 10` sem limite (RN-07); as faturas são as mesmas somas. *Conferido no script e no navegador com um JSON v9 salvo.*
- [x] O saldo da aba Entradas continua igual (RN-08). *Pelo script (`cardsAmount` = total das faturas) e pelos testes de saldo; não conferi a aba Entradas visualmente.*
- [x] Nenhuma tela mostra mais limite, disponível ou percentual de limite de cartão (Benefícios mantém o próprio percentual).
- [ ] Todos os cenários da seção 5 passam no navegador. *Pendente: a conferência visual da "Fatura prevista" em mês futuro, de dois cartões lado a lado no Histórico em 360 px e da aba Entradas.* A 360 px conferi que a aba Cartões e o Histórico não estouram a largura.
- [x] `npm run typecheck` e `npm run build` passam.
- [x] `FUNCIONALIDADES.md` e `README.md` atualizados, e as specs `historico-mensal.md`, `multiplos-cartoes.md` e `compras-e-categorias.md` têm a nota "Substituída em parte por `cartao-sem-limite.md`".

## 11. Tarefas

1. `store.ts`: tipos, `State` v10, `emptyState`, `migrateV9` e encadeamento na leitura (RN-07).
2. `store.ts`: fatura no lugar de usado, disponível e limite (RN-01, RN-02); `saveCard` sem limite (RN-03); remover `getConsolidated`; ajustar `getMonthCash` e a criação de mês.
3. `api.ts`: hooks e tipos.
4. `card-carousel.tsx` e `dashboard.tsx`: a face do cartão, o formulário e a remoção da faixa e do painel (RF-01 a RF-04).
5. `historico.tsx`: fatura e compras por mês, e a linha "Todos os cartões" (RF-05).
6. Atualizar `FUNCIONALIDADES.md` (seções 1, 4, 9 e 10, e as menções a limite), `README.md` (regras de cálculo, versão 10) e as notas nas três specs.
7. Rodar o roteiro de verificação; mudar o Status para `Implementada` e marcar só o que foi verificado.

## 12. Roteiro de verificação

1. `npm run typecheck` e `npm run build`.
2. Script de teste de `store.ts` (esbuild com `localStorage` simulado): a fatura com compra, parcela e cobrança recorrente, o mês futuro, a remoção de cartão, o saldo das Entradas igual ao de antes e a migração v9 → v10 (sem `limitAmount`, resto intacto).
3. `npm run dev`: cadastrar e editar cartão só com nome e cor; a face do cartão; a aba sem a faixa e sem o painel; o Histórico com 1 e com 2 cartões.
4. No console do navegador, gravar um JSON `version: 9` com limite em `controle-cartao:v1`, recarregar e conferir a migração.
5. Conferir a 360 px que a face do cartão e o Histórico não estouram a largura.
6. Conferir que Entradas, Benefícios e Categorias continuam iguais.
