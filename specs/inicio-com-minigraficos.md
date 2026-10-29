# Spec — Início com mini-gráficos (Nova versão, parte 2)

| Campo | Valor |
| ----- | ----- |
| Status | Proposta |
| Criada em | 29/10/2026 |
| Escopo | `src/pages/inicio.tsx`, novos `src/components/charts/{sparkline,mini-columns,usage-bar}.tsx`, `src/data/store.ts` e `src/data/api.ts` (três leituras novas), `src/lib/format.ts` (só se faltar um auxiliar), `FUNCIONALIDADES.md`, `README.md` |
| Depende de | [`redesign-v2-fundacao.md`](redesign-v2-fundacao.md) (tela Início, tema, esconder valores), [`contas-e-gastos.md`](contas-e-gastos.md), [`beneficios.md`](beneficios.md), [`parcelamento.md`](parcelamento.md) |
| Substitui em parte | O desenho do Início de `redesign-v2-fundacao.md` RF-04: os blocos "Entrou / Saiu / Próxima fatura / lista de Benefícios" são trocados por **painéis com mini-gráfico**. O estado vazio, o primeiro uso e os atalhos não mudam. |
| Referência visual | Canvas "Controle do Cartão", grupo v3, telas V3_01 (Início, clara e escura) |

> Mudanças de comportamento entram primeiro aqui e só depois no código.

---

## 1. Contexto e objetivo

O Início da fundação mostra números, mas não mostra **para onde eles estão indo**. A pessoa vê R$ 12.349,54 de saldo e não sabe se isso subiu ou caiu, nem quanto vem de fatura nos próximos meses. O desenho v3 resolve isso com três painéis, cada um com um mini-gráfico e o valor de hoje, mais uma lista de lançamentos recentes.

**Objetivo:** dar ao Início uma leitura de tendência em um olhar (saldo dos últimos 6 meses, faturas dos próximos meses, quanto de cada benefício já foi usado), sem tirar a leitura exata dos valores e sem mudar nenhuma regra de cálculo.

## 2. Decisões de produto

| # | Decisão | Motivo |
| - | ------- | ------ |
| D1 | Três painéis, nesta ordem: **Saldo** (linha dos últimos 6 meses), **Cartões** (colunas das próximas 7 faturas), **Benefícios** (barra de uso). Cada painel inteiro é um botão que abre a área correspondente no mês aberto. | Mesma ordem das áreas na barra; um alvo grande por painel. |
| D2 | O valor do painel continua em destaque e em texto; o gráfico é **complemento**, nunca a única forma de ler o número. | Acessibilidade e leitura exata. |
| D3 | **Saldo:** o ponto de cada mês é o **saldo ao fim do mês** (`balanceAmount`), do 5.º mês antes do aberto até o aberto. O último ponto é destacado. | É o número que o painel mostra, no tempo. |
| D4 | **Cartões:** colunas com o total de faturas (`cardsAmount`) do mês aberto e dos 6 seguintes; a primeira coluna é o mês aberto e é a mais forte. | Mostra o peso do parcelado nos meses que vêm. |
| D5 | **Benefícios:** uma barra única com o **gasto** sobre o **total disponível no mês** (valor do mês + o que veio do anterior), somando todos os benefícios. O painel diz "disponível de R$ X" e "N% usado". | Resposta imediata para "quanto ainda posso gastar". |
| D6 | **Entrou / Saiu** deixam de ser blocos próprios. A linha "+ R$ X neste mês" do painel Saldo mostra o resultado do mês; entrou e saiu continuam na aba Entradas e no Resumo do mês. | O desenho v3 não os tem; evita repetir o que Entradas já mostra. |
| D7 | **Lançamentos recentes:** os 3 últimos **gastos** (compra de cartão, gasto do dia a dia ou gasto de benefício) com data até hoje no mês aberto, do mais recente para o mais antigo. Em mês futuro, os 3 primeiros do mês. "Ver todos" abre o Resumo do mês. Tocar num item abre a área dele. | Dá contexto ao número sem criar uma tela nova. |
| D8 | Com os valores escondidos (olho), os gráficos são trocados por uma **barra neutra** do mesmo tamanho. | O formato da linha ou das colunas revelaria tendência e proporção. |
| D9 | Sem histórico suficiente (menos de 2 meses com movimento), o painel Saldo mostra só o valor e o texto "Ainda sem histórico". Sem fatura, o painel Cartões mostra "Nenhuma fatura neste mês." Sem benefício, o painel Benefícios mostra "Nenhum benefício cadastrado." | Nunca mostrar gráfico vazio ou enganoso. |
| D10 | Cores: Saldo `chart-in`, Cartões `chart-violet`, Benefícios `chart-rose` com trilho `chart-rose-tint`/`chart-track`. Todas já têm valor claro e escuro. | Reaproveita as cores com nome da fundação. |
| D11 | Sem tooltip nem ponto tocável nos mini-gráficos. Os gráficos completos continuam nas áreas. | O painel todo é um botão; um alvo dentro de outro alvo atrapalha o toque. |

