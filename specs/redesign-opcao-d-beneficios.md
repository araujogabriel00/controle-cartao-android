# Spec — Opção D na aba Benefícios: saldo em destaque e uso do crédito

| Campo | Valor |
| ----- | ----- |
| Status | Proposta |
| Criada em | 26/10/2026 |
| Escopo | `src/pages/benefits.tsx` (e componentes da aba), `src/components/charts/` (reuso), `FUNCIONALIDADES.md`, `README.md` |
| Depende de | [`redesign-opcao-d-entradas.md`](redesign-opcao-d-entradas.md), [`redesign-opcao-d-cartoes.md`](redesign-opcao-d-cartoes.md) (fileira de seleção e folha "⋯"), [`beneficios.md`](beneficios.md), [`compras-e-categorias.md`](compras-e-categorias.md) |
| Referência visual | Canvas: artboard "Opção D" da tela Benefícios (tema vinho) e fluxo "Opção D" |

> Mudanças de comportamento entram primeiro aqui e só depois no código.
> **Implemente depois de** [`redesign-opcao-d-cartoes.md`](redesign-opcao-d-cartoes.md).

---

## 1. Contexto e objetivo

A aba Benefícios usa o mesmo carrossel de faces e textos pequenos da aba Cartões. A Opção D aplica a mesma linguagem: **o disponível em texto grande**, um gráfico de **uso do crédito** e **uso por categoria**.

**Objetivo:** ver rápido quanto sobra do benefício no mês e onde ele foi gasto, sem mudar nenhuma regra de saldo, mês inicial/final ou categoria.

## 2. Decisões de produto

| # | Decisão | Motivo |
| - | ------- | ------ |
| D1 | Fileira de botões (44 px) no lugar do carrossel: um por benefício e "Novo benefício". Mesmo comportamento e visual da fileira de Cartões, com bolinha no tom vinho. | Consistência com Cartões. |
| D2 | **Hero**: "Disponível em ‹mês›" (14 px), valor em Fraunces 52 px, botão "⋯ Mais opções do benefício" (44 px) à direita e a linha "de R$ X de crédito · N lançamentos". | O disponível é o número principal. |
| D3 | "⋯" abre a folha com **"Editar benefício"** e **"Excluir benefício"** (excluir mantém a confirmação de hoje). | Tira o destrutivo da frente. |
| D4 | **Uso do crédito**: uma barra horizontal empilhada de 16 px com "Gasto" em `chart-rose` e "Disponível" em `chart-rose-tint`, 2 px de espaço entre os dois, extremos arredondados de 4 px. Legenda abaixo. Se o gasto passa do crédito, a barra fica toda em `chart-rose` e aparece o texto "Passou R$ X do crédito" (ícone + texto, sem depender da cor). | Mostra a fração usada. |
| D5 | Três colunas de números abaixo da barra: **Crédito**, **Gasto** e **Disponível** (rótulo 12 px, valor 15 px mono). | Os três números que a tela já mostra hoje. |
| D6 | **Uso por categoria**: barras horizontais, uma por linha, nome e "valor · percentual", todas em `chart-rose`, trilho `chart-track`. Cada linha filtra a lista de lançamentos. Sem botão "Tabela". Depois das barras, a linha **"Fechar categoria"** (44 px) com o comportamento atual, agora com a confirmação nova da spec de apoio. | Mesmo padrão do "Para onde foi". |
| D7 | **Lançamentos**: lista como hoje (linha inteira abre a edição; filtros por categoria; "Todos os lançamentos"). Só visual: hairlines e 44 px. | Sem mudança de lógica. |
| D8 | Mês fora do período do benefício (antes do mês inicial ou depois do final): hero mostra "Sem crédito em ‹mês›" e os gráficos ficam ocultos; a lista mostra a mensagem de hoje. | Mantém a regra existente. |

## 3. Requisitos

### 3.1 Requisitos funcionais (RF)

| ID | Requisito |
| -- | --------- |
| RF-01 | Ordem da tela: seletor de mês, abas, fileira (D1), hero (D2), "Uso do crédito" (D4, D5), "Uso por categoria" (D6) e "Lançamentos" (D7), seguidos do rodapé "Lançar" e "Categorias". |
| RF-02 | Alvos de toque de 44 px; textos de 12 px ou mais; hairlines `line`. |
| RF-03 | A barra de D4 tem `role="img"` e `aria-label` ("Gasto R$ 120,00 de R$ 600,00; disponível R$ 480,00") e tabela `sr-only`. |
| RF-04 | "Uso por categoria" lista até 6 categorias; as demais somam em "Outras". Tocar numa linha filtra os lançamentos e rola até a lista. |
| RF-05 | Sem benefício cadastrado: convite de hoje, com o visual desta spec. |
| RF-06 | `aria-label="Mais opções do benefício"` no "⋯"; a folha fecha ao tocar fora, em "Fechar" ou ao escolher. |

