# Spec — Opção D na aba Entradas: gráfico "Entrou e saiu" e tela Resumo do mês

| Campo | Valor |
| ----- | ----- |
| Status | Implementada |
| Criada em | 26/10/2026 |
| Escopo | `src/index.css` (cores de gráfico), `src/components/charts/` (novo), `src/pages/entradas.tsx`, `src/pages/entradas-resumo.tsx` (novo), `src/components/quick-add.tsx` (botão "Resumo" no rodapé), `src/App.tsx` (rotas), `src/lib/format.ts` (caminho da tela), `FUNCIONALIDADES.md`, `README.md` |
| Depende de | [`redesign-entradas.md`](redesign-entradas.md) (cores com nome, seletor de mês, abas e rodapé com texto — PR #25 já mesclado), [`telas-de-entradas.md`](telas-de-entradas.md), [`contas-e-gastos.md`](contas-e-gastos.md), [`mes-compartilhado.md`](mes-compartilhado.md), [`botao-lancar.md`](botao-lancar.md) |
| Substitui em parte | [`redesign-entradas.md`](redesign-entradas.md): o card verde de saldo (D1) e o bloco "Resumo do mês" dentro da aba (D2, D6) saem da aba. As cores com nome, o seletor de mês, as abas e o rodapé com texto continuam valendo. |
| Referência visual | Canvas "Controle do Cartão — Entradas": artboard "D2 — Barras divergentes" (aba) e "Resumo do mês (nova tela, aberta pelo rodapé)". O fluxo completo está nos artboards "Fluxo completo — Opção D". |

> Mudanças de comportamento entram primeiro aqui e só depois no código.
> Esta é a **primeira de quatro specs** da Opção D. Ela cria o que as outras reutilizam: as cores e os componentes de gráfico (seção 6) e o botão do rodapé. Implemente esta primeiro. Ordem: esta → [`redesign-opcao-d-cartoes.md`](redesign-opcao-d-cartoes.md) → [`redesign-opcao-d-beneficios.md`](redesign-opcao-d-beneficios.md) → [`redesign-opcao-d-telas-de-apoio.md`](redesign-opcao-d-telas-de-apoio.md).

---

## 1. Contexto e objetivo

A aba Entradas (já com o card de saldo da spec anterior) mostra o saldo e uma lista de quatro valores. Falta uma leitura rápida de **quanto entrou e quanto saiu** no mês. A Opção D troca o card verde por um saldo grande, sem moldura, e põe um gráfico de barras divergentes logo abaixo. A lista de quatro linhas, que levava às telas de cada tipo, vira uma tela própria, **Resumo do mês**, aberta por um botão no rodapé.

**Objetivo:** mostrar o saldo e o equilíbrio entre entradas e saídas de relance, sem mudar nenhuma regra de cálculo.

## 2. Decisões de produto

| # | Decisão | Motivo |
| - | ------- | ------ |
| D1 | O **Saldo** passa a ser texto grande (Fraunces, 52 px) logo abaixo das abas, **sem card**. Acima dele, "Saldo" em 14 px. | Destaque sem moldura, igual às outras abas da Opção D. |
| D2 | Abaixo do saldo há o gráfico **"Entrou e saiu"**: barras divergentes a partir de um eixo central, **entradas à direita** e **saídas à esquerda**, uma linha por tipo (Entradas, Contas fixas, Gastos do dia a dia, Cartões) e, separada por uma linha fina, a linha **Resultado do mês**. | Mostra de uma vez o que entrou, o que saiu e o que ficou. |
| D3 | As barras usam **uma escala única** para o mês: o maior valor absoluto entre as cinco linhas ocupa 100 px (de 358 px de largura útil); as demais são proporcionais. Valor zero não desenha barra e mostra só "0". | Comparação honesta entre as linhas. |
| D4 | Cores: **entrou/positivo** `chart-in` (azul), **saiu/negativo** `chart-out` (laranja). Cada barra tem o valor ao lado, em formato compacto (`+4.527`, `−520`, sem centavos), em texto na cor `ink`. O valor exato fica no `<title>` da barra e na tabela de apoio (RF-06). | Par validado para daltonismo; a cor nunca é o único sinal, porque o sinal "+/−" e o lado do eixo também dizem o que é. |
| D5 | O **Resultado do mês** negativo vira barra à esquerda em `chart-out`, e o valor passa a usar a cor `alert`. | Coerente com o saldo negativo (D5 da spec anterior). |
| D6 | Saldo negativo: o texto do saldo usa `alert` e mostra o aviso que já existe ("As saídas passaram das entradas e do saldo anterior."), abaixo do saldo. | Mantém o comportamento atual. |
| D7 | O bloco "Resumo do mês" (as quatro linhas) **sai da aba** e vira a tela **Resumo do mês**, em `/entradas/resumo` (e `/entradas/resumo/mes/:month` para outro mês). | Pedido do usuário. |
| D8 | O rodapé ganha o botão **"Resumo"** (ícone de lista + texto de 12 px), **à esquerda**, no espaço que hoje está vazio. Ele aparece **só nas telas de Entradas** (rotas que começam com `/entradas`). Nas telas Cartões e Benefícios o rodapé continua com "Lançar" e "Categorias". Na tela Resumo o botão aparece destacado (`aria-current="page"`). | O resumo é de Entradas; mostrar o botão nas outras abas confundiria. |
| D9 | A tela Resumo tem: botão voltar (44 px), o mês, o título "Resumo do mês", "Saldo anterior" e "Resultado do mês" em duas colunas e as quatro linhas de 64 px com seta, que abrem as mesmas listas de hoje. O seletor de mês e as abas **não** aparecem nela; o mês vem da rota. | Tela de apoio, como as listas. |
| D10 | O saldo anterior e o resultado do mês saem do card antigo e passam a aparecer **só na tela Resumo** (a aba mostra o saldo e o gráfico). | Evita repetir o mesmo número em dois lugares. |

## 3. Requisitos

### 3.1 Requisitos funcionais (RF)

| ID | Requisito |
| -- | --------- |
| RF-01 | A aba Entradas mostra, nesta ordem: seletor de mês, abas, "Saldo" + valor (D1), aviso de saldo negativo se houver (D6), o gráfico "Entrou e saiu" (D2) e o rodapé. Mantém os `data-testid` `text-cash-balance` e `text-cash-warning`. |
| RF-02 | O gráfico tem título "Entrou e saiu" (Fraunces 24 px) e legenda "Por tipo, no mês, em R$" (14 px, `ink-soft`). |
| RF-03 | Cada linha do gráfico tem o nome do tipo (14 px, 600, `ink`) acima da barra. A barra tem 20 px de altura, **extremidade arredondada de 4 px** só na ponta do dado e **quadrada no eixo**. O eixo central é uma linha de 1 px em `ink-soft`. |
| RF-04 | A ordem das linhas é a da lista do app: Entradas, Contas fixas, Gastos do dia a dia, Cartões. Entradas ficam à direita (`chart-in`); as outras três à esquerda (`chart-out`). Uma linha fina separa o Resultado do mês, que fica à direita (`chart-in`) se for zero ou positivo e à esquerda (`chart-out`) se for negativo. |
| RF-05 | Legenda abaixo do gráfico: "Entrou" (quadrado `chart-in`) e "Saiu" (quadrado `chart-out`), 13 px. |
| RF-06 | Acessibilidade: o `<svg>` tem `role="img"` e `aria-label` com os cinco valores por extenso ("Entradas de R$ 4.527,00; cartões de R$ 520,14; …"), e há uma **tabela de apoio** visualmente oculta (`sr-only`) com tipo e valor. Cada barra tem `<title>` com o valor exato. |
| RF-07 | O botão "Resumo" do rodapé fica à esquerda, com altura de 52 px, largura mínima de 60 px, ícone de lista de 20 px e texto de 12 px (600). Abre `/entradas/resumo` (ou a rota do mês aberto). Só existe nas rotas que começam com `/entradas`. |
| RF-08 | A tela Resumo do mês mostra: botão "Voltar" (44 px, vai para a aba Entradas do mesmo mês); "Dezembro de 2026" (kicker de 12 px, mono, caixa alta, `eyebrow`); título "Resumo do mês" (Fraunces 32 px); duas colunas "Saldo anterior" e "Resultado do mês" (12 px, mono 15 px); e as quatro linhas (Entradas, Contas fixas, Gastos do dia a dia, Cartões) de 64 px com valor, seta e o mesmo sinal/cor de hoje (entrada "+", saída "−", zero sem sinal e apagado). |
| RF-09 | Tocar numa linha da tela Resumo abre a mesma tela que abre hoje (`listPath(kind, month)`); "Cartões" continua levando à lista de cartões. Mantém os `data-testid` `tile-income`, `tile-bills`, `tile-daily`, `tile-cards` e `text-cash-*` (agora na tela Resumo) e `text-cash-previous` e `text-cash-result`. |
| RF-10 | Texto com no mínimo 12 px e alvos de toque de no mínimo 44 px (barras do gráfico não são alvos de toque). |
| RF-11 | Estados de carregamento e erro: enquanto os valores chegam, o saldo e o gráfico aparecem como blocos cinza; em erro, a mensagem e o "Tentar novamente" que o app já usa. |

### 3.2 Regras de negócio (RN)

| ID | Regra |
| -- | ----- |
| RN-01 | Nenhum cálculo muda. Os valores vêm do mesmo `useGetMonthCash(month)` (`balanceAmount`, `previousAmount`, `resultAmount`, `incomeAmount`, `billsAmount`, `dailyAmount`, `cardsAmount`). O gráfico só desenha esses números. |
| RN-02 | O mês aberto continua compartilhado entre as abas e a tela Resumo; trocar de aba mantém o mês e o app lembra o último mês aberto (`useRememberMonth`). |
| RN-03 | A tela Resumo respeita os limites de mês de Entradas (`useGetIncomeRange`) quando abre por rota de mês fora do intervalo, como as listas já fazem. |
| RN-04 | Valor de saída ≥ 0 sempre. O sinal "−" é só de apresentação. |

## 4. Cenários

```gherkin
# language: pt
Funcionalidade: Aba Entradas na Opção D

  Contexto:
    Dado que em dezembro de 2026 o saldo é R$ 12.246,56
    E o saldo anterior é R$ 8.239,70 e o resultado do mês é R$ 4.006,86
    E as entradas são R$ 4.527,00, os cartões R$ 520,14 e contas fixas e gastos R$ 0,00

  Cenário: Saldo e gráfico
    Quando eu abro a aba "Entradas"
    Então vejo "Saldo" e "R$ 12.246,56" sem card
    E vejo o gráfico "Entrou e saiu" com "+4.527" à direita do eixo em Entradas
    E "−520" à esquerda em Cartões
    E "0" em Contas fixas e em Gastos do dia a dia, sem barra
    E "+4.007" à direita em "Resultado do mês"

  Cenário: A aba não tem mais a lista de quatro linhas
    Quando eu abro a aba "Entradas"
    Então não vejo "Resumo do mês" nem as linhas "Abrir Entradas", "Abrir Cartões"

  Cenário: Abrir o resumo pelo rodapé
    Quando eu toco em "Resumo" no rodapé
    Então abre a tela "Resumo do mês" de dezembro de 2026
    E vejo "Saldo anterior R$ 8.239,70" e "Resultado do mês + R$ 4.006,86"
    E vejo as linhas Entradas "+ R$ 4.527,00", Contas fixas "R$ 0,00", Gastos do dia a dia "R$ 0,00" e Cartões "− R$ 520,14"
    E o botão "Resumo" aparece destacado no rodapé

  Cenário: Abrir uma lista a partir do resumo
    Dado que estou na tela "Resumo do mês"
    Quando eu toco em "Cartões"
    Então abre a lista de cartões do mês, como hoje

  Cenário: Voltar do resumo
    Quando eu toco em "Voltar"
    Então volto para a aba "Entradas" no mesmo mês

  Cenário: O botão Resumo só existe em Entradas
    Quando eu abro as abas "Cartões" e "Benefícios"
    Então o rodapé mostra só "Lançar" e "Categorias"

  Cenário: Saldo negativo
    Dado que as saídas passaram das entradas e do saldo anterior
    Então o saldo aparece na cor de alerta com o aviso de sempre

  Cenário: Resultado negativo no gráfico
    Dado que o resultado do mês é − R$ 300,00
    Então a barra de "Resultado do mês" aparece à esquerda do eixo, em laranja, e o valor em cor de alerta

  Cenário: Sem lançamentos no mês
    Dado que todos os valores do mês são R$ 0,00
    Então o gráfico mostra "0" em todas as linhas, sem barras
```

## 5. Dados e contrato

Sem mudança. Nada novo é gravado, e o formato salvo no aparelho não muda. A tela Resumo usa o mesmo `useGetMonthCash`. A escala do gráfico é calculada no componente: `max = maior |valor|` entre `incomeAmount`, `billsAmount`, `dailyAmount`, `cardsAmount` e `|resultAmount|`; se `max` for 0, todas as barras ficam sem desenho.

## 6. Interface

**Cores novas** (em `src/index.css`, no `@theme`, com nome; validadas com o validador de paleta do skill de gráficos):

| Nome | Valor | Uso |
| ---- | ----- | --- |
| `chart-in` | `#2a78d6` | entrou / positivo |
| `chart-out` | `#eb6834` | saiu / negativo |
| `chart-neutral` | `#6b7a70` | totais e valores de partida |
| `chart-track` | `#e6e1d5` | trilho de barras |
| `chart-violet` | `#5b46b0` | gráficos da aba Cartões |
| `chart-rose` | `#a63d5a` | gráficos da aba Benefícios |
| `chart-rose-tint` | `#e6c3cc` | parte "disponível" nos gráficos de Benefícios |

**Componentes novos** em `src/components/charts/` (SVG puro, sem biblioteca; `viewBox`, `width: 100%`):

| Arquivo | O que faz |
| ------- | --------- |
| `diverging-bars.tsx` | Barras divergentes (D2 desta spec). Props: `rows: { label, value, tone }[]`, `result`. |
| `chart-legend.tsx` | Legenda com quadrados de 12 px e texto de 13 px. |
| `chart-table.tsx` | Tabela `sr-only` com os mesmos números do gráfico (RF-06); os outros gráficos reutilizam. |

Mock de referência: artboard "D2 — Barras divergentes". Medidas: largura útil 358 px, eixo em x = 179, barras de 20 px, 100 px para o maior valor, valor compacto ao lado do fim da barra, nome do tipo 14 px acima da barra, 52 px de altura por linha.

## 7. Fora de escopo

- As listas (Entradas, Contas fixas, Gastos, Cartões), os formulários e as caixas de confirmação: ficam para [`redesign-opcao-d-telas-de-apoio.md`](redesign-opcao-d-telas-de-apoio.md). Aqui elas continuam como estão.
- Qualquer gráfico de várias semanas ou meses: o app só calcula o mês aberto (e o saldo acumulado).
- Os botões "Tabela" do mock: não entram. A tabela de apoio é só para leitor de tela (RF-06). Mostrar a tabela para todos pode virar spec futura.

### Pontos a confirmar antes de implementar

1. **Nome dos campos:** os nomes de `useGetMonthCash` acima foram lidos da tela atual (`entradas.tsx`). Confirme no código.
2. **Rodapé:** `quick-add.tsx` já decide pela rota se mostra o rodapé (`hasFooter`). O botão "Resumo" usa o mesmo teste (`location.startsWith('/entradas')`). Se a tela de lista de cartões (`/entradas/lista/cartoes`) abrir o rodapé com o botão, está certo.
3. **Rota do mês:** o padrão do app é `/mes/:month` no fim. Se `areaPath` não cobrir a tela Resumo, criar `summaryPath(month)` ao lado de `listPath` em `src/lib/format.ts`.

## 8. Critérios de aceite

- [x] A aba Entradas mostra o saldo sem card e o gráfico "Entrou e saiu"; não mostra mais as quatro linhas.
- [x] O botão "Resumo" aparece no rodapé só nas rotas `/entradas*` e abre a tela Resumo do mês.
- [x] A tela Resumo mostra saldo anterior, resultado e as quatro linhas, e cada linha abre a lista certa.
- [x] Os valores do gráfico batem com os da tela Resumo.
- [ ] Texto ≥ 12 px e alvos ≥ 44 px; o gráfico tem `aria-label` e tabela de apoio. _Implementado (14 px nos valores, botões de 44 px+, `aria-label` e tabela `sr-only`); a leitura com TalkBack não foi testada._
- [ ] Saldo negativo, resultado negativo e mês sem lançamentos se comportam como nos cenários. _Verificado no navegador: saldo negativo (cor de alerta e aviso). Pendente: resultado negativo e mês totalmente vazio._
- [x] `npm run typecheck` e `npm run build` passam; `FUNCIONALIDADES.md` e `README.md` atualizados; o status desta spec muda para "Implementada".

## 9. Tarefas

1. `src/index.css`: adicionar as cores da seção 6 ao `@theme`.
2. Criar `src/components/charts/` com `diverging-bars.tsx`, `chart-legend.tsx` e `chart-table.tsx`.
3. `src/pages/entradas.tsx`: trocar o card verde e a lista pelo saldo em texto + `DivergingBars`; manter o aviso de saldo negativo e os `data-testid`.
4. Criar `src/pages/entradas-resumo.tsx` com a tela do RF-08 e adicionar as rotas `/entradas/resumo` e `/entradas/resumo/mes/:month` em `src/App.tsx`.
5. `src/lib/format.ts`: `summaryPath(month)`.
6. `src/components/quick-add.tsx`: botão "Resumo" à esquerda do rodapé, só em `/entradas*`; estado ativo na tela Resumo.
7. `FUNCIONALIDADES.md` (nova seção "Opção D: Entradas") e `README.md`.
8. Rodar `npm run typecheck` e `npm run build`.

## 10. Roteiro de verificação

1. Abrir Entradas em dezembro de 2026 (ou com os valores do cenário) e conferir saldo, gráfico e legenda.
2. Tocar em "Resumo" e conferir os valores contra o gráfico; tocar em cada linha e voltar.
3. Abrir Cartões e Benefícios: o rodapé não mostra "Resumo".
4. Forçar saldo negativo e resultado negativo (lançar uma saída grande) e conferir cores e aviso.
5. Mês sem lançamentos: gráfico sem barras, valores "0".
6. Ler a aba com um leitor de tela (TalkBack): o gráfico fala os valores por extenso.
