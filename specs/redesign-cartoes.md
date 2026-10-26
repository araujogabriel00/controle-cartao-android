# Spec — Redesign da aba Cartões

| Campo | Valor |
| ----- | ----- |
| Status | Implementada |
| Criada em | 25/10/2026 |
| Escopo | `src/pages/dashboard.tsx`, `src/components/card-carousel.tsx`, `src/components/snap-carousel.tsx`, `src/components/card-menu.tsx` (novo), `src/components/progress.tsx`, `src/index.css` (só se faltar cor com nome), `FUNCIONALIDADES.md`, `README.md` |
| Depende de | [`redesign-entradas.md`](redesign-entradas.md) (cores com nome, seletor de mês, abas e rodapé novos), [`compras-e-categorias.md`](compras-e-categorias.md), [`parcelamento.md`](parcelamento.md), [`compra-recorrente.md`](compra-recorrente.md), [`multiplos-cartoes.md`](multiplos-cartoes.md), [`historico-no-cartao.md`](historico-no-cartao.md) |
| Referência visual | Canvas "Controle do Cartão — Entradas", artboards "Cartões — atual" e "Cartões — proposta" |

> Mudanças de comportamento entram primeiro aqui e só depois no código.

**Antes de começar:** a branch deve partir da `main` com o PR de [`redesign-entradas.md`](redesign-entradas.md) já mesclado, porque esta spec usa as cores com nome (`paper`, `surface`, `line`, `ink`, `ink-soft`, `brand`, `on-brand`, `eyebrow`, `alert`) e o seletor de mês, as abas e o rodapé novos.

---

## 1. Contexto e objetivo

A aba Cartões tem três problemas de uso no celular:

- A face do cartão aperta o título, o rótulo "VISÃO DO CARTÃO" (que quebra em duas linhas) e **três botões de 33 px** (histórico, editar, excluir). O excluir apaga o cartão **e todos os registros** e fica a um toque, colado nos outros dois.
- Cada compra tem lápis e lixeira de **12 px** (alvos de cerca de 20 px) em toda linha.
- Textos de **9 a 11 px** (selos, datas, percentuais, "Total do filtro"), valores em vermelho e rótulos dourados de baixo contraste.

**Objetivo:** tornar a aba confortável de tocar e de ler, sem mudar nenhuma regra de compra, parcela, recorrência, categoria, fatura ou histórico. A única mudança de comportamento é **onde ficam** as ações de editar e excluir (seção 2, D2 e D3).

## 2. Decisões de produto

| # | Decisão | Motivo |
| - | ------- | ------ |
| D1 | O rótulo "VISÃO DO CARTÃO" sai da face do cartão. | É redundante com o nome do cartão e quebra em duas linhas. |
| D2 | A face do cartão tem **dois botões de 44 px**: **Histórico** e **"⋯" (Mais opções do cartão)**. **Editar cartão** e **Excluir cartão** ficam dentro do "⋯", numa folha de rodapé. Excluir mantém a confirmação que já existe. | Tira o botão destrutivo da frente e libera espaço para o nome. |
| D3 | A **linha inteira da compra é um botão** que abre a edição (o mesmo formulário e a mesma pergunta "Só este mês / Este e os próximos" das recorrentes). Os ícones de lápis e lixeira saem da linha. **Excluir compra** passa a ser um botão de texto, em cor de alerta, **dentro do formulário de edição**, e usa o mesmo fluxo de exclusão de hoje (confirmação, parcelada, recorrente com escopo). | Alvos de toque grandes e menos exclusão acidental. |
| D4 | Linhas **previstas** de cobrança recorrente continuam **sem ação** (não são botões). **Parcelas previstas** abrem a edição da compra parcelada, como a [`editar-parcela-prevista.md`](editar-parcela-prevista.md) já faz, e o "Excluir compra" do formulário remove a compra parcelada. | A spec foi escrita sobre o código de 18/10, antes de [`editar-parcela-prevista.md`](editar-parcela-prevista.md) e [`todas-as-compras.md`](todas-as-compras.md). Manter a edição da parcela prevista preserva o que já foi aprovado e entregue. |
| D5 | Valores de compra e de categoria deixam de ser vermelhos: compra é "− R$ …" na cor `ink`. | Mesma regra de [`redesign-entradas.md`](redesign-entradas.md) D3. |
| D6 | Texto mínimo de **12 px** (e 13 px onde o canvas mostra 13). Alvos de toque de no mínimo **44 px**. Isso vale também para textos que o canvas não desenha: aviso de mês futuro, estado vazio, "Total do filtro", "Ver mais N compras" e "Mostrar menos". | Legibilidade e toque no celular. |
| D7 | O rodapé decorativo do fim da página ("Um jeito mais gentil de acompanhar o que importa." e "CONTROLE DO CARTÃO · 01") é removido. | Texto de 10 px sem função, que só alonga a tela. |
| D8 | Os rótulos dourados "COMPRAS" e "RESUMO" usam a cor `eyebrow` (mais escura), com 12 px. | O dourado atual tem contraste baixo. |
| D9 | O `SnapCarousel` é compartilhado com a aba Benefícios. Os tamanhos novos (bolinhas de 44 px e o "+" de 44 px) valem nas duas abas. A face e o conteúdo de Benefícios ficam para outra spec. | Evita duas versões do mesmo carrossel. |

