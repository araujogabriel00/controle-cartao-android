# Spec — Previsões de receber e pagar

| Campo | Valor |
| ----- | ----- |
| Status | Proposta |
| Criada em | 29/10/2026 |
| Escopo | `src/data/store.ts` (formato v11, previsões, exceções, efeito no caixa), `src/data/api.ts`, `src/App.tsx` (rotas), `src/components/app-tabs.tsx` (5.º item da barra), `src/lib/footer.ts`, novas telas `src/pages/{previsoes,previsao-dia,previsao-saldo,previsao-form}.tsx`, `src/pages/inicio.tsx` (aviso), `src/pages/entradas-lista.tsx` (linhas marcadas "Previsão"), `src/lib/format.ts` (rotas), `FUNCIONALIDADES.md`, `README.md` |
| Depende de | [`contas-e-gastos.md`](contas-e-gastos.md) (caixa do mês, contas fixas e gastos), [`entradas.md`](entradas.md) (recorrência com exceções), [`mes-compartilhado.md`](mes-compartilhado.md), [`desfazer-exclusao.md`](desfazer-exclusao.md), [`redesign-v2-fundacao.md`](redesign-v2-fundacao.md) |
| Substitui em parte | [`redesign-v2-fundacao.md`](redesign-v2-fundacao.md) D1 e RF-01: a barra inferior passa de 4 para **5 itens** (Início, Entradas, **Previsões**, Cartões, Benefícios). |
| Referência visual | Canvas "Controle do Cartão", grupo v4: V4_01 Previsões, V4_02 Nova previsão, V4_07 Nova previsão (só lembrete), V4_03 Dia da previsão, V4_04 Saldo previsto, V4_05 Aviso no Início, V4_06 Vazio; claras e escuras |

> Mudanças de comportamento entram primeiro aqui e só depois no código.

---

## 1. Contexto e objetivo

Hoje todo lançamento do app é algo que **já aconteceu** (ou uma recorrente que o app repete). Não há onde anotar "vou receber R$ 800 na terça" ou "o aluguel vence dia 5", ver isso num calendário e saber como o saldo fica depois.

**Objetivo:** uma área **Previsões** onde a pessoa cadastra o que vai **receber** ou **pagar** numa data, vê tudo num calendário com o dia selecionado, e escolhe se cada previsão **mexe no saldo** no dia. Se mexe e o dia chega, a previsão passa a valer no saldo e nas contas do mês **sozinha**; se a pessoa não quer, ela apaga. Se não mexe, é só um lembrete no calendário e a pessoa pode colocá-la no saldo com um toque. Uma tela de **Saldo previsto** mostra como o saldo evolui nas próximas semanas.

## 2. Glossário

| Termo | Significado |
| ----- | ----------- |
| Previsão | Algo que a pessoa espera **receber** ou **pagar** numa data prevista. |
| Mexe no saldo | Chave da previsão. Ligada: a partir do dia previsto ela soma no saldo. Desligada: lembrete. |
| Lembrete | Previsão com "mexe no saldo" desligado. Aparece no calendário e não altera nenhum valor. |
| Ocorrência | A previsão num mês (uma previsão que se repete tem uma por mês). |
| Entrou no saldo | Previsão que mexe no saldo e cuja data é hoje ou já passou. |

## 3. Decisões de produto

