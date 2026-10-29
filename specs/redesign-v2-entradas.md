# Spec — Aba Entradas na Nova versão (v2, parte 4), no desenho v3

| Campo | Valor |
| ----- | ----- |
| Status | Proposta |
| Criada em | 29/10/2026 |
| Escopo | `src/pages/entradas.tsx`, novos `src/components/origin-rows.tsx` e `src/components/charts/balance-line.tsx`, `src/components/charts/diverging-bars.tsx` (removido se nada mais o usar), `FUNCIONALIDADES.md`, `README.md` |
| Depende de | [`redesign-v2-fundacao.md`](redesign-v2-fundacao.md) (casco, tema, olho), [`inicio-com-minigraficos.md`](inicio-com-minigraficos.md) (`getBalanceSeries`, cores dos gráficos), [`redesign-opcao-d-entradas.md`](redesign-opcao-d-entradas.md), [`telas-de-entradas.md`](telas-de-entradas.md), [`contas-e-gastos.md`](contas-e-gastos.md) |
| Substitui em parte | O gráfico "Entrou e saiu" de barras divergentes e o saldo sem apoio de [`redesign-opcao-d-entradas.md`](redesign-opcao-d-entradas.md) (D2 a D6) na **aba Entradas**. A tela "Resumo do mês" não muda. |
| Referência visual | Canvas "Controle do Cartão", grupo v2, tela **V3_02 (Entradas)**, clara e escura (a versão com o gráfico "Saldo mês a mês"; a V2_02 não é a referência) |

> Mudanças de comportamento entram primeiro aqui e só depois no código.

---

## 1. Contexto e objetivo

A fundação da v2 trocou o casco do app, mas deixou o **conteúdo** da aba Entradas como estava na Opção D: o saldo solto no alto e um gráfico de barras que sai do meio para os dois lados. O desenho escolhido para a aba é o da **versão 3** (a mesma do Início com mini-gráficos): o saldo com o resultado do mês, um gráfico de linha **"Saldo mês a mês"** e as quatro origens como linhas tocáveis com barra.

**Objetivo:** deixar a aba Entradas igual à tela V3_02. Nenhuma regra de cálculo muda.

## 2. Decisões de produto

| # | Decisão | Motivo |
| - | ------- | ------ |
| D1 | O **Saldo** continua no topo, em destaque, com a linha "**± R$ resultado** neste mês" abaixo. | Mostra para onde o mês empurrou o saldo, como no desenho v3. |
| D2 | Abaixo vem a seção **"Saldo mês a mês"**: linha com o **saldo ao fim de cada um dos últimos 6 meses** (o mês aberto e os 5 anteriores), com área preenchida, pontos, nomes dos meses abaixo, linhas de grade e valores dos eixos legíveis (0, meio e topo). O último ponto é maior e leva o valor escrito ao lado. | Dá tendência sem sair da aba. Usa os mesmos dados do mini-gráfico do Início, em tamanho completo. |
| D3 | Cada ponto do gráfico pode ser **tocado** (ou escolhido por teclado, com as setas): o mês escolhido aparece destacado e uma linha logo abaixo do título diz "Set: R$ 8.239,70". Sem escolha, mostra o último mês. | Leitura exata de qualquer mês, com alvo de toque grande (a coluna inteira do mês é o alvo, 48 px de largura ou mais). |
| D4 | As quatro origens (Entradas, Contas fixas, Gastos do dia a dia, Cartões) são **linhas de um cartão**, na mesma ordem, com ícone, nome, quantidade, valor com sinal, seta e barra. Tocar abre a lista correspondente. | Chegar à lista em um toque, com o peso de cada origem visível. |
| D5 | A barra de cada linha compara a linha com o **total que entrou**: entradas 100%, saídas em proporção (no máximo 100%). | Responde "quanto do que entrou foi para cada coisa". |
| D6 | Sinais: entradas levam "+", saídas "−", zero sem sinal. Cores: linha do saldo e barra de entradas em `chart-in`; barras de saída em `chart-out`. | Regra de sinais do app; cor nunca é o único sinal. |
| D7 | O link "**Resumo do mês**" **continua** na aba (o desenho v3 não o mostra, mas a fundação o colocou aqui e a tela não tem outro caminho), à direita do título do cartão de origens, que passa a se chamar "Entrou e saiu". | Não deixar o Resumo inalcançável. |
| D8 | Saldo negativo mantém a cor de alerta e o aviso "As saídas passaram das entradas e do saldo anterior." | Regra existente. |
| D9 | O "Resumo do mês" (tela) e as quatro listas não mudam. | Escopo desta parte é a aba. |

