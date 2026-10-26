# Spec — Redesign da aba Benefícios

| Campo | Valor |
| ----- | ----- |
| Status | Implementada |
| Criada em | 25/10/2026 |
| Escopo | `src/pages/beneficios.tsx`, `src/components/card-menu.tsx`, `src/components/snap-carousel.tsx`, `src/components/progress.tsx`, `src/index.css` (só se faltar cor com nome), `FUNCIONALIDADES.md`, `README.md` |
| Depende de | [`redesign-entradas.md`](redesign-entradas.md) (cores com nome, seletor de mês, abas e rodapé), [`redesign-cartoes.md`](redesign-cartoes.md) (menu "⋯", carrossel de 44 px, barra de 8 px), [`beneficios.md`](beneficios.md), [`beneficios-em-carrossel.md`](beneficios-em-carrossel.md), [`lancamentos-do-beneficio.md`](lancamentos-do-beneficio.md) |
| Referência visual | Canvas "Controle do Cartão — Entradas", artboards "Benefícios — atual" e "Benefícios — proposta" |

> Mudanças de comportamento entram primeiro aqui e só depois no código.

**Antes de começar:** a branch deve partir da `main` com os PRs de [`redesign-entradas.md`](redesign-entradas.md) e [`redesign-cartoes.md`](redesign-cartoes.md) já mesclados. Se o de Cartões ainda não estiver, crie o `card-menu.tsx` aqui, como descrito na seção 6 daquela spec, e as mudanças do `SnapCarousel` (bolinhas e "+" de 44 px) e do `Progress` (barra de 8 px).

---

## 1. Contexto e objetivo

A aba Benefícios tem os mesmos problemas de toque e de leitura da aba Cartões:

- A face do benefício tem dois botões de 33 px (editar e excluir) lado a lado; o excluir apaga o benefício com um toque.
- O resumo "Crédito R$ 800,00 · Sobra anterior R$ 0,00 · Gasto R$ 500,00" é uma frase de 11 px que quebra em duas linhas.
- Em cada categoria, o botão "Fechar" fica colado ao valor e à seta que abre os lançamentos, e é fácil tocar no errado. A conta "sobra + crédito − gasto" tem 10 px, e o percentual 9 px.

**Objetivo:** tornar a aba confortável de tocar e de ler, sem mudar nenhuma regra de crédito, sobra, gasto, divisão por categoria ou fechamento. As mudanças de comportamento são só de **onde ficam** os botões (seção 2, D2 e D4).

## 2. Decisões de produto

| # | Decisão | Motivo |
| - | ------- | ------ |
| D1 | O resumo do benefício vira **três colunas** (Crédito, Sobra anterior, Gasto), cada uma com rótulo e valor. A frase corrida sai. | Lê-se de relance e não quebra de linha. |
| D2 | A face do benefício tem **um botão "⋯" de 44 px** ("Mais opções do benefício"), que abre a mesma folha de rodapé do cartão com **"Editar benefício"** e **"Excluir benefício"**. Excluir mantém a confirmação atual. | Tira o botão destrutivo da frente, como em Cartões. |
| D3 | A **linha inteira da categoria** (nome, valor, conta e barra) é um botão que abre os lançamentos dela. Hoje só o nome é o botão. | Alvo de toque maior. |
| D4 | **"Fechar"** vira **"Fechar categoria"**, numa **linha própria**, alinhada à direita, abaixo da categoria, com alvo de 44 px e cor `alert`. **"Reabrir"** vira **"Reabrir categoria"**, no mesmo lugar, na cor `brand`. | Evita tocar em "Fechar" sem querer, já que fechar libera a sobra. |
| D5 | Valor disponível negativo usa a cor `alert` (no lugar do vermelho solto de hoje). Valor zero ou positivo usa `ink`. | Cores com nome e o mesmo critério das outras abas. |
| D6 | Texto mínimo de **12 px** (13 px onde o canvas mostra 13) e alvos de toque de no mínimo **44 px**. Vale também para o que o canvas não desenha: estados de carregamento e erro, "Tentar novamente", o card "Novo benefício" e o selo "Fechada". | Legibilidade e toque no celular. |
| D7 | Os rótulos "MENSAL" (na face) e "POR CATEGORIA" têm 12 px. Na face, "Mensal" e o percentual usam a **cor de acento do benefício** (`CARD_COLORS[cor].accent`), sem a transparência atual. Em "Por categoria" o rótulo usa `eyebrow`. | Contraste. |
| D8 | O botão "Todos os lançamentos (n)" tem 56 px de altura, texto de 15 px (600) e seta de 18 px. | Alvo de toque e leitura. |
| D9 | O `SnapCarousel` (compartilhado com Cartões) já recebe as bolinhas e o "+" de 44 px em [`redesign-cartoes.md`](redesign-cartoes.md) D9. Esta spec só muda o conteúdo da face e o bloco "Por categoria". | Uma única versão do carrossel. |

