# Spec — Opção D na aba Cartões: fatura em destaque e três gráficos

| Campo | Valor |
| ----- | ----- |
| Status | Proposta |
| Criada em | 26/10/2026 |
| Escopo | `src/pages/dashboard.tsx` (face do cartão, gráficos e bloco Compras), `src/components/card-carousel.tsx` e `src/components/snap-carousel.tsx` (só o uso nesta aba), `src/components/charts/` (novos gráficos), `src/components/card-menu.tsx` (novo, se ainda não existir), `FUNCIONALIDADES.md`, `README.md` |
| Depende de | [`redesign-opcao-d-entradas.md`](redesign-opcao-d-entradas.md) (cores `chart-*`, componentes de gráfico, rodapé), [`redesign-entradas.md`](redesign-entradas.md), [`compras-e-categorias.md`](compras-e-categorias.md), [`cartao-sem-limite.md`](cartao-sem-limite.md), [`parcelamento.md`](parcelamento.md), [`compra-recorrente.md`](compra-recorrente.md), [`historico-no-cartao.md`](historico-no-cartao.md), [`multiplos-cartoes.md`](multiplos-cartoes.md) |
| Referência visual | Canvas "Controle do Cartão — Entradas": artboard "Opção D — Gráficos" da tela Cartões e o fluxo "Opção D" |

> Mudanças de comportamento entram primeiro aqui e só depois no código.
> **Implemente depois de** [`redesign-opcao-d-entradas.md`](redesign-opcao-d-entradas.md).

---

## 1. Contexto e objetivo

A aba Cartões mostra a face colorida do cartão, a lista de compras e o resumo por categoria, com textos de 9 a 11 px e botões pequenos. A Opção D tira a face colorida, põe a **fatura em texto grande** e acrescenta **três gráficos** que respondem: como a fatura cresceu no mês, em que ela foi gasta e quanto vem pela frente.

**Objetivo:** leitura rápida da fatura e do que vem pela frente, com alvos de toque de 44 px e texto de 12 px ou mais. Nenhuma regra de fatura, parcela, categoria ou histórico muda.

## 2. Decisões de produto