### 3.2 Regras de negócio (RN)

| ID | Regra |
| -- | ----- |
| RN-01 | Nenhum cálculo muda: disponível = crédito do mês − lançamentos do mês; período do benefício, categorias e fechamento de categoria como hoje. |
| RN-02 | Os dados dos gráficos saem do que a tela já busca; não há endpoint novo. |
| RN-03 | Os `data-testid` existentes são mantidos; os botões de editar e excluir passam a ser itens da folha "⋯". |

## 4. Cenários

```gherkin
# language: pt
Funcionalidade: Aba Benefícios na Opção D

  Contexto:
    Dado o benefício "Vale-refeição" com crédito mensal de R$ 600,00
    E em outubro há R$ 120,00 em lançamentos

  Cenário: Disponível em destaque
    Quando eu abro a aba "Benefícios"
    Então vejo "Disponível em outubro de 2026" e "R$ 480,00"
    E "de R$ 600,00 de crédito · N lançamentos"

  Cenário: Uso do crédito
    Então a barra mostra 20% de gasto e 80% de disponível
    E vejo Crédito R$ 600,00, Gasto R$ 120,00 e Disponível R$ 480,00

  Cenário: Passou do crédito
    Dado que os lançamentos somam R$ 650,00
    Então a barra fica toda na cor de gasto
    E vejo "Passou R$ 50,00 do crédito"

  Cenário: Filtrar por categoria
    Quando eu toco numa categoria em "Uso por categoria"
    Então a lista mostra só os lançamentos dela

  Cenário: Fechar categoria
    Quando eu toco em "Fechar categoria" e confirmo
    Então a categoria é fechada como hoje

  Cenário: Mês fora do período
    Quando eu abro um mês depois do mês final do benefício
    Então vejo "Sem crédito em ‹mês›" e nenhum gráfico
```

## 5. Dados e contrato

Sem mudança no formato salvo nem em `src/data/store.ts`.

## 6. Interface

Reutiliza `chart-rose`, `chart-rose-tint`, `chart-track`, `hbars.tsx`, `chart-legend.tsx`, `chart-table.tsx` e a fileira/folha de [`redesign-opcao-d-cartoes.md`](redesign-opcao-d-cartoes.md). Acrescenta `stacked-bar.tsx` (barra única empilhada, pode reaproveitar a de Entradas se existir).

## 7. Fora de escopo

- Comparar benefícios entre si, novas regras de saldo ou de período.
- Botão "Tabela" visível.

### Pontos a confirmar antes de implementar

1. Texto e valores do mock são ilustrativos; mantenha os textos e a lógica do seu código.
2. O tom vinho do tema escuro não passa na validação de contraste para dados; os gráficos usam `chart-rose` (validado). Confirme a aparência.
3. Regra de "passou do crédito" (D4): confirme que a tela já pode ficar com saldo negativo; se o seu código impede, ignore D4 e o cenário.

## 8. Critérios de aceite

- A aba não mostra mais a face colorida; mostra fileira, hero, barra de uso e categorias.
- Os números batem com a tela de hoje.
- Editar, excluir, filtrar, fechar categoria e abrir lançamento continuam funcionando.
- Mês fora do período se comporta como D8.
- `npm run typecheck` e `npm run build` passam; documentação atualizada; status "Implementada".

## 9. Tarefas

1. `stacked-bar.tsx` (ou reuso), ajustes em `hbars.tsx`.
2. `benefits.tsx`: fileira, hero, folha "⋯", barra de uso, categorias, lista.
3. `FUNCIONALIDADES.md` e `README.md`.
4. `npm run typecheck` e `npm run build`.

## 10. Roteiro de verificação

1. Criar benefício, lançar gastos e conferir hero, barra e categorias.
2. Passar do crédito e conferir o aviso.
3. Filtrar, fechar categoria, editar e excluir pelo "⋯".
4. Mês antes/depois do período.
5. TalkBack nos gráficos.
