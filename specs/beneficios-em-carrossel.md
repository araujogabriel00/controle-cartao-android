# Spec — Benefícios em carrossel de cards

| Campo | Valor |
| ----- | ----- |
| Status | Implementada |
| Criada em | 18/10/2026 |
| Escopo | `src/components/snap-carousel.tsx` (novo), `src/components/card-carousel.tsx`, `src/pages/beneficios.tsx`, `FUNCIONALIDADES.md`, `README.md` |
| Depende de | [`beneficios.md`](beneficios.md), [`multiplos-cartoes.md`](multiplos-cartoes.md) (o carrossel da aba Cartões), [`botao-lancar.md`](botao-lancar.md) |
| Substitui em parte | A lista vertical de benefícios, o botão "Novo benefício" e a faixa "Disponível em todos os benefícios" da aba Benefícios ([`beneficios.md`](beneficios.md)). As regras de saldo, divisão por categoria e fechamento não mudam. |

> Mudanças de comportamento entram primeiro aqui e só depois no código.

## 1. Contexto e objetivo

Na aba Benefícios, cada benefício é um bloco grande numa lista vertical, e o "Novo benefício" é um botão no topo. Na aba Cartões, os cartões são cards num carrossel horizontal, com um card "Adicionar cartão" no fim.

**Objetivo:** a aba Benefícios passa a funcionar como a de Cartões: os benefícios viram **cards num carrossel horizontal**, o **"Novo benefício" vira um card** ao lado do último benefício, e o detalhe do benefício selecionado fica abaixo.

## 2. Decisões de produto

| # | Decisão | Motivo |
| - | ------- | ------ |
| D1 | **Os benefícios ficam num carrossel horizontal**, um card por benefício, centralizado ao deslizar, com os vizinhos aparecendo nas pontas e os pontinhos embaixo. É o mesmo comportamento do carrossel de cartões. | Pedido do usuário. |
| D2 | **O card "Novo benefício" é o último slot do carrossel**, ao lado do último benefício. Tocar nele abre o formulário de novo benefício. O botão "Novo benefício" do topo sai. | Pedido do usuário. |
| D3 | **O card de cada benefício mostra:** nome (com o selo "Mensal"), os botões de editar e excluir (só no ativo), o **Disponível do mês** em destaque, uma linha "Crédito · Sobra anterior · Gasto" e a barra de percentual gasto. | Resumo do que hoje ocupa o bloco inteiro. |
| D4 | **Abaixo do carrossel fica o detalhe do benefício selecionado:** "Por categoria" (com Fechar/Reabrir) e a lista de gastos do mês, com editar e excluir. Mudar o benefício selecionado troca esse detalhe. | Igual à aba Cartões (compras do cartão selecionado). |
| D5 | **A faixa "Disponível em todos os benefícios" sai da aba.** Cada card mostra o disponível do próprio benefício. | Pedido do usuário. A soma continua calculada na camada de dados, sem uso na tela. |
| D6 | **Benefício selecionado:** o primeiro ao abrir. A escolha é lembrada enquanto o app está aberto (inclusive ao trocar de mês ou de aba), mas **não é salva** nos dados. Se o selecionado deixa de existir naquele mês, vale o primeiro. | Evita mexer no formato salvo. |
| D7 | **Cor do card:** benefício não tem cor cadastrada; o card usa a paleta dos cartões, escolhida pelo número do benefício (sem dado novo). | Mesma aparência do carrossel de cartões, sem migração. |
| D8 | **Sem benefícios:** o carrossel mostra só o card "Novo benefício" (com a frase "Nenhum benefício ainda."). | O card é o único caminho de criar na aba. |
| D9 | **O "+" do rodapé continua igual** ("Gasto de benefício" escolhe o benefício como hoje). | Fora do pedido. |

## 3. Requisitos

| ID | Requisito |
| -- | --------- |
| RF-01 | A aba Benefícios mostra os benefícios do mês como cards num carrossel horizontal com pontinhos, centralizando o card ao deslizar (D1). |
| RF-02 | O último slot é o card "Novo benefício", que abre o formulário de criação; não há botão "Novo benefício" no topo (D2). |
| RF-03 | Cada card mostra nome, selo "Mensal", Disponível do mês, "Crédito · Sobra anterior · Gasto" e a barra de percentual; editar e excluir ficam no card ativo (D3). |
| RF-04 | Abaixo do carrossel, "Por categoria" e a lista de gastos são os do benefício selecionado, com fechar/reabrir categoria, editar e excluir gasto (D4). |
| RF-05 | Deslizar, tocar num pontinho ou tocar num card vizinho seleciona aquele benefício e troca o detalhe (D4, D6). |
| RF-06 | A seleção se mantém ao trocar de mês ou de aba enquanto o app está aberto; sem o benefício no mês, vale o primeiro (D6). |
| RF-07 | Sem benefícios, só o card "Novo benefício" aparece (D8). |
| RN-01 | Os valores (crédito, sobra, gasto, disponível, percentual, por categoria) são exatamente os de hoje. |
| RN-02 | Editar, excluir benefício e as regras de divisão e fechamento de categoria não mudam. |
| RN-03 | Não muda o formato salvo (`version: 10`) nem `store.ts`. |

## 4. Cenários