| # | Decisão | Motivo |
| - | ------- | ------ |
| D1 | O carrossel de faces coloridas é trocado por uma **fileira de botões** (44 px) rolável na horizontal: um por cartão, mais "Novo cartão". O cartão selecionado usa `ink` com texto `on-brand` e uma bolinha com a cor do cartão; os outros usam borda e fundo `surface`. Tocar troca o cartão selecionado (mesmo comportamento do carrossel). | Menos altura gasta; a cor do cartão continua visível na bolinha. |
| D2 | Abaixo da fileira vem a **fatura**: "Fatura de ‹mês›" (14 px; "Fatura prevista de ‹mês›" em mês futuro), o valor em Fraunces 52 px, o botão "⋯ Mais opções do cartão" (44 px) à direita e a linha "N compras · próxima fatura prevista R$ X" (15 px). | Fatura é o número principal. |
| D3 | "⋯" abre a folha de rodapé com **"Editar cartão"** e **"Excluir cartão"** (excluir mantém a confirmação de hoje). O botão **Histórico** vira o link **"Histórico"** no título do gráfico "Próximas faturas" (D8). | Tira o botão destrutivo da frente; o histórico fica junto das faturas. |
| D4 | **"Próxima fatura prevista"** é o valor do mês seguinte ao aberto, vindo das parcelas e cobranças previstas. Sem valor (R$ 0,00), a frase fica só "N compras". | Informação já calculada pela tela de histórico. |
| D5 | **Ritmo do mês**: gráfico de degraus com o gasto acumulado dia a dia no mês aberto. Eixo x: dias do mês (rótulos 1, 8, 15, 22, 29). Eixo y: 4 marcas redondas até um pouco acima da fatura. Linha de 2 px e área a 10% de opacidade na cor `chart-violet`. Cada compra é um ponto de 8 px com anel de 2 px da cor do fundo e uma dica (`<title>`) "‹data›: +R$ x (‹descrição›)". No mês corrente há uma linha vertical em "hoje" e o rótulo "hoje". A maior alta do mês recebe o rótulo "+R$ x" ao lado. | Mostra quando a fatura subiu. |
| D6 | Em mês **passado** o gráfico vai até o último dia, sem "hoje". Em mês **futuro** ele mostra as parcelas previstas com a linha em tom claro (`chart-violet` a 38%) e o rótulo "prevista". Sem compras no mês: mensagem "Nenhuma compra neste mês." no lugar do gráfico. | Cobre os três tempos do app. |
| D7 | **Para onde foi**: barras horizontais por categoria, uma por linha, com nome e "valor · percentual", barra de 12 px sobre trilho `chart-track`, **todas na mesma cor** `chart-violet`. Cada linha é um botão que filtra as compras (como os botões de filtro de hoje). As categorias vêm do resumo por categoria que a tela já calcula. | Uma cor só, porque as categorias são abertas e têm nome ao lado. |
| D8 | **Próximas faturas**: sete colunas, começando no mês aberto. Mês até o corrente: cor cheia ("Lançada"); mês futuro: cor a 38% ("Prevista"). Valor no topo da primeira e da última coluna, rótulo do mês abaixo (3 letras). Legenda "Lançada" e "Prevista". O título tem à direita o link **"Histórico"** (44 px) que abre a tela de histórico. | Mostra a fatura que vem pela frente e dá acesso ao histórico. |
| D9 | O bloco **Compras** continua com a lista de hoje (linha inteira é botão que abre a edição; "Todas as compras" e os filtros de categoria mantêm o comportamento). Só o visual muda: hairlines em vez de cards e 44 px de alvo. Ver [`redesign-cartoes.md`](redesign-cartoes.md) para as medidas da linha, se ele já estiver implementado. | Não mexer na lógica da lista. |
| D10 | Não há botão "Tabela" nos gráficos. Cada gráfico tem `aria-label` com os números e uma tabela de apoio `sr-only`. | Mesmo critério da spec de Entradas. |

## 3. Requisitos

### 3.1 Requisitos funcionais (RF)

| ID | Requisito |
| -- | --------- |
| RF-01 | A tela mostra, nesta ordem: seletor de mês, abas, fileira de cartões (D1), fatura (D2), "Ritmo do mês" (D5), "Para onde foi" (D7), "Próximas faturas" (D8) e "Compras" (D9), seguidos do rodapé "Lançar" e "Categorias". |
| RF-02 | A fileira de cartões tem um botão por cartão, com alvo de 44 px, e "Novo cartão" (ícone "+" de 16 px). Toque em cartão chama a mesma troca de cartão selecionado de hoje. Sem cartão cadastrado, a tela mostra o convite de hoje ("Vamos anotar o seu cartão?"), com o visual desta spec. |
| RF-03 | "⋯" tem `aria-label="Mais opções do cartão"` e abre a folha do D3. A folha fecha ao tocar fora, em "Fechar" ou ao escolher uma opção. |
| RF-04 | O gráfico "Ritmo do mês" tem `role="img"` e `aria-label` com a descrição ("Gasto acumulado no cartão em outubro: R$ 20,00 no dia 2, R$ 60,00 no dia 15 e R$ 417,16 no dia 17…"). Cada ponto é uma área de toque de pelo menos 28 px (círculo transparente) com `<title>`. |
| RF-05 | "Para onde foi" lista no máximo **6 categorias**; as demais somam numa linha "Outras" (mesma cor). Categoria "Sem categoria" aparece como as outras. Tocar numa linha aplica o filtro de categoria à lista de Compras e rola até ela. |
| RF-06 | "Próximas faturas" mostra sempre 7 colunas; mês sem valor mostra coluna de altura mínima e "0" no rótulo da dica. A escala vai de 0 a um número redondo acima do maior valor. |
| RF-07 | Nos gráficos, textos de 12 px ou mais; eixos e grades em hairline de 1 px na cor `line`; barras de no máximo 24 px de espessura, ponta arredondada de 4 px e base reta; linhas de 2 px. |
| RF-08 | A tela de histórico (`/historico`) abre pelo link do D8; o botão de voltar dela leva de volta à aba Cartões, como hoje. |