| # | Decisão | Motivo |
| - | ------- | ------ |
| D1 | **Previsões** é a 3.ª área da barra inferior (Início, Entradas, **Previsões**, Cartões, Benefícios), com ícone de calendário. Segue o mês compartilhado como as outras áreas (rota `/previsoes`). | Desenho v4; é uma área de primeiro nível, não um recurso escondido. |
| D2 | A previsão tem: tipo (**A receber** ou **A pagar**), descrição, valor, **data prevista**, chave **Mexe no saldo no dia** (padrão **ligada**) e chave **Repetir todo mês** (padrão desligada). | Campos do desenho v4; o padrão ligado segue o pedido original. |
| D3 | **Uma previsão que mexe no saldo e cuja data chegou conta sozinha**, sem virar lançamento: continua na lista de Previsões e soma no saldo e nas linhas de Entradas. **Apagar** a previsão tira o efeito na hora (com "Desfazer"). | Escolha do usuário. Mantém uma só fonte de verdade e permite corrigir "não aconteceu" apagando. |
| D4 | **A receber** que entrou no saldo soma em **Entradas**. **A pagar** que entrou no saldo soma em **Contas fixas** ou em **Gastos do dia a dia**, **à escolha da pessoa** num campo "Entra como" no formulário (padrão **Contas fixas**); o campo só aparece para "A pagar" com a chave ligada. | Escolha do usuário. |
| D5 | Antes do dia previsto, nada muda no saldo nem nas contas do mês; a previsão aparece só no calendário, na lista de Previsões e na tela Saldo previsto. | O pedido é que afete "no dia". |
| D6 | **Lembrete** (chave desligada) nunca altera valores. Na lista do dia há o botão **Colocar no saldo**, que liga a chave **só para aquela ocorrência**. | Desenho v4 (V4_03). |
| D7 | Para "A pagar" colocado no saldo a partir de um lembrete, o campo "Entra como" vale o da previsão (padrão Contas fixas). | Sem pergunta extra no toque. |
| D8 | **Repetir todo mês** cria uma previsão **sem data final**, que cai no mesmo dia de cada mês (dia 31 vai para o último dia dos meses curtos, como nas contas fixas). Apagar uma ocorrência pergunta o alcance: **só este mês** ou **deste mês em diante** (a tela de escolha de alcance que já existe). | Escolha do usuário; igual às entradas e contas fixas recorrentes. |
| D9 | **Editar valor** (botão da lista do dia) muda o valor **só daquela ocorrência**. **Editar** a previsão (tocar no item) abre o formulário completo e pergunta o alcance quando ela se repete. | Desenho v4 e consistência com as outras recorrentes. |
| D10 | A **data prevista** não pode ser anterior a hoje ao cadastrar. Hoje é permitido e a previsão entra no saldo **na hora** se a chave estiver ligada. | Previsão é futura; o que já aconteceu é lançamento. |
| D11 | **Saldo previsto** (tela) mostra o saldo de hoje e como ele evolui de hoje até 21 dias à frente, **somando só as previsões que mexem no saldo**. Não inclui faturas de cartão, contas fixas recorrentes nem benefícios. | Desenho v4 (V4_04: "Conta só as previsões que mexem no saldo"). |
| D12 | O **Início** mostra um aviso "Hoje entraram N previsões no saldo" com os botões **Revisar** (abre o dia) e **Está certo** (dispensa o aviso até aparecer algo novo). | Desenho v4 (V4_05): nada entra no saldo sem a pessoa saber. |
| D13 | Nas listas de Entradas (Entradas, Contas fixas, Gastos do dia a dia), as previsões que entraram no saldo aparecem com a marca **Previsão**; tocar abre o dia delas em Previsões. | Cada valor do resumo precisa ter uma linha que o explique. |
| D14 | Na área Previsões, o botão flutuante diz **"Nova previsão"** e abre o formulário; nas outras áreas continua "Lançar". | O botão deve fazer o que a área é. |
| D15 | Exclusão usa o **Desfazer** (spec `desfazer-exclusao.md`): sem diálogo, aviso de 6 segundos. A escolha de alcance de recorrente continua. | Consistência com o resto do app. |

## 4. Requisitos

### 4.1 Requisitos funcionais (RF)

