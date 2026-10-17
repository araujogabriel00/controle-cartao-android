# Spec — Benefícios

| Campo | Valor |
| ----- | ----- |
| Status | Implementada |
| Criada em | 17/10/2026 |
| Escopo | `src/data/store.ts`, `src/data/api.ts`, `src/App.tsx`, `src/pages/beneficios.tsx` (novo), `src/components/categories-dialog.tsx` (novo, extraído de `dashboard.tsx`), `src/components/app-tabs.tsx`, `src/pages/dashboard.tsx`, `FUNCIONALIDADES.md`, `README.md` |
| Depende de | [`compras-e-categorias.md`](compras-e-categorias.md) (categorias globais), [`entradas.md`](entradas.md) (rotas por mês e barra de abas) |

> Esta spec é a fonte da verdade da funcionalidade. A implementação segue a seção [Tarefas](#11-tarefas) e só termina quando todos os [Critérios de aceite](#10-critérios-de-aceite) forem atendidos. Mudanças de comportamento entram primeiro aqui e só depois no código.

---

## 1. Contexto e objetivo

Quando a aba Cartões deixou de ter categorias-envelope com orçamento ([`compras-e-categorias.md`](compras-e-categorias.md)), o conceito de **saldo reservado para um fim** ficou sem lugar no app. Ele serve bem a **benefícios** como vale-refeição e vale-alimentação: um valor que entra todo mês, é gasto à parte e cuja sobra fica para o mês seguinte.

**Objetivo:**

1. Cadastrar **benefícios**, cada um com um valor mensal que se repete.
2. Registrar **gastos** de cada benefício, com categoria opcional.
3. Ver, por mês, o crédito, a sobra do mês anterior, o gasto e o **disponível** de cada benefício.
4. Manter tudo **independente dos cartões**: um gasto de benefício não usa o limite de cartão, e uma compra no cartão não abate o saldo de benefício.
5. **Dividir o valor do benefício por categoria**, como eram os envelopes: cada categoria reserva uma parte do crédito mensal e tem a sua própria sobra.

## 2. Glossário

| Termo | Definição |
| ----- | --------- |
| **Benefício** | Um saldo mensal com nome (ex.: "VR"): valor mensal, mês inicial e mês final opcional. |
| **Período ativo** | Os meses de `mêsInicial` até `mêsFinal` (ou sem fim). Fora dele, o benefício não aparece. |
| **Valor vigente** | O valor mensal que vale num mês. Muda quando o valor é alterado "daqui em diante". |
| **Crédito do mês** | O valor vigente, creditado em cada mês do período ativo. |
| **Sobra anterior** | O que sobrou até o mês anterior: créditos − gastos de todos os meses antes do mês visto. |
| **Gasto** | Um gasto avulso do benefício: descrição, valor, data e categoria opcional. |
| **Disponível** | Sobra anterior + crédito do mês − gasto do mês. Pode ficar negativo. |
| **Divisão** | A parte do valor mensal reservada para cada categoria (ex.: Mercado R$ 500,00, Lazer R$ 200,00). Tem histórico, como o valor mensal. |
| **Categoria fechada** | Categoria que deixou de receber gastos num benefício, a partir de um mês. A sobra dela é liberada para "Sem categoria". |
| **Restante** | O que o valor mensal tem a mais que a soma da divisão. Aparece como a linha "Sem categoria". |

Os termos de mês seguem [`historico-mensal.md`](historico-mensal.md#2-glossário), e as categorias, [`compras-e-categorias.md`](compras-e-categorias.md#2-glossário).

## 3. Decisões de produto

| # | Decisão | Motivo |
| - | ------- | ------ |
| D1 | **Benefícios são independentes dos cartões.** Nada de um lado entra nos cálculos do outro. | Escolha do usuário. |
| D2 | **O valor mensal se repete todo mês e a sobra acumula** para o mês seguinte. | Escolha do usuário. |
| D3 | **O gasto é avulso** (descrição, valor, data) **com categoria global opcional.** | Escolha do usuário. A categoria é a mesma lista usada nas compras dos cartões. |
| D4 | **O valor mensal tem histórico.** Mudar o valor "a partir de um mês" vale daquele mês em diante, sem mexer no passado. | Um reajuste de VR não pode reescrever os saldos antigos. |
| D5 | **O disponível pode ficar negativo.** Não se bloqueia um gasto acima do saldo. | Mesma regra do limite do cartão (`compras-e-categorias.md`, D3). |
| D6 | **O mês inicial não muda depois de criado.** O mês final pode ser definido ou removido. | Evita recalcular uma sobra que já vinha de meses anteriores. |
| D7 | **Aba própria "Benefícios", depois de "Cartões".** Ordem: Entradas, Cartões, Benefícios. | Escolha do usuário: o conceito sai da aba Cartões. |
| D8 | **Gastos só aceitam datas dentro do período ativo.** Datas em mês futuro dentro do período são permitidas. | Sem isso a sobra teria de existir antes do benefício ou depois do fim. |
| D9 | **Excluir um benefício apaga os gastos dele**, com confirmação que diz quantos são. | O saldo sem benefício não tem sentido. |
| D10 | **Navegação de mês:** do mês do benefício mais antigo (nunca depois do mês corrente) até 12 meses à frente. Sem nenhum benefício, só o mês corrente abre. | Mesma regra das entradas (`entradas.md`, D9). |
| D11 | **A gestão de categorias fica num diálogo compartilhado**, aberto também na aba Benefícios. | O gasto de benefício usa as mesmas categorias. |
| D12 | **Migração v6 → v7 automática**, só acrescenta listas vazias. | Ninguém perde dados. |
| D13 | **Um benefício pode ser dividido por categoria**, usando a lista global. Em cada benefício, a pessoa escolhe quais categorias usar e quanto reservar para cada uma. | Escolha do usuário: era o jeito dos envelopes antigos. |
| D14 | **A divisão se repete todo mês e tem histórico**: mudar "a partir de um mês" vale dali em diante, sem mexer no passado. | Escolha do usuário. Mesmo comportamento do valor mensal (D4). |
| D15 | **Cada categoria da divisão tem a sua sobra acumulada** para o mês seguinte, e o restante ("Sem categoria") também. | Escolha do usuário. A soma das linhas é sempre o disponível do benefício. |
| D16 | **A divisão é livre:** a soma pode ser menor que o valor do benefício (o resto vira "Sem categoria"), nunca maior. O gasto continua com categoria opcional e pode passar da parte da categoria, que fica negativa. | Escolha do usuário. Segue o D5. |
| D17 | **Um benefício sem divisão continua como está**: um só saldo, sem linhas por categoria. | Quem não quer dividir não paga o custo. |
| D18 | **Dá para fechar uma categoria dentro de um benefício**, a partir do mês aberto. Fechar **libera a sobra** da categoria para "Sem categoria" naquele mês, congela a linha dela e bloqueia novos gastos e alterações nela, como nos envelopes antigos. | Escolha do usuário. |
| D19 | **Dá para reabrir** a categoria a partir de um mês. Ela volta a receber o crédito da divisão desse mês em diante, com sobra zero. | O fechamento não pode ser um beco sem saída. |

## 4. Requisitos

### 4.1 Requisitos funcionais (RF)

| ID | Requisito |
| -- | --------- |
| RF-01 | A barra de abas passa a ter **Entradas, Cartões e Benefícios**, nessa ordem. |
| RF-02 | A tela **Benefícios** (`#/beneficios`) mostra o mês corrente, com navegação de mês (anterior/próximo), a faixa **"Disponível em todos os benefícios"** (soma dos disponíveis) e um cartão para cada benefício ativo no mês. |
| RF-03 | O cartão de um benefício mostra o nome, o selo "Mensal", **Crédito do mês**, **Sobra anterior**, **Gasto** e **Disponível**, e uma barra de quanto do (sobra + crédito) já foi gasto. |
| RF-04 | **"Novo benefício"** abre o diálogo com nome, valor mensal, mês inicial (padrão: o mês aberto) e mês final opcional. |
| RF-05 | **Editar** um benefício abre o diálogo com nome, valor mensal, **"Vale a partir de"** (padrão: o mês aberto) e mês final opcional. O mês inicial aparece, mas não pode ser alterado. |
| RF-06 | **Excluir** um benefício pede confirmação: "Remover o benefício “‹nome›” e seus ‹n› gastos? Esta ação não pode ser desfeita." (sem a parte dos gastos se não houver). |
| RF-07 | **"Registrar gasto"**, no cartão do benefício, abre o diálogo com descrição, valor, categoria (opcional, padrão "Sem categoria") e data (padrão: hoje, se estiver no mês aberto; senão, o dia 1º do mês aberto). |
| RF-08 | Cada cartão lista os **gastos do mês**, do mais recente para o mais antigo: descrição, categoria, data e valor, com editar e excluir. |
| RF-09 | O botão **"Categorias"** da tela abre o mesmo diálogo de categorias da aba Cartões (criar, renomear, excluir). |
| RF-10 | Sem nenhum benefício, a tela mostra "Nenhum benefício ainda." e o botão "Novo benefício". Um benefício sem gastos no mês mostra "Sem gastos neste mês." |
| RF-11 | Os diálogos de criar e de editar benefício ganham a seção **"Dividir por categoria"**: uma linha por categoria (seletor da lista global e valor), "Adicionar categoria", remover linha, e a conta "Sem categoria: R$ ‹restante›". Na edição, o "Vale a partir de" vale para o valor e para a divisão. |
| RF-12 | Com divisão, o cartão do benefício mostra, abaixo dos quatro valores, a lista **"Por categoria"**: para cada linha, o nome, o disponível, "crédito + sobra" e o gasto, com a barra de quanto já foi gasto. A linha "Sem categoria" traz o restante e os gastos sem categoria. |
| RF-13 | No diálogo de gasto, a categoria escolhida abate a linha dela. Sem divisão (D17), nada muda em relação ao RF-07. |
| RF-14 | Cada linha de categoria da lista "Por categoria" tem **"Fechar"**. A linha fechada mostra o selo **"Fechada"**, o valor **"Liberado"** no mês em que foi fechada, e **"Reabrir"**. A linha "Sem categoria" não fecha. |
| RF-15 | **Fechar** pede confirmação: "Fechar “‹categoria›” em ‹benefício›? ‹valor› que sobram vão para “Sem categoria”." (sem a parte do valor se a sobra for zero). |

### 4.2 Regras de negócio (RN)

| ID | Regra |
| -- | ----- |
| RN-01 | **Período ativo (D6, D8):** o benefício aparece nos meses de `mêsInicial` até `mêsFinal` inclusive, ou sem fim se não houver `mêsFinal`. |
| RN-02 | **Valor vigente (D4):** o valor da entrada do histórico com o maior `a partir de` que seja ≤ o mês. A primeira entrada começa no mês inicial. |
| RN-03 | **Crédito do mês:** o valor vigente, se o mês está no período ativo; senão, 0. |
| RN-04 | **Sobra anterior:** soma dos créditos dos meses ativos anteriores ao mês − soma dos gastos com data em meses anteriores ao mês. No mês inicial é 0. |
| RN-05 | **Disponível:** sobra anterior + crédito do mês − gasto do mês (soma dos gastos com data no mês). Em centavos, sem arredondar. |
| RN-06 | **Validação do benefício:** nome obrigatório, até 120 caracteres, único ignorando maiúsculas, minúsculas e espaços ("Já existe um benefício com esse nome."); valor mensal ≥ R$ 0,01; mês final igual ou posterior ao inicial ("O mês final deve ser igual ou posterior ao mês inicial."). |
| RN-07 | **Validação do gasto:** descrição obrigatória, até 200 caracteres; valor ≥ R$ 0,01; data válida; categoria, se informada, precisa existir; a data precisa estar no período ativo ("A data deve estar dentro do período do benefício."). |
| RN-08 | **Editar valor (D4):** com "Vale a partir de" = M e valor novo, a entrada de M é criada ou substituída, e as entradas posteriores a M são removidas. M não pode ser antes do mês inicial ("O valor não pode valer antes do mês inicial do benefício."). Se o valor vigente em M já é o informado, nada é gravado no histórico. |
| RN-09 | **Editar mês final:** definir ou remover. Se existir gasto com data depois do novo mês final, falha com "Há gastos depois do mês final." |
| RN-10 | **Excluir benefício (D9):** remove o benefício e todos os gastos dele. |
| RN-11 | **Excluir categoria:** complementa `compras-e-categorias.md`, RN-06: os gastos de benefício que usam a categoria passam a `categoryId: null`, e a contagem mostrada no diálogo de categorias soma esses gastos. |
| RN-12 | **Navegação (D10):** meses fora do intervalo [mês do benefício mais antigo ou o corrente, o que vier antes; mês corrente + 12] voltam para `#/beneficios`. Sem benefícios, só o mês corrente abre. |
| RN-13 | **Isolamento (D1):** criar, editar ou excluir benefícios e gastos não muda nenhum valor de cartão, de compra ou de entrada. Excluir um cartão não afeta benefícios. |
| RN-14 | A **migração** v6 → v7 é automática, acontece uma vez e não perde dados (D12). Como a v7 ainda não foi liberada, a divisão entra nela sem nova versão. |
| RN-15 | **Divisão (D13, D14):** é uma lista de entradas `a partir de` → itens (categoria, valor). Cada categoria aparece uma vez por entrada, existe na lista global e tem valor ≥ R$ 0,01. A divisão vigente num mês é a da entrada de maior `a partir de` ≤ o mês; uma entrada com lista vazia significa "sem divisão". |
| RN-16 | **Validação da divisão:** em todo mês em que o valor ou a divisão mudam, a soma da divisão vigente não pode passar do valor mensal vigente ("A divisão passa do valor mensal do benefício."). Vale ao criar e ao editar, inclusive quando só o valor é reduzido. |
| RN-17 | **Linhas por categoria (D15):** para uma categoria *c*: crédito do mês = o valor dela na divisão vigente (0 se não estiver nela); sobra anterior = créditos dos meses ativos anteriores − gastos de *c* antes do mês; disponível = sobra + crédito − gasto de *c* no mês. A linha **"Sem categoria"** tem crédito = valor mensal − soma da divisão, e os gastos sem categoria. A soma dos disponíveis das linhas é igual ao disponível do benefício (RN-05). |
| RN-18 | **Quais linhas aparecem:** só se o benefício tem alguma entrada de divisão com itens em mês ≤ o mês visto. Aparecem as categorias da divisão vigente e as que ainda têm sobra ou gasto, mais "Sem categoria". Gastar numa categoria fora da divisão (D16) cria a linha dela, negativa. |
| RN-19 | **Editar com "Vale a partir de" (D14):** o valor e a divisão são comparados, cada um, com o vigente naquele mês; só o que mudou grava uma entrada nova, e as entradas posteriores *desse mesmo item* são removidas (como na RN-08). |
| RN-20 | **Excluir categoria:** complementa a RN-11: a categoria sai de todas as divisões (a parte dela volta para "Sem categoria") e os gastos dela passam a sem categoria. |
| RN-21 | **Fechar em M (D18):** a categoria precisa existir e não estar fechada em M; não pode haver gasto dela em mês depois de M neste benefício ("Há gastos desta categoria depois de ‹mês›. Exclua-os antes de fechar."); e não pode haver fechamento dela começando depois de M. O fechamento vale de M em diante, sem mês final, até ser reaberto. |
| RN-22 | **Efeito no cálculo (D18):** no mês M do fechamento, a linha da categoria mostra crédito, sobra e gasto normais, mas o **disponível dela é 0**, e o disponível que ela tinha (`liberado`, que pode ser negativo) soma ao crédito de "Sem categoria" nesse mês. Nos meses seguintes ao fechamento, a parte dela na divisão passa para o crédito de "Sem categoria", e a linha dela mostra tudo zerado. A soma das linhas continua igual ao disponível do benefício (RN-17). |
| RN-23 | **Gastos bloqueados:** criar, alterar ou excluir um gasto da categoria com data num mês fechado (de M do fechamento em diante, até a reabertura) falha com "A categoria ‹nome› está fechada neste benefício." Os gastos anteriores ao fechamento continuam. |
| RN-24 | **Reabrir em R (D19):** a categoria precisa estar fechada em R. Se R é o mês do fechamento, o fechamento é desfeito (a liberação some). Senão, o fechamento passa a valer só de M até R (sem incluir R), e a categoria volta a receber o crédito da divisão de R em diante, com sobra zero em R. |
| RN-25 | **Excluir categoria ou benefício:** complementa as RN-10 e RN-20: os fechamentos da categoria, ou do benefício, são removidos junto. |

## 5. Cenários (BDD)

Os cenários usam a data de hoje como **17/10/2026**. "VR" é um benefício de R$ 800,00 por mês desde outubro de 2026, salvo indicação.

```gherkin
# language: pt

Funcionalidade: Benefícios
  Como pessoa que recebe vale-refeição, vale-alimentação ou algo parecido
  Quero acompanhar o saldo de cada benefício, mês a mês
  Para saber quanto ainda posso gastar com ele

  # --- RF-01 / D7 -----------------------------------------------------------------
  Cenário: Abrir a aba de benefícios
    Dado que estou no painel de um cartão
    Então a barra de abas mostra "Entradas", "Cartões" e "Benefícios", nessa ordem
    Quando eu toco em "Benefícios"
    Então vejo a tela de benefícios de outubro de 2026
    E o painel do cartão não mostra nenhum benefício

  # --- RF-10 ----------------------------------------------------------------------
  Cenário: Nenhum benefício cadastrado
    Dado que não há benefícios
    Quando eu abro a aba "Benefícios"
    Então vejo "Nenhum benefício ainda." e o botão "Novo benefício"

  # --- RF-04 / RF-03 / RN-01 / RN-03 / RN-05 ------------------------------------
  Cenário: Criar um benefício
    Quando eu toco em "Novo benefício"
    E preencho o nome "VR", o valor mensal "800" e mantenho o mês inicial de outubro de 2026
    E toco em "Adicionar"
    Então vejo o cartão "VR" com o selo "Mensal"
    E ele mostra crédito R$ 800,00, sobra anterior R$ 0,00, gasto R$ 0,00 e disponível R$ 800,00
    E vejo "Sem gastos neste mês."

  # --- RN-06 ---------------------------------------------------------------------
  Cenário: Validação do benefício
    Quando eu tento criar um benefício chamado " vr " com valor "800"
    Então vejo "Já existe um benefício com esse nome."
    Quando eu tento criar "VA" com valor "0"
    Então vejo "Valor deve ser de pelo menos R$ 0,01."
    Quando eu crio "VA" iniciando em outubro de 2026 com mês final setembro de 2026
    Então vejo "O mês final deve ser igual ou posterior ao mês inicial."

  # --- RF-07 / RF-08 / RN-05 / D3 -----------------------------------------------
  Cenário: Registrar um gasto
    Dado que existe o benefício "VR" e a categoria "Mercado"
    Quando eu toco em "Registrar gasto" no cartão "VR"
    E informo a descrição "Almoço", o valor "300", a categoria "Mercado" e a data 17/10/2026
    E toco em "Adicionar"
    Então o cartão "VR" lista "Almoço" em "Mercado" com R$ 300,00
    E mostra gasto R$ 300,00 e disponível R$ 500,00

  # --- RN-07 ---------------------------------------------------------------------
  Cenário: Gasto fora do período do benefício
    Dado que "VR" começa em outubro de 2026
    Quando eu registro um gasto com data 20/09/2026
    Então vejo "A data deve estar dentro do período do benefício."

  # --- D2 / RN-04 / RN-05 -------------------------------------------------------
  Cenário: A sobra acumula para o mês seguinte
    Dado que "VR" teve gasto de R$ 300,00 em outubro
    Quando eu abro novembro de 2026
    Então "VR" mostra sobra anterior R$ 500,00, crédito R$ 800,00, gasto R$ 0,00 e disponível R$ 1.300,00

  # --- D5 / RN-05 ----------------------------------------------------------------
  Cenário: Gastar mais do que o saldo
    Dado que "VR" tem R$ 1.300,00 disponíveis em novembro
    Quando eu registro um gasto de R$ 1.500,00 em novembro
    Então o disponível de novembro é -R$ 200,00
    E o de dezembro mostra sobra anterior -R$ 200,00 e disponível R$ 600,00

  # --- RF-02 ---------------------------------------------------------------------
  Cenário: Disponível em todos os benefícios
    Dado que "VR" tem R$ 500,00 disponíveis e "VA" tem R$ 200,00
    Então a faixa "Disponível em todos os benefícios" mostra R$ 700,00

  # --- D4 / RF-05 / RN-02 / RN-08 -----------------------------------------------
  Cenário: Reajuste do valor mensal daqui em diante
    Dado que "VR" vale R$ 800,00 desde outubro
    Quando eu abro dezembro de 2026, edito "VR" com "Vale a partir de" dezembro e valor "900"
    Então outubro e novembro continuam com crédito R$ 800,00
    E dezembro e os meses seguintes têm crédito R$ 900,00

  Cenário: Valor igual ao vigente não cria histórico
    Dado que "VR" vale R$ 800,00
    Quando eu edito só o nome de "VR" para "Vale-refeição"
    Então o nome muda em todos os meses
    E o valor mensal continua R$ 800,00 em todos eles

  # --- RN-08 ---------------------------------------------------------------------
  Cenário: Valor valendo antes do início
    Dado que "VR" começa em outubro de 2026
    Quando eu edito "VR" com "Vale a partir de" setembro de 2026
    Então vejo "O valor não pode valer antes do mês inicial do benefício."

  # --- RN-01 / RN-09 -------------------------------------------------------------
  Cenário: Encerrar um benefício com mês final
    Quando eu edito "VR" com mês final dezembro de 2026
    Então outubro, novembro e dezembro mostram "VR"
    E janeiro de 2027 não mostra "VR"

  Cenário: Mês final antes de um gasto
    Dado que "VR" tem gasto em novembro
    Quando eu edito "VR" com mês final outubro de 2026
    Então vejo "Há gastos depois do mês final."

  # --- RF-08 ---------------------------------------------------------------------
  Cenário: Editar e excluir um gasto
    Dado que "VR" tem o gasto "Almoço" de R$ 300,00
    Quando eu edito o valor para "350" e salvo
    Então o gasto mostra R$ 350,00 e o disponível muda
    Quando eu excluo o gasto e confirmo
    Então o gasto some e o disponível volta ao crédito

  # --- RF-06 / D9 / RN-10 --------------------------------------------------------
  Cenário: Excluir um benefício
    Dado que "VR" tem 3 gastos
    Quando eu excluo "VR"
    Então o sistema pede confirmação para "Remover o benefício “VR” e seus 3 gastos? Esta ação não pode ser desfeita."
    E depois de confirmar, "VR" e os gastos dele somem de todos os meses

  # --- RF-09 / RN-11 -------------------------------------------------------------
  Cenário: Excluir uma categoria usada em benefício
    Dado que "Mercado" tem 1 compra no cartão e 1 gasto de benefício
    Quando eu abro "Categorias" e excluo "Mercado"
    Então vejo a confirmação "2 compras ficarão sem categoria."
    E depois de confirmar, o gasto do benefício aparece sem categoria
    E o saldo do benefício não muda

  # --- RN-12 / D10 ---------------------------------------------------------------
  Cenário: Limite de navegação
    Quando eu abro "#/beneficios/mes/2028-10"
    Então o app volta para "#/beneficios"

  # --- RN-13 / D1 ----------------------------------------------------------------
  Cenário: Benefícios não mexem nos cartões nem nas entradas
    Dado que o cartão "Nubank" tem R$ 800,00 usados em outubro de 2026
    Quando eu registro um gasto de R$ 100,00 em "VR"
    Então o usado e o disponível do "Nubank" continuam iguais
    E o total das entradas de outubro continua igual

  # --- D13 / RF-11 / RF-12 / RN-15 / RN-17 ---------------------------------------
  Cenário: Dividir o benefício por categoria
    Dado que "VR" vale R$ 800,00 e existem as categorias "Mercado" e "Lazer"
    Quando eu edito "VR", divido R$ 500,00 em "Mercado" e R$ 200,00 em "Lazer" e salvo
    Então o cartão "VR" lista "Mercado" com crédito R$ 500,00, "Lazer" com R$ 200,00 e "Sem categoria" com R$ 100,00
    E o disponível do benefício continua R$ 800,00

  # --- D16 / RN-16 --------------------------------------------------------------
  Cenário: Divisão maior que o valor do benefício
    Quando eu divido R$ 600,00 em "Mercado" e R$ 300,00 em "Lazer" num benefício de R$ 800,00
    Então vejo "A divisão passa do valor mensal do benefício."

  Cenário: Reduzir o valor abaixo da divisão
    Dado que "VR" está dividido em "Mercado" R$ 500,00 e "Lazer" R$ 200,00
    Quando eu edito só o valor mensal para R$ 600,00
    Então vejo "A divisão passa do valor mensal do benefício."

  # --- RF-13 / RN-17 -------------------------------------------------------------
  Cenário: O gasto abate a categoria
    Dado que "VR" está dividido em "Mercado" R$ 500,00 e "Lazer" R$ 200,00
    Quando eu registro um gasto de R$ 120,00 em "Mercado"
    Então "Mercado" mostra gasto R$ 120,00 e disponível R$ 380,00
    E o disponível do benefício é R$ 680,00

  Cenário: Gasto sem categoria abate o restante
    Dado que "VR" está dividido em "Mercado" R$ 500,00 e "Lazer" R$ 200,00
    Quando eu registro um gasto de R$ 30,00 sem categoria
    Então "Sem categoria" mostra disponível R$ 70,00

  # --- D15 / RN-17 ---------------------------------------------------------------
  Cenário: A sobra de cada categoria acumula
    Dado que "VR" está dividido em "Mercado" R$ 500,00 e "Lazer" R$ 200,00, e gastei R$ 120,00 em "Mercado" em outubro
    Quando eu abro novembro
    Então "Mercado" mostra sobra anterior R$ 380,00, crédito R$ 500,00 e disponível R$ 880,00
    E "Lazer" mostra sobra anterior R$ 200,00 e disponível R$ 400,00

  # --- D16 / RN-18 ---------------------------------------------------------------
  Cenário: Gasto numa categoria fora da divisão
    Dado que "VR" está dividido e a categoria "Casa" não está na divisão
    Quando eu registro um gasto de R$ 50,00 em "Casa"
    Então aparece a linha "Casa" com disponível -R$ 50,00
    E o disponível do benefício diminui R$ 50,00

  # --- D14 / RN-19 ---------------------------------------------------------------
  Cenário: Reajustar a divisão daqui em diante
    Dado que "VR" está dividido em "Mercado" R$ 500,00 e "Lazer" R$ 200,00 desde outubro
    Quando eu edito "VR" com "Vale a partir de" dezembro, "Mercado" R$ 600,00 e "Lazer" R$ 100,00
    Então outubro e novembro continuam com "Mercado" R$ 500,00 e "Lazer" R$ 200,00
    E dezembro em diante têm "Mercado" R$ 600,00 e "Lazer" R$ 100,00

  # --- RN-20 ---------------------------------------------------------------------
  Cenário: Excluir uma categoria que está na divisão
    Dado que "VR" está dividido em "Mercado" R$ 500,00 e "Lazer" R$ 200,00, com gastos em "Lazer"
    Quando eu excluo a categoria "Lazer"
    Então os R$ 200,00 de "Lazer" passam para "Sem categoria"
    E os gastos de "Lazer" ficam sem categoria
    E o disponível do benefício não muda

  # --- D18 / RF-14 / RF-15 / RN-21 / RN-22 ---------------------------------------
  Cenário: Fechar uma categoria libera a sobra
    Dado que "VR" está dividido em "Mercado" R$ 500,00 e "Lazer" R$ 200,00, e gastei R$ 120,00 em "Mercado" em outubro
    Quando eu toco em "Fechar" na linha "Mercado"
    Então o sistema pede confirmação para "Fechar “Mercado” em VR? R$ 380,00 que sobram vão para “Sem categoria”."
    E depois de confirmar, "Mercado" mostra o selo "Fechada", gasto R$ 120,00, disponível R$ 0,00 e "Liberado R$ 380,00"
    E "Sem categoria" mostra disponível R$ 480,00
    E o disponível do benefício continua R$ 680,00

  Cenário: A categoria fechada nos meses seguintes
    Dado que "Mercado" foi fechada em outubro e "Lazer" tem R$ 200,00
    Quando eu abro novembro
    Então "Mercado" aparece "Fechada" com tudo zerado
    E "Sem categoria" mostra sobra anterior R$ 480,00, crédito R$ 600,00 e disponível R$ 1.080,00
    E "Lazer" mostra sobra anterior R$ 200,00 e disponível R$ 400,00

  # --- RN-23 ---------------------------------------------------------------------
  Cenário: Gasto numa categoria fechada
    Dado que "Mercado" está fechada em "VR"
    Quando eu registro um gasto em "Mercado" num mês fechado
    Então vejo "A categoria Mercado está fechada neste benefício."
    E os gastos antigos de "Mercado" não podem ser editados nem excluídos

  # --- RN-21 ---------------------------------------------------------------------
  Cenário: Fechar com gastos em meses seguintes
    Dado que "Mercado" tem um gasto em dezembro
    Quando eu fecho "Mercado" em outubro
    Então vejo "Há gastos desta categoria depois de outubro de 2026. Exclua-os antes de fechar."

  # --- D19 / RN-24 ---------------------------------------------------------------
  Cenário: Reabrir uma categoria
    Dado que "Mercado" foi fechada em outubro
    Quando eu abro dezembro e toco em "Reabrir" na linha "Mercado"
    Então novembro continua fechado
    E dezembro em diante "Mercado" volta a receber R$ 500,00 por mês, com sobra anterior zero em dezembro

  Cenário: Desfazer um fechamento no mesmo mês
    Dado que "Mercado" foi fechada em outubro
    Quando eu abro outubro e toco em "Reabrir"
    Então "Mercado" volta ao normal em outubro, com a sobra dela de volta

  # --- D17 / RN-18 ---------------------------------------------------------------
  Cenário: Benefício sem divisão
    Dado que "VR" não tem divisão
    Então o cartão "VR" não mostra a lista "Por categoria"
    E os gastos abatem só o disponível do benefício

  # --- RN-14 ---------------------------------------------------------------------
  Cenário: Migração de dados antigos
    Dado que o aparelho tem dados salvos na versão 6
    Quando eu abro o app
    Então cartões, compras, categorias e entradas continuam como estavam
    E a aba "Benefícios" abre vazia
```

### 5.1 Matriz de rastreabilidade

| Requisito | Cenário(s) |
| --------- | ---------- |
| RF-01, D7 | Abrir a aba de benefícios |
| RF-02 | Abrir a aba de benefícios; Disponível em todos os benefícios |
| RF-03 | Criar um benefício |
| RF-04 | Criar um benefício |
| RF-05 | Reajuste do valor mensal daqui em diante; Valor igual ao vigente não cria histórico |
| RF-06 | Excluir um benefício |
| RF-07 | Registrar um gasto |
| RF-08 | Registrar um gasto; Editar e excluir um gasto |
| RF-09 | Excluir uma categoria usada em benefício |
| RF-10 | Nenhum benefício cadastrado; Criar um benefício |
| RN-01 | Criar um benefício; Encerrar um benefício com mês final |
| RN-02 | Reajuste do valor mensal daqui em diante |
| RN-03 | Criar um benefício |
| RN-04 | A sobra acumula para o mês seguinte; Gastar mais do que o saldo |
| RN-05 | Registrar um gasto; A sobra acumula para o mês seguinte; Gastar mais do que o saldo |
| RN-06 | Validação do benefício |
| RN-07 | Gasto fora do período do benefício |
| RN-08 | Reajuste do valor mensal daqui em diante; Valor igual ao vigente não cria histórico; Valor valendo antes do início |
| RN-09 | Encerrar um benefício com mês final; Mês final antes de um gasto |
| RN-10 | Excluir um benefício |
| RN-11 | Excluir uma categoria usada em benefício |
| RN-12 | Limite de navegação |
| RN-13 | Benefícios não mexem nos cartões nem nas entradas |
| RN-14 | Migração de dados antigos |
| D1 | Benefícios não mexem nos cartões nem nas entradas |
| D2 | A sobra acumula para o mês seguinte |
| D3 | Registrar um gasto |
| D4 | Reajuste do valor mensal daqui em diante |
| D5 | Gastar mais do que o saldo |
| D8 | Gasto fora do período do benefício |
| D9 | Excluir um benefício |
| D10 | Limite de navegação |
| RF-11, D13 | Dividir o benefício por categoria |
| RF-12 | Dividir o benefício por categoria; Benefício sem divisão |
| RF-13 | O gasto abate a categoria; Gasto sem categoria abate o restante |
| RN-15, D14 | Dividir o benefício por categoria; Reajustar a divisão daqui em diante |
| RN-16, D16 | Divisão maior que o valor do benefício; Reduzir o valor abaixo da divisão |
| RN-17, D15 | O gasto abate a categoria; Gasto sem categoria abate o restante; A sobra de cada categoria acumula |
| RN-18, D17 | Gasto numa categoria fora da divisão; Benefício sem divisão |
| RN-19 | Reajustar a divisão daqui em diante |
| RN-20 | Excluir uma categoria que está na divisão |
| RF-14, RN-22, D18 | Fechar uma categoria libera a sobra; A categoria fechada nos meses seguintes |
| RF-15 | Fechar uma categoria libera a sobra |
| RN-21 | Fechar com gastos em meses seguintes |
| RN-23 | Gasto numa categoria fechada |
| RN-24, D19 | Reabrir uma categoria; Desfazer um fechamento no mesmo mês |
| RN-25 | Excluir uma categoria que está na divisão |

## 6. Modelo de dados e migração

O estado salvo passa de `version: 6` para `version: 7`:

```ts
type StoredBenefit = {
  id: number;
  name: string;
  firstMonth: MonthKey;
  lastMonth: MonthKey | null;                    // null = sem fim
  amounts: { from: MonthKey; amount: number }[]; // histórico do valor mensal, por `from` crescente
  splits: { from: MonthKey; items: { categoryId: number; amount: number }[] }[]; // histórico da divisão (RN-15); [] = nunca dividido
  closures: { categoryId: number; from: MonthKey; to: MonthKey | null }[];       // categoria fechada nos meses [from, to) (RN-21, RN-24)
};

type StoredBenefitSpend = {
  id: number; benefitId: number; categoryId: number | null;
  description: string; amount: number; date: string;
};

type State = { /* campos da v6 */ version: 7; benefits: StoredBenefit[]; benefitSpends: StoredBenefitSpend[] };
```

**Migração v6 → v7 (RN-14):** `{ ...old, version: 7, benefits: [], benefitSpends: [] }`. Mais uma etapa na cadeia, no estilo de `migrateV4`.

## 7. Contrato da camada de dados

Em `src/data/store.ts`:

| Função | Efeito |
| ------ | ------ |
| `getBenefits(month)` | Devolve `{ month, totalAvailable, items }`. Cada item: `id`, `name`, `amount` (crédito do mês), `carriedAmount` (sobra anterior), `spentAmount`, `availableAmount`, `percentUsed`, `lastMonth`, `firstMonth` e `spends` (gastos do mês, mais recentes primeiro, com `categoryName`). Só entram os benefícios ativos no mês (RN-01 a RN-05). |
| `getBenefitRange()` | `{ first, last }` para a navegação (RN-12). |
| `createBenefit(input)` | Cria o benefício (RN-06). |
| `updateBenefit(id, month, input)` | Nome, valor a partir de `month` e mês final (RN-06, RN-08, RN-09). |
| `deleteBenefit(id)` | RN-10. |
| `createBenefitSpend(benefitId, categoryId, input)`, `updateBenefitSpend(id, categoryId, input)`, `deleteBenefitSpend(id)` | RN-07. |

`deleteCategory` e `getCategories` passam a considerar os gastos de benefício (RN-11), e `deleteCategory` também tira a categoria das divisões (RN-20).

**Fechar (D18, D19):** `closeBenefitCategory(benefitId, categoryId, month)` e `reopenBenefitCategory(benefitId, categoryId, month)`, com as RN-21 a RN-25.

**Divisão (D13):** `createBenefit` e `updateBenefit` recebem também `split: { categoryId, amount }[]`, a divisão que vale a partir do mês da operação (no `createBenefit`, o mês inicial). Valem as RN-15, RN-16 e RN-19. Cada item de `getBenefits` ganha `categories: { categoryId: number | null, name: string | null, amount, carriedAmount, spentAmount, availableAmount, percentUsed, closed: boolean, releasedAmount }[]`, as linhas por categoria da RN-17 e da RN-18 (vazia sem divisão), e `split` (a divisão vigente no mês, para preencher o diálogo).

Em `src/data/api.ts`: `useGetBenefits`, `useGetBenefitRange` e as mutações correspondentes, com as query keys. As mutações invalidam as consultas de benefícios e de categorias, e só elas.

## 8. Interface

- **Barra de abas** (`app-tabs.tsx`): "Entradas", "Cartões" e "Benefícios". "Benefícios" fica ativa em `#/beneficios` e `#/beneficios/mes/…`.
- **Tela Benefícios** (`src/pages/beneficios.tsx`): navegação de mês igual à das Entradas, faixa "Disponível em todos os benefícios", botões "Novo benefício" e "Categorias", e um cartão por benefício com os quatro valores, a barra, "Registrar gasto", editar, excluir e a lista de gastos do mês.
- **Rotas:** `#/beneficios` e `#/beneficios/mes/AAAA-MM`; mês inválido ou fora do intervalo da RN-12 volta para `#/beneficios`.
- **Diálogos:** benefício (nome, valor, mês inicial, "Vale a partir de" na edição, mês final) e gasto (descrição, valor, categoria, data), no mesmo estilo dos diálogos de Entradas e de compra.
- **Divisão por categoria (RF-11, RF-12):** nos diálogos de benefício, a seção "Dividir por categoria" tem uma linha por categoria (seletor e valor), "Adicionar categoria" e a conta do restante em tempo real; no cartão do benefício, a lista "Por categoria" com barra por linha, no mesmo estilo dos resumos da aba Cartões.
- **Reuso:** o diálogo de categorias é extraído de `dashboard.tsx` para `src/components/categories-dialog.tsx` e usado nas duas abas; o padrão de rotas e de intervalo vem de Entradas (`IncomeMonthRoute`, `getIncomeRange`); `Progress`, `AppTabs` e os helpers de `src/lib/format.ts`.

## 9. Fora de escopo

- Ligar benefício a cartão ou pagar uma compra com benefício (D1).
- Sobra que expira, teto de acúmulo ou crédito em dia específico do mês.
- Benefícios de valor variável mês a mês, a não ser pelo histórico de reajustes (D4).
- Gastos parcelados ou recorrentes em benefício.
- Mudar o mês inicial de um benefício depois de criado (D6).
- Dividir o benefício de um jeito diferente em cada mês sem passar pelo histórico (D14).

## 10. Critérios de aceite

- [ ] RF-01 a RF-10 funcionam como descritos. *Verificados no navegador: RF-01, RF-02, RF-03, RF-04 (criar), RF-07 (com categoria), RF-08 (lista do mês) e RF-10 (estado vazio). Pendentes de conferência manual pela interface: RF-05, RF-06, RF-09 (o diálogo é o mesmo da aba Cartões, já verificado lá) e editar/excluir gasto (cobertos no `store.ts`).*
- [ ] Todos os cenários da seção 5 passam no navegador (`npm run dev`). *Passaram no navegador: abrir a aba e a ordem das abas, estado vazio, criar benefício, registrar gasto com categoria, sobra acumulada no mês seguinte, limite de navegação e cartões sem mudança. Os demais foram conferidos só na camada de dados: a ferramenta de automação do navegador passou a falhar ao abrir formulários durante a verificação.*
- [x] RN-01 a RN-13 exercitadas em `src/data/store.ts`, incluindo sobra acumulada, saldo negativo, reajuste, mês final, virada de ano e exclusão de categoria em uso.
- [x] Dados `version: 6` abrem sem perda e passam a `version: 7` (RN-14).
- [x] A aba Cartões, as compras, as categorias e as entradas continuam como estavam (RN-13).
- [x] `npm run typecheck` e `npm run build` passam.
- [x] `FUNCIONALIDADES.md` e `README.md` atualizados.

*Revisão (divisão por categoria e fechar categoria):*

- [ ] RF-11 a RF-15 funcionam como descritos. *Verificados no navegador: RF-11 (o diálogo abre preenchido com a divisão vigente, mostra o restante e o aviso de soma acima do valor; salvar uma divisão nova a partir de um mês), RF-12 (lista "Por categoria", inclusive em meses seguintes), RF-13 (cobertos no `store.ts`) e RF-14 (selo "Fechada", "Liberado" e "Reabrir"). Pendente de conferência manual: o botão "Fechar" com a confirmação de RF-15 (o `window.confirm` não pôde ser usado pela automação; a lógica está coberta no `store.ts`).*
- [ ] Os cenários de divisão e fechamento da seção 5 passam no navegador. *Conferidos no navegador: dividir e reajustar a divisão daqui em diante, soma acima do valor, categoria fechada no mês e nos seguintes e reabrir. Os demais (gastos bloqueados, fechar com gastos em meses seguintes, excluir categoria dividida e desfazer no mesmo mês) foram conferidos só na camada de dados.*
- [x] RN-15 a RN-25 exercitadas em `src/data/store.ts`, incluindo a soma das linhas igual ao disponível do benefício em todos os meses, sobra por categoria, fechar, bloqueio de gastos e reabrir.
- [x] Benefício sem divisão se comporta exatamente como antes (D17).
- [x] `FUNCIONALIDADES.md` e `README.md` descrevem a divisão e o fechamento.

## 11. Tarefas

1. `store.ts`: tipos, `State` v7, `emptyState`, `migrateV6` e encadeamento na leitura.
2. `store.ts`: cálculo do período ativo, valor vigente, crédito, sobra anterior e disponível (RN-01 a RN-05); `getBenefits` e `getBenefitRange`.
3. `store.ts`: `createBenefit`, `updateBenefit`, `deleteBenefit` com as validações (RN-06, RN-08 a RN-10).
4. `store.ts`: gastos de benefício (RN-07) e a extensão de `deleteCategory` e `getCategories` (RN-11).
5. `api.ts`: hooks, query keys e invalidações.
6. `categories-dialog.tsx`: extrair o diálogo de `dashboard.tsx` e reusar nas duas telas.
7. `beneficios.tsx`: tela, diálogos de benefício e de gasto; `App.tsx`: rotas e redirecionamento da RN-12; `app-tabs.tsx`: terceira aba.
8. Atualizar `FUNCIONALIDADES.md` (seção nova e sumário) e `README.md` (versão 7, estrutura de pastas, migração).
9. Rodar o roteiro de verificação; mudar o Status para `Implementada` e marcar só o que foi verificado.

*Revisão (divisão por categoria), em ordem:*

10. `store.ts`: campo `splits` no benefício, validação (RN-15, RN-16), linhas por categoria (RN-17, RN-18) e `split` em `createBenefit`/`updateBenefit` (RN-19).
11. `store.ts`: `deleteCategory` tira a categoria das divisões (RN-20).
12. `store.ts`: fechar e reabrir categoria (RN-21 a RN-25), bloqueio de gastos (RN-23) e o efeito nas linhas (RN-22).
13. `api.ts` e `beneficios.tsx`: seção "Dividir por categoria" nos diálogos, a lista "Por categoria" no cartão do benefício e os botões "Fechar" e "Reabrir".
14. Atualizar `FUNCIONALIDADES.md` (seção 13) e `README.md`; rodar o roteiro e marcar só o que foi verificado.

## 12. Roteiro de verificação

1. `npm run typecheck` e `npm run build`.
2. Script de teste de `store.ts` (esbuild com `localStorage` simulado): saldo acumulado com virada de ano, saldo negativo, reajuste "a partir de", mês final com e sem gastos, exclusão de categoria usada em compra e em gasto de benefício, e a migração v6 → v7.
3. `npm run dev` e percorrer os cenários da seção 5.
4. No console do navegador, gravar um JSON `version: 6` em `controle-cartao:v1`, recarregar e conferir a migração.
5. Conferir que Cartões, Histórico e Entradas continuam iguais.
