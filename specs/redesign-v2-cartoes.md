# Spec — Aba Cartões na Nova versão (v2, parte 5)

| Campo | Valor |
| ----- | ----- |
| Status | Implementada |
| Criada em | 29/10/2026 |
| Escopo | `src/pages/dashboard.tsx` (corpo da aba Cartões), `src/components/charts/step-line.tsx` (removido), `src/lib/card-series.ts` (só `paceSteps` e o tipo `PacePoint`, removidos), `FUNCIONALIDADES.md`, `README.md` |
| Depende de | [`redesign-v2-fundacao.md`](redesign-v2-fundacao.md), [`redesign-opcao-d-cartoes.md`](redesign-opcao-d-cartoes.md), [`multiplos-cartoes.md`](multiplos-cartoes.md), [`parcelamento.md`](parcelamento.md), [`todas-as-compras.md`](todas-as-compras.md), [`compras-em-qualquer-mes.md`](compras-em-qualquer-mes.md) |
| Substitui em parte | [`redesign-opcao-d-cartoes.md`](redesign-opcao-d-cartoes.md): a seção "Ritmo do mês" (D5, D6) é **removida**; a lista "O que já aconteceu" com chips de categoria e "Ver mais" passa a ser a lista "Compras" com as 3 mais recentes. O resto da aba muda só no visual. |
| Referência visual | Canvas "Controle do Cartão", grupo v2, tela V2_03 (Cartões), clara e escura |

> Mudanças de comportamento entram primeiro aqui e só depois no código.

---

## 1. Contexto e objetivo

A aba Cartões ainda tem a organização da Opção D: fatura, **Ritmo do mês**, **Para onde foi**, **Próximas faturas** e uma lista longa de compras com chips de categoria. São cinco blocos e o que a pessoa mais quer saber (quanto está a fatura e quanto vem nos próximos meses) fica espalhado. O desenho v2 reduz a aba a: escolher o cartão, ver a fatura, ver as próximas faturas e ver as últimas compras.

**Objetivo:** deixar a aba Cartões como a tela V2_03, mantendo o resumo por categoria que a pessoa pediu para conservar e removendo o gráfico de ritmo. Nenhuma regra de cálculo muda.

## 2. Decisões de produto

| # | Decisão | Motivo |
| - | ------- | ------ |
| D1 | A aba tem, nesta ordem: **seletor de cartão**, **Fatura**, **Próximas faturas**, **Para onde foi** e **Compras**. | Segue V2_03; o resumo por categoria fica antes da lista porque é o que a filtra (D5). |
| D2 | **Ritmo do mês** (gasto acumulado dia a dia) é **removido**, junto com o gráfico `StepLine` e o cálculo `paceSteps`. | Decisão do usuário: o ritmo não faz falta. |
| D3 | **Para onde foi** (resumo por categoria) é **mantido**, com as mesmas linhas e valores de hoje, no visual das outras seções da v2. | Decisão do usuário: o resumo por categoria fica. |
| D4 | A lista **Compras** mostra as **3 compras mais recentes** do mês aberto e o link "Todas as compras" no cabeçalho da seção. Sem "Ver mais" e sem chips de categoria. | Segue V2_03; o filtro por categoria e a busca já existem na tela "Todas as compras". |
| D5 | Tocar numa linha de **Para onde foi** filtra a lista **Compras** por aquela categoria (como hoje filtrava a lista longa). Com filtro ativo, a lista mostra até 3 compras da categoria, o "Total do filtro" e um botão **"Limpar filtro"** de 48 px; tocar de novo na mesma linha também limpa. | Mantém o comportamento que o resumo já tinha, sem a fileira de chips. |
| D6 | Com filtro ativo, "Todas as compras" **abre sem filtro** (a tela tem o próprio filtro). | Evita carregar estado de uma tela para outra. |
| D7 | A **Fatura** continua em destaque (48 px), com o menu ⋯ do cartão e a linha "N compras · próxima fatura prevista R$ X". | Já é o desenho; só ajusta o tamanho. |
| D8 | **Próximas faturas** mantém as sete colunas com a legenda Lançada/Prevista e o link "Histórico" no cabeçalho. | Já é o desenho; só ajusta o visual. |
| D9 | O item de compra é **compacto** como nas outras listas da v2: nome (com a parcela, como "teste 1/7"), "Categoria · data" embaixo, valor com "−" à direita; altura mínima de 64 px. Compra prevista (parcela futura) continua mostrando "prevista". | Consistência com o Início e a tela Entradas. |
| D10 | O aviso de mês futuro, o estado "Vamos anotar o seu cartão?" e todos os formulários, menus e confirmações não mudam. | Fora do escopo visual desta parte. |
| D11 | **O valor da Fatura tem 36 px abaixo de 380 px, 42 px até 419 px e 48 px a partir de 420 px** (ajuste da implementação). | Em 360 px "R$ 12.349,54" a 48 px quebraria no meio ao lado do menu ⋯ de 48 px; é o mesmo ajuste do Início e da aba Entradas. |
| D12 | **Com o olho fechado, o `HBars` e o `Columns` (compartilhados com Benefícios e Histórico) também escondem a forma**: as barras ficam sem preenchimento, o percentual some e as colunas viram uma faixa neutra. | RF-11 pede isso na aba Cartões; como os componentes são os mesmos, a regra do olho vale onde eles aparecem, em vez de deixar o formato das barras de Benefícios e do Histórico revelar a proporção. |
| D13 | **A dica "Toque numa categoria para ver só as compras dela." só aparece quando há categorias** e a categoria selecionada de `HBars` usa `bg-tint` (nova propriedade `activeClass`, com `bg-surface` como padrão para Benefícios). | Sem categorias a dica não faz sentido; Benefícios não muda de visual. |
| D14 | O nome da compra e a parcela ficam na mesma linha ("Teste 1/7") sem o selo em pílula; os selos "Mensal" e "prevista" passam para a linha de baixo, ao lado de "Categoria · data". | D9 pede o item compacto com a parcela junto do nome. |