| ID | Requisito |
| -- | --------- |
| RF-01 | A barra inferior tem 5 itens com "Previsões" em 3.º lugar; a rota `/previsoes` abre a área no mês aberto. |
| RF-02 | A tela Previsões mostra: o cartão de resumo ("Saldo hoje" e "Previsto em ‹último dia do mês›"), o calendário do mês aberto, a legenda (A receber, A pagar, Fora do saldo) e a lista do dia selecionado (padrão: hoje, ou o dia 1 em outro mês). |
| RF-03 | O calendário marca cada dia com pontos: azul para a receber, laranja para a pagar e contorno para lembrete; o dia de hoje tem contorno e o dia selecionado fica preenchido. Cada dia é um botão de 48 px com nome acessível ("27 de outubro, a receber, a pagar, hoje"). |
| RF-04 | A lista do dia mostra, para cada ocorrência: ícone de tipo, descrição, "A receber"/"A pagar", valor com sinal e uma etiqueta de estado: **No saldo** (mexe e o dia chegou), **Fora do saldo** (lembrete) ou **Previsto** (mexe, mas o dia ainda não chegou). O título do dia mostra o total que mexe no saldo. |
| RF-05 | **Nova previsão** abre o formulário (tela cheia, com ✕) com tipo, descrição, valor, data prevista, "Mexe no saldo no dia", "Entra como" (só A pagar ligado), "Repetir todo mês" e o botão fixo "Salvar previsão". O texto de ajuda muda com a chave. |
| RF-06 | Tocar numa previsão da lista abre o formulário de edição dela. Previsão que se repete pergunta o alcance ao salvar. |
| RF-07 | Na tela do dia (rota própria, aberta ao tocar no título do dia ou pelo aviso do Início), as ocorrências têm os botões **Editar valor**, **Apagar** e, nos lembretes, **Colocar no saldo**. No topo, se algo entrou no saldo hoje: "N previsões entraram no saldo hoje. Apague as que não aconteceram.", citando os lembretes. |
| RF-08 | **Apagar** remove a ocorrência (ou, com alcance, a previsão daqui em diante), mostra o aviso com "Desfazer" e atualiza saldo e contas. |
| RF-09 | **Saldo previsto** abre a partir do cartão de resumo e mostra o saldo previsto no fim do período ("Saldo previsto em ‹data›"), a diferença em relação a hoje, um gráfico de hoje a +21 dias e a lista "Próximas previsões". |
| RF-10 | O **Início** mostra o aviso de D12 quando há previsões que entraram no saldo desde a última vez em que a pessoa tocou "Está certo". |
| RF-11 | Sem nenhuma previsão no mês aberto, a tela mostra o calendário vazio, "Nada previsto para hoje." e o bloco "Como funciona" com 3 passos e o botão "Nova previsão". |
| RF-12 | As setas do mês navegam entre meses (ver RN-10). |
| RF-13 | Com o olho fechado, todos os valores e o gráfico seguem a regra do olho (R$ ••••, faixa neutra). |

### 4.2 Regras de negócio (RN)