## 3. Requisitos

### 3.1 Requisitos funcionais (RF)

| ID | Requisito |
| -- | --------- |
| RF-01 | O Início mostra, no mês aberto, os painéis **Saldo**, **Cartões** e **Benefícios**, nesta ordem, abaixo do cabeçalho, e depois a lista **Lançamentos recentes**. |
| RF-02 | O painel **Saldo** mostra o saldo do mês aberto (aviso de saldo negativo e cor de alerta como hoje), "± R$ resultado neste mês", e a linha dos últimos 6 meses com legenda "últimos 6 meses". |
| RF-03 | O painel **Cartões** mostra a fatura do mês aberto e as colunas das 7 faturas (mês aberto e 6 seguintes), com legenda "próximas 7 faturas". Quando há mais de um cartão, a legenda de baixo diz "N cartões". |
| RF-04 | O painel **Benefícios** mostra o total disponível, "disponível de R$ X" e a barra de uso com "N% usado". |
| RF-05 | Cada painel é um único botão que abre a área (Entradas, Cartões, Benefícios) **no mês aberto**; o nome acessível diz para onde vai e o valor (por exemplo, "Abrir Entradas, saldo R$ 12.349,54"). |
| RF-06 | **Lançamentos recentes** lista até 3 gastos conforme D7; cada linha mostra descrição, origem e data, e valor com "−". "Ver todos" abre o Resumo do mês. |
| RF-07 | Com o olho fechado, os valores seguem a regra do olho e os gráficos viram barra neutra (D8). |
| RF-08 | Cada gráfico tem um texto para leitor de tela (`role="img"` com `aria-label`) e uma tabela de apoio só para leitor de tela com os pontos. |
| RF-09 | Os estados vazios de D9 e o estado de primeiro uso da fundação seguem valendo. |

### 3.2 Regras de negócio (RN)

| ID | Regra |
| -- | ----- |
| RN-01 | Nenhum cálculo muda. Saldo, resultado, faturas e benefícios vêm das funções que já existem (`cashOf`, `consolidatedOf`, benefícios do mês). As leituras novas só **repetem** essas funções para outros meses. |
| RN-02 | O Início continua só lendo: não grava e não altera cartões, compras, entradas nem benefícios. |
| RN-03 | O mês do ponto do Saldo anterior ao primeiro mês com dados não entra (o gráfico começa no primeiro mês de `cashStart`). |
| RN-04 | A coluna de fatura de um mês sem fatura tem altura zero (um traço), nunca some, para as 7 colunas ficarem alinhadas. |
| RN-05 | A escala do gráfico de colunas vai de zero ao maior valor; a do Saldo vai do menor ao maior valor dos 6 pontos, com folga de 10%. Escalas não aparecem escritas nos mini-gráficos. |
| RN-06 | Os `data-testid` `card-home-balance`, `text-home-balance`, `card-home-invoice` e `card-home-benefits` são mantidos (agora nos painéis). `card-home-in`, `card-home-out` e `row-home-benefit-N` saem (D6, D5) e isso fica registrado no `FUNCIONALIDADES.md`. Novos: `chart-home-balance`, `chart-home-invoices`, `chart-home-benefits`, `list-home-recent`, `row-home-recent-N`, `link-home-recent-all`. |
| RN-07 | Texto de no mínimo 14 px nos painéis (13 px só na legenda do gráfico); painéis com no mínimo 120 px de altura e alvo de 48 px. Nada depende só de cor: o valor, o "+"/"−" e o texto de cada gráfico dizem o mesmo que a cor. |
| RN-08 | Se uma das leituras novas falhar, o painel afetado mostra o valor e a legenda "Gráfico indisponível", e os outros painéis seguem normais. |
| RN-09 | `prefers-reduced-motion`: sem animação de entrada nos gráficos. Fora disso, a linha e as colunas entram com a animação curta que o app já usa (`enter`). |