## 3. Requisitos

### 3.1 Requisitos funcionais (RF)

| ID | Requisito |
| -- | --------- |
| RF-01 | A face do benefício mostra: o rótulo "Mensal" com o ícone de repetir (12 px, mono, caixa alta, cor de acento); o **nome** (Fraunces 26 px) e o botão "⋯" (44 px, borda `white/28`) na mesma linha; "Disponível em ‹mês›" (13 px); o **valor disponível** (Fraunces 42 px); as três colunas (RF-02); e a barra "Gasto do mês" (RF-03). |
| RF-02 | As três colunas **Crédito**, **Sobra anterior** e **Gasto** têm rótulo de 12 px (`rgba(255,250,240,.84)`) e valor em mono 14 px. |
| RF-03 | A barra "Gasto do mês" tem rótulo de 13 px, percentual em mono 13 px na cor de acento, barra de 8 px com trilho `white/18` e preenchimento na cor de acento. O percentual vai de 0 a 100 na barra, como hoje. |
| RF-04 | O "⋯" abre a folha de rodapé com **"Editar benefício"** (abre o formulário atual) e **"Excluir benefício"** (pede a confirmação atual). A folha fecha ao tocar fora, em "Fechar" ou ao escolher uma opção. |
| RF-05 | Abaixo do carrossel há **um só cartão** (raio 24 px, borda `line`, fundo `surface`) com o título "POR CATEGORIA" (12 px, `eyebrow`), uma seção por categoria e, no fim, "Todos os lançamentos (n)". |
| RF-06 | Cada categoria é um botão de linha inteira com: nome (15 px, 600) e seta de 16 px; valor disponível (mono 15 px); a conta "sobra R$ x + crédito R$ y − gasto R$ z" (13 px, `ink-soft`) seguida de "· Liberado R$ w" (negrito, `#2f5a44`) quando há valor liberado; e, se a categoria está aberta, barra de 8 px com percentual em mono 13 px. O botão abre os lançamentos da categoria (nome acessível "Ver lançamentos de ‹categoria›"). |
| RF-07 | A barra da categoria usa a cor `brand`; acima de **85%** usa o tom quente que já existe (`#d98771`). O trilho é `#e6e1d5`. |
| RF-08 | Categorias **abertas** que podem ser fechadas (têm categoria, não é "Sem categoria") mostram, numa linha própria à direita, o botão **"Fechar categoria"** (14 px, 600, `alert`, sublinhado, no mínimo 44 px de altura). A mesma linha em categorias **fechadas** mostra **"Reabrir categoria"** na cor `brand`. "Sem categoria" nunca mostra esse botão. |
| RF-09 | Categoria fechada mostra o selo "Fechada" (12 px) ao lado do nome e **não** mostra barra de progresso, como hoje. |
| RF-10 | Se o benefício não tem categorias, o bloco mostra só "Todos os lançamentos (n)", como hoje. |
| RF-11 | "Todos os lançamentos (n)" abre todos os lançamentos do benefício (D8). |