## 3. Requisitos

### 3.1 Requisitos funcionais (RF)

| ID | Requisito |
| -- | --------- |
| RF-01 | A aba mostra as seções na ordem de D1; sem cartão, mostra o estado "Vamos anotar o seu cartão?" como hoje (D10). |
| RF-02 | A aba **não** mostra "Ritmo do mês" nem o gráfico de degraus (D2). |
| RF-03 | **Fatura** mostra o valor do mês aberto em 48 px, "Fatura de ‹mês›" (ou "Fatura prevista de" em mês futuro), o menu ⋯ do cartão e a linha "N compras · próxima fatura prevista R$ X" (D7). |
| RF-04 | **Próximas faturas** mostra as 7 colunas a partir do mês aberto, a legenda Lançada/Prevista e o link "Histórico" que abre o histórico (D8). |
| RF-05 | **Para onde foi** lista as categorias do mês com valor e barra, como hoje (D3). Sem compras no mês, mostra o texto "O resumo por categoria aparece quando houver compras no mês." |
| RF-06 | Tocar numa categoria de **Para onde foi** aplica o filtro de D5; tocar de novo, ou em "Limpar filtro", remove. Trocar de mês ou de cartão remove o filtro. |
| RF-07 | **Compras** mostra as 3 compras mais recentes do mês aberto (com a regra de ordenação de hoje: mais recente primeiro), cada uma como item compacto (D9). |
| RF-08 | Tocar numa compra registrada ou numa parcela prevista abre o formulário de edição, como hoje; compra recorrente prevista continua sem ação. |
| RF-09 | "Todas as compras" abre a tela de compras do cartão (sem filtro, D6). |
| RF-10 | Sem compras no mês, **Compras** mostra o estado vazio de hoje com o texto e a chamada para lançar a primeira compra. |
| RF-11 | Com o olho fechado, valores e gráficos seguem a regra do olho (as colunas viram uma faixa neutra, as barras de categoria viram barras neutras). |

### 3.2 Regras de negócio (RN)

| ID | Regra |
| -- | ----- |
| RN-01 | Nenhum cálculo muda: fatura, parcelas, previsão, recorrentes e resumo por categoria vêm das mesmas leituras de hoje. |
| RN-02 | O limite de meses navegáveis da aba, o mês compartilhado e a abertura em mês futuro com aviso não mudam. |
| RN-03 | As 3 compras de **Compras** vêm da mesma lista do mês (registradas e previstas) usada hoje; só o número exibido muda. |
| RN-04 | O filtro de D5 vale só para a lista **Compras** da aba; o resumo por categoria e a fatura continuam mostrando o mês inteiro. |
| RN-05 | `data-testid` mantidos: `section-invoice`, `text-invoice`, `button-card-menu`, `section-where`, `list-category-summary`, `row-summary-…`, `section-next`, `button-history`, `button-all-purchases`, `list-movements`, `row-movement-…`, `row-planned-…`, `text-movements-empty`, `text-filter-total`, `button-create-card`. Saem: `section-pace`, `text-pace-empty`, `filter-categories`, `filter-…` (chips) e o botão "Ver mais"/"Mostrar menos". Novo: `button-clear-filter`. |
| RN-06 | Texto de no mínimo 14 px (12 px só em eixos e rótulos de mês), alvos de 48 px, itens de compra com no mínimo 64 px; nada depende só de cor. |
| RN-07 | As seções com gráfico têm `aria-label` e tabela de apoio só para leitor de tela, como hoje. |