## 4. Cenários

```gherkin
# language: pt

Funcionalidade: Início com mini-gráficos

  Cenário: Painéis do Início
    Dado que há saldo, uma fatura e um benefício
    Quando eu abro o Início
    Então vejo os painéis "Saldo", "Cartões" e "Benefícios", nessa ordem
    E cada painel mostra o valor e um mini-gráfico

  Cenário: Tendência do saldo
    Dado que o app tem dados desde 6 meses atrás
    Quando eu olho o painel "Saldo"
    Então vejo uma linha com 6 pontos e o último destacado
    E a legenda "últimos 6 meses"

  Cenário: Saldo com pouco histórico
    Dado que só existe o mês corrente
    Quando eu olho o painel "Saldo"
    Então vejo o valor e o texto "Ainda sem histórico", sem linha

  Cenário: Faturas dos próximos meses
    Dado que há uma compra parcelada em 7 vezes
    Quando eu olho o painel "Cartões"
    Então vejo 7 colunas, a primeira mais forte
    E a legenda "próximas 7 faturas"

  Cenário: Uso do benefício
    Dado um benefício de R$ 600,00 com R$ 120,00 gastos
    Quando eu olho o painel "Benefícios"
    Então vejo "disponível de R$ 600,00", "R$ 480,00" e "20% usado"
    E uma barra com 20% preenchida

  Cenário: Abrir a área pelo painel
    Dado que estou no Início de agosto de 2026
    Quando eu toco no painel "Cartões"
    Então abre a aba Cartões em agosto de 2026

  Cenário: Lançamentos recentes
    Dado que o mês tem 5 gastos até hoje
    Quando eu olho "Lançamentos recentes"
    Então vejo os 3 mais recentes, com valor precedido de "−"
    E "Ver todos" abre o Resumo do mês

  Cenário: Valores escondidos
    Quando eu toco no olho
    Então os valores aparecem como "R$ ••••"
    E os gráficos viram barras neutras sem formato

  Cenário: Leitor de tela
    Quando um leitor de tela chega ao painel "Saldo"
    Então lê o valor, o resultado e a descrição do gráfico
    E há uma tabela de apoio com o saldo de cada mês

  Cenário: Falha numa leitura
    Dado que a leitura das faturas dos próximos meses falha
    Quando eu abro o Início
    Então o painel "Cartões" mostra o valor e "Gráfico indisponível"
    E os outros painéis aparecem normalmente
```

| Requisito | Cenário |
| --------- | ------- |
| RF-01, RF-05 | Painéis do Início; Abrir a área pelo painel |
| RF-02, RN-03, RN-05 | Tendência do saldo; Saldo com pouco histórico |
| RF-03, RN-04 | Faturas dos próximos meses |
| RF-04 | Uso do benefício |
| RF-06 | Lançamentos recentes |
| RF-07 | Valores escondidos |
| RF-08 | Leitor de tela |
| RF-09, D9 | Saldo com pouco histórico; verificação manual dos vazios |
| RN-01, RN-02 | Verificação manual: comparar com Entradas, Cartões e Benefícios |
| RN-06 | Verificação por busca dos `data-testid` |
| RN-07, RN-09 | Verificação manual no roteiro |
| RN-08 | Falha numa leitura |

## 5. Dados e contrato

Sem mudança no formato salvo. Três leituras novas em `src/data/store.ts` (e hooks em `src/data/api.ts`), todas só de leitura, que reaproveitam as funções existentes:

| Leitura | Entrada | Saída |
| ------- | ------- | ----- |
| `getBalanceSeries(endMonth, count)` | mês final e quantidade (6) | `{ month, balanceAmount }[]`, do mais antigo ao `endMonth`, sem meses antes de `cashStart` (RN-03) |
| `getInvoiceSeries(startMonth, count)` | mês inicial e quantidade (7) | `{ month, invoiceAmount }[]`, de `startMonth` em diante, usando `consolidatedOf` |
| `getRecentSpends(month, limit)` | mês aberto e limite (3) | `{ id, area: 'cards' \| 'income' \| 'benefits', description, origin, date, amount }[]` de compras de cartão, gastos do dia a dia e gastos de benefício, conforme D7 |