### 3.2 Regras de negócio (RN)

| ID | Regra |
| -- | ----- |
| RN-01 | Nenhum cálculo muda: disponível = sobra anterior + crédito − gasto; percentual usado; divisão por categoria; sobra acumulada; liberação ao fechar. |
| RN-02 | Fechar e reabrir categoria funcionam como hoje (a confirmação de fechar mostra o valor liberado); só o ponto de entrada visual muda. |
| RN-03 | Editar e excluir benefício funcionam como hoje; só o ponto de entrada muda. |
| RN-04 | Rotas, mês compartilhado, benefício selecionado (lembrado só enquanto o app está aberto) e o limite de meses navegáveis não mudam. |
| RN-05 | Os `data-testid` existentes são mantidos: `benefit-face-*`, `button-new-benefit`, `text-benefit-available-*`, `text-benefit-credit-*`, `text-benefit-carried-*`, `text-benefit-spent-*`, `card-benefit-*`, `section-categories-*`, `row-category-*-*`, `open-category-*-*`, `button-close-*-*`, `button-reopen-*-*`, `text-released-*-*`, `button-all-spends-*`. Os antigos `button-edit-benefit-*` e `button-delete-benefit-*` passam a ser os itens "Editar benefício" e "Excluir benefício" da folha. |
| RN-06 | O "⋯" só é interativo no benefício **ativo** do carrossel (como hoje: `invisible` e `tabIndex=-1` nos outros). |

## 4. Cenários

```gherkin
# language: pt

Funcionalidade: Aba Benefícios redesenhada

  Cenário: Face do benefício
    Dado que o benefício "FLASH" tem crédito de R$ 800,00, sobra anterior de R$ 0,00 e gasto de R$ 500,00 em outubro de 2026
    Quando eu abro a aba "Benefícios"
    Então vejo "FLASH", "Disponível em outubro de 2026" e "R$ 300,00"
    E vejo três colunas: "Crédito R$ 800,00", "Sobra anterior R$ 0,00" e "Gasto R$ 500,00"
    E vejo "Gasto do mês" com "63%"
    E vejo o botão "Mais opções do benefício"

  Cenário: Editar benefício pelo menu
    Quando eu toco em "Mais opções do benefício" e em "Editar benefício"
    Então abre o formulário de edição do benefício

  Cenário: Excluir benefício pelo menu
    Quando eu toco em "Mais opções do benefício" e em "Excluir benefício"
    Então vejo a confirmação de excluir o benefício
    E ele só some se eu confirmar

  Cenário: Abrir os lançamentos de uma categoria
    Quando eu toco em qualquer parte da linha da categoria "Mercado"
    Então abre a tela de lançamentos de "Mercado" no mês aberto

  Cenário: Conta de cada categoria
    Dado que "Sem categoria" tem sobra R$ 0,00, crédito R$ 780,00 e gasto R$ 500,00
    Então vejo "R$ 280,00"
    E "sobra R$ 0,00 + crédito R$ 780,00 − gasto R$ 500,00"
    E a barra em 64%

  Cenário: Fechar uma categoria
    Dado que "Mercado" está aberta
    Quando eu toco em "Fechar categoria", na linha própria abaixo dela
    Então vejo a confirmação de fechar "Mercado", com o valor que será liberado
    E ao confirmar ela passa a mostrar o selo "Fechada", sem barra, e o botão "Reabrir categoria"

  Cenário: Reabrir uma categoria
    Dado que "Mercado" está fechada
    Quando eu toco em "Reabrir categoria"
    Então a categoria volta a aparecer aberta, com sobra zero

  Cenário: Sem categoria não fecha
    Então a linha "Sem categoria" não tem "Fechar categoria" nem "Reabrir categoria"

  Cenário: Categoria perto do limite
    Dado que uma categoria já usou mais de 85% do que reservou
    Então a barra dela aparece no tom quente

  Cenário: Disponível negativo
    Dado que uma categoria gastou mais do que tinha
    Então o valor disponível dela aparece na cor de alerta

  Cenário: Todos os lançamentos
    Quando eu toco em "Todos os lançamentos (1)"
    Então abre a tela com todos os lançamentos do benefício no mês aberto

  Cenário: Benefício sem categorias
    Dado que o benefício não foi dividido por categoria
    Então o bloco abaixo do carrossel mostra só "Todos os lançamentos (n)"

  Cenário: Carrossel com mais de um benefício
    Dado que existem dois benefícios
    Quando eu deslizo para o segundo
    Então a bolinha ativa muda e o "⋯" passa a valer para o segundo benefício
```

