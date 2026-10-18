# Spec — Telas próprias de entradas, contas fixas, gastos do dia a dia e cartões

| Campo | Valor |
| ----- | ----- |
| Status | Implementada |
| Criada em | 18/10/2026 |
| Escopo | `src/pages/entradas.tsx`, `src/pages/entradas-lista.tsx` (novo), `src/components/entry-dialogs.tsx` (novo), `src/components/quick-add.tsx`, `src/App.tsx`, `src/lib/format.ts`, `FUNCIONALIDADES.md`, `README.md` |
| Depende de | [`entradas.md`](entradas.md), [`contas-e-gastos.md`](contas-e-gastos.md), [`mes-compartilhado.md`](mes-compartilhado.md), [`botao-lancar.md`](botao-lancar.md) |
| Substitui em parte | As listas de entradas, contas fixas e gastos do dia a dia na própria aba Entradas ([`entradas.md`](entradas.md), [`contas-e-gastos.md`](contas-e-gastos.md)): passam para telas próprias. As regras (recorrência, escopo "só este mês" / "este e os próximos", saldo) não mudam. |

> Mudanças de comportamento entram primeiro aqui e só depois no código.

## 1. Contexto e objetivo

A aba Entradas junta, numa tela só, o resumo do mês, a lista de entradas, a de contas fixas e a de gastos do dia a dia (com o resumo por categoria). A tela fica longa.

**Objetivo:** a aba Entradas fica só com o **resumo do mês**; **entradas**, **contas fixas**, **gastos do dia a dia** e **cartões** ganham **telas próprias**, abertas ao tocar no respectivo valor do resumo.

## 2. Decisões de produto

| # | Decisão | Motivo |
| - | ------- | ------ |
| D1 | **No "Resumo do mês", os blocos "Entradas", "Contas fixas", "Gastos do dia a dia" e "Cartões" viram botões** (com uma seta) que abrem a tela respectiva. | Pedido do usuário. |
| D2 | **O bloco "Cartões" segue o mesmo comportamento dos outros:** é um botão que abre a tela **Cartões** (`#/entradas/lista/cartoes`), e o link "Ver cartões" sai. Saldo anterior, Resultado do mês e Saldo não são tocáveis. | Pedido do usuário. |
| D11 | **A tela Cartões mostra o total das faturas do mês e uma linha por cartão** (cor, nome, fatura e nº de compras), sem botões de criar nem de editar. Tocar numa linha **abre a aba Cartões naquele mês com aquele cartão selecionado**. | Fica no mesmo formato das outras telas; o detalhe das compras continua na aba Cartões. |
| D3 | **A aba Entradas não mostra mais as três listas**, só o resumo do mês e o saldo. | Pedido do usuário (as listas vão para telas próprias). |
| D4 | **Cada tela mostra o mês aberto**: botão "Voltar", título (Entradas, Contas fixas, Gastos do dia a dia), o mês, o **total do mês** e a **lista** com editar e excluir, como na aba hoje. | Mesmo conteúdo, em outro lugar. |
| D5 | **As telas não têm botão de criar:** saem "Nova entrada", "Nova conta fixa" e "Novo gasto". Criar é só pelo "+" do rodapé. Editar e excluir ficam na lista. | Pedido do usuário. Mesma regra de [`botao-lancar.md`](botao-lancar.md) (D13), agora também para as Entradas. |
| D6 | **A tela de gastos do dia a dia traz o resumo "Por categoria"**, como hoje. | Faz parte do bloco que sai da aba. |
| D7 | **O mês aberto é o do resumo** e não troca dentro das telas: para outro mês, volta-se ao resumo. | Mantém as telas simples; o mês continua compartilhado e lembrado (spec do mês compartilhado). |
| D8 | **O rodapé aparece nas telas** (são parte de Entradas), e lançar por ele atualiza a lista aberta. | Consistência com [`botao-lancar.md`](botao-lancar.md). |
| D9 | **Sem barra de abas e sem seletor de mês nas telas**, como no Histórico e em Categorias. | São telas de detalhe. |
| D10 | **Endereços:** `#/entradas/lista/entradas`, `#/entradas/lista/contas-fixas`, `#/entradas/lista/gastos` e `#/entradas/lista/cartoes`, e as mesmas com `/mes/AAAA-MM` no fim para outro mês que o corrente. | Segue o padrão `.../mes/AAAA-MM` do mês compartilhado. |

## 3. Requisitos

