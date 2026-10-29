# Spec — Aba Entradas na Nova versão (v2, parte 4)

| Campo | Valor |
| ----- | ----- |
| Status | Proposta |
| Criada em | 29/10/2026 |
| Escopo | `src/pages/entradas.tsx`, novo `src/components/origin-rows.tsx`, `src/components/charts/diverging-bars.tsx` (removido se nada mais o usar), `FUNCIONALIDADES.md`, `README.md` |
| Depende de | [`redesign-v2-fundacao.md`](redesign-v2-fundacao.md) (casco, tema, olho), [`redesign-opcao-d-entradas.md`](redesign-opcao-d-entradas.md), [`telas-de-entradas.md`](telas-de-entradas.md), [`contas-e-gastos.md`](contas-e-gastos.md) |
| Substitui em parte | O gráfico "Entrou e saiu" de barras divergentes e o saldo sem apoio de [`redesign-opcao-d-entradas.md`](redesign-opcao-d-entradas.md) (D2 a D6) na **aba Entradas**. A tela "Resumo do mês" não muda. |
| Referência visual | Canvas "Controle do Cartão", grupo v2, tela V2_02 (Entradas), clara e escura |

> Mudanças de comportamento entram primeiro aqui e só depois no código.

---

## 1. Contexto e objetivo

A fundação da v2 trocou o casco do app (barra inferior, cabeçalho, tema), mas deixou o **conteúdo** da aba Entradas como estava na Opção D: o saldo solto no alto e um gráfico de barras que sai do meio para os dois lados. Esse gráfico pede para a pessoa interpretar o desenho; o desenho v2 mostra as mesmas quatro origens como **linhas que se tocam**, cada uma com nome, quantidade, valor com sinal e uma barra simples, e conta de onde o saldo vem.

**Objetivo:** deixar a aba Entradas igual à tela V2_02: o saldo com a explicação em uma linha, e as quatro origens como linhas tocáveis com barra, no lugar do gráfico. Nenhuma regra de cálculo muda.

## 2. Decisões de produto

| # | Decisão | Motivo |
| - | ------- | ------ |
| D1 | O **Saldo** continua no topo, em destaque, e ganha uma linha de apoio: "Começou o mês com **R$ anterior** · resultado **± R$ resultado**". | O saldo deixa de ser um número solto: mostra de onde veio, sem abrir outra tela. |
| D2 | O gráfico de barras divergentes é trocado por uma seção **"Entrou e saiu"** com um cartão de **4 linhas**: Entradas, Contas fixas, Gastos do dia a dia, Cartões, nesta ordem. | Linhas de 72 px são mais fáceis de tocar e de ler que um gráfico. |
| D3 | Cada linha mostra o ícone, o nome, a quantidade ("1 lançamento", "nenhuma neste mês"), o valor com sinal, uma seta e uma **barra** abaixo. Tocar na linha abre a lista correspondente (comportamento de [`telas-de-entradas.md`](telas-de-entradas.md)). | A pessoa vê o peso de cada origem e chega à lista em um toque. |
| D4 | A barra de cada linha compara a linha com o **total que entrou**: entrada 100%, e cada saída em proporção ao total de entradas (no máximo 100%). Uma nota explica: "As barras comparam cada linha com o total que entrou." | Responde "quanto do que entrou foi para cada coisa". |
| D5 | Sinais: entradas levam "+", saídas levam "−", e zero aparece sem sinal. Barras de Entradas em `chart-in`, as de saídas em `chart-out`. | Mantém a regra de sinais do app; a cor nunca é o único sinal. |
| D6 | "Resumo do mês" passa a ser um link no **cabeçalho da seção**, no lugar do botão solto acima do saldo. | Agrupa o link com o que ele resume, como no desenho. |
| D7 | Saldo negativo mantém a cor de alerta e o aviso "As saídas passaram das entradas e do saldo anterior." | Regra existente. |
| D8 | O "Resumo do mês" (tela) e as quatro listas não mudam. | Escopo desta parte é a aba. |

## 3. Requisitos

### 3.1 Requisitos funcionais (RF)