## 3. Requisitos

### 3.1 Requisitos funcionais (RF)

| ID | Requisito |
| -- | --------- |
| RF-01 | A face do cartão mostra o **nome** (Fraunces 26 px), os botões **Histórico** e **"⋯"** (44 px, borda `white/28`), o rótulo "Fatura de ‹mês›" (ou "Fatura prevista de ‹mês›" em mês futuro) com 13 px, o **valor da fatura** (Fraunces 42 px) e o texto "N compras" (ou "Nenhuma compra neste mês.") com 13 px. |
| RF-02 | "⋯" abre uma folha de rodapé com **"Editar cartão"** e **"Excluir cartão"**; excluir pede a mesma confirmação de hoje. A folha fecha ao tocar fora, em "Fechar" ou ao escolher uma opção. |
| RF-03 | As bolinhas do carrossel e o "+" de novo cartão têm alvo de 44 px. A bolinha ativa é uma pílula de 20×8 px na cor do cartão. |
| RF-04 | O bloco **Compras** tem: rótulo "COMPRAS" (12 px, `eyebrow`), título "O que já aconteceu" (Fraunces 28 px), o link **"Todas as compras"** (14 px, 600, `brand`, sublinhado, alvo de 44 px, à direita do rótulo) e os filtros de categoria. |
| RF-05 | Os filtros de categoria ficam numa **fileira rolável na horizontal**, sem quebrar linha, com botões de 44 px de altura, 14 px, 600. O ativo usa `brand` com texto `on-brand`; os outros usam borda `#cfc7b7`, fundo `surface` e texto `ink-soft`. Mantêm `aria-pressed`. |
| RF-06 | Cada compra é um **botão de linha inteira** com no mínimo 72 px: ícone circular de 40 px; descrição (15 px, 600) com o selo de parcela (`1/7`, mono 12 px) e, nas recorrentes, o selo "Mensal"; data (13 px, `ink-soft`, ícone de calendário de 14 px) e categoria (selo de 12 px); valor "− R$ …" em mono 15 px, peso 500, `ink`, alinhado à direita. O botão abre a edição (D3) e tem nome acessível "Editar compra ‹descrição›". |
| RF-07 | O formulário de edição de compra ganha o botão de texto **"Excluir compra"** (cor `alert`, alvo de 44 px). Ele fecha o formulário e executa o fluxo de exclusão existente. Ele não aparece ao criar. |
| RF-08 | O bloco **Por categoria** tem: rótulo "RESUMO", título "Por categoria" (Fraunces 28 px) e um cartão com uma linha por categoria: nome (15 px, 600), valor (mono 15 px), barra de **8 px** na cor `brand` sobre trilho `#e6e1d5`, e o percentual em mono **13 px** (`ink-soft`). |
| RF-09 | "Total do filtro", o aviso de mês futuro, os estados vazios e "Ver mais N compras" / "Mostrar menos" seguem D6 (12 a 13 px, alvos de 44 px nos botões). |
| RF-10 | A cor do cartão continua vindo de `CARD_COLORS` (fundo e acento). Nenhuma cor de cartão muda. |