| ID | Requisito |
| -- | --------- |
| RF-01 | No "Resumo do mês", os blocos Entradas, Contas fixas, Gastos do dia a dia e Cartões são botões; tocar em um abre a tela dele, no mês aberto (D1, D10). |
| RF-02 | A aba Entradas só tem o resumo do mês e o saldo; as três listas saem dela (D3). |
| RF-08 | A tela Cartões lista os cartões do mês (cor, nome, fatura e nº de compras) e o total das faturas; tocar num cartão abre a aba Cartões nele, no mesmo mês (D11). |
| RF-03 | Cada tela tem "Voltar" (para o resumo no mesmo mês), título, mês, total do mês e a lista (D4, D9). |
| RF-04 | Nas telas, editar e excluir funcionam como hoje, inclusive o escopo "só este mês" / "este e os próximos" das entradas e contas fixas recorrentes. Criar é só pelo "+" do rodapé; as telas não têm botão de criar (D5). |
| RF-05 | A tela de gastos do dia a dia mostra o resumo "Por categoria" (D6). |
| RF-06 | Um mês que a aba Entradas não abre leva ao mês mais próximo que ela abre, na mesma tela; um mês inválido leva ao mês corrente. |
| RF-07 | O app lembra o último mês aberto também ao navegar pelas telas, como nas três abas (D7). |
| RN-01 | Os valores do resumo e do saldo são os mesmos de hoje; o resumo e a tela de uma lista mostram o mesmo total. |
| RN-02 | Lançar pelo rodapé estando numa tela atualiza a lista, o total e o resumo (D8). |
| RN-03 | Não muda o formato salvo (`version: 10`) nem `store.ts`. |

## 4. Cenários

```gherkin
# language: pt
Funcionalidade: Telas próprias de entradas, contas fixas e gastos do dia a dia
  Contexto:
    Dado que hoje é 18/10/2026
    E outubro tem a entrada "Salário" de R$ 5.000,00, a conta fixa "Aluguel" de R$ 1.500,00 e o gasto "Mercado" de R$ 300,00

  Cenário: A aba Entradas só tem o resumo
    Quando eu abro a aba "Entradas"
    Então vejo o "Resumo do mês" com o saldo
    E não vejo as listas de entradas, contas fixas e gastos

  Cenário: Abrir a tela de entradas
    Quando eu toco no bloco "Entradas" do resumo
    Então abre a tela "Entradas" de outubro de 2026 com o total R$ 5.000,00
    E a lista mostra "Salário"

  Cenário: Abrir a tela de contas fixas
    Quando eu toco no bloco "Contas fixas" do resumo
    Então abre a tela "Contas fixas" com o total R$ 1.500,00 e "Aluguel"

  Cenário: Abrir a tela de gastos do dia a dia
    Quando eu toco no bloco "Gastos do dia a dia" do resumo
    Então abre a tela "Gastos do dia a dia" com o total R$ 300,00, "Mercado" e o resumo "Por categoria"

  Cenário: Abrir a tela de cartões
    Dado que o "Nubank" tem fatura de R$ 200,00 (2 compras) e o "Inter" de R$ 100,00 (1 compra) em outubro
    Quando eu toco no bloco "Cartões" do resumo
    Então abre a tela "Cartões" de outubro de 2026 com o total R$ 300,00
    E a lista mostra "Nubank" R$ 200,00 · 2 compras e "Inter" R$ 100,00 · 1 compra
    E não há o link "Ver cartões" nem botão de criar

  Cenário: Abrir um cartão pela tela
    Dado que estou na tela "Cartões" de novembro de 2026
    Quando eu toco em "Inter"
    Então vejo a aba "Cartões" de novembro de 2026 com o "Inter" selecionado

  Cenário: Blocos que não abrem tela
    Então "Saldo anterior", "Resultado do mês" e "Saldo" não abrem tela

  Cenário: Voltar
    Dado que estou na tela "Contas fixas" de novembro de 2026
    Quando eu toco em "Voltar"
    Então vejo o resumo da aba "Entradas" de novembro de 2026

  Cenário: Editar uma conta fixa recorrente
    Dado que estou na tela "Contas fixas"
    Quando eu toco em "Editar Aluguel"
    Então o app pergunta se vale "Só este mês" ou "Este e os próximos"
    E ao salvar a lista e o total da tela mudam

  Cenário: Sem botão de criar nas telas
    Quando eu abro as telas "Entradas", "Contas fixas" e "Gastos do dia a dia"
    Então não há botão "Nova entrada", "Nova conta fixa" nem "Novo gasto"
    Mas o "+" do rodapé continua disponível

  Cenário: Criar pelo rodapé estando na tela
    Dado que estou na tela "Gastos do dia a dia"
    Quando eu toco no "+" do rodapé, em "Gasto do dia a dia" e salvo "Feira" de R$ 80,00
    Então a lista mostra "Feira" e o total sobe para R$ 380,00

  Cenário: Lançar pelo rodapé estando na tela
    Dado que estou na tela "Entradas"
    Quando eu toco no "+" do rodapé, em "Entrada" e salvo "Bônus" de R$ 1.000,00
    Então a lista mostra "Bônus" e o total sobe para R$ 6.000,00

  Cenário: Mês fora do alcance
    Dado que a aba Entradas abre até dezembro de 2026
    Quando eu abro "#/entradas/lista/entradas/mes/2027-03"
    Então vejo a tela "Entradas" de dezembro de 2026

  Cenário: A tela abre direto pelo endereço
    Quando eu abro "#/entradas/lista/gastos"
    Então vejo a tela "Gastos do dia a dia" do mês corrente
```