| ID | Requisito |
| -- | --------- |
| RF-01 | O primeiro bloco da aba é o **Saldo** do mês aberto, com a linha de apoio "Começou o mês com R$ X · resultado ± R$ Y" (D1). |
| RF-02 | Abaixo vem a seção **"Entrou e saiu"**, com o link "Resumo" à direita do título, que abre a tela Resumo do mês. |
| RF-03 | A seção mostra um cartão com as 4 origens, cada uma como botão de linha inteira (mínimo 72 px) que abre a lista correspondente, no mês aberto. |
| RF-04 | Cada linha mostra ícone, nome, quantidade, valor com sinal (D5), seta e barra proporcional (D4). |
| RF-05 | A quantidade diz "1 lançamento" / "N lançamentos" (Entradas), "1 conta" / "N contas" (Contas fixas), "1 gasto" / "N gastos" (Gastos do dia a dia) e "1 fatura" / "N faturas" (Cartões); sem itens: "nenhuma neste mês" (feminino) ou "nenhum neste mês" (masculino). |
| RF-06 | Abaixo do cartão há a nota "As barras comparam cada linha com o total que entrou." |
| RF-07 | Com saldo negativo, o valor do Saldo fica na cor de alerta e o aviso aparece logo abaixo (D7). |
| RF-08 | Se não entrou nada no mês, as barras das saídas ficam vazias (zero) e a nota continua visível. |
| RF-09 | Com o olho fechado, valores e a linha de apoio seguem a regra do olho (R$ ••••), e as barras viram uma barra neutra de comprimento fixo. |

### 3.2 Regras de negócio (RN)

| ID | Regra |
| -- | ----- |
| RN-01 | Nenhum cálculo muda. Os valores vêm de `useGetMonthCash`; as quantidades vêm de `useGetIncomes`, `useGetBills`, `useGetDailyExpenses` e de `useGetCards` (cartões com fatura maior que zero). |
| RN-02 | A tela só lê: não grava nada e não altera cartões, compras nem benefícios. |
| RN-03 | O mês continua o do fim do endereço, e as setas respeitam o intervalo de Entradas (como hoje). |
| RN-04 | A largura da barra é `min(100, valor ÷ total de entradas × 100)`; com total de entradas zero, todas as barras ficam em zero. Valor positivo e muito pequeno tem no mínimo 4 px, para existir na tela. |
| RN-05 | Os `data-testid` `section-balance`, `text-cash-balance`, `text-cash-warning` e `button-summary` são mantidos. `section-chart` passa a ser a seção "Entrou e saiu". Novos: `row-origin-income`, `row-origin-bills`, `row-origin-daily`, `row-origin-cards`, `text-origin-count-…`, `bar-origin-…`. |
| RN-06 | Se uma das leituras de quantidade falhar, a linha mostra o valor e deixa a quantidade em branco; as outras linhas seguem normais. |
| RN-07 | Texto de no mínimo 14 px (13 px só na nota), linhas com no mínimo 72 px, ícones de 18 px e nada depende só de cor: valor, sinal e quantidade dizem o mesmo que a barra. |
| RN-08 | Cada barra tem texto para leitor de tela e há uma tabela de apoio só para leitor de tela com origem, valor e percentual. |

## 4. Cenários

```gherkin
# language: pt

Funcionalidade: Aba Entradas na nova versão

  Cenário: Saldo com a explicação
    Dado que o mês começou com R$ 8.239,70 e o resultado é + R$ 4.109,84
    Quando eu abro a aba "Entradas"
    Então vejo o saldo R$ 12.349,54
    E a linha "Começou o mês com R$ 8.239,70 · resultado + R$ 4.109,84"

  Cenário: Origens como linhas
    Dado que o mês tem entradas de R$ 4.527,00 e uma fatura de R$ 417,16
    Quando eu olho "Entrou e saiu"
    Então vejo "Entradas" com "+ R$ 4.527,00" e "1 lançamento"
    E "Cartões" com "− R$ 417,16" e "1 fatura"
    E "Contas fixas" e "Gastos do dia a dia" com "R$ 0,00" e "nenhuma neste mês" / "nenhum neste mês", sem sinal

  Cenário: Barras proporcionais
    Dado que entraram R$ 4.527,00 e saíram R$ 417,16 em cartões
    Então a barra de "Entradas" está cheia
    E a barra de "Cartões" tem cerca de 9% da largura

  Cenário: Abrir uma lista
    Quando eu toco na linha "Cartões"
    Então abre a tela de faturas por cartão do mês aberto

  Cenário: Resumo do mês
    Quando eu toco em "Resumo" no cabeçalho da seção
    Então abre a tela "Resumo do mês"

  Cenário: Saldo negativo
    Dado que as saídas passam das entradas e do saldo anterior
    Então o saldo aparece na cor de alerta
    E vejo "As saídas passaram das entradas e do saldo anterior."

  Cenário: Mês sem entradas
    Dado que o mês só tem uma fatura
    Então as barras de saída ficam vazias
    E a nota sobre as barras continua visível

  Cenário: Valores escondidos
    Quando eu toco no olho
    Então os valores e a linha de apoio aparecem como "R$ ••••"
    E as barras viram uma barra neutra do mesmo tamanho em todas as linhas

  Cenário: Falha numa contagem
    Dado que a leitura de contas fixas falha
    Quando eu abro a aba "Entradas"
    Então "Contas fixas" mostra o valor sem a quantidade
    E as outras linhas aparecem normalmente

  Cenário: Leitor de tela
    Quando um leitor de tela chega à linha "Cartões"
    Então lê o nome, a quantidade e o valor
    E a tabela de apoio traz origem, valor e percentual das quatro linhas
```