## 3. Requisitos

### 3.1 Requisitos funcionais (RF)

| ID | Requisito |
| -- | --------- |
| RF-01 | O primeiro bloco é o **Saldo** do mês aberto, com "± R$ resultado neste mês" (D1). |
| RF-02 | Segue a seção **"Saldo mês a mês"** com o gráfico de linha dos últimos 6 meses (D2). Com menos de 2 meses de histórico (ver RN-03), a seção mostra "Ainda sem histórico." no lugar do gráfico. |
| RF-03 | Tocar num mês do gráfico (ou usar as setas do teclado quando ele tem foco) destaca o ponto e mostra "‹mês›: R$ ‹saldo›" abaixo do título; sem escolha, mostra o mês aberto. |
| RF-04 | Depois vem o cartão **"Entrou e saiu"** com as 4 origens como botões de linha inteira (mínimo 72 px) que abrem a lista correspondente, no mês aberto, com o link "Resumo" no cabeçalho do cartão que abre o Resumo do mês (D7). |
| RF-05 | Cada linha mostra ícone, nome, quantidade, valor com sinal, seta e barra proporcional (D5, D6). |
| RF-06 | A quantidade diz "1 lançamento" / "N lançamentos" (Entradas), "1 conta" / "N contas" (Contas fixas), "1 gasto" / "N gastos" (Gastos do dia a dia) e "1 fatura" / "N faturas" (Cartões); sem itens: "nenhuma neste mês" (feminino) ou "nenhum neste mês" (masculino). |
| RF-07 | Com saldo negativo, o valor do Saldo fica na cor de alerta e o aviso aparece abaixo (D8). Pontos de saldo negativo no gráfico ficam abaixo do zero: a escala do gráfico inclui o negativo. |
| RF-08 | Se não entrou nada no mês, as barras das saídas ficam vazias (zero). |
| RF-09 | Com o olho fechado, valores, rótulos de eixo e o texto do mês escolhido seguem a regra do olho (R$ ••••), e o gráfico vira uma faixa neutra de altura fixa, sem linha. As barras das linhas viram uma barra neutra de comprimento fixo. |

### 3.2 Regras de negócio (RN)

| ID | Regra |
| -- | ----- |
| RN-01 | Nenhum cálculo muda. Os valores vêm de `useGetMonthCash`; a série do gráfico vem de `getBalanceSeries(mês aberto, 6)` (já criada em [`inicio-com-minigraficos.md`](inicio-com-minigraficos.md)); as quantidades vêm de `useGetIncomes`, `useGetBills`, `useGetDailyExpenses` e `useGetCards` (cartões com fatura maior que zero). |
| RN-02 | A tela só lê: não grava nada e não altera cartões, compras nem benefícios. |
| RN-03 | Meses anteriores ao primeiro mês com dados não entram na série; com menos de 2 pontos, não há gráfico (RF-02). |
| RN-04 | Escala do eixo vertical: de 0 (ou do menor saldo, se for negativo) até um valor "redondo" acima do maior saldo, com 3 marcas (início, meio, topo) escritas como "0", "7 mil", "14 mil". |
| RN-05 | A largura da barra é `min(100, valor ÷ total de entradas × 100)`; com total zero, todas ficam em zero. Valor positivo muito pequeno tem no mínimo 4 px. |
| RN-06 | `data-testid` mantidos: `section-balance`, `text-cash-balance`, `text-cash-warning`, `button-summary`. `section-chart` passa a ser a seção "Saldo mês a mês". Novos: `chart-balance-line`, `text-balance-selected`, `point-balance-AAAA-MM`, `row-origin-income`, `row-origin-bills`, `row-origin-daily`, `row-origin-cards`. |
| RN-07 | Falha numa leitura derruba só a parte afetada: sem a série, a seção mostra "Gráfico indisponível" e "Tentar novamente"; sem uma quantidade, a linha mostra o valor sem a quantidade. |
| RN-08 | Texto de no mínimo 14 px (12 px só nos rótulos dos eixos e dos meses); linhas com no mínimo 72 px; nada depende só de cor. |
| RN-09 | O gráfico tem `role="img"` com `aria-label` e uma tabela de apoio só para leitor de tela (mês e saldo); as linhas de origem têm texto próprio e tabela de apoio com valor e percentual. |
| RN-10 | `prefers-reduced-motion`: sem animação de desenho da linha. |

