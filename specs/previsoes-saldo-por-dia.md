# Spec — Previsões: saldo de cada dia no calendário e folha do dia

| Campo | Valor |
| ----- | ----- |
| Status | Implementada |
| Criada em | 12/11/2026 |
| Escopo | `src/pages/previsoes.tsx` (cartão de resumo removido, calendário com saldo, folha do dia), `src/components/app-header.tsx` (item "Saldo previsto" no menu da área Previsões), `src/data/store.ts` e `src/data/api.ts` (saldo por dia), testes de `previsoes.test.tsx` e `previsao-saldo.test.tsx`, `FUNCIONALIDADES.md`, `README.md` |
| Depende de | [`previsoes.md`](previsoes.md), [`redesign-v2-fundacao.md`](redesign-v2-fundacao.md), [`botao-lancar.md`](botao-lancar.md) |
| Substitui em parte | [`previsoes.md`](previsoes.md): RF-02 (cartão de resumo), RF-03 (calendário só com pontos), RF-04 (lista do dia abaixo do calendário), RF-09 (entrada do Saldo previsto pelo cartão) e RN-09 (texto do cartão) |
| Ajustada por | [`previsoes-folha-recolhida.md`](previsoes-folha-recolhida.md) (D6, D7, RF-07 e a Interface da folha e do botão Lançar) |
| Referência visual | Canvas "Controle do Cartão", grupo Previsões (saldo por dia): **V10_04** (saldo sem abreviar + folha do dia), clara e escura. As variações V8, V9 e V10_01 a V10_03 são alternativas descartadas |

> Mudanças de comportamento entram primeiro aqui e só depois no código.

---

## 1. Contexto e objetivo

O calendário de Previsões mostra só pontos (a receber, a pagar, lembrete) e, acima dele, um cartão com "Saldo hoje" e "Previsto em ‹fim do mês›". Para saber como o saldo fica num dia qualquer a pessoa precisa abrir a tela Saldo previsto e ler um gráfico.

**Objetivo:** mostrar **o saldo de cada dia dentro do próprio calendário**, já contando as previsões a receber e a pagar que mexem no saldo, e levar a lista do dia para uma **folha fixa embaixo**. O cartão de resumo sai (o saldo de hoje e o do último dia já estão nas células). **A regra de cálculo não muda**: é o mesmo saldo da tela Saldo previsto (`previsoes.md` RN-08), agora dia a dia.

## 2. Glossário

| Termo | Significado |
| ----- | ----------- |
| Saldo do dia | O saldo no **fim** do dia: saldo base do mês aberto (RN-08 de `previsoes.md`) mais as previsões que mexem no saldo, com data até aquele dia. |
| Folha do dia | Painel fixo acima da barra inferior com o dia selecionado: título, total que mexe no saldo, previsões e "Saldo no fim do dia". |
| Dia com previsão | Dia com ao menos uma previsão que mexe no saldo e que ainda não entrou (data depois de hoje). |

## 3. Decisões de produto