| Requisito | Cenário |
| --------- | ------- |
| RF-01, RF-07 | Saldo com a explicação; Saldo negativo |
| RF-02, D6 | Resumo do mês |
| RF-03, RF-04, RF-05, D3, D5 | Origens como linhas; Abrir uma lista |
| RF-06, D4, RN-04 | Barras proporcionais |
| RF-08 | Mês sem entradas |
| RF-09 | Valores escondidos |
| RN-01, RN-02, RN-03 | Verificação manual: comparar com as listas e com o Resumo |
| RN-05 | Verificação por busca dos `data-testid` |
| RN-06 | Falha numa contagem |
| RN-07 | Verificação manual no roteiro |
| RN-08 | Leitor de tela |

## 5. Dados e contrato

Sem mudança no formato salvo, na camada de dados nem nos hooks. A aba passa a usar também `useGetIncomes`, `useGetBills`, `useGetDailyExpenses` e `useGetCards` do mês aberto, só para as quantidades.

## 6. Interface

- **Saldo:** rótulo de 14 px, valor em fonte de números a 36 px (o mesmo tamanho do desenho), linha de apoio de 14 px com os valores em fonte de números.
- **Seção "Entrou e saiu":** título de seção com o link "Resumo ›" à direita (alvo de 48 px).
- **Cartão com 4 linhas:** divisórias de 1 px (`line`), cada linha com mínimo de 72 px: ícone de 18 px (entrada, repetição, cesta e cartão), nome em 16 px/600, quantidade em 14 px `ink-soft`, valor em fonte de números a 16 px, seta de 20 px, e abaixo a barra de 8 px de altura, raio de 4 px, em trilho `chart-track`.
- **Nota** de 13 px abaixo do cartão.
- Referência exata: V2_02 (clara e escura) do canvas.

## 7. Fora de escopo

- Tela "Resumo do mês", as quatro listas de Entradas e os formulários (nada muda).
- Abas Cartões e Benefícios, Histórico e Categorias: ficam para as próximas partes da v2.
- Gráfico de evolução do saldo na aba (já existe no Início).
- Escolher outra base para as barras (sempre o total que entrou).

## 8. Critérios de aceite

- [ ] `npm run typecheck` e `npm run build` passam.
- [ ] A aba mostra o saldo com a linha de apoio e as 4 linhas conforme a seção 4, nos temas claro e escuro.
- [ ] Os valores e as quantidades batem com o Resumo do mês e as listas do mesmo mês.
- [ ] Cada linha abre a lista certa, no mês aberto; "Resumo" abre o Resumo do mês.
- [ ] Barras proporcionais conforme RN-04; mês sem entradas com barras vazias.
- [ ] Saldo negativo na cor de alerta com o aviso.
- [ ] Com o olho fechado, nenhum valor e nenhum comprimento de barra aparece.
- [ ] Falha numa contagem não derruba a tela.
- [ ] Leitor de tela: nome, quantidade e valor lidos; tabela de apoio presente.
- [ ] Sem scroll horizontal em 360 px; linhas com no mínimo 72 px.
- [ ] `FUNCIONALIDADES.md` (nova seção 35 e ajuste das seções 23 e 27) e `README.md` atualizados.

## 9. Tarefas

1. Componente `OriginRows` (linha com ícone, quantidade, valor com sinal, barra e a barra neutra do olho), com texto para leitor de tela e `ChartTable`.
2. Reescrever o miolo de `entradas.tsx`: saldo com linha de apoio, seção "Entrou e saiu" com link "Resumo", nota (RF-01 a RF-09).
3. Quantidades por origem com tolerância a falha (RN-06).
4. Remover `diverging-bars.tsx` e usos soltos, se mais nada o usar.
5. `FUNCIONALIDADES.md` e `README.md`.
6. Rodar `typecheck` e `build`.

## 10. Roteiro de verificação

1. `npm run dev`, abrir `#/entradas` em 390 px, nos temas claro e escuro.
2. Conferir os cenários da seção 4, inclusive um mês com saldo negativo (conta fixa maior que as entradas) e um mês sem entradas.
3. Comparar saldo, anterior, resultado e as quatro linhas com o Resumo do mês e as listas.
4. Tocar em cada linha e em "Resumo".
5. Fechar o olho e conferir texto, `aria-label` e HTML (sem valor e sem comprimento de barra).
6. Simular erro numa contagem (erro temporário em `useGetBills`) e ver só a linha afetada perder a quantidade.