### 3.2 Regras de negócio (RN)

| ID | Regra |
| -- | ----- |
| RN-01 | Nenhum cálculo muda: fatura do mês, total do filtro, resumo por categoria e percentuais. |
| RN-02 | Editar e excluir compra, compra parcelada e compra recorrente (com "Só este mês / Este e os próximos") funcionam como hoje; só o ponto de entrada muda. |
| RN-03 | Excluir cartão continua apagando o cartão e todos os registros dele, com a confirmação atual. |
| RN-04 | Histórico, troca de cartão pelo carrossel, cartão lembrado, mês compartilhado e rotas não mudam. |
| RN-05 | Os `data-testid` existentes (`card-face-*`, `button-history`, `button-edit-card`, `button-add-card`, `filter-*`, `row-movement-*`, `row-planned-*`, `list-movements`, `list-category-summary`, `row-summary-*`, `text-filter-total`, `badge-installment-*`, `badge-recurring`, `text-movement-category`) são mantidos. `button-edit-card` passa a ser o item "Editar cartão" da folha. |
| RN-06 | O botão Histórico e o "⋯" só são interativos no cartão **ativo** do carrossel (como hoje: `invisible` e `tabIndex=-1` nos outros). |

## 4. Cenários

```gherkin
# language: pt

Funcionalidade: Aba Cartões redesenhada

  Cenário: Face do cartão
    Dado que o cartão "Nubank" tem fatura de R$ 417,16 em outubro de 2026 com 3 compras
    Quando eu abro a aba "Cartões"
    Então vejo "Nubank", "Fatura de outubro de 2026", "R$ 417,16" e "3 compras"
    E vejo os botões "Ver histórico de Nubank" e "Mais opções do cartão"
    E não vejo o texto "Visão do cartão"

  Cenário: Editar cartão pelo menu
    Quando eu toco em "Mais opções do cartão" e em "Editar cartão"
    Então abre o formulário de edição do cartão

  Cenário: Excluir cartão pelo menu
    Quando eu toco em "Mais opções do cartão" e em "Excluir cartão"
    Então vejo a confirmação de excluir o cartão e todos os seus registros
    E o cartão só some se eu confirmar

  Cenário: Abrir o histórico
    Quando eu toco em "Ver histórico de Nubank"
    Então abre a tela de histórico, como hoje

  Cenário: Filtrar por categoria
    Dado que existem compras em "testes" e "Eletrônicos"
    Quando eu toco no filtro "Eletrônicos"
    Então a lista mostra só as compras de "Eletrônicos"
    E vejo "Total do filtro" com a soma delas
    E os filtros ficam numa única fileira que rola na horizontal

  Cenário: Editar uma compra tocando na linha
    Quando eu toco na linha da compra "Cabo"
    Então abre o formulário de edição com os dados dela
    E não há lápis nem lixeira dentro da linha

  Cenário: Excluir uma compra pelo formulário
    Dado que o formulário de edição de "Cabo" está aberto
    Quando eu toco em "Excluir compra"
    Então vejo a confirmação de excluir a compra "Cabo"
    E ao confirmar a compra some da lista e a fatura diminui

  Cenário: Excluir uma compra parcelada pelo formulário
    Dado que o formulário de edição de "teste" (1/7) está aberto
    Quando eu toco em "Excluir compra"
    Então vejo a confirmação de remover a compra parcelada e todas as suas parcelas

  Cenário: Excluir uma compra recorrente pelo formulário
    Dado que o formulário de edição de uma compra recorrente está aberto
    Quando eu toco em "Excluir compra"
    Então vejo a pergunta "Só este mês" ou "Este e os próximos"

  Cenário: Criar uma compra não mostra "Excluir compra"
    Quando eu toco em "Lançar" e em "Compra no cartão"
    Então o formulário não tem o botão "Excluir compra"

  Cenário: Linhas previstas não têm ação
    Dado que estou num mês futuro com parcelas previstas
    Então as linhas previstas aparecem com o selo "prevista"
    E não são botões

  Cenário: Resumo por categoria
    Dado que "testes" soma R$ 357,16 e "Eletrônicos" soma R$ 60,00
    Então vejo "testes" com "R$ 357,16" e "86%"
    E "Eletrônicos" com "R$ 60,00" e "14%"
    E os valores não aparecem em vermelho

  Cenário: Carrossel com mais de um cartão
    Dado que existem dois cartões
    Quando eu deslizo para o segundo cartão
    Então a bolinha ativa muda e o histórico e o "⋯" passam a valer para o segundo cartão
```