| Requisito | Cenário |
| --------- | ------- |
| RF-01, RF-02, RF-03, RN-01 | Face do benefício |
| RF-04, RN-03 | Editar benefício pelo menu; Excluir benefício pelo menu |
| RF-05, RF-06, D3 | Abrir os lançamentos de uma categoria; Conta de cada categoria |
| RF-07 | Categoria perto do limite |
| RF-08, RF-09, RN-02, D4 | Fechar uma categoria; Reabrir uma categoria; Sem categoria não fecha |
| D5 | Disponível negativo |
| RF-10 | Benefício sem categorias |
| RF-11, D8 | Todos os lançamentos |
| RN-04, RN-06 | Carrossel com mais de um benefício |
| D6, D7 | Verificação manual no roteiro |

## 5. Dados e contrato

Sem mudança no formato salvo, na camada de dados nem nos hooks.

## 6. Interface

Medidas de referência (artboard "Benefícios — proposta"; largura de referência 390 px):

- **Carrossel:** igual ao de Cartões ([`redesign-cartoes.md`](redesign-cartoes.md) seção 6): card com 86% da largura, raio 26 px, padding 20 px, círculos decorativos mantidos, próximo card aparecendo pela direita. Fundo e acento vêm de `CARD_COLORS`.
- **Cabeçalho da face:** coluna com o rótulo "Mensal" (mono 12 px, `tracking` .14em, caixa alta, cor de acento) e o nome em Fraunces 26 px, `leading-tight`; à direita o "⋯" de 44 px com borda `rgba(255,255,255,.28)`.
- **Valor disponível:** rótulo de 13 px em `rgba(255,250,240,.84)`; valor em Fraunces 42 px, `leading` 1.15, `tracking` -.03em; 20 px abaixo do cabeçalho.
- **Colunas:** `grid grid-cols-3 gap-2`, 16 px abaixo do valor; rótulo de 12 px, valor em mono 14 px. "Sobra anterior" cabe numa coluna de cerca de 94 px a 390 px de largura; confira também a 360 px.
- **Barra "Gasto do mês":** 16 px abaixo das colunas; rótulo e percentual de 13 px; barra `h-2` com trilho `rgba(255,255,255,.18)`.
- **Bloco "Por categoria":** começa 12 px abaixo das bolinhas; um único cartão com raio 24 px, borda `line`, fundo `surface`, `overflow-hidden`. O título tem `px-5 pb-3 pt-4`. Cada categoria tem borda superior `line` e `px-5`; o botão da linha é `flex-col gap-1 py-3`; a linha de "Fechar categoria" / "Reabrir categoria" tem `min-h-11 justify-end`.
- **"Todos os lançamentos (n)":** `min-h-14`, `px-5`, borda superior `line`, texto de 15 px (600), seta de 18 px.
- **Folha do "⋯":** a mesma de Cartões (`card-menu.tsx`), com "Editar benefício" (cor `ink`), "Excluir benefício" (cor `alert`) e "Fechar".
- **Cores:** barras e destaques com `brand`; tom quente `#d98771` só para mais de 85%; avisos e ações destrutivas com `alert`; texto secundário com `ink-soft`.

## 7. Fora de escopo

