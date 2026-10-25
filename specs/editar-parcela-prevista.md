# Spec — Editar parcela prevista

| Campo | Valor |
| ----- | ----- |
| Status | Implementada |
| Criada em | 25/10/2026 |
| Escopo | `src/data/store.ts`, `src/data/api.ts`, `src/pages/dashboard.tsx`, `FUNCIONALIDADES.md`, `specs/parcelamento.md` |
| Depende de | [`parcelamento.md`](parcelamento.md), [`compras-e-categorias.md`](compras-e-categorias.md) |
| Substituída em parte por | [`todas-as-compras.md`](todas-as-compras.md): a parcela prevista também pode ser excluída (D5 deixa de valer). |
| Substitui em parte | A prévia de mês futuro só para leitura ([`parcelamento.md`](parcelamento.md), RF-09 e RN-14) e a data de compra parcelada sempre em mês passado ou corrente ([`parcelamento.md`](parcelamento.md), RN-05), apenas na **edição**. |

> Mudanças de comportamento entram primeiro aqui e só depois no código.

---

## 1. Contexto e objetivo

Um mês futuro (que ainda não começou) mostra as parcelas previstas, mas sem nenhuma ação. Para corrigir uma compra parcelada (valor, nº de parcelas, categoria, parcela inicial), a pessoa precisa esperar o mês da parcela chegar ou voltar a um mês em que a parcela já está gravada.

**Objetivo:** poder **editar a compra parcelada a partir de uma parcela prevista**, na prévia de qualquer mês futuro.

## 2. Glossário

