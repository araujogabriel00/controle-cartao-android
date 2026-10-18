# Spec — Lançamentos do benefício em tela própria

| Campo | Valor |
| ----- | ----- |
| Status | Implementada |
| Criada em | 18/10/2026 |
| Escopo | `src/pages/beneficios.tsx`, `src/pages/beneficio-lancamentos.tsx` (novo), `src/App.tsx`, `src/lib/format.ts`, `FUNCIONALIDADES.md`, `README.md` |
| Depende de | [`beneficios.md`](beneficios.md), [`beneficios-em-carrossel.md`](beneficios-em-carrossel.md), [`botao-lancar.md`](botao-lancar.md), [`telas-de-entradas.md`](telas-de-entradas.md) |
| Substitui em parte | A lista de gastos que aparece abaixo do carrossel de benefícios ([`beneficios-em-carrossel.md`](beneficios-em-carrossel.md), D4). As regras de saldo, divisão e fechamento não mudam. |

> Mudanças de comportamento entram primeiro aqui e só depois no código.

## 1. Contexto e objetivo

Abaixo do carrossel de benefícios ficam o "Por categoria" e a lista de todos os gastos do benefício selecionado, na mesma tela. A lista é longa e não separa por categoria.

**Objetivo:** a lista de lançamentos sai da aba e passa para uma **tela própria**, aberta **ao tocar numa categoria** (mostra os lançamentos daquela categoria) ou num botão para ver **todos os lançamentos** do benefício.

## 2. Glossário

| Termo | Definição |
| ----- | --------- |
| **Lançamento** | Um gasto do benefício (descrição, valor, data, categoria opcional). |
| **Tela de lançamentos** | A tela com a lista de lançamentos de um benefício no mês, de uma categoria ou de todas. |

## 3. Decisões de produto

| # | Decisão | Motivo |
| - | ------- | ------ |
| D1 | **Tocar numa categoria do "Por categoria" abre a tela de lançamentos daquela categoria**, no benefício e no mês abertos. "Sem categoria" também abre (os lançamentos sem categoria). | Pedido do usuário. |
| D2 | **Um botão "Todos os lançamentos"** (com a quantidade) no detalhe do benefício abre a tela com todos os lançamentos do benefício no mês. | Pedido do usuário ("uma tela para todos os lançamentos"). Também cobre o benefício sem divisão por categoria, que não tem "Por categoria". |
| D3 | **A lista de gastos sai da aba Benefícios.** Fica o "Por categoria" e o botão do D2. | A lista passa a viver na tela própria. |
| D4 | **A tela de lançamentos mostra:** "Voltar", o nome do benefício e a categoria (ou "Todos os lançamentos"), o mês, o **total** da lista e a **lista** (descrição, data, categoria, valor) com **editar e excluir** cada um. | Mesmo formato das telas das Entradas. |
| D5 | **Sem botão de criar na tela**; criar é pelo "+" do rodapé ("Gasto de benefício"), que atualiza a lista. | Mesma regra de [`botao-lancar.md`](botao-lancar.md) (D13). |
| D6 | **Sem barra de abas e sem seletor de mês na tela**; o mês é o aberto na aba. "Voltar" leva à aba Benefícios no mesmo mês, com o mesmo benefício selecionado. | Igual às telas das Entradas. |
| D7 | **Endereços:** `#/beneficios/lancamentos/:benefício/todos`, `.../sem` (sem categoria) e `.../:categoria`, e os mesmos com `/mes/AAAA-MM` no fim para outro mês que o corrente. | Segue o padrão de mês no fim do endereço. |
| D8 | **Benefício ou mês que não existem** levam de volta à aba Benefícios: benefício que não existe no mês → aba no mesmo mês; mês fora do alcance → mês mais próximo, como na aba. | Evita tela vazia ou quebrada. |
| D9 | **Os botões Fechar/Reabrir das categorias continuam na linha da categoria**, separados da área tocável que abre a tela. | Não mudam de lugar. |

