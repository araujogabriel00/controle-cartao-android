# Spec — Fatura com todas as compras do mês (aba Cartões)

| Campo | Valor |
| ----- | ----- |
| Status | Implementada |
| Criada em | 31/10/2026 |
| Escopo | `src/pages/dashboard.tsx` (lista "Compras" da aba Cartões), `src/pages/dashboard.test.tsx`, `FUNCIONALIDADES.md` |
| Depende de | [`redesign-v2-cartoes.md`](redesign-v2-cartoes.md), [`todas-as-compras.md`](todas-as-compras.md), [`compras-em-qualquer-mes.md`](compras-em-qualquer-mes.md), [`parcelamento.md`](parcelamento.md) |
| Substitui em parte | [`redesign-v2-cartoes.md`](redesign-v2-cartoes.md): D4, o "até 3" de D5, RF-07, RN-03 e o cenário "Três compras mais recentes" (a lista deixa de ter limite) |

> Mudanças de comportamento entram primeiro aqui e só depois no código.

---

## 1. Contexto e objetivo

Hoje a lista **Compras** da aba Cartões mostra só as 3 compras mais recentes do mês. A fatura e o "N compras" já contam o mês inteiro, então a pessoa vê "11 compras" e só 3 linhas, e precisa sair da aba (para "Todas as compras") para conferir a fatura.

**Objetivo:** a lista **Compras** da aba Cartões mostra **todas** as compras do mês aberto, para que a fatura possa ser conferida ali mesmo. Nenhuma regra de cálculo muda.

## 2. Glossário

- **Fatura:** compras do mês aberto no cartão selecionado (registradas e, em mês futuro, as previstas).
- **Lista Compras:** seção "Compras" da aba Cartões.

## 3. Decisões de produto

| # | Decisão | Motivo |
| - | ------- | ------ |
| D1 | A lista **Compras** mostra **todas** as compras do mês aberto do cartão selecionado, mais recentes primeiro (mesma ordenação de hoje), sem "Ver mais". | Pedido do usuário; o contador "N compras" passa a bater com as linhas. |
| D2 | Em **mês futuro** a lista inclui também as parcelas e recorrentes **previstas** (com o selo "prevista"), como já entram no contador. | Mesma lista de hoje, só sem o corte. |
| D3 | Com **filtro de categoria** ativo, a lista mostra **todas** as compras da categoria (sem limite), com o "Total do filtro" e "Limpar filtro" como hoje. | Coerência com D1. |
| D4 | O botão **"Todas as compras"** (histórico de todos os meses) **fica** no cabeçalho da seção, sem filtro. | Continua útil para ver outros meses, busca e filtros da tela própria. |
| D5 | Itens, edição ao tocar, selos, estado vazio e `data-testid` não mudam. | Só o limite sai. |

## 4. Requisitos

### 4.1 Requisitos funcionais (RF)

| ID | Requisito |
| -- | --------- |
| RF-01 | A lista **Compras** mostra todas as compras do mês aberto (D1), incluindo as previstas em mês futuro (D2). |
| RF-02 | Com filtro de categoria, a lista mostra todas as compras da categoria (D3). |
| RF-03 | "Todas as compras" continua abrindo `#/compras` sem filtro (D4). |
| RF-04 | O número de linhas da lista é igual ao "N compras" da Fatura quando não há filtro. |

### 4.2 Regras de negócio (RN)

| ID | Regra |
| -- | ----- |
| RN-01 | Nenhum cálculo, formato salvo ou leitura de dados muda; só sai o corte de 3 linhas na tela. |
| RN-02 | A ordenação, o item compacto (≥ 64 px), a edição ao tocar e o estado vazio da lista não mudam. |

## 5. Cenários

```gherkin
# language: pt

Funcionalidade: Fatura com todas as compras do mês

  Cenário: Lista completa do mês
    Dado um cartão com 11 compras no mês
    Quando eu abro a aba "Cartões"
    Então a fatura mostra "11 compras"
    E "Compras" lista as 11, da mais recente para a mais antiga

  Cenário: Filtro mostra todas da categoria
    Dado 6 compras em "Mercado" e 5 em "Eletrônicos" no mês
    Quando eu toco em "Mercado" em "Para onde foi"
    Então "Compras" lista as 6 de "Mercado" e o "Total do filtro"

  Cenário: Mês futuro lista as previstas
    Dado uma compra parcelada em 7 vezes
    Quando eu abro o mês seguinte
    Então "Compras" lista a parcela prevista com o selo "prevista"

  Cenário: Todas as compras continua disponível
    Quando eu toco em "Todas as compras"
    Então abre a lista de todos os meses, sem filtro
```

| Requisito | Cenário |
| --------- | ------- |
| RF-01, RF-04, D1, RN-01, RN-02 | Lista completa do mês |
| RF-02, D3 | Filtro mostra todas da categoria |
| D2 | Mês futuro lista as previstas |
| RF-03, D4 | Todas as compras continua disponível (já coberto por teste existente) |

## 6. Modelo de dados e contrato

Sem mudança no formato salvo, na camada de dados nem nos hooks.

## 7. Interface

Mesma seção "Compras": a lista só cresce com o número de compras. Conferir em 360 × 780 que a rolagem e o layout seguem ok com muitas linhas.

## 8. Fora de escopo

- Paginação, "Ver mais" ou recolher a lista.
- Busca ou filtros novos na aba (existem em "Todas as compras").
- Mudar a tela "Todas as compras" ou o histórico.

## 9. Critérios de aceite

- [x] Com 11 compras no mês, a lista tem 11 linhas (teste em `src/pages/dashboard.test.tsx`).
- [x] Com filtro de categoria, a lista mostra todas as da categoria e o total do filtro bate (teste: 5 compras, "R$ 50,00").
- [x] Em mês futuro, as previstas aparecem com "prevista" (no navegador: novembro mostra "TV 2/3 · prevista · − R$ 100,00"). Sem teste automatizado novo.
- [x] "Todas as compras" abre `#/compras` (conferido no navegador). Sem teste automatizado novo; com filtro ativo não conferi.
- [x] `npm test` (298 testes), `npm run typecheck` e `npm run build` passam.
- [x] Verificado no navegador num `<iframe>` de 360 × 780 (viewport de 358 px), tema escuro, com 10 compras + 1 parcelada: 10 linhas = "10 compras", sem scroll horizontal (343 px), itens de 70 a 71 px, filtro (5 linhas, "Total do filtro R$ 300,00") e "Limpar filtro" voltam a 10, e a última compra fica acima do botão "Lançar" ao rolar até o fim. Tema claro não conferido.
- [x] `FUNCIONALIDADES.md` atualizado (seção 39 e ajustes nas seções 3 e 28/36) e `redesign-v2-cartoes.md` anotada como substituída em parte.

## 10. Tarefas (ordem de implementação)

1. Teste novo em `src/pages/dashboard.test.tsx` (11 compras; filtro) e ajuste de qualquer teste que dependa do corte.
2. `src/pages/dashboard.tsx`: remover `RECENT_PURCHASES` e o `.slice(0, RECENT_PURCHASES)`.
3. `FUNCIONALIDADES.md`: seção da aba Cartões (~linhas 244-262 e ~1729) e nova seção com link para esta spec; nota em `redesign-v2-cartoes.md`.
4. Rodar `npm test`, `typecheck`, `build`.

## 11. Roteiro de verificação

1. `npm run dev`, janela 360 × 780, `#/cartoes`.
2. Cartão com mais de 3 compras no mês: conferir linhas = "N compras".
3. Filtrar por categoria e limpar; abrir mês futuro com parcelas; tocar em "Todas as compras".