| # | Decisão | Motivo |
| - | ------- | ------ |
| D1 | Cada dia do calendário mostra o **saldo do dia em reais inteiros, sem abreviar** (`8.420`, `10.070`, `−1.250`), em fonte mono de 12 px sob o número do dia e os pontos. | Escolha do usuário (V10_04). Reais inteiros cabem na célula e mostram o valor sem "k". |
| D2 | **Dias com previsão e hoje** aparecem com o saldo em **negrito**; os demais, em peso normal e cor suave. | Mostra onde o saldo muda sem repetir o mesmo destaque em todos os dias. |
| D3 | **Mês corrente:** o saldo aparece de **hoje** ao último dia; os dias passados ficam **sem saldo**. **Mês futuro:** do dia 1 ao último dia. **Mês passado:** nenhum dia mostra saldo. | O app não guarda o saldo dia a dia do que já aconteceu (D11 de `previsoes.md`: mês passado não tem projeção). |
| D4 | O saldo do dia **soma só as previsões que mexem no saldo**. **Lembretes não entram** (continuam com o ponto vazado). Faturas de cartão, contas fixas recorrentes e benefícios não são previsões e já estão no saldo base. | Mesma regra de `previsoes.md` D11/RN-08; nada de cálculo novo. |
| D5 | O **cartão de resumo é removido**. O saldo de hoje está na célula de hoje e o do último dia, na célula do último dia. | Escolha do usuário. |
| D6 | A **lista do dia** sai de baixo do calendário e vai para a **folha do dia**, fixa acima da barra inferior. Ela mostra: título do dia (toca para abrir a tela do dia), total que mexe no saldo, as previsões (tocar abre a edição, como hoje) e a linha **"Saldo no fim do dia"** com centavos. Se o dia tiver mais previsões do que cabem, a lista da folha rola dentro dela (a folha tem no máximo 45% da altura da tela). | V10_04. |
| D7 | O botão flutuante **Lançar continua**: ele fica **acima da folha do dia** (sobe junto com ela) em vez de sumir. O V10_04 o omitiu só para mostrar a folha; sem ele não haveria como criar uma previsão. | Preserva `botao-lancar.md`; "Nova previsão" nasce do Lançar. |
| D8 | O **Saldo previsto** (tela com gráfico e "Próximas previsões") **continua existindo**, sem mudança de conteúdo. A entrada passa a ser o item **"Saldo previsto"** no menu ⋯ do cabeçalho, **só na área Previsões** e só em mês corrente ou futuro. | O cartão de resumo era a única porta de entrada; o menu é o lugar que mais se parece com o que o desenho tinha. |
| D9 | Saldo **negativo** aparece com sinal "−" e cor `alert`, e o nome acessível diz "saldo negativo". | Nunca só cor. |
| D10 | Se o saldo formatado passar de 6 caracteres (por exemplo `112.420` ou `−12.420`), a célula usa **milhares com "k"** (`112k`, `−12k`). | Em 360 px a célula tem ~46 px; 6 caracteres mono de 12 px cabem, 7 não. |
| D11 | Com o **olho fechado**, as células mostram `•••` no lugar do saldo e a folha mostra o valor mascarado como o resto do app. | Regra global v2. |
| D12 | A **legenda** ganha o item "‹saldo› saldo em R$ no fim do dia" além de "A receber", "A pagar" e "Fora do saldo". O ‹saldo› é o **do dia selecionado** (mesmo formato das células); em dia sem saldo, o do primeiro dia que tem; em mês passado, o item não aparece. *(O desenho V10_04 usava "10.070" só como exemplo.)* | V10_04. |

## 4. Requisitos

### 4.1 Requisitos funcionais (RF)

| ID | Requisito |
| -- | --------- |
| RF-01 | A tela Previsões **não mostra** o cartão de resumo ("Saldo hoje" / "Previsto em …") (D5). |
| RF-02 | Cada dia do calendário com saldo (D3) mostra o **saldo do dia** em reais inteiros (D1, D10), em negrito nos dias com previsão e em hoje (D2). |
| RF-03 | O nome acessível da célula inclui o saldo: "20 de novembro, a receber, saldo R$ 10.070,30" (e "saldo negativo" quando for o caso, D9). |
| RF-04 | A **folha do dia** mostra o dia selecionado (padrão: hoje, ou o dia 1 em outro mês) com o título, o total que mexe no saldo, as previsões do dia e "Saldo no fim do dia" com centavos (D6). Em dia sem saldo (passado) a linha do saldo não aparece. |
| RF-05 | Tocar no título da folha abre a tela do dia; tocar numa previsão abre a edição (como hoje). |
| RF-06 | Dia sem previsões mostra na folha "Nada previsto para este dia." (ou "…para hoje.") e, se o dia tem saldo, a linha do saldo. |
| RF-07 | A folha e o botão Lançar não se sobrepõem (D7); o conteúdo do calendário continua acessível por rolagem. |
| RF-08 | O menu ⋯ da área Previsões tem "Saldo previsto" (D8), que abre `/previsoes/saldo/:mês`; em mês passado o item não aparece. |
| RF-09 | O estado vazio ("Como funciona") continua quando não há nenhuma previsão no mês, agora acima da folha; o calendário mostra o saldo normalmente. |
| RF-10 | Com o olho fechado nenhum valor em reais aparece nas células nem na folha (D11). |

### 4.2 Regras de negócio (RN)