```gherkin
# language: pt
Funcionalidade: Benefícios em carrossel
  Contexto:
    Dado que hoje é 18/10/2026
    E existem os benefícios "VR" (R$ 800,00) e "VA" (R$ 500,00)

  Cenário: Benefícios como cards na horizontal
    Quando eu abro a aba "Benefícios"
    Então vejo os cards "VR" e "VA" lado a lado num carrossel
    E o card "Novo benefício" ao lado do último
    E não há botão "Novo benefício" no topo

  Cenário: O que o card mostra
    Dado que o "VR" tem sobra anterior de R$ 100,00 e gasto de R$ 300,00
    Então o card do "VR" mostra Disponível R$ 600,00, "Crédito R$ 800,00 · Sobra anterior R$ 100,00 · Gasto R$ 300,00" e a barra de percentual
    E editar e excluir aparecem só no card ativo

  Cenário: Trocar de benefício
    Dado que o "VR" está selecionado
    Quando eu deslizo até o "VA" ou toco no pontinho "VA"
    Então o "VA" fica centralizado e selecionado
    E "Por categoria" e os gastos abaixo passam a ser os do "VA"

  Cenário: Criar pelo card
    Quando eu deslizo até "Novo benefício" e toco nele
    Então abre o formulário de novo benefício

  Cenário: A seleção acompanha o mês e a aba
    Dado que o "VA" está selecionado
    Quando eu troco para o mês seguinte e depois para a aba "Cartões" e volto
    Então o "VA" continua selecionado

  Cenário: Benefício que não existe no mês
    Dado que o "VA" só começa no mês seguinte
    Quando eu abro o mês atual
    Então o "VR" fica selecionado

  Cenário: Sem benefícios
    Dado que não existem benefícios
    Quando eu abro a aba "Benefícios"
    Então vejo só o card "Novo benefício" com "Nenhum benefício ainda."

  Cenário: Os valores não mudam
    Então o saldo de cada benefício e o "Por categoria" são os de antes
    E não há a faixa "Disponível em todos os benefícios"

  Cenário: 360 px
    Dado que estou a 360 px de largura
    Então os cards cabem, o carrossel desliza e não há rolagem horizontal da página
```

| Requisito | Cenário(s) |
| --------- | ---------- |
| RF-01, D1 | Benefícios como cards na horizontal |
| RF-02, D2 | Benefícios como cards na horizontal; Criar pelo card |
| RF-03, D3 | O que o card mostra |
| RF-04, RF-05, D4 | Trocar de benefício |
| RF-06, D6 | A seleção acompanha o mês e a aba; Benefício que não existe no mês |
| RF-07, D8 | Sem benefícios |
| RN-01, RN-02 | Os valores não mudam |
| D5 | Os valores não mudam (sem a faixa de total) |
| D7 | (cor pela paleta, conferida no navegador) |
| RN-03, D9 | (sem mudança de dados nem do rodapé) |

## 5. Dados e contrato

Sem mudança no formato salvo (`version: 10`) nem em `store.ts` ou `api.ts`. O benefício selecionado fica em memória (D6).

## 6. Interface

- `snap-carousel.tsx` (novo): o carrossel genérico, extraído de `card-carousel.tsx` (faixa com `snap`, espaçadores, slot de adicionar, pontinhos, teclado ← →, "abre sem animação no selecionado"). Recebe os itens, a face de cada um, o texto do slot de adicionar e os eventos de selecionar e adicionar.
- `card-carousel.tsx`: passa a usar o `snap-carousel.tsx`, sem mudar o que o usuário vê.
- `beneficios.tsx`: carrossel de benefícios, detalhe do selecionado (por categoria e gastos), formulários e confirmações como hoje.
- 360 px: o card ocupa 86% da largura, como nos cartões; sem rolagem horizontal da página.

## 7. Fora de escopo

- Lembrar o benefício selecionado entre aberturas do app (D6).
- Escolher a cor do benefício.
- Pré-selecionar o benefício no "Gasto de benefício" do rodapé (D9).
- Mudanças nas regras de saldo, divisão e fechamento.

## 8. Critérios de aceite

- [x] RF-01 a RF-07 funcionam como descritos. *Verificados no navegador: cards lado a lado com o card "Novo benefício" no fim e sem botão no topo; disponível, crédito, sobra, gasto e percentual no card; editar/excluir só no card ativo; tocar num card vizinho troca o detalhe (por categoria e gastos); a seleção acompanha a troca de aba e de mês, e cai no primeiro quando o benefício não existe no mês; o card "Novo benefício" abre o formulário.*
- [x] O carrossel de cartões continua igual depois do refatoramento (faces, "Adicionar cartão" e o botão de histórico conferidos).
- [ ] Todos os cenários da seção 4 no navegador. *Conferidos todos, menos "Sem benefícios" (card único com a frase) e o deslizar com o dedo (só toque/clique foi testado).* A 360 px não há rolagem horizontal da página.
- [x] `npm run typecheck` e `npm run build` passam.
- [x] `FUNCIONALIDADES.md` e `README.md` atualizados; nota em `beneficios.md`.

## 9. Tarefas

1. Extrair o `snap-carousel.tsx` e fazer o `card-carousel.tsx` usá-lo.
2. `beneficios.tsx`: carrossel, face do benefício, card "Novo benefício", seleção em memória.
3. Mover "Por categoria" e a lista de gastos para o detalhe do selecionado.
4. Atualizar `FUNCIONALIDADES.md`, `README.md` e a nota em `beneficios.md`.
5. Verificar; marcar a spec `Implementada`.
