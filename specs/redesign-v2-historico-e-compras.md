# Spec — Histórico e Todas as compras na Nova versão (v2, parte 7)

| Campo | Valor |
| ----- | ----- |
| Status | Proposta |
| Criada em | 31/10/2026 |
| Escopo | `src/pages/historico.tsx`, `src/pages/compras.tsx` (visual e o gráfico do histórico), testes dessas duas páginas, `FUNCIONALIDADES.md`, `README.md` |
| Depende de | [`redesign-v2-fundacao.md`](redesign-v2-fundacao.md), [`redesign-v2-cartoes.md`](redesign-v2-cartoes.md), [`historico-mensal.md`](historico-mensal.md), [`todas-as-compras.md`](todas-as-compras.md), [`desfazer-exclusao.md`](desfazer-exclusao.md) |
| Referência visual | Canvas "Controle do Cartão", grupo v2: V2_10 (Histórico), V2_14 (Todas as compras) e V2_15 (Todas as compras com filtro), claras e escuras |

> Mudanças de comportamento entram primeiro aqui e só depois no código.

---

## 1. Contexto e objetivo

As duas telas que saem da aba Cartões ("Histórico" e "Todas as compras") ainda têm o visual antigo: cabeçalhos próprios, selos coloridos (Mensal, prevista, parcela, categoria) e controles menores que 48 px. **Objetivo:** deixá-las como as telas V2_10, V2_14 e V2_15, com a mesma linguagem das abas. Nenhuma regra de cálculo, dado salvo ou rota muda; as telas continuam mostrando os mesmos números.

## 2. Decisões de produto

| # | Decisão | Motivo |
| - | ------- | ------ |
| D1 | As duas telas são **do cartão selecionado** (como hoje); com mais de um cartão o subtítulo mostra o nome dele. | Decisão do usuário. |
| D2 | **Histórico** tem: voltar, título "Histórico", subtítulo com o cartão, **gráfico de 6 colunas** (5 meses fechados + o mês atual, que está em aberto), a **média dos últimos 5 meses fechados**, "Próximos meses" e "Todos os meses". | V2_10. |
| D3 | A média considera só meses **fechados** com fatura (mês atual e futuros ficam de fora); com menos de 5, usa os que existem; sem nenhum, não mostra a média. | Mês em aberto puxaria a média para baixo. |
| D4 | **Próximos meses** é mantido (parcelas já lançadas nos meses seguintes), no visual de lista v2, com o total de cada mês e "N itens". Tocar abre o painel do mês. | Decisão do usuário: manter. |
| D5 | **Todos os meses** vira lista de cartões v2 com mês por extenso, "N compras · fatura fechada" (ou "em aberto" no mês atual) e o valor; com mais de um cartão, a linha extra "Todos os cartões: fatura R$ X" continua. | V2_10. |
| D6 | **Todas as compras** tem: voltar, título "Todas as compras", subtítulo "‹cartão› · todos os meses", **busca em pílula** de 52 px e **controle de categoria** de 48 px. | V2_14. |
| D7 | O controle de categoria continua sendo um `<select>` nativo (mesmas opções: "Todas as categorias", "Sem categoria" e as categorias), **estilizado** como botão com seta. | Mantém acessibilidade e o seletor nativo do Android; testes seguem valendo. |
| D8 | Com categoria escolhida, o botão vira uma **etiqueta com ✕** (limpa o filtro) e aparece **"Total do filtro R$ X"** à direita (soma de tudo que aparece na lista, incluindo previstas). | V2_15. |
| D9 | Cada mês é um **título** (fonte de títulos, 20 px) com o total do mês à direita em fonte mono, seguido de um cartão com os itens. | V2_14. |
| D10 | O item é **compacto** (mínimo 64 px): nome (e "Parcela n/m" na linha de baixo), "Categoria · data" embaixo, e "Mensal" e "prevista" como **texto** na linha de baixo, não como selo colorido; valor com "−" e menu ⋯ de 48 px. | Nunca só cor; consistência com as demais listas v2. |
| D11 | Editar e excluir (com Desfazer, `ScopeDialog` em recorrentes) **não mudam**. | Fora do escopo visual. |
| D12 | Com o olho fechado, valores, totais e colunas seguem a regra do olho. | Regra global v2. |
| D13 | **A lista abre no mês de onde a pessoa veio.** "Todas as compras" passa a levar o mês no fim da rota (`#/compras/mes/AAAA-MM`, como `#/cartoes/mes/AAAA-MM`); ao abrir, a lista **rola até o título desse mês** e ele fica visível logo abaixo do cabeçalho. `#/compras` sem mês vale o mês atual. O **voltar** da tela leva à aba Cartões **desse mesmo mês**. | Pedido do usuário: a lista deve ir para o mês em que foi aberta. Hoje ela sempre abre no topo e o voltar sempre vai ao mês atual. |
| D14 | Se o mês pedido **não tem compras** (nem previstas), a lista rola até o **mês mais próximo que tenha**, preferindo o mais recente anterior; sem nenhum, fica no topo. Busca e filtro **não** voltam a rolar sozinhos. | Evita ficar parado no vazio. |