| ID | Regra |
| -- | ----- |
| RN-01 | **Saldo do dia D** do mês M = saldo base de M (`baseBalance`, RN-08 de `previsoes.md`) + soma, com sinal, das previsões que mexem no saldo com data maior que o início da projeção e menor ou igual a D. Início da projeção: **hoje** no mês corrente; **o dia anterior ao dia 1** em mês futuro. |
| RN-02 | No mês corrente, o saldo de **hoje** é o saldo base (as previsões de hoje já entraram nele). No mês futuro, o saldo do dia 1 inclui as previsões do dia 1. |
| RN-03 | O saldo do **último dia** do mês é igual ao "Previsto" que a tela Saldo previsto mostra para o mesmo mês e ao `endBalance` de `getBalanceForecast` (sem limite de 21 dias). |
| RN-04 | Lembrete (previsão que não mexe no saldo) **não** altera o saldo do dia; "Colocar no saldo" altera a ocorrência a partir da data dela (RN-04 de `previsoes.md`). |
| RN-05 | Apagar ou editar o valor de uma previsão (com Desfazer) recalcula todos os saldos dos dias seguintes na hora. |
| RN-06 | Formatação (D1, D10): arredondar para o real mais próximo (centavos ≥ 50 sobem); `−0` aparece como `0`. A folha usa o valor exato com centavos. |
| RN-07 | Nenhuma regra de cálculo do app muda: `cashOf`, `balanceOf` e `baseBalance` ficam como estão. |

## 5. Cenários

```gherkin
# language: pt

Funcionalidade: Previsões com o saldo de cada dia

  Contexto:
    Dado que hoje é 12/11 e o saldo de hoje é R$ 8.420,30
    E as previsões que mexem no saldo: a receber R$ 1.200,00 no dia 13, a pagar R$ 350,00 no dia 16,
        a receber R$ 800,00 no dia 20, a pagar R$ 1.500,00 no dia 25, a pagar R$ 620,00 no dia 28
        e a receber R$ 3.200,00 no dia 30

  Cenário: O cartão de resumo não existe mais
    Quando eu abro "Previsões"
    Então não vejo "Saldo hoje" nem "Previsto em" no alto da tela

  Cenário: Saldo em cada dia do calendário
    Quando eu abro "Previsões" em novembro
    Então o dia 12 mostra "8.420" em negrito
    E o dia 13 mostra "9.620" em negrito
    E o dia 15 mostra "9.620" sem negrito
    E o dia 20 mostra "10.070" em negrito
    E o dia 28 mostra "7.950" em negrito
    E o dia 30 mostra "11.150" em negrito

  Cenário: Dias passados ficam sem saldo
    Então os dias 1 a 11 não mostram saldo

  Cenário: Mês futuro mostra o saldo do dia 1 ao último dia
    Dado uma previsão a pagar de R$ 500,00 no dia 10 de dezembro
    Quando eu abro dezembro
    Então todos os dias de 1 a 31 mostram saldo
    E o dia 31 mostra o saldo previsto de dezembro

  Cenário: O saldo de um mês continua no seguinte
    Quando eu abro dezembro
    Então o dia 1 de dezembro parte do saldo de 30/11 mais o que ainda estava por vir

  Cenário: Mês passado não mostra saldo
    Quando eu abro outubro
    Então nenhum dia mostra saldo

  Cenário: O último dia bate com o Saldo previsto
    Quando eu abro "Saldo previsto" de novembro
    Então o valor previsto é igual ao saldo mostrado no dia 30

  Cenário: Lembrete não muda o saldo do dia
    Dado um lembrete de R$ 300,00 a receber no dia 14
    Então o dia 14 mostra "9.620"
    E tem o ponto vazado de "Fora do saldo"

  Cenário: Colocar no saldo muda os dias seguintes
    Dado o lembrete de R$ 300,00 no dia 14
    Quando eu toco em "Colocar no saldo" no dia 14
    Então o dia 14 mostra "9.920"
    E os dias seguintes sobem R$ 300,00

  Cenário: Apagar uma previsão recalcula os dias
    Quando eu apago a previsão de R$ 1.500,00 do dia 25
    Então o dia 25 mostra "10.070"
    E aparece "Desfazer"
    Quando eu toco em "Desfazer"
    Então o dia 25 volta a mostrar "8.570"

  Cenário: A folha do dia mostra o dia e o saldo
    Quando eu toco no dia 20
    Então a folha mostra "Sexta, 20 de novembro", "+ R$ 800,00", a previsão "Venda"
    E "Saldo no fim do dia" com "R$ 10.070,30"

  Cenário: A folha começa em hoje
    Quando eu abro "Previsões" em novembro
    Então a folha mostra o dia 12 com "Saldo no fim do dia" "R$ 8.420,30"

  Cenário: Dia sem previsões
    Quando eu toco no dia 15
    Então a folha mostra "Nada previsto para este dia."
    E "Saldo no fim do dia" "R$ 9.620,30"

  Cenário: Dia passado na folha
    Quando eu toco no dia 5
    Então a folha mostra o título e "Nada previsto para este dia."
    E não mostra "Saldo no fim do dia"

  Cenário: Abrir o dia e editar pela folha
    Quando eu toco no título da folha
    Então abre a tela do dia
    E tocar numa previsão da folha abre a edição dela

  Cenário: Saldo negativo
    Dado uma previsão a pagar de R$ 9.000,00 no dia 18
    Então o dia 18 mostra "−1.200" em cor de alerta
    E o nome acessível diz "saldo negativo"

  Cenário: Saldo muito grande é abreviado
    Dado um saldo de R$ 112.420,00 num dia
    Então a célula mostra "112k"

  Cenário: O botão Lançar sobe acima da folha
    Então o botão "Lançar" está visível acima da folha do dia e não a cobre

  Cenário: Saldo previsto pelo menu
    Quando eu abro o menu ⋯ em "Previsões"
    Então vejo "Saldo previsto"
    Quando eu toco nele
    Então abre a tela Saldo previsto do mês aberto

  Cenário: Mês passado não tem Saldo previsto no menu
    Quando eu abro outubro em "Previsões" e o menu ⋯
    Então não vejo "Saldo previsto"

  Cenário: Estado vazio
    Dado nenhuma previsão
    Então vejo "Como funciona" e o calendário com o saldo de cada dia sem mudanças

  Cenário: Olho fechado
    Dado o olho fechado
    Então as células mostram "•••" e nenhum valor em reais aparece na folha
```