| Requisito | Cenário |
| --------- | ------- |
| RF-01, RF-10 | Face do cartão |
| RF-02, RN-03 | Editar cartão pelo menu; Excluir cartão pelo menu |
| RF-03, RN-06 | Carrossel com mais de um cartão |
| RF-04, RF-05 | Filtrar por categoria |
| RF-06, RN-02 | Editar uma compra tocando na linha |
| RF-07, RN-02 | Excluir uma compra pelo formulário; parcelada; recorrente; Criar uma compra não mostra "Excluir compra" |
| RF-08, RN-01, D5 | Resumo por categoria |
| D4 | Linhas previstas não têm ação |
| RN-04 | Abrir o histórico |
| RF-09, D6, D7, D8 | Verificação manual no roteiro |

## 5. Dados e contrato

Sem mudança no formato salvo, na camada de dados nem nos hooks.

## 6. Interface

Medidas de referência (artboard "Cartões — proposta"; a largura de referência é 390 px):

- **Carrossel:** card com 86% da largura (322 px na referência), raio 26 px, padding 20 px, círculos decorativos mantidos; a fileira sangra 16 px para fora da margem da página e o próximo card aparece pela direita (o "+" de novo cartão, tracejado).
- **Face do cartão:** nome em Fraunces 26 px com `leading-tight`; valor da fatura em Fraunces 42 px, `leading` 1.15, `tracking` -.03em; rótulos de 13 px em `rgba(255,250,240,.84)`; o fundo e o acento vêm de `CARD_COLORS`.
- **Folha do "⋯":** igual à folha "Lançar" (mesmo `dialogOverlay`, `max-w-[440px]`, `rounded-t-[24px]`, `bg-surface`), com linhas de 56 px: "Editar cartão" (cor `ink`) e "Excluir cartão" (cor `alert`), e um botão "Fechar". Componente novo em `src/components/card-menu.tsx`, reutilizável para o menu do benefício.
- **Filtros:** `flex gap-2 overflow-x-auto`, com `-mx-4 px-4` para sangrar até a borda; esconder a barra de rolagem com `.no-scrollbar`.
- **Lista de compras:** contêiner com raio 24 px, borda `line`, fundo `surface`; linhas de no mínimo 72 px, `px-4 py-3`, `gap-3`; ícone circular de 40 px com fundo `#f1e9df` e cor `#9a4f3f`; divisórias na cor `line`. Selo de parcela: fundo `#ece6da`, texto `ink-soft`, mono 12 px. Selo de categoria: fundo `#e4ece2`, texto `#2f5a44`, 12 px, peso 500.
- **Resumo por categoria:** cartão com raio 24 px, padding 20 px, `gap` 20 px entre linhas; barra `h-2` (8 px) com trilho `#e6e1d5`; percentual com `w-10`.
- **Títulos de seção:** Fraunces 28 px, `leading-tight`, cor `ink`. Rótulos de seção: mono 12 px, caixa alta, `tracking` .14em, cor `eyebrow`.
- **Espaços:** seletor de mês, abas e rodapé seguem [`redesign-entradas.md`](redesign-entradas.md). O carrossel começa 20 px abaixo das abas; os blocos Compras e Por categoria ficam a 28 px um do outro.

## 7. Fora de escopo

- Conteúdo e face da aba Benefícios (próxima spec), salvo o que o `SnapCarousel` compartilhado impõe (D9).
- Dark mode, textura de fundo (`notebook-grain`) e animações.
- Trocar os hexadecimais de telas fora desta spec.
- Novas funções (busca, ordenação, gráficos, barra de "saídas × entradas").
- O que o link "Todas as compras" faz: **não muda**. Veja o ponto a confirmar abaixo.

