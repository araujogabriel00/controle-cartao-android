# Spec — Compras do cartão em qualquer mês

| Campo | Valor |
| ----- | ----- |
| Status | Implementada |
| Criada em | 26/10/2026 |
| Escopo | `src/data/store.ts`, `src/data/api.ts`, `src/pages/dashboard.tsx`, `src/pages/compras.tsx`, `src/components/*` (diálogos compartilhados), `FUNCIONALIDADES.md`, `README.md` |
| Depende de | [`parcelamento.md`](parcelamento.md), [`compra-recorrente.md`](compra-recorrente.md), [`editar-parcela-prevista.md`](editar-parcela-prevista.md), [`todas-as-compras.md`](todas-as-compras.md) |
| Substitui em parte | [`editar-parcela-prevista.md`](editar-parcela-prevista.md): D4 (recorrente prevista sem ação) e a recusa de data futura na criação (RN-01). [`todas-as-compras.md`](todas-as-compras.md): D5 (recorrente prevista não aparece). [`parcelamento.md`](parcelamento.md): RN-05 (data de compra parcelada só até o mês corrente). |

> Mudanças de comportamento entram primeiro aqui e só depois no código.

---

## 1. Contexto e objetivo

Hoje, num mês futuro:

- **compra à vista**: dá para registrar, editar e excluir;
- **compra parcelada**: dá para editar e excluir pela parcela prevista, mas **não dá para registrar** com data futura ("Compra parcelada não aceita data em mês futuro.");
- **compra recorrente**: dá para registrar (até 12 meses à frente), mas a cobrança **prevista** não tem editar nem excluir, nem na prévia do mês nem em "Todas as compras".

**Objetivo:** a pessoa pode **registrar, editar e excluir qualquer compra do cartão, de qualquer mês, seja à vista, parcelada ou recorrente**, com as mesmas ações no passado, no mês corrente e no futuro.

## 2. Glossário

| Termo | Definição |
| ----- | --------- |
| **Compra** | Qualquer lançamento no cartão: à vista, parcela de compra parcelada ou cobrança de compra recorrente. |
| **Parcela prevista** | Parcela de mês futuro, calculada da compra e ainda não gravada. |
| **Cobrança prevista** | Cobrança de compra recorrente de mês futuro (até 12 meses à frente), calculada da regra e ainda não gravada. |
| **Escopo** | "Só este mês" ou "Deste mês em diante", a pergunta que a compra recorrente já faz ([`compra-recorrente.md`](compra-recorrente.md)). |

## 3. Decisões de produto

| # | Decisão | Motivo |
| - | ------- | ------ |
| D1 | **A cobrança recorrente prevista ganha editar e excluir**, na prévia do mês futuro e em "Todas as compras". Os dois perguntam o escopo, como a cobrança gravada. | Pedido do usuário: qualquer compra, independente do mês. A camada de dados já aceita (`updateRecurring` e `deleteRecurring` recebem o mês). |
| D2 | **A compra parcelada pode ser registrada com data em mês futuro**, até 12 meses à frente (o mesmo teto da recorrente). A data dá o mês de "Parcela neste mês", como hoje. | Pedido do usuário. O teto evita datas absurdas e mantém uma regra só para o que é futuro. |
| D3 | **"Todas as compras" passa a listar também as cobranças recorrentes previstas** (até 12 meses à frente), nos grupos dos meses futuros. | Sem listar não há onde editar ou excluir pela tela. Revoga D5 de [`todas-as-compras.md`](todas-as-compras.md). |
| D4 | **As regras de cada tipo não mudam.** Parcela: editar e excluir valem para a compra parcelada inteira. Recorrente: escopo "só este mês" ou "deste mês em diante". À vista: só ela. | Mantém o que já foi aprovado. |
| D5 | **A navegação entre meses não muda**: Cartões abre até o último mês com algo previsto ou registrado. Para registrar num mês mais à frente, a pessoa usa o "+" e escolhe a data. | Fora do pedido; evita abrir meses vazios. |

## 4. Requisitos

### 4.1 Requisitos funcionais (RF)

| ID | Requisito |
| -- | --------- |
| RF-01 | Na prévia de mês futuro, a cobrança recorrente prevista tem os botões editar e excluir. Os dois abrem a pergunta de escopo antes do diálogo ou da confirmação. |
| RF-02 | Em "Todas as compras", as cobranças recorrentes previstas aparecem nos grupos dos meses futuros, com o selo "Mensal" e "prevista", e têm editar e excluir (RF-01). |
| RF-03 | Registrar compra parcelada com data em mês futuro (até 12 meses à frente) funciona: nenhuma parcela é gravada ainda e todas aparecem como previstas. |
| RF-04 | Registrar compra à vista e compra recorrente em qualquer mês continua como hoje. |
| RF-05 | Editar e excluir compra à vista e compra parcelada em qualquer mês continuam como hoje, na prévia e em "Todas as compras". |