O painel de Benefícios usa `useGetBenefits(month)` que o Início já usa: `spentAmount` e `amount + carriedAmount` somados dos benefícios.

## 6. Interface

- **Painel:** botão de largura total, raio 20 px, borda `line`, fundo `surface`, altura mínima 120 px; título com ponto colorido (10 px) e "Abrir ›"; embaixo, valor em destaque (fonte de números do app, 30 px) à esquerda e gráfico de 128 px à direita com legenda de 13 px centrada.
- **Saldo (linha):** viewBox 150 × 56, linha de 2,5 px com cantos arredondados, área preenchida a 14%, ponto final de raio 5 com anel de 2 px na cor do painel.
- **Cartões (colunas):** 7 colunas de 16 px com 6 px de espaço, cantos de 3 px; a primeira com opacidade 1 e as outras 0,42.
- **Benefícios (barra):** uma barra de 16 px com a parte usada em `chart-rose` e o restante em `chart-rose-tint`, com 2 px de espaço entre as partes.
- **Lançamentos recentes:** o mesmo item de lista das outras telas (64 px).
- Referência exata: V3_01 (clara e escura) do canvas.

## 7. Fora de escopo

- Previsões, Sonhos e Carrinho (v4 a v6) e o "Desfazer" (spec própria, pois mexe na camada de dados).
- Gráficos com tooltip ou seleção dentro do Início.
- Escolher o período do gráfico (sempre 6 meses para o saldo e 7 faturas).
- Validação completa de daltonismo das cores escuras de gráfico (só contraste conferido até aqui).
- Mudar as telas Entradas, Cartões e Benefícios.

## 8. Critérios de aceite

- [ ] `npm run typecheck` e `npm run build` passam.
- [ ] Painéis Saldo, Cartões e Benefícios aparecem com gráfico e valor, nos temas claro e escuro.
- [ ] Os números dos painéis batem com Entradas, Cartões e Benefícios do mesmo mês.
- [ ] Cada painel abre a área certa no mês aberto.
- [ ] Os estados vazios (sem histórico, sem fatura, sem benefício) aparecem em vez de gráfico.
- [ ] "Lançamentos recentes" mostra os 3 gastos conforme D7 e "Ver todos" abre o Resumo.
- [ ] Com o olho fechado, nenhum valor e nenhum formato de gráfico aparece.
- [ ] Leitor de tela: `aria-label` e tabela de apoio presentes nos três gráficos.
- [ ] Falha numa leitura derruba só o painel afetado.
- [ ] Layout sem scroll horizontal em 360 px de largura.
- [ ] `FUNCIONALIDADES.md` (nova seção 33 e ajuste da seção 32) e `README.md` atualizados.

## 9. Tarefas

1. `getBalanceSeries`, `getInvoiceSeries` e `getRecentSpends` em `store.ts`, e os hooks em `api.ts`.
2. Componentes `Sparkline`, `MiniColumns` e `UsageBar` em `src/components/charts/`, com `aria-label`, `ChartTable` e a barra neutra do olho.
3. Reescrever o miolo de `inicio.tsx` com os três painéis e os estados de D9 e RN-08.
4. Lista "Lançamentos recentes" e o link "Ver todos".
5. `FUNCIONALIDADES.md` e `README.md`.
6. Rodar `typecheck` e `build`.

## 10. Roteiro de verificação

1. `npm run dev`, abrir `#/` em 390 px de largura, nos temas claro e escuro.
2. Conferir os cenários da seção 4. Para o parcelado, criar uma compra em 7 vezes e ver as 7 colunas.
3. Comparar o Saldo, a fatura e o disponível do Início com as abas correspondentes, no mês corrente e em um mês passado e um futuro.
4. Fechar o olho e conferir texto, `aria-label` e HTML (sem valor e sem formato de gráfico).
5. Dados mínimos (só o mês corrente, sem cartão e sem benefício) para ver os vazios.
6. Simular erro numa das leituras (por exemplo, lançando um erro temporário em `getInvoiceSeries`) e ver só o painel afetado cair.