### Ponto a confirmar antes de implementar

O canvas foi desenhado a partir de prints do app, e os prints têm o link **"Todas as compras"** e botões de filtro maiores, que **não existem** no código do GitHub (`main`, último commit de 18/10). Isso indica alterações locais ainda não enviadas. Antes de começar:

1. Confira no seu código local o que "Todas as compras" faz hoje e mantenha esse comportamento; só mude o visual (RF-04).
2. Se o link não existir no seu código, **não o crie**: retire-o do bloco Compras e deixe o rótulo "COMPRAS" sozinho na linha.
3. Os tamanhos desta spec valem sobre o código que estiver na sua branch, mesmo que ele já tenha filtros maiores que os do GitHub.

## 8. Critérios de aceite

- [x] `npm run typecheck` e `npm run build` passam.
- [x] A face do cartão mostra nome, fatura, "N compras", Histórico e "⋯", sem o rótulo "Visão do cartão".
- [x] "⋯" abre a folha com "Editar cartão" e "Excluir cartão"; excluir pede confirmação (a confirmação foi exercitada recusando; apagar de fato não foi testado).
- [x] Tocar na linha de uma compra abre a edição; não há lápis nem lixeira na linha.
- [x] "Excluir compra" no formulário funciona para compra comum, parcelada e recorrente (com escopo), e não aparece ao criar.
- [x] Linhas previstas de cobrança recorrente não são botões (parcelas previstas são, ver D4).
- [ ] Os filtros ficam numa fileira rolável de botões de 44 px (botões de 44 px conferidos; a rolagem horizontal não foi testada com muitas categorias).
- [x] Nenhum valor de compra ou categoria aparece em vermelho (valores em `ink`).
- [x] Texto mínimo de 12 px e alvos de 44 px nos botões da aba (medido por script no navegador, 390 px).
- [x] O rodapé decorativo do fim da página foi removido.
- [ ] A aba Benefícios continua funcionando, com as bolinhas e o "+" de 44 px (abre sem erro e o "+" tem 44 px; não testado com benefícios cadastrados).
- [x] `FUNCIONALIDADES.md` (seção 25) e `README.md` atualizados.

## 9. Tarefas

1. Criar `src/components/card-menu.tsx` (folha com "Editar" e "Excluir", reutilizável) e usá-la na face do cartão.
2. Atualizar `card-carousel.tsx` (RF-01, RF-02, D1, D2) e `snap-carousel.tsx` (RF-03, D9).
3. Em `dashboard.tsx`: filtros rolláveis (RF-05), lista de compras com linha-botão (RF-06, D3, D4), "Total do filtro", aviso de mês futuro e estados vazios (RF-09), bloco Compras (RF-04) e Por categoria (RF-08), remoção do rodapé decorativo (D7).
4. Adicionar "Excluir compra" ao formulário de edição, ligado ao fluxo de exclusão existente (RF-07).
5. Atualizar `progress.tsx` para a barra de 8 px e o trilho novo (RF-08).
6. Trocar os hexadecimais da aba pelas cores com nome; criar cor com nome só se faltar uma (por exemplo para `#f1e9df`, `#ece6da`, `#e4ece2`).
7. Atualizar `FUNCIONALIDADES.md` (nova seção 24 com os cenários acima) e `README.md` (seção "Compras e categorias" e "Histórico mensal": ações de editar e excluir mudaram de lugar).
8. Marcar o Status como `Implementada` e só os critérios de aceite realmente verificados.

## 10. Roteiro de verificação

1. `npm run dev` e abrir `#/` com 390 px de largura (e com 360 px, para conferir que nada estoura).
2. Passar pelos cenários da seção 4, incluindo um cartão com compra parcelada, uma recorrente e um mês futuro com parcelas previstas.
3. Criar dois cartões e deslizar entre eles; conferir que "⋯" e Histórico seguem o cartão ativo.
4. Abrir `#/beneficios` e conferir que o carrossel continua funcionando com as bolinhas e o "+" maiores.
5. Rodar `npm run typecheck` e `npm run build`.