| ID | Regra |
| -- | ----- |
| RN-01 | **Efeito no caixa.** Para cada mês, a ocorrência de uma previsão soma no caixa do mês quando **mexe no saldo** (padrão da previsão, ou "colocada no saldo" na ocorrência) **e** sua data é **menor ou igual a hoje**: "A receber" em `incomeAmount`; "A pagar" em `billsAmount` ou `dailyAmount` conforme "Entra como". Saldo anterior, resultado e saldo do mês seguem a fórmula de sempre. |
| RN-02 | Ocorrência com data posterior a hoje não entra no caixa de nenhum mês, nem no mês corrente nem nos futuros. Quando o dia chega, passa a entrar sem nenhuma ação. |
| RN-03 | Ocorrência apagada (só este mês, ou deste mês em diante) não entra no caixa e não aparece em nenhuma lista. |
| RN-04 | Lembrete não entra no caixa. "Colocar no saldo" acrescenta à ocorrência a marca "no saldo" e ela passa a seguir RN-01 e RN-02 (se a data já chegou, entra na hora). |
| RN-05 | Valor de uma ocorrência editada com "Editar valor" vale só para aquele mês; o da previsão continua para os outros. |
| RN-06 | Recorrência: a previsão existe desde o mês da data inicial, sem fim, no mesmo dia de cada mês (dia 29 a 31 vai para o último dia dos meses curtos). Apagar "deste mês em diante" encerra a previsão no mês anterior; se for o mês inicial, apaga a previsão toda. |
| RN-07 | Validação: descrição de 1 a 120 caracteres; valor maior que zero; data válida e, ao cadastrar, não anterior a hoje (D10). Erros aparecem no formulário. |
| RN-08 | **Saldo previsto em uma data D** (D ≥ hoje) = saldo de hoje + soma das ocorrências que mexem no saldo com data maior que hoje e menor ou igual a D, "A receber" com sinal "+" e "A pagar" com sinal "−". O saldo de hoje é o `balanceAmount` do mês corrente. |
| RN-09 | O "Previsto em ‹último dia do mês›" do cartão de resumo usa RN-08 com D = último dia do mês aberto (mês corrente) ou do mês seguinte, se o mês aberto já passou do mês corrente em diante; em mês passado, mostra "—". |
| RN-10 | Limite de meses: do mês mais antigo com previsão (ou o corrente, se não houver) até **24 meses** à frente do corrente. Fora do intervalo vai para o mais próximo, como as outras áreas. |
| RN-11 | O aviso do Início (D12) lista as previsões que entraram no saldo com data posterior à marca de "Está certo" e menor ou igual a hoje; a marca é a data em que a pessoa tocou "Está certo" e fica em `Preferences` (`controle-cartao:forecast-ack`), fora do estado do app. Falha ao ler a marca: o aviso aparece. |
| RN-12 | O Desfazer cobre apagar ocorrência e apagar daqui em diante (as listas `forecasts` e `forecastExceptions` entram no remendo reverso). |
| RN-13 | Nenhuma previsão altera cartões, compras, benefícios, entradas ou contas fixas **cadastradas**: o efeito é só somado no cálculo do caixa (RN-01). |
| RN-14 | `data-testid`: `tab-forecasts`, `card-forecast-summary`, `calendar-forecasts`, `day-AAAA-MM-DD`, `list-forecasts`, `row-forecast-ID`, `chip-forecast-state`, `button-new-forecast`, `form-forecast`, `switch-affects`, `select-pay-as`, `switch-repeat`, `button-save-forecast`, `button-put-in-balance`, `button-edit-amount`, `button-delete-forecast`, `banner-forecast-today`, `link-balance-forecast`, `chart-balance-forecast`, `card-home-forecast-alert`, `button-review`, `button-ack`. |
| RN-15 | Texto de no mínimo 14 px (12 px só em eixos), alvos de 48 px, nada depende só de cor (etiquetas e ícones dizem o estado), contraste de 4,5:1 nos dois temas. |
| RN-16 | Se a leitura das previsões falhar, a tela mostra o aviso de erro com "Tentar de novo", e o saldo e as contas do resto do app continuam mostrando os valores sem previsões. |

## 5. Cenários