### 5.1 Matriz de rastreabilidade

| Requisito / regra | Cenário(s) |
| ----------------- | ---------- |
| RF-01, D5 | O cartão de resumo não existe mais |
| RF-02, D1, D2, D3, RN-01, RN-02 | Saldo em cada dia do calendário; Dias passados ficam sem saldo; Mês futuro…; O saldo de um mês continua no seguinte; Mês passado não mostra saldo |
| RN-03 | O último dia bate com o Saldo previsto |
| RN-04, D4 | Lembrete não muda o saldo do dia; Colocar no saldo muda os dias seguintes |
| RN-05 | Apagar uma previsão recalcula os dias |
| RF-03, D9 | Saldo negativo |
| RF-04, D6 | A folha do dia mostra o dia e o saldo; A folha começa em hoje; Dia passado na folha |
| RF-05 | Abrir o dia e editar pela folha |
| RF-06 | Dia sem previsões |
| RF-07, D7 | O botão Lançar sobe acima da folha |
| RF-08, D8 | Saldo previsto pelo menu; Mês passado não tem Saldo previsto no menu |
| RF-09 | Estado vazio |
| RF-10, D11 | Olho fechado |
| D10, RN-06 | Saldo muito grande é abreviado; Saldo em cada dia do calendário |
| RN-07 | todos (valores do resto do app iguais aos de antes) |

## 6. Modelo de dados e migração

**Sem mudança no formato salvo e sem migração.** Um cálculo novo na camada de dados, só leitura:

```ts
export type ForecastDayBalance = { date: string; balance: number | null; hasForecast: boolean };
// Saldo no fim de cada dia do mês aberto (RN-01); `balance` é null nos dias sem saldo (D3).
export async function getForecastDayBalances(month: MonthKey): Promise<ForecastDayBalance[]>;
```

- Reusa `baseBalance`, `forecastsOf` e `signedForecast`; **não** altera `getBalanceForecast`, que continua limitado a `days` para a tela Saldo previsto.
- Hook em `api.ts`: `useGetForecastDayBalances(month)`, com a mesma chave de invalidação das previsões (`getGetForecastsQueryKey`) para recalcular depois de criar, editar, apagar, desfazer e "Colocar no saldo".
- `getForecastSummary` e `useGetForecastSummary` **saem** (só o cartão removido os usa), com os testes que os cobriam.

## 7. Interface

