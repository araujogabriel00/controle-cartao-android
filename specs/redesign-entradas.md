# Spec — Redesign da tela Entradas e da navegação compartilhada

| Campo | Valor |
| ----- | ----- |
| Status | Proposta |
| Criada em | 25/10/2026 |
| Escopo | `src/index.css`, `src/pages/entradas.tsx`, `src/components/month-nav.tsx`, `src/components/app-tabs.tsx`, `src/components/quick-add.tsx` (só o menu de rodapé), `FUNCIONALIDADES.md`, `README.md` |
| Depende de | [`telas-de-entradas.md`](telas-de-entradas.md), [`contas-e-gastos.md`](contas-e-gastos.md), [`mes-compartilhado.md`](mes-compartilhado.md), [`botao-lancar.md`](botao-lancar.md) |
| Substitui em parte | [`botao-lancar.md`](botao-lancar.md): o botão "+" e o ícone de categorias do rodapé passam a ter **texto** ("Lançar" e "Categorias"). O resto do rodapé, o menu de opções e os formulários não mudam. |
| Referência visual | Canvas "Controle do Cartão — Entradas", artboards "Atual" e "Proposta" da tela Entradas |

> Mudanças de comportamento entram primeiro aqui e só depois no código.

---

## 1. Contexto e objetivo

A tela Entradas mostra o **Saldo**, o número mais importante, no fim da tela e pequeno, abaixo de uma grade de quatro blocos. Os textos têm 10 a 13 px, valores zerados aparecem em vermelho, e o botão "+" e o ícone de categorias do rodapé não têm rótulo. Além disso, o app tem cerca de 509 usos de cor em hexadecimal nos `.tsx` (103 valores diferentes) apesar de o tema do `index.css` já definir variáveis.

**Objetivo:** reorganizar a tela Entradas para que o Saldo seja o destaque, tornar o texto e os alvos de toque adequados ao celular, e criar um conjunto pequeno de **cores com nome** que as outras telas poderão adotar depois. Nenhuma regra de cálculo muda.

## 2. Decisões de produto

| # | Decisão | Motivo |
| - | ------- | ------ |
| D1 | O **Saldo** vai para o topo, num card de destaque, com a conta que o gera logo abaixo: **Saldo anterior + Resultado do mês**. | É o número que o usuário procura, e a conta mostra de onde ele vem. |
| D2 | As quatro origens (Entradas, Contas fixas, Gastos do dia a dia, Cartões) viram **linhas** de 60 px, no lugar da grade 2×2. | Linhas são mais fáceis de tocar e de comparar. |
| D3 | **Entradas** levam "+", **saídas** levam "−", e valor zero aparece sem sinal e em cor apagada. Nenhum valor usa vermelho. | Hoje contas fixas e gastos aparecem em vermelho mesmo com R$ 0,00, o que parece um alerta que não existe. |
| D4 | Texto com no mínimo **12 px** e alvos de toque de no mínimo **44 px** nos elementos interativos desta tela e da navegação. | Legibilidade e toque no celular. |
| D5 | Se o saldo é negativo, o card de saldo muda para a cor de alerta e mostra o aviso que já existe ("As saídas passaram das entradas e do saldo anterior."). | Mantém o comportamento atual (RN do saldo negativo). |
| D6 | A legenda "Resumo do mês · ‹mês›" é removida; o título da lista passa a ser "Resumo do mês". | O seletor de mês, logo acima, já mostra o mês. |
| D7 | O seletor de mês, as abas e o rodapé são **componentes únicos**, então a mudança de tamanho vale também nas abas Cartões e Benefícios. O conteúdo dessas abas não muda nesta spec. | Evita duas versões da mesma barra. |
| D8 | As cores novas entram no tema do Tailwind com nomes (`paper`, `surface`, `line`, `ink`, `ink-soft`, `brand`, `on-brand`, `on-brand-soft`, `eyebrow`, `alert`). Só os componentes desta spec passam a usá-las. | Primeiro passo para tirar os hexadecimais soltos, sem mexer em telas que ainda não foram revisadas. |

## 3. Requisitos

### 3.1 Requisitos funcionais (RF)

| ID | Requisito |
| -- | --------- |
| RF-01 | O card de **Saldo** é o primeiro bloco do conteúdo da tela, logo abaixo das abas, com o valor em destaque (`text-3xl` ou maior). |
| RF-02 | O card de Saldo mostra, em duas colunas, **Saldo anterior** e **Resultado do mês**. O resultado positivo leva "+". |
| RF-03 | O bloco "Resumo do mês" lista **Entradas, Contas fixas, Gastos do dia a dia e Cartões**, nessa ordem, cada um como botão de linha inteira que abre a lista correspondente (comportamento de [`telas-de-entradas.md`](telas-de-entradas.md)). |
| RF-04 | Cada linha mostra o rótulo, o valor e uma seta. Entradas com valor maior que zero levam "+" e cor da marca; saídas com valor maior que zero levam "−" e cor do texto; valor zero aparece sem sinal e em cor apagada. |
| RF-05 | O seletor de mês tem setas de 44 px e o nome do mês em 20 px; "Voltar para o mês atual" tem 13 px e só aparece fora do mês corrente. |
| RF-06 | As abas têm 44 px de altura e texto de 14 px. |
| RF-07 | O rodapé mostra o botão "Lançar" (ícone "+" e texto) no centro e "Categorias" (ícone e texto) à direita. Os dois continuam abrindo o que abriam. |
| RF-08 | O card de Saldo muda para a cor de alerta quando o saldo é negativo, e mostra o aviso de saldo negativo dentro dele. |

### 3.2 Regras de negócio (RN)