```gherkin
# language: pt

Funcionalidade: Previsões de receber e pagar

  Contexto:
    Dado que hoje é 27 de outubro de 2026

  Cenário: Cadastrar uma previsão que mexe no saldo
    Quando eu crio "Salário", "A receber", R$ 4.527,00, dia 05/11/2026, com "Mexe no saldo" ligado
    Então ela aparece no calendário em 5 de novembro com a etiqueta "Previsto"
    E o saldo de hoje não muda

  Cenário: O dia chega e a previsão entra sozinha
    Dado a previsão "Venda do notebook", "A receber", R$ 800,00, para hoje, ligada
    Então ela aparece com a etiqueta "No saldo"
    E o saldo e a linha "Entradas" do mês incluem R$ 800,00

  Cenário: A pagar entra como conta fixa
    Dado a previsão "Internet", "A pagar", R$ 119,90, para hoje, ligada, "Entra como" Contas fixas
    Então "Contas fixas" do mês inclui R$ 119,90
    E "Gastos do dia a dia" não muda

  Cenário: A pagar entra como gasto do dia a dia
    Dado a previsão "Mercado", "A pagar", R$ 80,00, para hoje, ligada, "Entra como" Gastos do dia a dia
    Então "Gastos do dia a dia" do mês inclui R$ 80,00
    E "Contas fixas" não muda

  Cenário: Apagar uma previsão que não aconteceu
    Dado que "Internet" entrou no saldo hoje
    Quando eu apago "Internet"
    Então o saldo volta ao valor de antes
    E aparece o aviso "Desfazer"

  Cenário: Lembrete não mexe no saldo
    Dado a previsão "Reembolso", "A receber", R$ 300,00, para hoje, com "Mexe no saldo" desligado
    Então ela aparece com a etiqueta "Fora do saldo"
    E o saldo não muda

  Cenário: Colocar um lembrete no saldo
    Dado o lembrete "Reembolso" de hoje
    Quando eu toco em "Colocar no saldo"
    Então a etiqueta passa a "No saldo" e o saldo soma R$ 300,00
    E os lembretes de outros dias não mudam

  Cenário: Previsão futura não afeta o mês corrente
    Dado a previsão "Aluguel", "A pagar", R$ 1.500,00, para 30/10, ligada
    Então o saldo de hoje não muda
    E "Previsto em 31/out" mostra o saldo de hoje menos R$ 1.500,00

  Cenário: Repetir todo mês
    Dado a previsão "Salário" de 05/11 com "Repetir todo mês"
    Então ela aparece em 5 de novembro, 5 de dezembro e nos meses seguintes
    Quando eu apago a de dezembro e escolho "Deste mês em diante"
    Então novembro continua e dezembro em diante some

  Cenário: Editar o valor de uma ocorrência
    Dado a previsão recorrente "Aluguel" de R$ 1.500,00
    Quando eu uso "Editar valor" em dezembro e digito R$ 1.600,00
    Então dezembro mostra R$ 1.600,00
    E novembro e janeiro continuam com R$ 1.500,00

  Cenário: Data no passado
    Quando eu tento criar uma previsão com data de ontem
    Então vejo o erro no formulário e nada é salvo

  Cenário: Saldo previsto
    Dado as previsões ligadas "Aluguel" −R$ 1.500,00 em 30/10 e "Salário" +R$ 4.527,00 em 05/11
    Quando eu abro "Saldo previsto"
    Então vejo o saldo previsto em 10/11 igual ao de hoje + R$ 3.027,00
    E o gráfico não inclui lembretes nem faturas

  Cenário: Aviso no Início
    Dado que 2 previsões entraram no saldo hoje
    Quando eu abro o Início
    Então vejo "Hoje entraram 2 previsões no saldo" com "Revisar" e "Está certo"
    Quando eu toco em "Está certo"
    Então o aviso some e não volta até entrar outra previsão

  Cenário: Marca nas listas de Entradas
    Dado que "Internet" entrou no saldo hoje como conta fixa
    Quando eu abro a lista "Contas fixas"
    Então a linha "Internet" aparece com a marca "Previsão"
    E tocar nela abre o dia 27 de outubro em Previsões

  Cenário: Estado vazio
    Dado que não há previsões
    Quando eu abro Previsões
    Então vejo "Nada previsto para hoje." e os 3 passos de "Como funciona"

  Cenário: Valores escondidos
    Quando eu toco no olho
    Então os valores de Previsões aparecem como "R$ ••••" e o gráfico vira uma faixa neutra

  Cenário: Falha ao ler as previsões
    Dado que a leitura das previsões falha
    Quando eu abro Previsões
    Então vejo o aviso de erro com "Tentar de novo"
    E o saldo do Início não inclui previsões
```

| Requisito | Cenário |
| --------- | ------- |
| RF-01, D1 | Verificação manual: barra de 5 itens |
| RF-02, RF-03, RF-04, RF-05, D2, D5 | Cadastrar uma previsão que mexe no saldo |
| RN-01, RN-02, D3 | O dia chega e a previsão entra sozinha; Previsão futura não afeta o mês corrente |
| D4, D7 | A pagar entra como conta fixa; A pagar entra como gasto do dia a dia |
| RF-08, RN-03, RN-12, D15 | Apagar uma previsão que não aconteceu |
| D6, RN-04, RF-07 | Lembrete não mexe no saldo; Colocar um lembrete no saldo |
| D8, RN-06, RF-06 | Repetir todo mês |
| D9, RN-05 | Editar o valor de uma ocorrência |
| D10, RN-07 | Data no passado |
| RF-09, D11, RN-08, RN-09 | Saldo previsto; Previsão futura não afeta o mês corrente |
| RF-10, D12, RN-11 | Aviso no Início |
| D13 | Marca nas listas de Entradas |
| RF-11 | Estado vazio |
| RF-13 | Valores escondidos |
| RN-16 | Falha ao ler as previsões |
| RN-10, RN-13, RN-14, RN-15 | Verificação manual e por busca no roteiro |

