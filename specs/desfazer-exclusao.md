# Spec — Desfazer a exclusão (Nova versão, parte 3)

| Campo | Valor |
| ----- | ----- |
| Status | Implementada |
| Criada em | 29/10/2026 |
| Escopo | `src/data/store.ts` e `src/data/api.ts` (guardar e aplicar o desfazer), novo `src/components/undo-snackbar.tsx`, `src/components/notice.tsx` (convivência com o aviso), `src/components/confirm-dialog.tsx` (`removeAsk` deixa de ser usado nas exclusões listadas), `src/pages/{entradas-lista,dashboard,compras,beneficio-lancamentos}.tsx`, `FUNCIONALIDADES.md`, `README.md` |
| Depende de | [`redesign-opcao-d-telas-de-apoio.md`](redesign-opcao-d-telas-de-apoio.md) (D5 confirmação, D8 aviso), [`telas-de-entradas.md`](telas-de-entradas.md), [`compra-recorrente.md`](compra-recorrente.md), [`parcelamento.md`](parcelamento.md), [`lancamentos-do-beneficio.md`](lancamentos-do-beneficio.md) |
| Substitui em parte | A pergunta "Remover …? Esta ação não pode ser desfeita." de `redesign-opcao-d-telas-de-apoio.md` D5, **nas exclusões de lançamentos** (seção 2, D2). Cartão, benefício e categoria continuam com confirmação. |
| Referência visual | Canvas "Controle do Cartão", grupo v2, telas V2_08 (Excluída, com "Desfazer") e V2_09 (Confirmar exclusão, só nas exclusões grandes) |

> Mudanças de comportamento entram primeiro aqui e só depois no código.

---

## 1. Contexto e objetivo

Hoje, apagar um lançamento abre uma pergunta ("Remover …?") e, depois do "Remover", não há volta: "Esta ação não pode ser desfeita." Isso tem dois problemas. A pergunta aparece em toda exclusão, inclusive nas pequenas, e vira um toque automático. E o erro de toque que apaga a coisa errada, ou a exclusão confirmada sem querer, não tem conserto.

**Objetivo:** apagar um lançamento é imediato, e um aviso com **Desfazer** fica na tela por 6 segundos. Quem apagou sem querer volta tudo ao que era. A pergunta antes de apagar fica só para o que arrasta muita coisa junto (cartão, benefício, categoria). Nenhuma regra de cálculo muda.

## 2. Decisões de produto