## 4. Cenários

```gherkin
# language: pt

Funcionalidade: Aba Cartões na nova versão

  Cenário: Ordem das seções
    Dado um cartão com compras no mês
    Quando eu abro a aba "Cartões"
    Então vejo, nesta ordem, o seletor de cartão, "Fatura", "Próximas faturas", "Para onde foi" e "Compras"
    E não vejo "Ritmo do mês"

  Cenário: Fatura em destaque
    Dado que a fatura de outubro é R$ 417,16 e a de novembro é R$ 397,16
    Então vejo "Fatura de outubro" e "R$ 417,16"
    E "3 compras · próxima fatura prevista R$ 397,16"

  Cenário: Próximas faturas
    Dado uma compra parcelada em 7 vezes
    Então vejo 7 colunas, a do mês aberto mais forte
    E a legenda "Lançada" e "Prevista"
    Quando eu toco em "Histórico"
    Então abre o histórico de faturas

  Cenário: Resumo por categoria mantido
    Dado compras em "Eletrônicos" e em "Mercado"
    Então "Para onde foi" lista as duas categorias com valor e barra

  Cenário: Filtrar as compras por categoria
    Dado compras em "Eletrônicos" e em "Mercado"
    Quando eu toco em "Eletrônicos" em "Para onde foi"
    Então "Compras" mostra só as de "Eletrônicos", com "Total do filtro"
    E aparece o botão "Limpar filtro"
    Quando eu toco em "Limpar filtro"
    Então "Compras" volta a mostrar as 3 mais recentes do mês

  Cenário: Três compras mais recentes
    Dado que o mês tem 5 compras
    Então "Compras" mostra as 3 mais recentes
    E o link "Todas as compras" leva à lista completa, sem filtro

  Cenário: Editar uma compra pela lista
    Quando eu toco numa compra registrada
    Então abre o formulário de edição dela

  Cenário: Mês sem compras
    Dado um cartão sem compras no mês
    Então "Para onde foi" mostra "O resumo por categoria aparece quando houver compras no mês."
    E "Compras" mostra o estado vazio com a chamada para lançar

  Cenário: Valores escondidos
    Quando eu toco no olho
    Então os valores aparecem como "R$ ••••"
    E as colunas e as barras viram formas neutras

  Cenário: Trocar de mês limpa o filtro
    Dado um filtro de categoria ativo
    Quando eu vou para o mês seguinte
    Então o filtro some
```

| Requisito | Cenário |
| --------- | ------- |
| RF-01, RF-02, D1, D2 | Ordem das seções |
| RF-03, D7 | Fatura em destaque |
| RF-04, D8 | Próximas faturas |
| RF-05, D3 | Resumo por categoria mantido; Mês sem compras |
| RF-06, D5, RN-04 | Filtrar as compras por categoria; Trocar de mês limpa o filtro |
| RF-07, RF-09, D4, D6, RN-03 | Três compras mais recentes |
| RF-08 | Editar uma compra pela lista |
| RF-10 | Mês sem compras |
| RF-11 | Valores escondidos |
| RN-01, RN-02 | Verificação manual: comparar com o Início, o histórico e a tela Todas as compras |
| RN-05 | Verificação por busca dos `data-testid` |
| RN-06, RN-07 | Verificação manual no roteiro |

## 5. Dados e contrato

Sem mudança no formato salvo, na camada de dados nem nos hooks. Saem apenas o gráfico `StepLine` e o cálculo `paceSteps` (e o tipo `PacePoint`), que só a aba usa.

## 6. Interface

- **Seletor de cartão:** o mesmo seletor de hoje, com a opção "Novo cartão".
- **Fatura:** rótulo de 14 px, valor em fonte de títulos a 48 px, menu ⋯ de 48 px, linha de apoio em 15 px.
- **Cabeçalho de seção:** título em 20 px e, à direita, o link da seção (Histórico, Todas) com alvo de 48 px, como nas outras telas da v2.
- **Próximas faturas:** as 7 colunas e a legenda atuais, nas cores `chart-violet` (forte para lançada, 42% para prevista).
- **Para onde foi:** linhas com nome, valor e barra em `chart-violet`; a categoria filtrada fica com fundo `tint` e `aria-pressed`.
- **Compras:** cartão com divisórias de 1 px; item de 64 px com nome (parcela junto), "Categoria · data", valor com "−".
- Referência exata: V2_03 (clara e escura) do canvas.

## 7. Fora de escopo

- Tela "Todas as compras", histórico, formulários, menu do cartão e confirmações (não mudam).
- Aba Entradas (spec própria), Benefícios, Histórico e Categorias.
- Gráfico alternativo para o ritmo do mês (foi removido por decisão do usuário).
- Filtrar mais de uma categoria ao mesmo tempo.