## 4. Requisitos

| ID | Requisito |
| -- | --------- |
| RF-01 | Cada linha do "Por categoria" (inclusive "Sem categoria" e as fechadas) abre a tela de lançamentos daquela categoria (D1, D9). |
| RF-02 | O detalhe do benefício tem o botão "Todos os lançamentos (n)" que abre a tela com todos eles (D2). |
| RF-03 | A aba Benefícios não mostra mais a lista de gastos (D3). |
| RF-04 | A tela mostra "Voltar", benefício, categoria, mês, total e a lista; cada lançamento tem editar e excluir (D4). |
| RF-05 | Sem lançamentos, a tela mostra "Sem lançamentos neste mês." (ou "...nesta categoria."). |
| RF-06 | "Voltar" leva à aba Benefícios, no mesmo mês, com o mesmo benefício selecionado (D6). |
| RF-07 | Lançar pelo rodapé estando na tela atualiza a lista e o total (D5). |
| RF-08 | Endereço com benefício ou mês inválido leva à aba, como na D8. |
| RN-01 | O total da tela é a soma dos lançamentos listados; o total de "todos" é o "Gasto" do card do benefício. |
| RN-02 | Editar e excluir lançamento e as regras de saldo não mudam. |
| RN-03 | Não muda o formato salvo (`version: 10`) nem `store.ts`. |

## 5. Cenários

```gherkin
# language: pt
Funcionalidade: Lançamentos do benefício em tela própria
  Contexto:
    Dado que hoje é 18/10/2026
    E o benefício "VR" tem os lançamentos "Almoço" (Mercado) R$ 300,00, "Jantar" (Mercado) R$ 80,00 e "Cinema" (sem categoria) R$ 50,00 em outubro

  Cenário: A aba não lista mais os gastos
    Quando eu abro a aba "Benefícios"
    Então vejo o card "VR" e o "Por categoria"
    E não vejo a lista de lançamentos
    E vejo o botão "Todos os lançamentos (3)"

  Cenário: Abrir uma categoria
    Quando eu toco em "Mercado" no "Por categoria"
    Então abre a tela "VR · Mercado" de outubro de 2026 com o total R$ 380,00
    E a lista mostra "Almoço" e "Jantar", e não mostra "Cinema"

  Cenário: Abrir sem categoria
    Quando eu toco em "Sem categoria"
    Então a tela mostra só "Cinema", com o total R$ 50,00

  Cenário: Abrir todos os lançamentos
    Quando eu toco em "Todos os lançamentos (3)"
    Então abre a tela "VR · Todos os lançamentos" com o total R$ 430,00 e os 3 lançamentos

  Cenário: Benefício sem divisão por categoria
    Dado que o "VR" não tem divisão por categoria
    Então não há "Por categoria" e o botão "Todos os lançamentos" continua disponível

  Cenário: Fechar e reabrir continuam na linha
    Quando eu toco em "Fechar" na linha de "Mercado"
    Então a categoria fecha e a tela de lançamentos não abre

  Cenário: Editar na tela
    Dado que estou na tela de "Mercado"
    Quando eu toco em "Editar Almoço" e mudo o valor para R$ 250,00
    Então o total da tela vira R$ 330,00

  Cenário: Excluir na tela
    Quando eu toco em "Excluir Jantar" e confirmo
    Então "Jantar" some da lista e do "Gasto" do card

  Cenário: Lançar pelo rodapé estando na tela
    Dado que estou na tela de "Mercado"
    Quando eu toco no "+" do rodapé, em "Gasto de benefício", e salvo "Padaria" de R$ 20,00 em "Mercado"
    Então a lista mostra "Padaria" e o total sobe para R$ 400,00

  Cenário: Sem lançamentos
    Dado que a categoria "Lazer" não tem lançamentos no mês
    Quando eu toco em "Lazer"
    Então vejo "Sem lançamentos nesta categoria."

  Cenário: Voltar
    Dado que estou na tela de "Mercado" do "VR" em novembro de 2026
    Quando eu toco em "Voltar"
    Então vejo a aba "Benefícios" de novembro de 2026 com o "VR" selecionado

  Cenário: Endereço inválido
    Quando eu abro a tela de um benefício que não existe no mês
    Então volto à aba "Benefícios" daquele mês
```