| ID | Regra |
| -- | ----- |
| RN-01 | Nenhum cálculo muda: Resultado = entradas − contas fixas − gastos − faturas; Saldo = Saldo anterior + Resultado (ver [`contas-e-gastos.md`](contas-e-gastos.md)). |
| RN-02 | A tela continua só lendo os cartões, sem alterar cartões, compras ou benefícios. |
| RN-03 | As rotas, o mês compartilhado entre as abas e o limite de meses navegáveis não mudam. |
| RN-04 | Os identificadores de teste (`data-testid`) existentes na tela e no rodapé são mantidos. |
| RN-05 | Os botões do rodapé mantêm os nomes acessíveis "Lançar" e "Categorias". |

## 4. Cenários

```gherkin
# language: pt

Funcionalidade: Tela Entradas redesenhada

  Cenário: O saldo é o primeiro bloco
    Quando eu abro a aba "Entradas"
    Então o card "Saldo" aparece logo abaixo das abas
    E mostra "Saldo anterior" e "Resultado do mês" em duas colunas

  Cenário: Origens do mês como linhas
    Dado que o mês tem entradas de R$ 4.527,00 e faturas de R$ 520,14
    Quando eu olho o "Resumo do mês"
    Então vejo "Entradas" com "+ R$ 4.527,00"
    E "Cartões" com "− R$ 520,14"
    E "Contas fixas" e "Gastos do dia a dia" com "R$ 0,00", sem sinal e sem vermelho

  Cenário: Abrir uma lista
    Quando eu toco na linha "Cartões"
    Então abre a tela de faturas por cartão do mês

  Cenário: Saldo negativo
    Dado que as saídas passam das entradas e do saldo anterior
    Então o card de saldo aparece na cor de alerta
    E mostra "As saídas passaram das entradas e do saldo anterior."

  Cenário: Rodapé com texto
    Quando eu abro as abas "Entradas", "Cartões" e "Benefícios"
    Então vejo o botão "Lançar" com texto e o botão "Categorias" com texto
    E tocar em "Lançar" abre as mesmas cinco opções de antes
```

| Requisito | Cenário |
| --------- | ------- |
| RF-01, RF-02 | O saldo é o primeiro bloco |
| RF-03, RF-04, RN-01 | Origens do mês como linhas; Abrir uma lista |
| RF-05, RF-06, RN-03 | Verificação manual no roteiro |
| RF-07, RN-05 | Rodapé com texto |
| RF-08 | Saldo negativo |

## 5. Dados e contrato

Sem mudança no formato salvo, na camada de dados nem nos hooks.

## 6. Interface

- **Cores com nome** (tema do Tailwind): `paper` #f5f1e7, `surface` #fbf8f0, `line` #e1dbce, `ink` #1f3a2e, `ink-soft` #4f6256, `brand` #28513f, `on-brand` #fffaf0, `on-brand-soft` #d5ddd0, `eyebrow` #7a6a45, `alert` #8c4636.
- **Card de Saldo:** fundo `brand` (ou `alert` se negativo), raio 24 px, rótulo 14 px, valor em DM Mono 38 px, colunas com rótulo de 13 px e valor de 16 px.
- **Linhas do resumo:** altura mínima de 60 px, rótulo de 15 px, valor em DM Mono 16 px, divisórias de 1 px na cor `line`.
- **Rodapé:** 80 px de altura; "Lançar" com 52 px de altura; "Categorias" com ícone de 20 px e texto de 12 px.
- Referência exata de medidas: artboard "Proposta" da tela Entradas no canvas.

## 7. Fora de escopo

- Conteúdo das abas Cartões e Benefícios (card, lista de compras, resumo por categoria). Ficam para uma próxima spec.
- Dark mode, a textura de fundo (`notebook-grain`) e as animações.
- Trocar os hexadecimais das demais telas pelos nomes de cor.
- Barra de "saídas × entradas".

## 8. Critérios de aceite

- [ ] `npm run typecheck` e `npm run build` passam.
- [ ] O saldo aparece primeiro, com anterior e resultado abaixo.
- [ ] As quatro linhas abrem as listas corretas e mostram sinais e cores conforme RF-04.
- [ ] O saldo negativo troca a cor do card e mostra o aviso.
- [ ] Setas do mês, abas, "Lançar" e "Categorias" têm no mínimo 44 px de altura.
- [ ] O rodapé continua abrindo o menu "Lançar" e a tela de categorias, nas três abas.
- [ ] A navegação entre meses e entre abas continua igual.
- [ ] `FUNCIONALIDADES.md` e `README.md` atualizados.

## 9. Tarefas

1. Adicionar as cores com nome ao tema em `src/index.css`.
2. Atualizar `month-nav.tsx` e `app-tabs.tsx` (tamanhos de RF-05 e RF-06).
3. Atualizar o menu de rodapé em `quick-add.tsx` (RF-07) e o espaço reservado para ele.
4. Reescrever o bloco de resumo de `entradas.tsx` (RF-01 a RF-04, RF-08).
5. Atualizar `FUNCIONALIDADES.md` (nova seção 23 e ajuste da seção 19) e o `README.md`.
6. Rodar `typecheck` e `build`.

## 10. Roteiro de verificação

1. `npm run dev`, abrir `#/entradas` num tamanho de 390 px de largura.
2. Conferir os cenários da seção 4, inclusive um mês com saldo negativo (criar uma conta fixa maior que as entradas).
3. Abrir `#/` e `#/beneficios` e conferir o seletor de mês, as abas e o rodapé novos.
4. Tocar em "Lançar" e em "Categorias" e conferir que abrem o menu e a tela de categorias.