## 6. Modelo de dados e migração

Novo formato salvo **versão 11** (hoje 10). Duas listas novas no estado:

```ts
type ForecastKind = 'receive' | 'pay';
type StoredForecast = {
  id: number;
  kind: ForecastKind;
  description: string;
  amount: number;
  firstMonth: MonthKey;
  day: number;                       // 1 a 31; ajustado nos meses curtos
  affects: boolean;                  // "mexe no saldo no dia"
  payAs: 'bill' | 'daily' | null;    // só quando kind = 'pay' e affects = true
  recurring: boolean;
  lastMonth: MonthKey | null;        // fim da repetição (null = sem fim)
};
type StoredForecastException = {
  forecastId: number; month: MonthKey;
  skip: boolean;                     // ocorrência apagada
  amount?: number;                   // "Editar valor"
  putInBalance?: boolean;            // "Colocar no saldo" (só lembrete)
};
```

- **Migração v10 → v11:** acrescenta `forecasts: []` e `forecastExceptions: []`; nada mais muda. `emptyState` e o carregamento aceitam v10 e migram, como nas versões anteriores.
- **Efeito no caixa:** `cashOf(state, month)` passa a somar as ocorrências de RN-01 em `incomeAmount`, `billsAmount` e `dailyAmount`. A função que lista as ocorrências do mês (como `billsOf`) também alimenta as listas de D13 com a marca `forecast: true`.
- **Leituras novas** (`store.ts`, com hooks em `api.ts`): `getForecasts(month)` (ocorrências do mês com estado), `getForecastDay(date)`, `getForecastSummary()` (saldo hoje, previsto no fim do mês), `getBalanceForecast(days)` (série diária de hoje a +21), `getForecastRange()` (RN-10), `getForecastAlerts(since)` (aviso do Início).
- **Escritas novas:** `createForecast`, `updateForecast(id, month, scope)`, `deleteForecast(id, month, scope)`, `setForecastAmount(id, month, amount)`, `putForecastInBalance(id, month)`. As exclusões entram no remendo reverso do Desfazer (RN-12).
- **Chave em `Preferences`** (fora do estado): `controle-cartao:forecast-ack` = data (AAAA-MM-DD) do último "Está certo".

## 7. Interface

- **Barra inferior:** 5 itens iguais, ícone de calendário em "Previsões"; rótulos de 12 px sempre visíveis.
- **Cartão de resumo:** duas colunas ("Saldo hoje — só o que entra no saldo" e "Previsto em ‹data› — ± R$ …"); tocar abre Saldo previsto.
- **Calendário:** 7 colunas, células de 48 px, hoje com contorno de 2 px, selecionado preenchido em `ink`, pontos de 6 px (azul `chart-in`, laranja `chart-out`, contorno para lembrete); legenda abaixo.
- **Etiquetas:** "No saldo" (ícone de check), "Fora do saldo" (ícone de sino), "Previsto" (ícone de calendário), 14 px.
- **Formulário:** campos com rótulo acima e ajuda abaixo, botão "Salvar previsão" fixo; o texto de ajuda da chave diz o que acontece ("Entra no saldo sozinha. No dia 05/11 esta previsão passa a valer. Se não acontecer, apague." / "Só um lembrete. Aparece no calendário, mas não muda o saldo. Se acontecer, toque em Colocar no saldo.").
- **Saldo previsto:** valor grande, diferença para hoje, gráfico de linha (real/previsto), nota "Conta só as previsões que mexem no saldo. Lembretes ficam de fora." e "Próximas previsões".
- **Aviso no Início:** cartão com contorno `brand`, lista das previsões que entraram, e os botões "Revisar" e "Está certo" (48 px).
- Referência exata de medidas e cores: V4_01 a V4_07 do canvas.

## 8. Fora de escopo

- Notificações do sistema no dia da previsão.
- Previsões de valor variável, parcelas de previsão ou intervalos que não sejam "todo mês".
- Incluir faturas de cartão, contas fixas recorrentes, benefícios ou compras parceladas no Saldo previsto.
- Transformar uma previsão em lançamento de verdade (continua só contando no caixa, D3).
- Anexos, categorias e busca nas previsões.
- Mexer na tela "Resumo do mês" além do que o efeito no caixa já traz.