## 3. Requisitos

### 3.1 Requisitos funcionais (RF)

| ID | Requisito |
| -- | --------- |
| RF-01 | O Histórico mostra o gráfico de 6 colunas (D2) com a fatura de cada mês, o mês atual destacado como "em aberto" e uma tabela alternativa para leitor de tela. |
| RF-02 | O Histórico mostra "Média dos últimos 5 meses" conforme D3. |
| RF-03 | "Próximos meses" lista os meses seguintes com parcelas lançadas; tocar leva ao painel do mês (`#/cartoes/mes/AAAA-MM`). |
| RF-04 | "Todos os meses" lista do mais recente ao mais antigo, com contagem e fatura; tocar leva ao painel do mês. Com mais de um cartão, mostra também a fatura de todos os cartões. |
| RF-05 | Sem nenhuma compra, o Histórico mostra o estado vazio com a chamada para lançar. |
| RF-06 | "Todas as compras" agrupa por mês (do mais recente para o mais antigo), cada grupo com título, total e itens, incluindo parcelas previstas e recorrentes previstas. |
| RF-07 | A busca filtra pela descrição enquanto a pessoa digita; o controle de categoria filtra por categoria (D7). |
| RF-08 | Com filtro de categoria, aparecem a etiqueta com ✕ e o "Total do filtro" (D8); o ✕ remove o filtro. |
| RF-09 | Tocar num item abre a edição; o ⋯ tem "Editar" e "Excluir" (com Desfazer), como hoje. |
| RF-10 | Sem resultado, a tela mostra o texto vazio atual (com a ação de limpar a busca/filtro). |
| RF-11 | Sem mês na rota (`#/compras`), voltar leva à aba Cartões do mês atual. |
| RF-12 | Com o olho fechado nada mostra valor em reais (texto, `aria-label`, HTML) e as colunas viram faixa neutra. |
| RF-13 | Abrir "Todas as compras" a partir de um mês (link da aba Cartões, "Todos os meses" do Histórico) abre `#/compras/mes/AAAA-MM` com a lista rolada até o grupo desse mês (D13, D14). |
| RF-14 | O voltar de "Todas as compras" leva a `#/cartoes/mes/AAAA-MM` do mês de onde veio (substitui o RF-11 quando há mês na rota). |

### 3.2 Regras de negócio (RN)

| ID | Regra |
| -- | ----- |
| RN-01 | Os valores são os de hoje (`useGetMonthHistory`, `useGetFutureInstallments`, lista de compras); nenhuma conta é refeita. |
| RN-02 | Média (D3) = soma das faturas dos últimos até 5 meses fechados com fatura ÷ quantidade desses meses, arredondada em centavos. |
| RN-03 | Ordenação dos itens dentro do mês: como hoje (mais recente primeiro). |
| RN-04 | Alvos de toque ≥ 48 px; texto ≥ 14 px (12–13 só em eixos e rótulos de gráfico); nenhuma informação só por cor. |

## 4. Cenários