| # | Decisão | Motivo |
| - | ------- | ------ |
| D1 | Apagar **entrada, conta fixa, gasto do dia a dia, compra do cartão (avulsa, parcelada ou recorrente) e gasto de benefício** apaga na hora e mostra o aviso "‹O quê› removida/removido." com o botão **Desfazer**. | Corrigir depois é mais barato e mais seguro do que perguntar sempre. |
| D2 | **Cartão, benefício e categoria continuam pedindo confirmação** (a caixa de diálogo de hoje). Não ganham "Desfazer". Fechar uma categoria de benefício também continua pedindo confirmação. | Arrastam muito junto (compras, gastos, divisões) e são raros; a pergunta ainda faz sentido. |
| D3 | O aviso fica **6 segundos** e pausa a contagem enquanto o botão "Desfazer" está com o foco. Some sozinho depois. | Tempo para ler e tocar sem correr, e para quem navega por teclado ou leitor de tela. |
| D4 | O desfazer vale **só para a última exclusão**. Apagar outra coisa antes do prazo fecha o aviso anterior (a exclusão anterior fica definitiva) e abre o novo. | Simples de explicar e de testar; evita fila de avisos cobrindo o botão Lançar. |
| D5 | Desfazer **restaura exatamente o que a exclusão tirou**: o item, as parcelas de uma compra parcelada, a data final de uma recorrente, as exceções de mês. Mudanças feitas **depois** em outros itens ficam como estão. | Quem apaga e lança outra coisa em seguida não perde o lançamento novo ao desfazer. |
| D6 | As telas de escolha do alcance (só este mês × daqui para a frente) continuam como são. Escolhido o alcance, apaga na hora, sem segunda pergunta. | O alcance é uma escolha de conteúdo, não uma confirmação. |
| D7 | O desfazer vive **na memória** do app, só durante o aviso. Se o app fechar nesse tempo, a exclusão fica definitiva. | Não cria dado novo salvo nem migração; 6 segundos não justificam persistir. |
| D8 | Desfazer que não pode ser aplicado (por exemplo, o mesmo item foi editado nesse intervalo) mostra "Não foi possível desfazer." e deixa tudo como está. | Nunca desfazer pela metade. |
| D9 | **Gênero do aviso (ajuste da implementação):** "removida" para compra, compra parcelada, compra recorrente e conta fixa; "removido" para gasto do dia a dia, gasto de benefício e entrada. | O texto de exemplo da RF-07 é "Salário removido deste mês." (a spec não fixa o gênero de "entrada"); o tipo do item é o que o app sabe, e a descrição digitada pela pessoa não tem gênero conhecido. |
| D10 | **O formulário de edição fecha ao apagar a partir dele** (botão "Excluir compra" em Cartões e em Compras; gasto do benefício). | Antes a pergunta vinha por cima do formulário e ele continuava aberto, mostrando um item que já não existe. |
| D11 | **A cor do botão "Desfazer" é uma cor nova, `snack-action`** (#8fd0b1 no claro, #28513f no escuro). | O aviso inverte (fundo `ink`, texto `paper`) e nenhuma cor com nome serve de botão sobre esse fundo nos dois temas (contraste de 6,9:1 e 7,7:1). |
| D12 | **Parar o relógio:** o cursor ou o dedo sobre o aviso também pausa a contagem, além do foco no botão (RF-04), e o tempo que restava é retomado. | Pedido da própria RF-04. |

## 3. Requisitos

### 3.1 Requisitos funcionais (RF)

| ID | Requisito |
| -- | --------- |
| RF-01 | Nas exclusões de D1, ao tocar em "Remover" (ou no item de menu equivalente), o lançamento é apagado sem diálogo de confirmação. |
| RF-02 | Logo depois, aparece o aviso "‹Descrição› removido." (ou removida) com o botão "Desfazer", acima da barra inferior e do botão Lançar. |
| RF-03 | Tocar em "Desfazer" restaura o que a exclusão tirou, atualiza as telas abertas e troca o aviso por "‹Descrição› de volta." (4 segundos, sem botão). |
| RF-04 | O aviso some sozinho depois de 6 segundos, e o tempo para enquanto o botão "Desfazer" tem o foco ou o dedo/cursor está sobre o aviso. |
| RF-05 | Apagar outro lançamento enquanto o aviso está aberto fecha o aviso anterior (exclusão anterior definitiva) e abre o aviso novo (D4). |
| RF-06 | Excluir cartão, benefício ou categoria continua abrindo o diálogo de confirmação, com o texto de hoje. |
| RF-07 | Em exclusões com escolha de alcance (entrada, conta fixa e compra recorrente), a escolha é feita antes (D6) e o aviso diz o alcance: "Salário removido deste mês." ou "Salário removido deste mês em diante." |
| RF-08 | O aviso é anunciado por leitores de tela (`role="status"`), o botão "Desfazer" tem 48 px de altura e o aviso não cobre o botão Lançar nem a barra inferior. |
| RF-09 | O aviso aparece e desfaz também a partir das telas de Entradas (listas), Cartões e Compras, e dos lançamentos do benefício. |

### 3.2 Regras de negócio (RN)

| ID | Regra |
| -- | ----- |
| RN-01 | Nenhum cálculo muda. O estado depois de apagar e desfazer é igual ao de antes de apagar (mesmos itens, mesmos identificadores, mesmo saldo, mesma fatura). |
| RN-02 | O desfazer repõe **por registro**: cada coisa que a exclusão tirou, mudou ou acrescentou (item, parcelas, exceções, data final) volta ao valor anterior; nada mais é tocado (D5). |
| RN-03 | Há no máximo **um** desfazer pendente (D4). Ele é descartado ao expirar o aviso, ao apagar outra coisa ou ao fechar o app. |
| RN-04 | Os identificadores de teste `button-confirm-ok` e `button-confirm-cancel` continuam nas exclusões grandes (D2). Novos: `snackbar-undo`, `button-undo` e `text-undo`. |
| RN-05 | O aviso de desfazer e o aviso de sucesso (`status-toast`) nunca aparecem juntos: o de desfazer ocupa o lugar do outro. |
| RN-06 | Se a exclusão falhar, nada muda e aparece o aviso de erro de sempre; não há "Desfazer". |
| RN-07 | Texto do aviso com no mínimo 14 px, contraste de 4,5:1 nos dois temas, e o aviso não é a única forma de saber que apagou: o item some da lista. |

## 4. Cenários

```gherkin
# language: pt

Funcionalidade: Desfazer a exclusão

  Cenário: Apagar e desfazer um gasto
    Dado um gasto do dia a dia "Mercado" de R$ 80,00
    Quando eu apago "Mercado"
    Então ele some da lista sem pedir confirmação
    E aparece o aviso "Mercado removido." com o botão "Desfazer"
    Quando eu toco em "Desfazer"
    Então "Mercado" volta à lista, com o mesmo valor e a mesma data
    E o aviso diz "Mercado de volta."

  Cenário: O aviso some sozinho
    Dado que apaguei um gasto
    Quando passam 6 segundos
    Então o aviso desaparece
    E a exclusão fica definitiva

  Cenário: O aviso espera enquanto há foco no botão
    Dado que apaguei um gasto
    E o botão "Desfazer" está com o foco
    Quando passam 6 segundos
    Então o aviso continua na tela

  Cenário: Desfazer uma compra parcelada
    Dado uma compra "Fone" em 3 parcelas
    Quando eu apago a compra e desfaço
    Então as 3 parcelas voltam, cada uma no seu mês
    E a fatura de cada mês é a de antes

  Cenário: Desfazer uma recorrente daqui para a frente
    Dado uma conta fixa "Internet" que começou em janeiro
    Quando eu apago "Internet" em junho, "deste mês em diante", e desfaço
    Então "Internet" volta sem data final, e junho e os meses seguintes mostram a conta

  Cenário: Desfazer uma exceção de mês
    Dado uma entrada recorrente "Salário"
    Quando eu apago "Salário" só em julho e desfaço
    Então julho volta a mostrar "Salário"

  Cenário: Apagar outro lançamento antes do prazo
    Dado que apaguei o gasto A e o aviso está aberto
    Quando eu apago o gasto B
    Então o aviso passa a falar do gasto B
    E desfazer devolve só o gasto B
    E o gasto A continua apagado

  Cenário: Lançar depois de apagar não se perde ao desfazer
    Dado que apaguei o gasto A
    E lancei o gasto C
    Quando eu toco em "Desfazer"
    Então os gastos A e C aparecem

  Cenário: Exclusão grande continua pedindo confirmação
    Dado um cartão com compras
    Quando eu peço para excluir o cartão
    Então aparece o diálogo "Remover …?" com "Cancelar" e "Remover"
    E não aparece "Desfazer" depois

  Cenário: Desfazer que não pode ser aplicado
    Dado que apaguei uma compra recorrente
    E o mesmo item foi alterado antes de eu desfazer
    Quando eu toco em "Desfazer"
    Então vejo "Não foi possível desfazer."
    E nada muda

  Cenário: Falha ao apagar
    Dado que a exclusão falha
    Quando eu apago um gasto
    Então o gasto continua na lista
    E aparece o aviso de erro, sem "Desfazer"
```

| Requisito | Cenário |
| --------- | ------- |
| RF-01, RF-02, RF-03, RN-01 | Apagar e desfazer um gasto |
| RF-04, RN-03 | O aviso some sozinho; O aviso espera enquanto há foco no botão |
| RF-05, D4 | Apagar outro lançamento antes do prazo |
| RF-06, D2, RN-04 | Exclusão grande continua pedindo confirmação |
| RF-07, D6 | Desfazer uma recorrente daqui para a frente; Desfazer uma exceção de mês |
| RF-08, RN-07 | Verificação manual: leitor de tela, 48 px, contraste nos dois temas |
| RF-09 | Verificação manual: repetir o primeiro cenário em cada tela |
| RN-02, D5 | Desfazer uma compra parcelada; Lançar depois de apagar não se perde ao desfazer |
| RN-05 | Verificação manual: apagar logo após um aviso de sucesso |
| RN-06 | Falha ao apagar |
| D8 | Desfazer que não pode ser aplicado |

## 5. Dados e contrato

**Formato salvo:** sem mudança, sem migração (D7). O desfazer pendente não é gravado.

**Camada de dados** (`src/data/store.ts`):

- `mutate` ganha uma variante que compara o estado antes e depois da mudança e guarda um **remendo reverso** com, para cada lista do estado (`incomes`, `incomeExceptions`, `bills`, `billExceptions`, `dailyExpenses`, `movements`, `purchases`, `recurrings`, `recurringExceptions`, `benefitSpends`): os registros removidos, os alterados (valor anterior) e os acrescentados.
- As exclusões do D1 usam essa variante e devolvem `{ undoId: number }` em vez de nada (`deleteIncome`, `deleteBill`, `deleteDailyExpense`, `deleteMovement`, `deletePurchase`, `deleteRecurring`, `deleteBenefitSpend`). As de D2 (`deleteCard`, `deleteBenefit`, `deleteCategory`) não mudam.
- `undoDeletion(undoId)` aplica o remendo reverso por identificador, sem tocar nos demais registros. Se o `undoId` não é o pendente, ou se um registro a restaurar já existe com outro conteúdo, lança "Não foi possível desfazer." e não altera nada (D8).
- `discardUndo()` descarta o pendente (aviso expirado ou fechado).

**Camada de hooks** (`src/data/api.ts`): `useUndoDeletion` e `useDiscardUndo`, e os `useDelete…` acima passam a devolver `{ undoId }`.

## 6. Interface

- **Aviso com Desfazer:** barra de 56 px, raio de 28 px, fundo `ink` com texto `paper` (inverte nos dois temas), texto à esquerda, botão "Desfazer" à direita (48 px de altura, `brand` claro). Posição: acima do botão Lançar e da barra inferior, 16 px de margem lateral. Referência: V2_08 (clara e escura).
- **Contagem:** sem barra de progresso; o aviso some com fade de 150 ms (sem animação com `prefers-reduced-motion`).
- **Texto:** "‹Descrição› removida." / "removido." conforme o gênero; "de volta." depois de desfazer.
- **Diálogo de confirmação** (D2): o mesmo de hoje; o texto "Esta ação não pode ser desfeita." continua só nele.
- **Itens de menu "Remover":** mesmo lugar e mesmo texto; só deixam de abrir o diálogo.

## 7. Fora de escopo

- Desfazer **edição** de lançamento e desfazer **criação** (só a exclusão).
- Desfazer de cartão, benefício e categoria (D2).
- Vários desfazeres em fila ou histórico de desfazer.
- Guardar o desfazer depois que o app fecha (D7).
- Mudar o texto ou o fluxo dos diálogos de alcance (D6).

## 8. Critérios de aceite

Verificado no navegador (`npm run dev`) com dados de teste, nos temas claro e escuro, e a lógica de dados exercitada direto em `src/data/store.ts`. Não conferi com um leitor de tela de verdade: a acessibilidade foi conferida pelo DOM.

- [x] `npm run typecheck` e `npm run build` passam.
- [x] Apagar entrada, conta fixa, gasto do dia a dia, compra (avulsa, parcelada e recorrente) e gasto de benefício apaga sem diálogo e mostra o aviso com "Desfazer". Conferido pela interface em Entradas (gastos, entradas, contas fixas), Cartões, Compras e lançamentos do benefício.
- [x] "Desfazer" devolve o item, as parcelas, a data final e as exceções de mês; o saldo e a fatura voltam aos valores de antes. Nos dez tipos de exclusão (gasto, entrada e conta fixa "só este mês" e "daqui em diante", avulsa, parcelada de 3 parcelas, recorrente nos dois alcances, gasto de benefício) o JSON salvo depois de apagar e desfazer é **idêntico, byte a byte,** ao de antes.
- [x] O aviso some em 6 segundos (medido: 6,28 s, contando os 150 ms do fade) e espera enquanto o botão tem foco (com o foco no botão, seguia na tela depois de 8 s) e enquanto o cursor está sobre ele.
- [x] Apagar outro item antes do prazo troca o aviso e o desfazer vale só para o último (um só aviso na tela; "Fone removida." desfeito devolve as 3 parcelas e "Avulsa" continua apagada; o desfazer antigo falha com "Não foi possível desfazer.").
- [x] Lançamentos criados depois da exclusão não se perdem ao desfazer (apaguei A, lancei C, desfiz: A e C aparecem).
- [x] Cartão, benefício e categoria continuam pedindo confirmação, sem "Desfazer". Categoria conferida até o fim (o aviso depois é o de sucesso, sem botão); cartão e benefício conferidos até o diálogo, com "Cancelar".
- [x] Falha ao apagar não muda nada e não mostra "Desfazer" (com um erro temporário em `mutateUndoable`: o gasto continuou na lista, o armazenamento ficou intacto e o aviso de erro apareceu). O erro de teste foi revertido.
- [x] Aviso legível nos temas claro e escuro, acima da barra e do botão Lançar (base do aviso a 687 px e topo do Lançar a 711 px), sem scroll horizontal em 360 px (documento de 345 px num iframe de 360 px, aviso de 56 px com margem de 16 px, mensagem longa em duas linhas). Contraste de 10,9:1 (texto) e 6,9:1 (botão) no claro, 14,6:1 e 7,7:1 no escuro.
- [x] Leitor de tela: o aviso tem `role="status"` (e `role="alert"` no erro) e o botão tem 48 px de altura. **Não** ouvi um leitor de tela de verdade.
- [x] `FUNCIONALIDADES.md` (nova seção 34, e ajuste das seções que tinham "Remover … ? Cancelar / Remover": 3, 11, 13, 14, 15, 24, 25 e 30; as seções 19, 20 e 22 não tinham esse texto) e `README.md` atualizados.

Não conferido: o aviso falando por um leitor de tela; `prefers-reduced-motion` (usa a regra global de `index.css`, que não foi tocada); e o fluxo de desfazer a partir do Início e do Resumo, que não apagam nada.

## 9. Tarefas

1. Remendo reverso em `store.ts`: variante de `mutate`, `undoDeletion`, `discardUndo` e o retorno `{ undoId }` das sete exclusões (seção 5).
2. Hooks em `api.ts`.
3. `UndoSnackbar` (6 s, pausa com foco e toque, convivência com `Notice`) montado uma vez no casco do app.
4. Trocar `confirm(removeAsk(...))` pelo desfazer em `entradas-lista`, `dashboard`, `compras` e `beneficio-lancamentos`, mantendo `confirm` em cartão, benefício e categoria.
5. Texto do aviso por tipo de item e por alcance (RF-07).
6. `FUNCIONALIDADES.md` e `README.md`.
7. Rodar `typecheck` e `build`.

## 10. Roteiro de verificação

1. `npm run dev`, 390 px, nos temas claro e escuro.
2. Em cada tela da seção 4 (RF-09), apagar e desfazer: gasto do dia a dia, entrada, conta fixa, compra avulsa, compra parcelada em 3 vezes, compra recorrente e gasto de benefício. Comparar saldo, fatura e disponível antes e depois.
3. Recorrentes: apagar "só este mês" e "daqui para a frente", desfazer e olhar o mês apagado e os seguintes.
4. Apagar A, depois B, e desfazer: só B volta. Apagar A, lançar C, desfazer: A e C aparecem.
5. Esperar 6 segundos sem tocar; repetir com o foco no "Desfazer" (teclado ou leitor de tela).
6. Excluir um cartão com compras, um benefício com gastos e uma categoria: confirmação como antes.
7. Simular erro na exclusão (erro temporário em `deleteDailyExpense`) e conferir que nada some.