## 9. Critérios de aceite

- [ ] `npm run typecheck` e `npm run build` passam.
- [ ] Dados salvos na v10 abrem sem perda e passam a v11; nada do que existia muda de valor.
- [ ] Previsão ligada de hoje entra no saldo e nas linhas certas de Entradas (receber → Entradas; pagar → Contas fixas ou Gastos do dia a dia, conforme "Entra como"); a de dia futuro não altera nada até o dia.
- [ ] Lembrete não altera valores; "Colocar no saldo" só vale para a ocorrência.
- [ ] Apagar e Desfazer restauram saldo, contas e a previsão; apagar "deste mês em diante" encerra a recorrência.
- [ ] Repetir todo mês cria as ocorrências sem fim; "Editar valor" muda só a ocorrência.
- [ ] Saldo previsto confere com a conta de RN-08, sem lembretes.
- [ ] Aviso no Início aparece quando algo entra, e "Está certo" o dispensa.
- [ ] Listas de Entradas mostram as previsões que entraram, com a marca "Previsão", e a soma delas bate com o Resumo do mês.
- [ ] Barra de 5 itens, rotas e mês compartilhado funcionam; Início continua indo a `/`.
- [ ] Temas claro e escuro, olho fechado e leitor de tela conforme RN-14 e RN-15; sem scroll horizontal em 360 px.
- [ ] `FUNCIONALIDADES.md` (nova seção, e ajuste das seções de barra inferior, Entradas e do Início) e `README.md` atualizados.

## 10. Tarefas

1. Formato v11: tipos, `emptyState`, migração v10 → v11 em `store.ts`.
2. Ocorrências de previsão (como `billOccurrenceOf`), regras RN-01 a RN-06 e efeito em `cashOf`; marca `forecast` nas ocorrências das listas.
3. Escritas (`createForecast`, `updateForecast`, `deleteForecast`, `setForecastAmount`, `putForecastInBalance`) com validação RN-07 e remendo reverso do Desfazer.
4. Leituras (`getForecasts`, `getForecastDay`, `getForecastSummary`, `getBalanceForecast`, `getForecastRange`, `getForecastAlerts`) e hooks em `api.ts`.
5. Rotas e barra de 5 itens (`/previsoes`, `/previsoes/mes/:month`, `/previsoes/dia/:date`, `/previsoes/saldo`, `/previsoes/nova`, `/previsoes/editar/:id/:month`), `hasFooter` e botão "Nova previsão".
6. Tela Previsões (resumo, calendário, legenda, lista do dia, estado vazio).
7. Formulário de previsão (tipo, campos, chaves, "Entra como", alcance).
8. Tela do dia (aviso, "Editar valor", "Apagar", "Colocar no saldo") e tela Saldo previsto (gráfico, lista).
9. Aviso no Início e marca `forecast-ack` em `Preferences`.
10. Marca "Previsão" nas listas de Entradas e link para o dia.
11. `FUNCIONALIDADES.md` e `README.md`.
12. Rodar `typecheck` e `build`.

## 11. Roteiro de verificação

1. `npm run dev`, 390 px, nos temas claro e escuro. Dados de teste: um salário recorrente, uma conta fixa e um cartão.
2. Criar as previsões dos cenários (a receber, a pagar nas duas opções de "Entra como", lembrete, recorrente) com data de hoje e de dias à frente.
3. Comparar saldo, resultado e as linhas de Entradas antes e depois de cada previsão do dia; conferir o Resumo do mês e as listas.
4. Para ver o "dia que chega": criar previsões para amanhã, mudar a data do aparelho para amanhã e reabrir o app (ou exercitar `getForecastDay` em `src/data/store.ts`); conferir o aviso do Início.
5. Apagar e desfazer (ocorrência e "deste mês em diante"); "Editar valor"; "Colocar no saldo".
6. Abrir um app com dados da v10 e conferir que nada mudou.
7. Fechar o olho; testar leitor de tela no calendário; simular erro na leitura das previsões.