| Requisito | Cenário(s) |
| --------- | ---------- |
| RF-01, D1, D9 | Abrir uma categoria; Abrir sem categoria; Fechar e reabrir continuam na linha |
| RF-02, D2 | Abrir todos os lançamentos; Benefício sem divisão por categoria |
| RF-03, D3 | A aba não lista mais os gastos |
| RF-04, D4, RN-01, RN-02 | Abrir uma categoria; Editar na tela; Excluir na tela |
| RF-05 | Sem lançamentos |
| RF-06, D6 | Voltar |
| RF-07, D5 | Lançar pelo rodapé estando na tela |
| RF-08, D7, D8 | Endereço inválido |
| RN-03 | (sem mudança de dados) |

## 6. Dados e contrato

Sem mudança no formato salvo (`version: 10`) nem em `store.ts` ou `api.ts`. A tela usa `useGetBenefits(month)` (o benefício traz `spends` com `categoryId` e `categoryName`) e filtra no cliente pela categoria do endereço.

## 7. Interface

- `beneficios.tsx`: o "Por categoria" ganha linhas tocáveis (a área do nome e do valor), o botão "Todos os lançamentos (n)" substitui a contagem e a lista de gastos; ficam o editar/excluir do benefício e o Fechar/Reabrir.
- `beneficio-lancamentos.tsx` (novo): a tela, no estilo das telas das Entradas, com o diálogo de editar gasto e a confirmação de excluir, reaproveitando `SpendDialog`.
- `App.tsx`: rotas `/beneficios/lancamentos/:benefit/:cat` e `.../mes/:month`, com a regra da D8.
- `format.ts`: o caminho da tela.
- 360 px: a lista e o cabeçalho não ganham rolagem horizontal.

## 8. Fora de escopo

- Trocar de mês dentro da tela (D6).
- Criar lançamento pela tela (D5).
- Filtrar por período ou buscar por texto.
- Mudanças nas regras de saldo, divisão e fechamento.

## 9. Critérios de aceite

- [x] RF-01 a RF-08 funcionam como descritos. *Verificados no navegador: linhas do "Por categoria" (inclusive "Sem categoria" e uma sem lançamentos) abrem a tela filtrada com o total certo; "Todos os lançamentos (n)" abre todos; a aba não lista mais os gastos; "Fechar" fecha a categoria sem abrir a tela; editar, excluir e criar pelo rodapé atualizam lista e total; "Voltar" volta à aba; benefício inexistente, id ou categoria inválidos e mês inválido voltam à aba, e mês fora do alcance vai para o mais próximo.*
- [ ] Cenários da seção 5 conferidos no navegador. *Conferidos todos, menos "Voltar" em outro mês que o corrente com o benefício selecionado de volta (testei só o mês corrente) e "Benefício sem divisão por categoria". A 360 px não há rolagem horizontal.*
- [x] `npm run typecheck` e `npm run build` passam.
- [x] `FUNCIONALIDADES.md` e `README.md` atualizados; nota em `beneficios-em-carrossel.md`.

## 10. Tarefas

1. `beneficio-lancamentos.tsx` e as rotas no `App.tsx`.
2. `beneficios.tsx`: linhas tocáveis, botão "Todos os lançamentos", tirar a lista de gastos.
3. Atualizar `FUNCIONALIDADES.md`, `README.md` e a nota em `beneficios-em-carrossel.md`.
4. Verificar; marcar a spec `Implementada`.
