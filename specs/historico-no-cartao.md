# Spec — Histórico no card do cartão (e sem o botão Atualizar)

| Campo | Valor |
| ----- | ----- |
| Status | Implementada |
| Criada em | 18/10/2026 |
| Escopo | `src/components/card-carousel.tsx`, `src/pages/dashboard.tsx`, `src/pages/historico.tsx`, `src/App.tsx`, `src/lib/format.ts`, `FUNCIONALIDADES.md`, `README.md` |
| Depende de | [`historico-mensal.md`](historico-mensal.md), [`cartao-sem-limite.md`](cartao-sem-limite.md), [`multiplos-cartoes.md`](multiplos-cartoes.md) |
| Substitui em parte | Os botões "Histórico" e "Atualizar" na linha de controles da aba Cartões ([`mes-compartilhado.md`](mes-compartilhado.md), RF-01). |

> Mudanças de comportamento entram primeiro aqui e só depois no código.

## 1. Contexto e objetivo

Hoje o acesso ao Histórico é um botão solto no topo da aba Cartões, mas o Histórico é de **um cartão** (o selecionado). Fica mais claro que o acesso esteja no **card do próprio cartão**.

**Objetivo:** tirar o botão "Atualizar" e mover o "Histórico" para dentro do card de cada cartão; ao tocar, abre a tela de Histórico **daquele cartão**, com as mesmas informações de hoje.

## 2. Decisões de produto

| # | Decisão | Motivo |
| - | ------- | ------ |
| D1 | **O botão "Histórico" sai da linha de controles** da aba Cartões e passa a ser um botão **na face de cada cartão**. | Pedido do usuário. |
| D2 | **Tocar abre a mesma tela de Histórico** (`#/historico`), com as mesmas informações: fatura e nº de compras por mês, "Todos os cartões" com 2+ cartões e "Próximos meses". Nada novo é exibido. | Pedido: "exiba as mesmas infos". Interpretei "clicar nele" como abrir a tela atual, não uma lista dentro do card. |
| D3 | **O Histórico mostra o cartão em que se tocou.** Ao tocar no botão de um cartão que já é o selecionado, nada muda; só o botão do cartão ativo age (como editar/remover). | O Histórico sempre segue o cartão selecionado. |
| D5 | **O botão "Atualizar" sai da aba Cartões.** Os dados já se atualizam sozinhos a cada mudança e ao voltar o foco para o app. | Pedido do usuário. |
| D6 | **Sem os dois botões, a linha de controles some no celular**; de `sm` para cima fica só o aviso "Seu caderno está em dia". | Evita uma barra vazia com borda. |
| D4 | **O botão só aparece no cartão ativo**, junto de editar e remover (nos vizinhos fica invisível). | Mantém o padrão das ações do card. |

## 3. Requisitos

| ID | Requisito |
| -- | --------- |
| RF-01 | A aba Cartões não tem mais os botões "Histórico" nem "Atualizar"; a linha de controles só mostra o aviso de sincronização a partir de `sm` (D6). |
| RF-02 | A face do cartão ativo tem o botão "Histórico" (rótulo acessível "Ver histórico de ‹cartão›"). |
| RF-03 | Tocar nele abre `#/historico` mostrando o histórico daquele cartão, com as mesmas informações de hoje. |
| RF-04 | "Mês atual" no Histórico volta para a aba Cartões, como hoje. |
| RN-01 | O Histórico usa o cartão selecionado; ao tocar em "Histórico" o cartão da face já é o selecionado (D3). |
| RN-02 | Sem cartões, não há face e, portanto, nenhum acesso ao Histórico (como o botão já ficava sem utilidade). |

## 4. Cenários

```gherkin
# language: pt
Funcionalidade: Histórico no card do cartão

  Cenário: Os botões saem do topo
    Dado que existe um cartão
    Quando eu abro a aba "Cartões"
    Então não há botões "Atualizar" nem "Histórico" no topo
    E no celular a linha de controles não aparece

  Cenário: O botão fica no card
    Dado que "Nubank" é o cartão selecionado
    Então a face do "Nubank" tem o botão "Histórico"

  Cenário: Abrir o histórico do cartão
    Dado que "Inter" é o cartão selecionado
    Quando eu toco em "Histórico" na face do "Inter"
    Então vejo "Mês a mês" com "Inter — a fatura de cada mês"
    E cada mês mostra a fatura e a quantidade de compras
    E com 2 cartões ou mais, a linha "Todos os cartões"

  Cenário: Cartão vizinho
    Dado que "Nubank" é o selecionado e "Inter" é o vizinho
    Então o botão "Histórico" do "Inter" não está disponível até ele ser selecionado

  Cenário: Voltar
    Dado que estou no Histórico
    Quando eu toco em "Mês atual"
    Então volto à aba "Cartões"
```

| Requisito | Cenário(s) |
| --------- | ---------- |
| RF-01, D5, D6 | O botão sai do topo |
| RF-02, D4 | O botão fica no card; Cartão vizinho |
| RF-03, RN-01, D2, D3 | Abrir o histórico do cartão |
| RF-04 | Voltar |
| RN-02 | (sem cartões não há face) |

## 5. Dados e contrato

Sem mudança no formato salvo (`version: 10`) nem na camada de dados.

## 6. Interface

- `card-carousel.tsx`: novo `onHistory` e um botão (ícone de relógio/histórico) ao lado de editar e remover, visível só no ativo.
- `dashboard.tsx`: tira os botões "Histórico" e "Atualizar" (e o import de `RefreshCw`, se sobrar sem uso), esconde a linha de controles abaixo de `sm` e passa `onHistory={() => navigate('/historico')}`.
- 360 px: três botões redondos cabem no cabeçalho do card com o nome truncando.

## 7. Fora de escopo

- Histórico expandido dentro do card.
- Qualquer outro modo de forçar a atualização (puxar para atualizar).
- Histórico por cartão com rota própria (`#/historico/:cardId`).

## 8. Critérios de aceite

- [x] RF-01 a RF-04 funcionam como descritos. *Verificados no navegador: sem "Atualizar" nem "Histórico" no topo, botão só visível no cartão ativo, tocar abre `#/historico` com o cartão tocado; "Mês atual" não foi retestado (não mudou).*
- [x] Cenários da seção 4 conferidos no navegador, inclusive a 360 px (linha de controles oculta, botões dentro do card, sem rolagem horizontal).
- [x] `npm run typecheck` e `npm run build` passam.
- [x] `FUNCIONALIDADES.md` e `README.md` atualizados; nota em `mes-compartilhado.md`.

## 9. Tarefas

1. `card-carousel.tsx`: botão e `onHistory`.
2. `dashboard.tsx`: remover o botão do topo; ligar `onHistory`.
3. Atualizar `FUNCIONALIDADES.md`, `README.md` e a nota em `mes-compartilhado.md`.
4. Verificar; marcar a spec `Implementada`.