### 4.2 Regras de negócio (RN)

| ID | Regra |
| -- | ----- |
| RN-01 | `createPurchase` aceita data de até 12 meses à frente do mês corrente. Além disso, recusa com "A data deve ser de até 12 meses à frente.", a mesma mensagem da recorrente. |
| RN-02 | Com `firstMonth` futuro, `syncPurchases` não grava parcela (já para no mês corrente) e o mês não é iniciado (`ensureMonthOf`). |
| RN-03 | Editar a cobrança prevista com escopo "só este mês" guarda uma exceção do mês (`recurringExceptions`); com "deste mês em diante" divide a regra, como em [`compra-recorrente.md`](compra-recorrente.md) (RN-05, RN-06). A data editada deve cair no mês da cobrança. |
| RN-04 | Excluir a cobrança prevista segue [`compra-recorrente.md`](compra-recorrente.md) (RN-07, RN-08): "só este mês" pula o mês; "deste mês em diante" encerra a regra no mês anterior. |
| RN-05 | `getAllMovements` devolve também as cobranças previstas (`kind: 'recurring'`). O total de um mês na tela continua batendo com a fatura daquele mês no card do cartão. |
| RN-06 | O formato salvo não muda. |

## 5. Cenários (BDD)

Hoje é **26/10/2026**, cartão "Nubank" selecionado, com a compra recorrente "Academia" de R$ 100,00 todo dia 10, desde setembro de 2026.

```gherkin
# language: pt

Funcionalidade: Compras do cartão em qualquer mês

  # --- RF-01 / RN-03 / RN-04 ----------------------------------------------------
  Cenário: Editar a cobrança prevista só neste mês
    Quando abro dezembro de 2026
    E toco em editar em "Academia" e escolho "Só este mês"
    E mudo o valor para "120"
    Então dezembro de 2026 mostra "Academia" de R$ 120,00
    E janeiro de 2027 mostra "Academia" de R$ 100,00

  Cenário: Editar a cobrança prevista deste mês em diante
    Quando abro dezembro de 2026
    E toco em editar em "Academia" e escolho "Deste mês em diante"
    E mudo o valor para "120"
    Então novembro de 2026 mostra "Academia" de R$ 100,00
    E dezembro de 2026 e janeiro de 2027 mostram "Academia" de R$ 120,00

  Cenário: Excluir a cobrança prevista só neste mês
    Quando abro dezembro de 2026
    E toco em excluir em "Academia", escolho "Só este mês" e confirmo
    Então dezembro de 2026 não mostra "Academia"
    E janeiro de 2027 mostra "Academia"

  Cenário: Excluir a cobrança prevista deste mês em diante
    Quando abro dezembro de 2026
    E toco em excluir em "Academia", escolho "Deste mês em diante" e confirmo
    Então novembro de 2026 mostra "Academia"
    E dezembro de 2026 e janeiro de 2027 não mostram "Academia"

  # --- RF-02 / RN-05 ------------------------------------------------------------
  Cenário: Todas as compras lista a cobrança prevista
    Quando abro "Todas as compras"
    Então os grupos novembro de 2026 em diante mostram "Academia" com "Mensal" e "prevista"
    E o total de novembro de 2026 é igual à fatura de novembro no card do cartão

  Cenário: Excluir a cobrança prevista por Todas as compras
    Quando abro "Todas as compras"
    E toco em excluir em "Academia" de dezembro, escolho "Só este mês" e confirmo
    Então o grupo dezembro de 2026 não mostra "Academia"
    E continuo na tela de todas as compras

  # --- RF-03 / RN-01 / RN-02 ----------------------------------------------------
  Cenário: Registrar compra parcelada em mês futuro
    Quando registro a compra parcelada "Sofá" de R$ 300,00 em 3x com data 15/12/2026
    Então dezembro de 2026 mostra "Sofá" "1/3" de R$ 100,00 como "prevista"
    E outubro e novembro de 2026 não mostram "Sofá"

  Cenário: Compra parcelada além de 12 meses é recusada
    Quando registro uma compra parcelada com data em dezembro de 2027
    Então vejo "A data deve ser de até 12 meses à frente."

  # --- RF-04 / RF-05 ------------------------------------------------------------
  Cenário: Compra à vista em mês futuro
    Quando registro a compra "Cinema" de R$ 40,00 com data 20/12/2026
    Então dezembro de 2026 mostra "Cinema"
    E posso editá-la e excluí-la

  Cenário: Compra parcelada prevista continua editável e excluível
    Dado a compra parcelada "Fone" de R$ 100,00 em 3x com a parcela 1 em 15/10/2026
    Quando abro novembro de 2026
    Então a parcela "Fone" "2/3" tem editar e excluir
```