```gherkin
# language: pt

Funcionalidade: Histórico e Todas as compras na nova versão

  Cenário: Gráfico do histórico com 6 colunas
    Dado faturas fechadas de maio a setembro e a de outubro em aberto
    Quando eu abro o Histórico
    Então vejo 6 colunas e a de outubro marcada como "em aberto"

  Cenário: Média dos últimos 5 meses
    Dado faturas fechadas de 1850, 2200, 2600, 3100 e 3420
    Então vejo "Média dos últimos 5 meses" com "R$ 2.634,00"

  Cenário: Média só com meses fechados
    Dado uma fatura fechada de R$ 70,00 e a do mês atual de R$ 200,00
    Então a média é "R$ 70,00"

  Cenário: Sem meses fechados não há média
    Dado só a fatura do mês atual
    Então não vejo "Média dos últimos 5 meses"

  Cenário: Próximos meses
    Dado parcelas lançadas em novembro e dezembro
    Quando eu toco no mês de novembro em "Próximos meses"
    Então abre o painel de novembro

  Cenário: Todos os meses
    Dado compras em setembro e outubro
    Então "Todos os meses" lista outubro e setembro, do mais recente ao mais antigo
    Quando eu toco em setembro
    Então abre o painel de setembro

  Cenário: Mais de um cartão
    Dado dois cartões
    Então cada mês mostra também "Todos os cartões: fatura"

  Cenário: Histórico vazio
    Dado nenhuma compra
    Então vejo o estado vazio com a chamada para lançar

  Cenário: Todas as compras agrupadas por mês
    Dado compras em outubro e uma parcela prevista em novembro
    Quando eu abro "Todas as compras"
    Então vejo os meses do mais recente ao mais antigo, cada um com o total
    E a parcela prevista aparece com o texto "prevista"

  Cenário: Item sem selos coloridos
    Dado uma compra parcelada recorrente e prevista
    Então o item mostra "Parcela 2/7", a categoria e a data em texto
    E "Mensal" e "prevista" aparecem como texto

  Cenário: Buscar pela descrição
    Dado compras "Fone de ouvido" e "Cabo"
    Quando eu digito "fone"
    Então vejo só "Fone de ouvido"

  Cenário: Filtrar por categoria
    Dado compras em "Eletrônicos" e em "Mercado"
    Quando eu escolho "Eletrônicos"
    Então vejo só as de "Eletrônicos", a etiqueta "Eletrônicos ✕" e o "Total do filtro"
    Quando eu toco no ✕
    Então voltam todas as compras

  Cenário: Filtro por "Sem categoria"
    Dado uma compra sem categoria
    Quando eu escolho "Sem categoria"
    Então vejo só ela

  Cenário: Sem resultados
    Quando eu busco um texto que não existe
    Então vejo o aviso de que nada foi encontrado

  Cenário: Editar pela lista
    Quando eu toco numa compra lançada
    Então abre a edição dela

  Cenário: Excluir com Desfazer
    Quando eu escolho "Excluir" no ⋯ de uma compra
    Então a compra some e aparece "Desfazer"

  Cenário: Voltar
    Dado que abri "Todas as compras" sem mês na rota
    Quando eu toco em voltar
    Então abre a aba Cartões do mês atual

  Cenário: A lista abre no mês de onde vim
    Dado compras em setembro, outubro e novembro
    E que estou na aba Cartões em setembro
    Quando eu toco em "Todas as compras"
    Então abre `#/compras/mes/2026-09`
    E o título "Setembro de 2026" está visível logo abaixo do cabeçalho

  Cenário: Voltar leva ao mesmo mês
    Dado que abri "Todas as compras" a partir de setembro
    Quando eu toco em voltar
    Então abre a aba Cartões em setembro

  Cenário: Mês sem compras
    Dado compras só em agosto e novembro e a lista aberta em outubro
    Então a lista rola até "Agosto de 2026"

  Cenário: Busca não rola sozinha
    Dado a lista aberta em setembro
    Quando eu digito uma busca
    Então a posição da lista não é forçada de volta a setembro

  Cenário: Olho fechado
    Dado o olho fechado
    Então nenhum valor em reais aparece nas duas telas e as colunas ficam neutras