- Tela de lançamentos do benefício (`beneficio-lancamentos.tsx`), formulário do benefício e formulário de gasto.
- Dark mode, textura de fundo (`notebook-grain`) e animações.
- Trocar os hexadecimais de telas fora desta spec.
- Novas funções (gráficos, comparação entre meses, ordenação de categorias).

### Ponto a confirmar antes de implementar

O canvas foi desenhado a partir de prints do app, e nos prints o botão "Fechar" aparece com cerca de 16 px e "Todos os lançamentos (n)" com cerca de 15 px sem negrito, **maiores** do que no código do GitHub (`main`, último commit de 18/10). Isso indica alterações locais ainda não enviadas. Antes de começar, confira o seu código local e aplique os tamanhos desta spec sobre ele. Se algo de que esta spec depende já tiver mudado (por exemplo o nome de algum botão), siga o seu código e avise.

## 8. Critérios de aceite

- [x] `npm run typecheck` e `npm run build` passam.
- [x] A face mostra "Mensal", nome, disponível, as três colunas e a barra "Gasto do mês", sem a frase corrida.
- [x] "⋯" abre a folha com "Editar benefício" e "Excluir benefício"; excluir pede confirmação e só apaga ao confirmar.
- [x] A linha inteira da categoria abre os lançamentos dela.
- [x] "Fechar categoria" e "Reabrir categoria" ficam em linha própria, com 44 px de altura, e funcionam como antes (inclusive a confirmação com o valor liberado; fechar e reabrir foram testados de fato).
- [x] "Sem categoria" não mostra o botão de fechar nem o de reabrir.
- [x] Categoria fechada mostra o selo "Fechada" e não mostra barra.
- [x] Barra acima de 85% no tom quente; disponível negativo na cor `alert`.
- [x] Texto mínimo de 12 px e alvos de 44 px nos botões da aba (medido por script no navegador); contraste do acento sobre cada cor de fundo entre 4,6 e 8,8 (calculado). A 360 px as colunas do resumo cabem numa linha (valores em 13 px abaixo de 375 px).
- [ ] A aba Cartões continua funcionando (carrossel e "⋯"). Não reaberta depois desta mudança, que alterou o padding do carrossel compartilhado.
- [x] `FUNCIONALIDADES.md` e `README.md` atualizados.

## 9. Tarefas

1. Em `beneficios.tsx`, trocar os botões de editar e excluir da face pelo "⋯" e a folha de `card-menu.tsx` (RF-04, D2).
2. Reorganizar a face: rótulo "Mensal", nome, disponível, três colunas e barra (RF-01 a RF-03, D1, D7).
3. Reescrever o bloco "Por categoria": cartão único, linha-botão por categoria, "Fechar categoria" e "Reabrir categoria" em linha própria, selo "Fechada", barras de 8 px (RF-05 a RF-09, D3 a D5).
4. Atualizar "Todos os lançamentos (n)" (RF-11, D8) e os estados de carregamento, erro e vazio (D6).
5. Trocar os hexadecimais da aba pelas cores com nome; criar cor com nome só se faltar uma.
6. Atualizar `FUNCIONALIDADES.md` (nova seção 25 com os cenários acima; ajustar os cenários da seção 13 e 21 que citam "Fechar", "Reabrir", editar e excluir) e o `README.md` (seção "Benefícios").
7. Marcar o Status como `Implementada` e só os critérios de aceite realmente verificados.

## 10. Roteiro de verificação

1. `npm run dev` e abrir `#/beneficios` com 390 px de largura e também com 360 px.
2. Passar pelos cenários da seção 4. Criar um benefício dividido por categoria, um sem divisão e um com uma categoria fechada; gastar mais de 85% e mais que o disponível em categorias diferentes.
3. Criar dois benefícios e deslizar entre eles; conferir que o "⋯" segue o benefício ativo.
4. Trocar a cor de um benefício e conferir o contraste do acento sobre cada fundo.
5. Abrir `#/` e conferir que Cartões continua funcionando.
6. Rodar `npm run typecheck` e `npm run build`.