## 4. Cenários

```gherkin
# language: pt

Funcionalidade: Aba Entradas na nova versão (desenho v3)

  Cenário: Saldo com o resultado do mês
    Dado que o resultado do mês é + R$ 4.109,84 e o saldo R$ 12.349,54
    Quando eu abro a aba "Entradas"
    Então vejo o saldo R$ 12.349,54
    E a linha "+ R$ 4.109,84 neste mês"

  Cenário: Saldo mês a mês
    Dado que o app tem dados desde 6 meses atrás
    Quando eu olho "Saldo mês a mês"
    Então vejo uma linha com 6 pontos, os nomes dos meses e as marcas "0", "7 mil" e "14 mil"
    E o último ponto está destacado, com o valor escrito ao lado

  Cenário: Ver o saldo de outro mês
    Quando eu toco no ponto de setembro
    Então o ponto fica destacado
    E vejo "Set: R$ 8.239,70" abaixo do título

  Cenário: Escolher o mês pelo teclado
    Dado que o gráfico está com o foco
    Quando eu aperto a seta para a esquerda
    Então o mês anterior é escolhido e o texto muda

  Cenário: Pouco histórico
    Dado que só existe o mês corrente
    Então a seção mostra "Ainda sem histórico." e não desenha o gráfico

  Cenário: Origens como linhas
    Dado que o mês tem entradas de R$ 4.527,00 e uma fatura de R$ 417,16
    Quando eu olho "Entrou e saiu"
    Então vejo "Entradas" com "+ R$ 4.527,00" e "1 lançamento"
    E "Cartões" com "− R$ 417,16" e "1 fatura"
    E "Contas fixas" e "Gastos do dia a dia" com "R$ 0,00", "nenhuma neste mês" / "nenhum neste mês" e sem sinal

  Cenário: Barras proporcionais
    Dado que entraram R$ 4.527,00 e saíram R$ 417,16 em cartões
    Então a barra de "Entradas" está cheia
    E a barra de "Cartões" tem cerca de 9% da largura

  Cenário: Abrir uma lista e o resumo
    Quando eu toco na linha "Cartões"
    Então abre a tela de faturas por cartão do mês aberto
    Quando eu volto e toco em "Resumo"
    Então abre a tela "Resumo do mês"

  Cenário: Saldo negativo
    Dado que as saídas passam das entradas e do saldo anterior
    Então o saldo aparece na cor de alerta com o aviso
    E o gráfico mostra o ponto abaixo do zero

  Cenário: Valores escondidos
    Quando eu toco no olho
    Então os valores, os eixos e o texto do mês escolhido aparecem como "R$ ••••"
    E o gráfico vira uma faixa neutra e as barras viram barras neutras

  Cenário: Falha na série do gráfico
    Dado que a leitura da série falha
    Quando eu abro a aba "Entradas"
    Então a seção mostra "Gráfico indisponível" e "Tentar novamente"
    E o saldo e as linhas aparecem normalmente

  Cenário: Leitor de tela
    Quando um leitor de tela chega ao gráfico
    Então lê a descrição com os 6 saldos
    E há uma tabela de apoio com mês e saldo
```

| Requisito | Cenário |
| --------- | ------- |
| RF-01 | Saldo com o resultado do mês |
| RF-02, RN-03, RN-04 | Saldo mês a mês; Pouco histórico |
| RF-03 | Ver o saldo de outro mês; Escolher o mês pelo teclado |
| RF-04, RF-05, RF-06, D4, D6, D7 | Origens como linhas; Abrir uma lista e o resumo |
| RF-05, D5, RN-05 | Barras proporcionais |
| RF-07, RF-08, D8 | Saldo negativo |
| RF-09 | Valores escondidos |
| RN-01, RN-02 | Verificação manual: comparar com o Início, o Resumo e as listas |
| RN-06 | Verificação por busca dos `data-testid` |
| RN-07 | Falha na série do gráfico |
| RN-08, RN-10 | Verificação manual no roteiro |
| RN-09 | Leitor de tela |

## 5. Dados e contrato

Sem mudança no formato salvo, na camada de dados nem nos hooks existentes. A aba usa `getBalanceSeries` (de `inicio-com-minigraficos.md`) e os hooks de quantidades listados em RN-01.