```

### 4.1 Matriz de rastreabilidade

| Requisito / regra | Cenário(s) |
| ----------------- | ---------- |
| RF-01 | Gráfico do histórico com 6 colunas |
| RF-02, RN-02 | Média dos últimos 5 meses; Média só com meses fechados; Sem meses fechados não há média |
| RF-03 | Próximos meses |
| RF-04 | Todos os meses; Mais de um cartão |
| RF-05 | Histórico vazio |
| RF-06, RN-03 | Todas as compras agrupadas por mês |
| RF-07 | Buscar pela descrição; Filtro por "Sem categoria" |
| RF-08 | Filtrar por categoria |
| RF-09 | Editar pela lista; Excluir com Desfazer |
| RF-10 | Sem resultados |
| RF-11, RF-14 | Voltar; Voltar leva ao mesmo mês |
| RF-13, D14 | A lista abre no mês de onde vim; Mês sem compras; Busca não rola sozinha |
| RF-12 | Olho fechado |
| RN-01 | todos (valores iguais aos de antes) |
| RN-04 | Item sem selos coloridos (e roteiro de verificação) |

## 5. Dados e contrato

Sem mudança no formato salvo, na camada de dados nem nos hooks. A média (RN-02) e o "Total do filtro" são calculados na tela a partir do que os hooks já devolvem.

## 6. Interface

- **Cabeçalho das duas telas:** botão voltar de 48 px, título em fonte de títulos e subtítulo em 14 px.
- **Histórico:** `Columns` com 6 colunas (a do mês atual com contorno/hachura e o texto "em aberto" abaixo, nunca só cor); média logo abaixo em linha própria; seções com título de 20 px; linhas de 64 px.
- **Todas as compras:** busca em pílula (52 px, ícone de lupa), botão de categoria de 48 px com seta, ou etiqueta com ✕ e "Total do filtro" em mono; título de mês de 20 px com total à direita; cartão com divisórias de 1 px.
- **Item:** 64 px no mínimo; nome em negrito; abaixo "Parcela n/m · Categoria · data" e "Mensal"/"prevista" em texto; valor "− R$" e ⋯ de 48 px.
- **Rota e rolagem:** `#/compras/mes/AAAA-MM` (e `#/compras`); o título de cada mês tem `id`/`data-testid="group-AAAA-MM"` e a rolagem usa `scrollIntoView` com margem do cabeçalho, uma vez ao carregar os dados.
- **Referência exata:** V2_10, V2_14 e V2_15 do canvas.

## 7. Fora de escopo

- Mudar o que é calculado, a ordem dos meses ou o formato salvo.
- Filtro por vários cartões, por período ou por valor; ordenar por valor.
- Aba Categorias e Benefícios (specs próprias).

## 8. Critérios de aceite

- [ ] `npm test`, `npm run typecheck` e `npm run build` passam.
- [ ] Cada cenário da seção 4 tem teste (`historico.test.tsx`, `compras.test.tsx`).
- [ ] Abrir a lista a partir de um mês rola até ele e o voltar retorna a esse mês; mês sem compras cai no mais próximo.
- [ ] Valores das duas telas iguais aos da versão anterior para os mesmos dados.
- [ ] Média dos últimos 5 meses conforme RN-02.
- [ ] Em 360 × 780: sem scroll horizontal, alvos ≥ 48 px, itens ≥ 64 px, texto ≥ 14 px.
- [ ] Temas claro e escuro conferidos no navegador; olho fechado sem valores.
- [ ] `FUNCIONALIDADES.md` (seções 9, 18 e 24) e `README.md` atualizados.

## 9. Tarefas

1. Histórico: gráfico de 6 colunas, média (RN-02), listas v2 com "em aberto".
2. Rota `#/compras/mes/AAAA-MM`: links de origem passam o mês, rolagem até o grupo (D13, D14) e voltar ao mês (RF-14).
3. Todas as compras: cabeçalho, busca em pílula, `<select>` estilizado, etiqueta com ✕ e "Total do filtro".
4. Item compacto sem selos coloridos (D10), título de mês com total (D9).
5. Testes dos cenários novos e ajuste dos existentes.
6. `FUNCIONALIDADES.md` e `README.md`.
7. Rodar `test`, `typecheck` e `build`.

## 10. Roteiro de verificação

1. `npm run dev`, janela 360 × 780, `#/historico` e `#/compras`, claro e escuro.
2. Conferir os cenários da seção 4 com um cartão com compras em vários meses, uma parcela e uma recorrente.
3. Comparar totais com a aba Cartões e com a versão anterior.
4. Filtrar, buscar, editar e excluir com Desfazer; abrir sem compras; com dois cartões.
5. Fechar o olho e conferir texto, `aria-label` e HTML.