### Matriz de rastreabilidade

| Requisito | Cenário |
| --------- | ------- |
| RF-01, RN-03 | Editar a cobrança prevista só neste mês; Editar a cobrança prevista deste mês em diante |
| RF-01, RN-04 | Excluir a cobrança prevista só neste mês; Excluir a cobrança prevista deste mês em diante |
| RF-02, RN-05 | Todas as compras lista a cobrança prevista; Excluir a cobrança prevista por Todas as compras |
| RF-03, RN-01, RN-02 | Registrar compra parcelada em mês futuro; Compra parcelada além de 12 meses é recusada |
| RF-04 | Compra à vista em mês futuro |
| RF-05 | Compra à vista em mês futuro; Compra parcelada prevista continua editável e excluível |
| RN-06 | Sem mudança de formato (nada a migrar) |

## 6. Modelo de dados e migração

Não muda (RN-06).

## 7. Contrato da camada de dados

- `requirePurchase`: na criação, troca a recusa de mês futuro pelo teto de 12 meses à frente (RN-01). A edição não muda.
- `getAllMovements`: `planned` passa a incluir as cobranças recorrentes previstas (RN-05).
- `updateRecurring` e `deleteRecurring`: sem mudança; já recebem o mês da cobrança.

## 8. Interface

- `dashboard.tsx` (prévia de mês futuro): a linha de cobrança recorrente prevista vira botão e ganha editar e excluir, abrindo o `ScopeDialog` (RF-01).
- `compras.tsx`: mostra as cobranças previstas nos meses futuros, com os mesmos botões (RF-02).
- Reaproveita o `ScopeDialog` e o diálogo de compra recorrente; a linha prevista passa o `recurringId` e o mês da cobrança no lugar de um `Movement`.

## 9. Fora de escopo

- Abrir meses futuros além do último com algo previsto (D5).
- Editar ou excluir uma única parcela mantendo as outras (D4).
- Compras de benefícios, contas fixas e gastos do dia a dia (têm telas próprias).

## 10. Critérios de aceite

- [x] RN-03, RN-04: editar e excluir a cobrança prevista, nos dois escopos (verificado exercitando `store.ts` no navegador).
- [x] RN-01, RN-02, RN-05: parcelada em mês futuro fica toda prevista, recusa além de 12 meses, `getAllMovements` traz as cobranças previstas.
- [x] RF-02: em "Todas as compras", a cobrança prevista aparece e "editar" abre a pergunta de escopo e o diálogo (conferido no navegador).
- [ ] RF-01: o toque na cobrança prevista na prévia do mês (`dashboard.tsx`) não foi clicado no navegador; usa o mesmo código de escopo da tela de compras.
- [ ] RF-04, RF-05 e o total do mês igual à fatura (RN-05): não conferidos na interface.
- [x] `npm run typecheck` passa; `npm run build` rodado ao final.

## 11. Tarefas

1. `store.ts`: teto de 12 meses na criação de compra parcelada (RN-01, RN-02) e cobranças previstas em `getAllMovements` (RN-05).
2. `api.ts`: tipo de `getAllMovements`, se declarado lá.
3. `dashboard.tsx`: linha de cobrança prevista com editar e excluir e pergunta de escopo (RF-01).
4. `compras.tsx`: listar e agir nas cobranças previstas (RF-02).
5. `FUNCIONALIDADES.md` (seção nova com os cenários principais e ajuste das seções de prévia, parcelamento e Todas as compras) e notas nas specs substituídas em parte.

## 12. Roteiro de verificação

1. Criar "Academia" recorrente desde setembro; abrir dezembro; editar e excluir nos dois escopos e conferir novembro e janeiro.
2. Em "Todas as compras", conferir as cobranças previstas, o total do mês contra o card e a exclusão sem sair da tela.
3. Registrar parcelada com data em dezembro: parcelas previstas, nada gravado. Tentar uma data de dezembro de 2027 e ver o erro.
4. Conferir que à vista e parcelada continuam editáveis e excluíveis em mês futuro.