## 6. Interface

- **Saldo:** rótulo de 14 px, valor em fonte de números a 34 px, linha do resultado em 14 px.
- **"Saldo mês a mês":** título de seção em 20 px; gráfico de largura total, viewBox 358 × 170, grade de 1 px (`line`), eixo à esquerda em 12 px, linha de 2,5 px, área a 12%, pontos de raio 4,5 (o último 6) com anel de 2 px, nomes dos meses em 12 px. Cada mês tem uma coluna invisível tocável de pelo menos 48 px de largura.
- **"Entrou e saiu":** cartão de 4 linhas, divisórias de 1 px (`line`); cada linha com mínimo de 72 px, ícone de 18 px (entrada, repetição, cesta, cartão), nome em 16 px/600, quantidade em 14 px `ink-soft`, valor em fonte de números a 16 px, seta de 20 px e barra de 8 px de altura (raio 4 px) em trilho `chart-track`.
- Referência exata: V3_02 (clara e escura) do canvas.

## 7. Fora de escopo

- Tela "Resumo do mês", as quatro listas de Entradas e os formulários (nada muda).
- Abas Cartões e Benefícios, Histórico e Categorias: ficam para as próximas partes da v2.
- Outro período para o gráfico (sempre 6 meses) e comparação com o ano anterior.
- Outro critério para as barras das linhas (sempre o total que entrou).

## 8. Critérios de aceite

- [ ] `npm run typecheck` e `npm run build` passam.
- [ ] A aba mostra o saldo com o resultado, "Saldo mês a mês" e as 4 linhas conforme a seção 4, nos temas claro e escuro.
- [ ] Os pontos do gráfico batem com o saldo de cada mês no Resumo do mês e no Início.
- [ ] Tocar em um mês, e usar as setas no teclado, atualiza o texto e o destaque.
- [ ] Os valores e as quantidades das linhas batem com o Resumo do mês e as listas.
- [ ] Cada linha abre a lista certa, no mês aberto; "Resumo" abre o Resumo do mês.
- [ ] Mês com saldo negativo mostra o gráfico com ponto abaixo do zero e o aviso.
- [ ] Menos de 2 meses de histórico mostra "Ainda sem histórico."
- [ ] Com o olho fechado, nenhum valor e nenhum formato de gráfico ou comprimento de barra aparece.
- [ ] Falha na série ou numa contagem não derruba a tela.
- [ ] Leitor de tela: gráfico com descrição e tabela de apoio; linhas com nome, quantidade e valor.
- [ ] Sem scroll horizontal em 360 px; linhas com no mínimo 72 px; colunas do gráfico com pelo menos 48 px de largura.
- [ ] `FUNCIONALIDADES.md` (nova seção 35 e ajuste das seções 23 e 27) e `README.md` atualizados.

## 9. Tarefas

1. Componente `BalanceLine` (gráfico completo: escala, grade, pontos tocáveis, seleção por toque e teclado, faixa neutra do olho), com `aria-label` e `ChartTable`.
2. Componente `OriginRows` (linha com ícone, quantidade, valor com sinal, barra e a barra neutra do olho), com texto para leitor de tela.
3. Reescrever o miolo de `entradas.tsx`: saldo com o resultado, seção "Saldo mês a mês", cartão "Entrou e saiu" com o link "Resumo" (RF-01 a RF-09), com tolerância a falha (RN-07).
4. Remover `diverging-bars.tsx` e usos soltos, se mais nada o usar.
5. `FUNCIONALIDADES.md` e `README.md`.
6. Rodar `typecheck` e `build`.

## 10. Roteiro de verificação

1. `npm run dev`, abrir `#/entradas` em 390 px, nos temas claro e escuro.
2. Conferir os cenários da seção 4, inclusive um mês com saldo negativo (conta fixa maior que as entradas) e o app com só um mês de dados.
3. Comparar saldo, resultado, os pontos do gráfico e as quatro linhas com o Início, o Resumo do mês e as listas.
4. Tocar em cada ponto e usar as setas do teclado no gráfico; tocar em cada linha e em "Resumo".
5. Fechar o olho e conferir texto, `aria-label` e HTML (sem valor e sem formato de gráfico).
6. Simular erro na série (erro temporário em `getBalanceSeries`) e numa contagem (erro temporário em `useGetBills`).