### 3.2 Regras de negócio (RN)

| ID | Regra |
| -- | ----- |
| RN-01 | Nenhum cálculo muda: fatura = soma das compras do mês; parcelas e recorrentes caem como hoje; categorias só classificam. |
| RN-02 | Os dados dos gráficos saem do que a tela já busca: compras do mês (para o ritmo), resumo por categoria (para "Para onde foi") e parcelas futuras do cartão (`useGetFutureInstallments`) mais a fatura do mês aberto (para "Próximas faturas"). Não há endpoint novo. |
| RN-03 | "Lançada" vale para meses até o corrente; "Prevista" para meses depois dele, mesmo que já tenham compras registradas. |
| RN-04 | Mês, cartão selecionado e rotas não mudam. Trocar de aba mantém o mês; o app lembra o cartão selecionado. |
| RN-05 | Os `data-testid` existentes são mantidos: `card-face-*` passa a ser o botão do cartão na fileira, e `button-history`, `button-edit-card`, `button-add-card`, `filter-*`, `row-movement-*`, `row-planned-*`, `list-movements`, `list-category-summary`, `row-summary-*` e `text-filter-total` continuam. O `button-edit-card` e o de excluir passam a ser os itens da folha do "⋯". |

## 4. Cenários

```gherkin
# language: pt
Funcionalidade: Aba Cartões na Opção D

  Contexto:
    Dado que hoje é 25/10/2026 e existe o cartão "Nubank"
    E em outubro há "Cabo" de R$ 20,00 (02/10), "Fone" 1/3 de R$ 40,00 (15/10) e "teste" 1/7 de R$ 357,16 (17/10)

  Cenário: Fatura em destaque
    Quando eu abro a aba "Cartões"
    Então vejo "Fatura de outubro de 2026" e "R$ 417,16"
    E "3 compras · próxima fatura prevista R$ 397,16"
    E não vejo a face colorida do cartão

  Cenário: Trocar de cartão
    Dado que existem os cartões "Nubank" e "Inter"
    Quando eu toco em "Inter" na fileira
    Então o cartão selecionado passa a ser "Inter" e a tela mostra a fatura dele

  Cenário: Ritmo do mês
    Então vejo o gráfico "Ritmo do mês" com degraus em 02, 15 e 17 de outubro
    E "+R$ 357,16" ao lado da maior alta
    E a linha "hoje" no dia 25

  Cenário: Para onde foi
    Então vejo "testes R$ 357,16 · 86%" e "Eletrônicos R$ 60,00 · 14%", ambas na mesma cor
    Quando eu toco em "Eletrônicos"
    Então a lista de Compras mostra só "Fone" e "Cabo"

  Cenário: Próximas faturas
    Então vejo sete colunas: outubro cheia com R$ 417,16
    E novembro e dezembro claras com R$ 397,16 e janeiro a abril claras com R$ 357,16

  Cenário: Abrir o histórico
    Quando eu toco em "Histórico" no título de "Próximas faturas"
    Então abre a tela de histórico do cartão

  Cenário: Editar e excluir o cartão
    Quando eu toco em "Mais opções do cartão" e em "Excluir cartão"
    Então vejo a confirmação de excluir o cartão e todos os seus registros
    E o cartão só some se eu confirmar

  Cenário: Mês passado
    Quando eu volto para setembro de 2026
    Então o gráfico "Ritmo do mês" vai até o dia 30, sem a linha "hoje"
    E a primeira coluna de "Próximas faturas" é setembro, em cor cheia

  Cenário: Mês futuro
    Quando eu abro novembro de 2026
    Então o rótulo é "Fatura prevista de novembro de 2026"
    E o ritmo mostra as parcelas previstas em tom claro

  Cenário: Mês sem compras
    Dado que um mês não tem compras
    Então "Ritmo do mês" mostra "Nenhuma compra neste mês."
    E "Para onde foi" mostra a mensagem de hoje para resumo vazio
```