- **Calendário:** 7 colunas; células de 64 px de altura (cabe 5 semanas acima da folha em 360 × 780); número do dia 15 px, pontos de 6 a 7 px e saldo em `font-mono-data` 12 px; hoje com contorno de 2 px e o dia selecionado preenchido em `ink`; os saldos seguem o texto da célula (`paper` no selecionado).
- **Legenda:** A receber, A pagar, Fora do saldo e "‹saldo do dia› saldo em R$ no fim do dia" (14 px).
- **Folha do dia:** `position: fixed` acima da barra inferior, `surface`, cantos de 24 px em cima, alça de 40 × 4 px, sombra; título em 20 px (toque de 48 px que abre o dia), total à direita, lista de previsões com o item atual (72 px), linha final "Saldo no fim do dia" (valor em 18 px, mono, com centavos; `alert` se negativo). Altura máxima 45% da tela, lista com rolagem interna.
- **Botão Lançar:** continua o do app (56 px), com `bottom` calculado para ficar 12 px acima da folha.
- **Menu ⋯:** item "Saldo previsto" (ícone de gráfico) acima de "Carrinho", só na área Previsões.
- Referência exata: V10_04 (clara e escura).

## 8. Fora de escopo

- Mudar a conta do saldo, o formato salvo ou a tela do dia, o formulário e o Saldo previsto (gráfico e lista).
- Mostrar o saldo dos dias já passados (o app não guarda esse histórico).
- Incluir lembretes no saldo, faturas de cartão, benefícios ou contas fixas como previsão.
- Tocar numa célula para arrastar a folha (a folha tem tamanho fixo).
- Mapa de calor, variação do dia na célula e gráfico dentro do calendário (alternativas descartadas).

## 9. Critérios de aceite

- [x] `npm test`, `npm run typecheck` e `npm run build` passam.
- [ ] Cada cenário da seção 5 tem teste (pendente: "Mês passado não tem Saldo previsto no menu", que o jsdom não alcança porque não se cria previsão no passado, e "Lançar acima da folha", que é layout e fica para o navegador) (`previsoes.test.tsx`, `previsao-saldo.test.tsx`, `store.test.ts` para `getForecastDayBalances`).
- [x] O saldo do último dia de um mês é igual ao "Previsto" do Saldo previsto do mesmo mês (RN-03).
- [x] O cartão de resumo, o `getForecastSummary` e seus testes foram removidos; nada mais os usa.
- [ ] Em 360 × 780: sem scroll horizontal, saldos legíveis sem cortar (`−1.250` cabe), células ≥ 48 px de toque, folha e botão Lançar sem sobreposição.
- [ ] Temas claro e escuro conferidos no navegador, com o olho fechado (`•••`) e com saldo negativo.
- [x] `FUNCIONALIDADES.md` (seção 41) e `README.md` atualizados.

## 10. Tarefas

1. `getForecastDayBalances` em `store.ts` e hook em `api.ts`; remover `getForecastSummary` e o hook.
2. Calendário com saldo, negrito, formatação (D1, D10) e nome acessível (RF-03).
3. Folha do dia (lista, saldo, rolagem interna) no lugar da lista do dia.
4. Posição do botão Lançar acima da folha.
5. Item "Saldo previsto" no menu ⋯ da área Previsões (e esconder em mês passado).
6. Remover o cartão de resumo; legenda nova; estado vazio acima da folha.
7. Testes dos cenários e ajuste dos que citam `card-forecast-summary`, `text-forecast-today`, `text-forecast-projected` e `link-balance-forecast`.
8. `FUNCIONALIDADES.md` e `README.md`.
9. Rodar `test`, `typecheck` e `build`.

## 11. Roteiro de verificação

1. `npm run dev`, janela 360 × 780, claro e escuro. Criar as previsões do contexto da seção 5 (inclusive um lembrete).
2. Conferir os saldos do calendário contra a conta manual: saldo de hoje + previsões até cada dia.
3. Abrir "Saldo previsto" pelo menu e conferir que o valor previsto é o do último dia.
4. Colocar um lembrete no saldo, apagar e desfazer uma previsão; ver os dias seguintes mudarem.
5. Navegar para dezembro e outubro; abrir sem nenhuma previsão.
6. Fechar o olho; criar um saldo negativo e um saldo acima de R$ 100.000.
7. Conferir que o botão Lançar abre o formulário "Nova previsão" e não fica atrás da folha.
