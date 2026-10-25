# Spec — Todas as compras do cartão

| Campo | Valor |
| ----- | ----- |
| Status | Implementada |
| Criada em | 25/10/2026 |
| Escopo | `src/data/store.ts`, `src/data/api.ts`, `src/pages/compras.tsx` (novo), `src/pages/dashboard.tsx`, `src/App.tsx`, `FUNCIONALIDADES.md`, `README.md`, `specs/parcelamento.md`, `specs/editar-parcela-prevista.md` |
| Depende de | [`compras-e-categorias.md`](compras-e-categorias.md), [`parcelamento.md`](parcelamento.md), [`compra-recorrente.md`](compra-recorrente.md), [`editar-parcela-prevista.md`](editar-parcela-prevista.md) |

> Mudanças de comportamento entram primeiro aqui e só depois no código.

---

## 1. Contexto e objetivo

Hoje só se edita ou exclui uma compra do cartão olhando o mês dela. Para corrigir uma compra antiga, a pessoa precisa navegar até o mês certo, e as parcelas de meses futuros só têm o botão de editar.

**Objetivo:** uma **tela com todas as compras do cartão selecionado, de qualquer mês**, onde cada compra pode ser **editada ou excluída**.

## 2. Glossário

| Termo | Definição |
| ----- | --------- |
| **Compra** | Qualquer lançamento no cartão: comum, parcela de compra parcelada ou cobrança de compra recorrente. |
| **Parcela prevista** | Parcela de mês futuro, ainda não gravada ([`parcelamento.md`](parcelamento.md#2-glossário)). |

## 3. Decisões de produto

| # | Decisão | Motivo |
| - | ------- | ------ |
| D1 | **Tela própria `#/compras`**, com as compras do cartão selecionado, sem seletor de mês. | Pedido do usuário: agir em qualquer compra, independente do mês. |
| D2 | **A lista é agrupada por mês**, do mais novo para o mais antigo, com o total de cada mês. Meses futuros entram: compras futuras registradas e parcelas previstas. | O mês continua sendo a referência de leitura, mas deixa de ser um filtro. |
| D3 | **Cada linha mostra** descrição, data, categoria, valor e os selos que já existem ("k/N", "Mensal", "prevista"). | Igual à lista do mês. |
| D4 | **Editar e excluir seguem as regras de cada tipo:**<br>• compra comum: edita e exclui só ela;<br>• parcela (gravada ou prevista): edita e exclui a **compra parcelada inteira**, com o diálogo e a confirmação atuais ([`parcelamento.md`](parcelamento.md) RF-05, RF-06);<br>• compra recorrente gravada: pergunta o escopo (só este mês / deste mês em diante), como hoje. | Mantém as regras já aprovadas; uma parcela não tem valor próprio. |
| D5 | **Compra recorrente prevista não aparece.** | Ela só existe como regra até o mês chegar; quem a edita é a cobrança gravada. |
| D6 | **Busca por texto na descrição e filtro por categoria**, iguais aos da lista do mês. | Sem filtro a lista fica longa. |
| D7 | **Entrada:** botão "Todas as compras" na aba Cartões. "Voltar" leva à aba Cartões. | Segue o padrão das telas de lançamentos. |
| D8 | **A parcela prevista da prévia de mês futuro também ganha o botão excluir**, ao lado do editar. | Pedido anterior do usuário: poder excluir as parcelas. |
| D9 | **Registrar compra continua pelo "+" do rodapé**; não há botão de criar nesta tela. | Mesma regra de [`botao-lancar.md`](botao-lancar.md). A lista atualiza ao salvar. |

## 4. Requisitos

### 4.1 Requisitos funcionais (RF)

| ID | Requisito |
| -- | --------- |
| RF-01 | A tela `#/compras` lista as compras do cartão selecionado em todos os meses, agrupadas por mês (D2), com o total de cada mês. |
| RF-02 | Cada compra tem os botões editar e excluir conforme D4. |
| RF-03 | A busca e o filtro de categoria reduzem a lista de todos os meses (D6). |
| RF-04 | Sem compras, mostra "Nenhuma compra neste cartão.". |
| RF-05 | A aba Cartões tem o botão "Todas as compras" (D7). |
| RF-06 | Na prévia de mês futuro, a parcela prevista tem o botão excluir (D8). |
| RF-07 | Editar ou excluir uma compra de outro mês não leva a pessoa a esse mês: o diálogo abre na própria tela e a lista atualiza ao salvar. |

### 4.2 Regras de negócio (RN)

| ID | Regra |
| -- | ----- |
| RN-01 | O mês de uma compra é o mês da data. Mudar a data para outro mês move a compra de grupo. |
| RN-02 | A edição de compra comum aceita data de qualquer mês (D5 de [`compras-e-categorias.md`](compras-e-categorias.md)). A edição de compra parcelada aceita data em mês futuro ([`editar-parcela-prevista.md`](editar-parcela-prevista.md)). |
| RN-03 | O total de um mês é a soma das compras do grupo, incluindo as parcelas previstas, e bate com o "usado" daquele mês no card do cartão. |
| RN-04 | A lista vem de `getAllMovements(cardId)`, que junta as compras gravadas e as parcelas previstas. Não grava nada. |
| RN-05 | Editar e excluir usam as mutações que já existem (`updateMovement`, `deleteMovement`, `updatePurchase`, `deletePurchase`, `updateRecurring`, `deleteRecurring`), sem regra nova. |
| RN-06 | O formato salvo não muda. |

## 5. Cenários (BDD)

Hoje é **25/10/2026**, cartão "Nubank" selecionado.

```gherkin
# language: pt

Funcionalidade: Todas as compras do cartão
  Contexto:
    Dado a compra "Mercado" de R$ 80,00 em 05/08/2026
    E a compra "Cinema" de R$ 40,00 em 12/10/2026
    E a compra parcelada "Fone" de R$ 100,00 em 3x com a parcela 1 em 15/10/2026

  # --- RF-01 / D2 / RN-03 -------------------------------------------------------
  Cenário: Ver as compras de todos os meses
    Quando abro "Todas as compras"
    Então vejo os grupos dezembro, novembro, outubro e agosto de 2026, nessa ordem
    E dezembro e novembro mostram "Fone" "3/3" e "2/3" como "prevista"
    E outubro mostra "Cinema" e "Fone" "1/3" com o total R$ 73,34
    E agosto mostra "Mercado" com o total R$ 80,00

  # --- RF-02 / RF-07 / RN-01 / RN-02 / D4 ---------------------------------------
  Cenário: Editar uma compra de um mês antigo
    Quando toco em editar em "Mercado"
    E mudo o valor para "95" e a data para 07/09/2026
    Então "Mercado" passa para o grupo setembro de 2026 com R$ 95,00
    E continuo na tela de todas as compras

  Cenário: Excluir uma compra de um mês antigo
    Quando toco em excluir em "Mercado" e confirmo
    Então o grupo agosto de 2026 some

  Cenário: Editar uma parcela prevista
    Quando toco em editar em "Fone" "2/3" de novembro
    E mudo o valor total para "150"
    Então "Fone" mostra R$ 50,00 em todos os meses

  Cenário: Excluir uma parcela exclui a compra parcelada
    Quando toco em excluir em "Fone" "1/3" e confirmo
    Então "Fone" some de outubro, novembro e dezembro

  Cenário: Compra recorrente pergunta o escopo
    Dado a compra recorrente "Academia" de R$ 100,00 todo dia 10, desde setembro
    Quando toco em excluir em "Academia" de setembro
    Então o app pergunta "Só este mês" ou "Deste mês em diante"

  # --- D5 -----------------------------------------------------------------------
  Cenário: Recorrente prevista não aparece
    Dado a compra recorrente "Academia" de R$ 100,00 todo dia 10, desde setembro
    Então "Academia" não aparece nos grupos novembro e dezembro

  # --- RF-03 / D6 ---------------------------------------------------------------
  Cenário: Buscar em todos os meses
    Quando busco "mer"
    Então vejo só "Mercado", no grupo agosto de 2026

  # --- RF-04 --------------------------------------------------------------------
  Cenário: Cartão sem compras
    Dado um cartão sem compras
    Quando abro "Todas as compras"
    Então vejo "Nenhuma compra neste cartão."

  # --- RF-05 / D7 ---------------------------------------------------------------
  Cenário: Chegar e voltar
    Quando toco em "Todas as compras" na aba Cartões
    E toco em "Voltar"
    Então volto para a aba Cartões

  # --- RF-06 / D8 ---------------------------------------------------------------
  Cenário: Excluir pela prévia de mês futuro
    Quando abro novembro de 2026
    E toco em excluir na parcela "Fone" "2/3" e confirmo
    Então "Fone" é removido de todos os meses
```

### Matriz de rastreabilidade

| Requisito | Cenário |
| --------- | ------- |
| RF-01, D2, RN-03, RN-04 | Ver as compras de todos os meses |
| RF-02, RF-07, RN-01, RN-02, RN-05, D4 | Editar uma compra de um mês antigo; Excluir uma compra de um mês antigo; Editar uma parcela prevista; Excluir uma parcela exclui a compra parcelada; Compra recorrente pergunta o escopo |
| D5 | Recorrente prevista não aparece |
| RF-03, D6 | Buscar em todos os meses |
| RF-04 | Cartão sem compras |
| RF-05, D7 | Chegar e voltar |
| RF-06, D8 | Excluir pela prévia de mês futuro |
| RN-06 | Sem mudança de formato (nada a migrar) |

## 6. Modelo de dados e migração

Não muda (RN-06).

## 7. Contrato da camada de dados

- Nova leitura `getAllMovements(cardId)`: compras gravadas do cartão (todos os meses) mais as parcelas previstas, cada item com seu mês.
- Hook `useGetAllMovements`, invalidado junto das demais consultas de compra.
- Nenhuma mutação nova.

## 8. Interface

- `src/pages/compras.tsx`: "Voltar", título, busca, filtro de categoria, grupos por mês com total e linhas com editar/excluir. Reaproveita o diálogo e as confirmações do `dashboard.tsx` (extrair para componente compartilhado, como `entry-dialogs.tsx`).
- Rota `#/compras`; botão "Todas as compras" na aba Cartões; botão excluir nas parcelas previstas do `dashboard.tsx`.

## 9. Fora de escopo

- Editar ou excluir uma única parcela mantendo as outras: vale a compra parcelada inteira (D4).
- Compras de benefícios, contas fixas e gastos do dia a dia (têm telas próprias).
- Todos os cartões juntos: a tela mostra o cartão selecionado.
- Criar compra pela tela (D9).

## 10. Critérios de aceite

- [ ] (não verificado no navegador) RF-01, RF-04: lista agrupada, totais e vazio.
- [ ] (não verificado no navegador) RF-02, RF-07: editar e excluir em qualquer mês, sem sair da tela.
- [ ] (não verificado no navegador) RF-03: busca e filtro.
- [ ] (não verificado no navegador) RF-05: entrada e volta.
- [ ] (não verificado no navegador) RF-06: excluir pela prévia.
- [x] `npm run typecheck` e `npm run build` passam.

> Verificado exercitando `store.ts` (script com `localStorage` simulado): `getAllMovements` junta as compras de todos os meses e as parcelas previstas; editar pela parcela prevista recalcula as parcelas; excluir remove tudo; criar compra parcelada com data futura continua recusado. A tela em si ainda precisa ser conferida no navegador.

## 11. Tarefas

1. `store.ts`: `getAllMovements` (RN-03, RN-04).
2. `api.ts`: `useGetAllMovements` e invalidação nas mutações.
3. Extrair o diálogo e as ações de editar/excluir compra do `dashboard.tsx` para um componente compartilhado.
4. `compras.tsx` e a rota; botão na aba Cartões; excluir nas parcelas previstas.
5. `FUNCIONALIDADES.md`, `README.md` e notas em `parcelamento.md` e `editar-parcela-prevista.md`.

## 12. Roteiro de verificação

1. Montar o contexto dos cenários e abrir a tela: conferir grupos, totais e selos.
2. Editar e excluir uma compra de agosto, uma parcela de novembro e uma recorrente.
3. Conferir que o card do cartão em cada mês bate com o total do grupo.
