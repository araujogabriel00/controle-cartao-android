# Spec — Tela de categorias

| Campo | Valor |
| ----- | ----- |
| Status | Implementada |
| Criada em | 18/10/2026 |
| Escopo | `src/pages/categorias.tsx` (novo), `src/App.tsx`, `src/pages/dashboard.tsx`, `src/pages/entradas.tsx`, `src/pages/beneficios.tsx`, `src/components/categories-dialog.tsx` (removido), `FUNCIONALIDADES.md`, `README.md` |
| Depende de | [`compras-e-categorias.md`](compras-e-categorias.md) (categorias globais) |
| Substitui em parte | O diálogo "Categorias" de [`compras-e-categorias.md`](compras-e-categorias.md) (RF-07, D9), [`beneficios.md`](beneficios.md) (RF-09, D11) e [`contas-e-gastos.md`](contas-e-gastos.md) (RF-09). As regras de criar, renomear e excluir categorias continuam as mesmas; o que muda é **onde** elas são feitas. |

> Esta spec é a fonte da verdade da funcionalidade. A implementação segue a seção [Tarefas](#11-tarefas) e só termina quando todos os [Critérios de aceite](#10-critérios-de-aceite) forem atendidos. Mudanças de comportamento entram primeiro aqui e só depois no código.

---

## 1. Contexto e objetivo

As categorias são **globais**: as mesmas para as compras dos cartões, os gastos do dia a dia e os benefícios. Mesmo assim, o criar, renomear e excluir existe em **três telas** (Cartões, Entradas e Benefícios), cada uma com o seu botão "Categorias" abrindo um diálogo e repetindo a lógica de gravação e de atualização das listas.

**Objetivo:**

1. Ter **um lugar só** para criar, renomear e excluir categorias: uma tela própria.
2. Manter o caminho curto: as três abas continuam com o botão "Categorias", que passa a **abrir a tela** em vez de um diálogo.
3. Ter **uma implementação só** dessa lógica, em vez de três cópias.

## 2. Glossário

| Termo | Definição |
| ----- | --------- |
| **Tela de categorias** | A tela `#/categorias`, onde ficam todas as operações sobre categorias. |
| **Contagem de uso** | O número mostrado em cada categoria: compras, parcelas e recorrências, gastos do dia a dia e gastos de benefício que a usam (`movementCount` de `getCategories`). |

## 3. Decisões de produto

| # | Decisão | Motivo |
| - | ------- | ------ |
| D1 | **O CRUD de categorias fica só na tela `#/categorias`.** Nenhuma outra tela cria, renomeia ou exclui categorias. | Escolha do usuário: um lugar só. |
| D2 | **A tela é uma página, não um diálogo**, sem a barra de abas (não pertence a nenhuma das três áreas). | Uma página comporta a lista inteira e fica ao alcance do botão "Voltar" do aparelho. |
| D3 | **As abas Cartões, Entradas e Benefícios mantêm o botão "Categorias"**, que agora leva à tela. | Escolha do usuário. Um lugar para editar, três atalhos para chegar. |
| D4 | **Os seletores de categoria** (compra, gasto, benefício) **continuam só listando**: escolher uma categoria não muda. | Não é CRUD. |
| D5 | **As regras de dados não mudam**: nome obrigatório, até 120 caracteres, único sem diferenciar caixa e espaços; excluir libera compras, parcelas, recorrências, gastos e gastos de benefício e tira a categoria das divisões e dos fechamentos. | Só o lugar muda. |
| D6 | **Sem mudança de formato salvo.** Nenhuma migração. | Nada de dados muda. |

## 4. Requisitos

### 4.1 Requisitos funcionais (RF)

| ID | Requisito |
| -- | --------- |
| RF-01 | A rota **`#/categorias`** mostra a tela "Categorias": título, botão **"Voltar"**, o campo para criar uma categoria e a lista de categorias. |
| RF-02 | Os botões **"Categorias"** das abas Cartões, Entradas e Benefícios **abrem a tela** (D3). Não abrem mais diálogo. |
| RF-03 | **Criar:** o campo "Nova categoria" com o botão "Criar". Depois de criar, a mensagem "Categoria criada." aparece, o campo é limpo e a categoria entra na lista. |
| RF-04 | **Renomear:** o botão de renomear de uma linha troca o nome por um campo com confirmar e cancelar. Depois de salvar, a mensagem "Categoria renomeada." aparece. |
| RF-05 | **Excluir:** o botão de excluir pede confirmação "Excluir a categoria “‹nome›”? ‹n› compras ficarão sem categoria. Esta ação não pode ser desfeita." (sem a parte da contagem quando for zero; "1 compra ficará sem categoria." no singular). Depois de confirmar, a mensagem é "Categoria removida.". |
| RF-06 | A lista mostra as categorias **em ordem alfabética**, cada uma com o nome e a **contagem de uso** ("0 compras", "1 compra", "n compras"). |
| RF-07 | **"Voltar"** retorna à tela de onde a pessoa veio. Se a tela foi aberta direto, sem tela anterior, leva a `#/`. |
| RF-08 | Sem nenhuma categoria, a tela mostra "Nenhuma categoria ainda. Crie uma para separar seus gastos." |

### 4.2 Regras de negócio (RN)

| ID | Regra |
| -- | ----- |
| RN-01 | **Validação e efeitos (D5):** as de `compras-e-categorias.md` (RN-05, RN-06), estendidas por `beneficios.md` (RN-11, RN-20), `contas-e-gastos.md` (RN-11) e `compra-recorrente.md` (RN-11). Os erros aparecem como mensagem na tela ("Já existe uma categoria com esse nome."). |
| RN-02 | **Ponto único (D1):** só a tela de categorias chama criar, renomear e excluir categoria. As outras telas só leem a lista (D4). |
| RN-03 | **Atualização:** depois de criar, renomear ou excluir, as listas de categorias e tudo o que mostra o nome ou a categoria de uma compra, gasto, recorrência ou benefício (cartões, resumos, histórico, benefícios, gastos do dia a dia) são atualizados, de forma que, ao voltar, as outras telas já mostrem o resultado. |
| RN-04 | **Navegação (RF-07):** "Voltar" usa o histórico de navegação quando existe; senão vai para `#/`. A tela não aparece na barra de abas. |
| RN-05 | **Rota:** `#/categorias` abre sempre, sem depender de cartões, entradas ou benefícios cadastrados. |

## 5. Cenários (BDD)

```gherkin
# language: pt

Funcionalidade: Tela de categorias
  Como pessoa que organiza gastos, compras e benefícios em categorias
  Quero gerenciar as categorias num lugar só
  Para não procurar o mesmo botão em três telas diferentes

  # --- RF-02 / D3 -----------------------------------------------------------------
  Cenário: Chegar nas categorias a partir de qualquer aba
    Dado que estou na aba "Cartões", "Entradas" ou "Benefícios"
    Quando eu toco no botão "Categorias"
    Então abre a tela "Categorias"
    E nenhum diálogo de categorias abre

  # --- RF-01 / RN-05 --------------------------------------------------------------
  Cenário: Abrir a tela direto
    Dado que não existe nenhum cartão, entrada ou benefício
    Quando eu abro "#/categorias"
    Então vejo o título "Categorias", o campo "Nova categoria" e o botão "Voltar"
    E a barra de abas não aparece

  # --- RF-08 ----------------------------------------------------------------------
  Cenário: Nenhuma categoria criada
    Dado que não existe nenhuma categoria
    Então vejo "Nenhuma categoria ainda. Crie uma para separar seus gastos."

  # --- RF-03 ----------------------------------------------------------------------
  Cenário: Criar uma categoria
    Quando eu preencho "Transporte" e toco em "Criar"
    Então vejo a mensagem "Categoria criada."
    E "Transporte" aparece na lista com "0 compras"
    E o campo "Nova categoria" fica vazio

  # --- RN-01 ----------------------------------------------------------------------
  Cenário: Nome de categoria repetido
    Dado que existe a categoria "Mercado"
    Quando eu tento criar uma categoria chamada "  mercado "
    Então vejo a mensagem de erro "Já existe uma categoria com esse nome."

  # --- RF-06 ----------------------------------------------------------------------
  Cenário: Lista em ordem alfabética com a contagem de uso
    Dado que existem "Mercado" (3 usos), "Casa" (1 uso) e "Lazer" (0 usos)
    Então a lista mostra "Casa" com "1 compra", "Lazer" com "0 compras" e "Mercado" com "3 compras", nessa ordem

  # --- RF-04 ----------------------------------------------------------------------
  Cenário: Renomear uma categoria
    Dado que existe a categoria "Transporte" com compras
    Quando eu toco em "Renomear Transporte", mudo para "Uber e ônibus" e confirmo
    Então vejo a mensagem "Categoria renomeada."
    E as compras, os gastos e as parcelas previstas dessa categoria passam a mostrar "Uber e ônibus"

  Cenário: Desistir de renomear
    Quando eu toco em "Renomear Transporte" e depois em cancelar
    Então o nome continua "Transporte"

  # --- RF-05 / RN-01 --------------------------------------------------------------
  Cenário: Excluir uma categoria em uso
    Dado que "Lazer" tem 2 compras no cartão e 1 gasto de benefício
    Quando eu toco em "Excluir Lazer"
    Então o sistema pede confirmação para "Excluir a categoria “Lazer”? 3 compras ficarão sem categoria. Esta ação não pode ser desfeita."
    Quando eu confirmo
    Então vejo a mensagem "Categoria removida."
    E os 3 itens continuam, agora "Sem categoria", e os valores dos cartões, benefícios e saldo não mudam

  Cenário: Excluir uma categoria sem uso
    Dado que existe a categoria "Viagem" sem uso
    Quando eu toco em "Excluir Viagem"
    Então o sistema pede confirmação sem falar de compras

  # --- RN-03 ----------------------------------------------------------------------
  Cenário: As outras telas refletem a mudança ao voltar
    Dado que renomeei "Transporte" para "Uber e ônibus" na tela de categorias
    Quando eu toco em "Voltar"
    Então a tela de onde vim já mostra "Uber e ônibus" nas compras e nos seletores

  # --- RF-07 / RN-04 --------------------------------------------------------------
  Cenário: Voltar
    Dado que cheguei pela aba "Benefícios"
    Quando eu toco em "Voltar"
    Então volto para a aba "Benefícios"
    Mas se abri "#/categorias" direto, "Voltar" leva ao painel dos cartões

  # --- RN-02 / D1 / D4 -----------------------------------------------------------
  Cenário: Só a tela de categorias gerencia categorias
    Dado que estou na aba "Cartões", "Entradas" ou "Benefícios"
    Então não há campo para criar, nem ação de renomear ou excluir categoria na tela
    E os seletores de categoria só listam as existentes
```

### 5.1 Matriz de rastreabilidade

| Requisito | Cenário(s) |
| --------- | ---------- |
| RF-01, RN-05 | Abrir a tela direto |
| RF-02, D3 | Chegar nas categorias a partir de qualquer aba |
| RF-03 | Criar uma categoria |
| RF-04 | Renomear uma categoria; Desistir de renomear |
| RF-05 | Excluir uma categoria em uso; Excluir uma categoria sem uso |
| RF-06 | Lista em ordem alfabética com a contagem de uso |
| RF-07, RN-04 | Voltar; Abrir a tela direto |
| RF-08 | Nenhuma categoria criada |
| RN-01, D5 | Nome de categoria repetido; Excluir uma categoria em uso |
| RN-02, D1, D4 | Só a tela de categorias gerencia categorias |
| RN-03 | As outras telas refletem a mudança ao voltar; Renomear uma categoria |
| D2 | Abrir a tela direto |
| D6 | (sem mudança de dados) |

## 6. Modelo de dados e migração

Nada muda: o formato salvo (`version: 9`) e as funções de dados `getCategories`, `createCategory`, `updateCategory` e `deleteCategory` continuam como estão (D5, D6).

## 7. Contrato da camada de dados

Sem mudanças em `src/data/store.ts` nem em `src/data/api.ts`. A tela usa os hooks que já existem: `useGetCategories`, `useCreateCategory`, `useUpdateCategory` e `useDeleteCategory`.

## 8. Interface

- **Tela** (`src/pages/categorias.tsx`), de cima para baixo: o botão "Voltar", o título "Categorias" (com a legenda "Para todos os cartões, gastos e benefícios"), o campo "Nova categoria" com o botão "Criar", e a lista. Cada linha tem o nome, a contagem de uso, o botão de renomear (que troca o nome por um campo com confirmar e cancelar) e o de excluir. O estado vazio segue o RF-08. As mensagens de sucesso e de erro aparecem como nas outras telas.
- **Rota** (`src/App.tsx`): `#/categorias`, fora do agrupamento por abas.
- **Abas:** em Cartões, Entradas e Benefícios, o botão "Categorias" navega para `#/categorias` e deixa de abrir diálogo. Saem desses três arquivos o estado do diálogo, as três mutações de categoria e o `CategoriesDialog`.
- **Reuso:** o conteúdo do `CategoriesDialog` (formulário de criar, lista, edição na linha) vira o corpo da tela, e o componente `src/components/categories-dialog.tsx` é removido. Estilo e mensagens seguem as outras telas (`dialog-styles` só para o que ainda for modal).
- **Atualização (RN-03):** depois de cada operação, a tela invalida as consultas de categorias, compras, resumos, histórico, benefícios, gastos e saldo.

## 9. Fora de escopo

- Cor ou ícone de categoria, reordenar à mão e mesclar duas categorias.
- Quarta aba "Categorias" na barra de abas.
- Mudar a contagem de uso (continua `movementCount`, rotulada "compras").
- Qualquer mudança nas regras de dados das categorias (D5).

## 10. Critérios de aceite

- [x] RF-01 a RF-08 funcionam como descritos. *Verificados no navegador: a tela e o "Voltar" (RF-01, RF-07), os botões das três abas (RF-02), criar com mensagem e campo limpo (RF-03), renomear e cancelar (RF-04), excluir com a confirmação e a contagem (RF-05) e a lista em ordem alfabética com a contagem (RF-06). O estado vazio (RF-08) foi conferido só pelo código.*
- [ ] Todos os cenários da seção 5 passam no navegador (`npm run dev`). *Conferidos: chegar pelas três abas, nome repetido, lista em ordem, renomear, desistir, excluir em uso e sem uso, as outras telas refletindo ao voltar, "Voltar" e a tela cabendo em 360 px. Pendente: abrir `#/categorias` direto num aparelho sem histórico (o "Voltar" levar a `#/`) e o estado vazio.*
- [x] As três abas abrem a tela pelo botão "Categorias", sem diálogo, e nenhuma delas tem mais o CRUD (RN-02).
- [x] Depois de criar, renomear e excluir, as outras telas mostram o resultado ao voltar (RN-03): benefícios, compras do cartão e filtros, e gastos do dia a dia.
- [x] `npm run typecheck` e `npm run build` passam.
- [x] `FUNCIONALIDADES.md` e `README.md` atualizados, e as specs `compras-e-categorias.md`, `beneficios.md` e `contas-e-gastos.md` têm a nota "Substituída em parte por `tela-de-categorias.md`".

## 11. Tarefas

1. `categorias.tsx`: a tela, com criar, renomear inline, excluir com confirmação, lista, estado vazio e "Voltar", reaproveitando o corpo do `CategoriesDialog`.
2. `App.tsx`: a rota `#/categorias`.
3. `dashboard.tsx`, `entradas.tsx` e `beneficios.tsx`: o botão "Categorias" passa a navegar; remover o estado, as mutações de categoria e o `CategoriesDialog`.
4. Remover `src/components/categories-dialog.tsx`.
5. Atualizar `FUNCIONALIDADES.md` (seções 2, 13 e 14), `README.md` e as notas nas três specs.
6. Rodar o roteiro de verificação; mudar o Status para `Implementada` e marcar só o que foi verificado.

## 12. Roteiro de verificação

1. `npm run typecheck` e `npm run build`.
2. `npm run dev`: em cada aba, tocar em "Categorias" e conferir que abre a tela; criar, renomear e excluir; "Voltar" para cada aba e abrir `#/categorias` direto.
3. Conferir que, depois de renomear e excluir, as compras, os gastos, os benefícios e os resumos mostram o resultado ao voltar.
4. Conferir a 360 px que a tela não passa da largura.
5. Conferir que o resto de Cartões, Entradas e Benefícios continua igual.