| Termo | Definição |
| ----- | --------- |
| **Parcela prevista** | Parcela de mês futuro, calculada a partir da compra e ainda não gravada (como em [`parcelamento.md`](parcelamento.md#2-glossário)). |
| **Mês aberto** | O mês corrente e os passados, que têm compras gravadas. Os meses futuros "não abertos" só mostram o que está previsto. |

## 3. Decisões de produto

| # | Decisão | Motivo |
| - | ------- | ------ |
| D1 | **A parcela prevista ganha o botão "Editar compra parcelada"**, que abre o mesmo diálogo da edição de uma parcela gravada. | Pedido do usuário. Reaproveita o diálogo e as regras que já existem. |
| D2 | **Editar muda a compra inteira**, não só aquela parcela. | Mantém a decisão D8 de [`compras-e-categorias.md`](compras-e-categorias.md): parcela não tem valor próprio, ela é calculada da compra. |
| D3 | **A data e o campo "Parcela neste mês" do diálogo se referem à parcela prevista aberta**, que cai num mês futuro. Por isso a edição aceita data em mês futuro. A criação continua sem aceitar. | Sem isso, abrir uma parcela de dezembro e salvar daria erro. |
| D4 | **Só compra parcelada.** Cobrança recorrente prevista não muda. | O pedido é sobre parcelas. A recorrente tem o próprio fluxo de escopo. |
| D5 | **Excluir não entra nesta spec.** | Não foi pedido. A exclusão já existe nas parcelas gravadas. |

## 4. Requisitos

### 4.1 Requisitos funcionais (RF)

| ID | Requisito |
| -- | --------- |
| RF-01 | Na prévia de mês futuro, cada parcela prevista de compra parcelada mostra o botão "Editar compra parcelada", igual ao das parcelas gravadas. A cobrança recorrente prevista continua sem botão. |
| RF-02 | O botão abre "Editar compra parcelada" com categoria, descrição, valor total, nº de parcelas, "Parcela neste mês" (a da linha), "Começa na parcela" e a data da linha. |
| RF-03 | Ao salvar, a prévia do mês e o "Próximos meses" do Histórico refletem a compra editada. |

### 4.2 Regras de negócio (RN)

| ID | Regra |
| -- | ----- |
| RN-01 | `updatePurchase` aceita data em mês futuro. `createPurchase` continua recusando ("Compra parcelada não aceita data em mês futuro."). |
| RN-02 | As demais validações e o recálculo de [`parcelamento.md`](parcelamento.md) (RN-01, RN-02, RN-05, RN-06) não mudam. Parcelas que caírem até o mês corrente continuam sendo gravadas. |
| RN-03 | A parcela prevista traz o que o diálogo precisa: id da compra, valor total, nº de parcelas, parcela inicial, categoria. O formato salvo não muda. |

## 5. Cenários (BDD)

Hoje é **25/10/2026**, e o cartão "Nubank" tem a compra "Fone" de R$ 100,00 em 3x, com a parcela 1 em 15/10/2026.

```gherkin
# language: pt

Funcionalidade: Editar parcela prevista

  # --- RF-01 / D4 ---------------------------------------------------------------
  Cenário: A prévia mostra o botão de editar
    Quando eu abro novembro de 2026
    Então a parcela "Fone" "2/3" tem o botão "Editar compra parcelada"
    E uma cobrança recorrente prevista não tem botão

  # --- RF-02 / D3 / RN-01 -------------------------------------------------------
  Cenário: Abrir a edição a partir de uma parcela prevista
    Quando eu abro novembro de 2026
    E toco em "Editar compra parcelada" na parcela "Fone" "2/3"
    Então vejo "Editar compra parcelada" com valor total "100", "3" parcelas, "Parcela neste mês" "2" e data 15/11/2026

  # --- D2 / RF-03 / RN-02 -------------------------------------------------------
  Cenário: Editar o valor total pela parcela prevista
    Quando eu abro novembro de 2026
    E edito "Fone" pela parcela "2/3" com valor total "150"
    Então novembro de 2026 mostra "Fone" "2/3" de R$ 50,00
    E a parcela "1/3" de outubro de 2026 passa a valer R$ 50,00

  Cenário: Mudar o nº de parcelas pela parcela prevista
    Quando eu abro novembro de 2026
    E edito "Fone" pela parcela "2/3" para "4" parcelas
    Então existem parcelas previstas até janeiro de 2027

  # --- RN-01 --------------------------------------------------------------------
  Cenário: Criar compra parcelada em mês futuro continua recusado
    Quando eu registro uma compra parcelada com data em dezembro de 2026
    Então vejo "Compra parcelada não aceita data em mês futuro."
```

### Matriz de rastreabilidade

| Requisito | Cenário |
| --------- | ------- |
| RF-01, D4 | A prévia mostra o botão de editar |
| RF-02, D3 | Abrir a edição a partir de uma parcela prevista |
| RF-03, D2, RN-02 | Editar o valor total…; Mudar o nº de parcelas… |
| RN-01 | Criar compra parcelada em mês futuro continua recusado; Abrir a edição… |
| RN-03 | Abrir a edição… (o diálogo recebe os dados da compra) |

## 6. Modelo de dados e migração

Não muda. Só o tipo `PlannedInstallment` (resposta da prévia) ganha o campo `purchase` com `{ id, totalAmount, installmentCount, firstInstallment }`, o mesmo de `Movement`.

## 7. Contrato da camada de dados

- `getMonthPreview`: cada item de parcela traz `purchase`.
- `updatePurchase`: deixa de recusar data em mês futuro (`requirePurchase` recebe a regra pelo modo criar/editar).

## 8. Interface

- Linha de parcela prevista com `purchase`: botão "Editar compra parcelada" (mesmo ícone do lápis), que abre o diálogo de compra parcelada preenchido (RF-02).

## 9. Fora de escopo

- Excluir compra parcelada pela prévia (D5).
- Editar cobrança recorrente prevista (D4).
- Editar uma única parcela sem mudar a compra (D2).

## 10. Critérios de aceite

- [ ] RF-01: botão só nas parcelas previstas de compra parcelada. _(implementado; não verificado no navegador)_
- [ ] RF-02: diálogo abre com os dados da parcela da linha. _(implementado; não verificado no navegador)_
- [ ] RF-03: prévia e Histórico atualizam após salvar. _(implementado; não verificado no navegador)_
- [ ] RN-01: edição aceita mês futuro; criação continua recusando. _(implementado; não verificado no navegador)_
- [x] `npm run typecheck` e `npm run build` passam.

## 11. Tarefas

1. `store.ts`: `purchase` em `PlannedInstallment` (RN-03) e `requirePurchase` aceitando mês futuro na edição (RN-01).
2. `api.ts`: tipos/hooks, se o tipo da prévia for declarado lá.
3. `dashboard.tsx`: botão de editar nas linhas previstas de compra parcelada e abertura do diálogo (RF-01, RF-02).
4. `FUNCIONALIDADES.md` (seção nova + ajuste da prévia na seção 11) e nota em `specs/parcelamento.md`.

## 12. Roteiro de verificação

1. Registrar "Fone" em 3x em outubro, abrir novembro, editar pela parcela 2/3 e conferir valor, parcelas e Histórico.
2. Tentar criar uma compra parcelada com data futura e ver o erro.
3. Conferir que a cobrança recorrente prevista continua sem botão.