## 5. Dados e contrato

Sem mudança no formato salvo nem nas funções de `src/data/store.ts`. Os gráficos montam as séries no componente a partir de dados que a tela já recebe (RN-02). Se o resumo por categoria ou as parcelas futuras ainda não estiverem acessíveis na tela, usar os mesmos hooks da tela de histórico e do resumo por categoria.

## 6. Interface

Reutiliza `src/components/charts/` da spec de Entradas e acrescenta: `step-line.tsx` (ritmo), `hbars.tsx` (barras horizontais), `columns.tsx` (colunas lançadas/previstas). Reutiliza `chart-legend.tsx` e `chart-table.tsx`. Cores: `chart-violet` e `chart-track` (spec de Entradas). Mock: artboard "Opção D — Gráficos" da tela Cartões; a fileira de cartões do mock é a do D1 (no mock aparece só "Nubank").

## 7. Fora de escopo

- Comparar cartões entre si ou somar todos os cartões num gráfico.
- Mudar a edição de compra, o formulário, as parcelas ou o histórico em si (o histórico recebe só o visual da spec de apoio).
- Botão "Tabela" visível.

### Pontos a confirmar antes de implementar

1. **No mock**, "Para onde foi" mostra a segunda categoria em laranja e dá o link "Todas as compras" e os filtros de categoria como na tela de hoje. **A regra desta spec é uma cor só** (D7); siga a spec, não o mock.
2. O mock foi feito a partir de prints e do código do GitHub; se o seu código local tiver outro texto no "Todas as compras" ou nos filtros, **mantenha o comportamento do seu código** e só aplique o visual (D9).
3. **Fonte da "próxima fatura prevista"** (D4): confirme que `useGetFutureInstallments` devolve o mês seguinte com a soma das parcelas e cobranças previstas; se devolver só itens, some no componente.

## 8. Critérios de aceite

- A aba Cartões não mostra mais a face colorida; mostra fileira de cartões, fatura e os três gráficos.
- Os números dos gráficos batem com a fatura, as categorias e as parcelas das telas que já existiam.
- Trocar cartão, abrir histórico, editar e excluir cartão, filtrar por categoria e abrir uma compra continuam funcionando.
- Mês passado, corrente, futuro e sem compras se comportam como nos cenários.
- Texto ≥ 12 px, alvos ≥ 44 px, gráficos com `aria-label` e tabela de apoio.
- `npm run typecheck` e `npm run build` passam; documentação atualizada; status "Implementada".

## 9. Tarefas

1. Criar `step-line.tsx`, `hbars.tsx` e `columns.tsx` em `src/components/charts/`.
2. `src/pages/dashboard.tsx`: fileira de cartões (D1), fatura (D2), folha "⋯" (D3, criar `card-menu.tsx` se não existir), as três seções de gráficos e o bloco Compras com o visual do D9. Mover o botão "Histórico" para o título de "Próximas faturas".
3. Ajustar o carrossel: sair desta aba sem apagar o `SnapCarousel` se a aba Benefícios ainda o usa.
4. Montar as séries a partir dos dados da tela (RN-02), com funções puras e pequenas.
5. `FUNCIONALIDADES.md` e `README.md`.
6. `npm run typecheck` e `npm run build`.

## 10. Roteiro de verificação

1. Com o cartão e as três compras do cenário, conferir fatura, ritmo, categorias e colunas.
2. Trocar de cartão, de mês (passado, corrente, futuro) e conferir os três gráficos.
3. Tocar em "Eletrônicos" em "Para onde foi" e conferir o filtro da lista.
4. Abrir o histórico pelo link e voltar.
5. "⋯" → editar e excluir cartão (a exclusão pede confirmação).
6. Mês sem compras.
7. TalkBack: cada gráfico fala os valores.