| Requisito | Cenário(s) |
| --------- | ---------- |
| RF-01, D1 | Abrir a tela de entradas / de contas fixas / de gastos do dia a dia |
| RF-02, D3 | A aba Entradas só tem o resumo |
| D2, RF-08, D11 | Abrir a tela de cartões; Abrir um cartão pela tela |
| D2 | Blocos que não abrem tela |
| RF-03, D4, D9 | Abrir as telas; Voltar |
| RF-04, D5 | Editar uma conta fixa recorrente; Sem botão de criar nas telas; Criar pelo rodapé estando na tela |
| RF-05, D6 | Abrir a tela de gastos do dia a dia |
| RF-06 | Mês fora do alcance |
| RF-07, D7 | (conferido no navegador: abrir um mês passado e reabrir o app) |
| RN-01 | Abrir as telas (total igual ao do resumo) |
| RN-02, D8 | Lançar pelo rodapé estando na tela |
| D10 | A tela abre direto pelo endereço |

## 5. Dados e contrato

Sem mudança no formato salvo (`version: 10`) nem em `store.ts`. As telas usam as mesmas consultas e mutações da aba (`useGetIncomes`, `useGetBills`, `useGetDailyExpenses`, `useGetMonthCash`, `useCreate*`, `useUpdate*`, `useDelete*`).

## 6. Interface

- `entradas.tsx`: fica com o resumo do mês e o saldo; os três blocos viram botões com uma seta; sai a lógica das listas e dos formulários.
- `entradas-lista.tsx` (novo): uma tela com `tipo` (`entradas` | `contas-fixas` | `gastos` | `cartoes`) que mostra "Voltar", título, mês, total, lista (e "Por categoria" nos gastos) e os formulários e o diálogo de escopo.
- `entry-dialogs.tsx` (novo): `IncomeDialog`, `BillDialog` e `DailyDialog` (movidos de `entradas.tsx`), usados pelas telas e pelo `quick-add.tsx`.
- `App.tsx`: rotas `/entradas/lista/:tipo` e `/entradas/lista/:tipo/mes/:month`, com a regra de mês mais próximo.
- `format.ts`: `monthInPath` já lê o mês do fim do endereço; sem mudança.
- 360 px: os blocos do resumo continuam em 2 colunas; as telas não ganham rolagem horizontal.

## 7. Fora de escopo

- Trocar de mês dentro das telas (D7).
- Tornar tocáveis o saldo anterior, o resultado e o saldo.
- Mudanças nas regras de recorrência, escopo ou saldo.

## 8. Critérios de aceite

- [x] RF-08 funciona (D2, D11). *Verificado no navegador: o bloco "Cartões" abre a tela com o total R$ 300,00 e uma linha por cartão (fatura e nº de compras); sem "Ver cartões" nem botões de criar; tocar em "Inter" abre a aba Cartões com ele selecionado; "Voltar" mantém o mês; sem rolagem horizontal a 360 px.*
- [x] RF-01 a RF-07 funcionam como descritos. *Verificados no navegador: os três blocos abrem a tela certa com o mesmo total do resumo; a aba só tem o resumo; sem botões de criar; editar uma conta fixa recorrente pergunta o escopo e atualiza a lista; criar pelo rodapé estando na tela atualiza a lista e o total; "Voltar" mantém o mês; mês fora do alcance vai para o mais próximo, mês inválido para o corrente e lista desconhecida para a aba. Lembrar o mês (RF-07) usa o mesmo gancho das abas, conferido só pelo código.*
- [x] Cenários da seção 4 conferidos no navegador, inclusive a 360 px (sem rolagem horizontal no resumo e nas telas). *Não testei excluir uma entrada recorrente pela tela (o fluxo é o mesmo código que existia na aba).*
- [x] `npm run typecheck` e `npm run build` passam.
- [x] `FUNCIONALIDADES.md` e `README.md` atualizados, e as specs `entradas.md` e `contas-e-gastos.md` têm a nota "Substituída em parte por `telas-de-entradas.md`".

## 9. Tarefas

1. Mover os três diálogos para `entry-dialogs.tsx` e ajustar o `quick-add.tsx`.
2. `entradas-lista.tsx` com as três telas.
3. `entradas.tsx`: tirar as listas e tornar os blocos botões.
4. `App.tsx`: rotas e regra de mês.
5. Atualizar `FUNCIONALIDADES.md`, `README.md` e as notas nas specs.
6. Verificar; marcar a spec `Implementada`.