## 8. Critérios de aceite

Verificado no navegador (`npm run dev`) com dados de teste (um cartão com compras em duas categorias, uma compra em 7 parcelas e uma recorrente; depois dois cartões), nos temas escuro e claro, em janela larga e num `<iframe>` de 360 px. Antes de mudar o código tirei uma linha de base da aba antiga para comparar os valores. Não conferi com um leitor de tela de verdade.

- [x] `npm run typecheck` e `npm run build` passam.
- [x] A aba mostra as seções na ordem de D1 (seletor, Fatura, Próximas faturas, Para onde foi, Compras), nos temas escuro e claro, sem "Ritmo do mês".
- [x] Fatura, próximas faturas, resumo por categoria e compras batem com os valores de antes da mudança para o mesmo mês: fatura R$ 320,00 e "5 compras · próxima fatura prevista R$ 130,00"; colunas R$ 320,00 e 6 × R$ 130,00; resumo Mercado R$ 140,00 · 44%, Eletrônicos R$ 100,00 · 31%, Sem categoria R$ 80,00 · 25%; as mesmas compras na mesma ordem (só 3 agora).
- [x] Tocar numa categoria filtra "Compras" (só as da categoria, com `aria-pressed` e fundo `tint`), mostra o "Total do filtro" (R$ 100,00 e R$ 140,00) e "Limpar filtro" remove; tocar de novo na mesma linha também limpa; trocar de mês e trocar de cartão limpam (e voltar ao primeiro cartão não traz o filtro de volta).
- [x] "Compras" mostra 3 itens (5 no mês) e "Todas as compras" abre a lista completa (`#/compras`, com todos os meses) sem filtro, mesmo com um filtro ativo.
- [x] Editar uma compra pela lista abre o formulário dela; excluir pelo formulário não pede confirmação, mostra "Padaria removida." com "Desfazer" e a fatura cai de R$ 320,00 para R$ 300,00; desfazer devolve tudo idêntico ao salvo antes (byte a byte).
- [x] Estados vazios aparecem em vez de seções vazias: mês sem compras ("O resumo por categoria aparece quando houver compras no mês." e "Ainda sem compras" com "Registrar a primeira compra") e sem nenhum cartão ("Vamos anotar o seu cartão?", sem "Todas as compras").
- [x] Com o olho fechado, nenhum valor e nenhum formato de gráfico aparece (texto, HTML e `aria-label` sem valor em reais; sem percentual; colunas em faixa neutra; barras sem largura).
- [x] Sem scroll horizontal em 360 px (documento de 345 px num iframe de 360 px); itens de compra com 70 a 71 px (mínimo 64), alvos de 48 px (menu ⋯, "Histórico", "Todas as compras", "Limpar filtro") e linhas do resumo com 59 px.
- [x] Nenhum resto do `StepLine`/`paceSteps` no código (busca por `StepLine`, `step-line`, `paceSteps`, `PacePoint`, `section-pace`, `text-pace-empty` e `filter-categories`: nada).
- [x] `FUNCIONALIDADES.md` (nova seção 36 e ajuste das seções 3 e 28) e `README.md` atualizados.

Não conferido: o aviso falando por um leitor de tela; a exclusão de uma compra recorrente ou parcelada pela lista nesta aba (o fluxo de exclusão com Desfazer não mudou e foi verificado na parte 3); e `prefers-reduced-motion`.

## 9. Tarefas

1. Remover "Ritmo do mês" de `dashboard.tsx`, o `StepLine` e o `paceSteps`.
2. Reorganizar o corpo da aba na ordem de D1, com os cabeçalhos de seção da v2.
3. Trocar a lista "O que já aconteceu" (chips, 8 itens, "Ver mais") por "Compras" com 3 itens compactos e o filtro de D5 ("Limpar filtro").
4. Ajustar o tamanho da Fatura e o visual de "Para onde foi" (categoria selecionada com `aria-pressed`).
5. `FUNCIONALIDADES.md` e `README.md`.
6. Rodar `typecheck` e `build`.

## 10. Roteiro de verificação

1. `npm run dev`, abrir `#/cartoes` em 390 px, nos temas claro e escuro.
2. Conferir os cenários da seção 4, com um cartão com compras em duas categorias e uma compra parcelada em 7 vezes.
3. Comparar os valores com o Início, o histórico e "Todas as compras" do mesmo mês, e com a versão anterior da aba.
4. Filtrar por uma categoria, trocar de mês e de cartão e conferir que o filtro some.
5. Editar e excluir (com Desfazer) uma compra pela lista; abrir um mês futuro e um mês sem compras; abrir sem nenhum cartão.
6. Fechar o olho e conferir texto, `aria-label` e HTML.
