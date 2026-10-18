# Spec — Contas fixas e gastos do dia a dia

| Campo | Valor |
| ----- | ----- |
| Status | Implementada |
| Criada em | 17/10/2026 |
| Escopo | `src/data/store.ts`, `src/data/api.ts`, `src/pages/entradas.tsx`, `src/App.tsx`, `src/pages/dashboard.tsx`, `FUNCIONALIDADES.md`, `README.md`, `specs/entradas.md` |
| Depende de | [`entradas.md`](entradas.md) (a tela, a recorrência e a navegação por mês), [`compras-e-categorias.md`](compras-e-categorias.md) (categorias globais e o usado dos cartões) |
| Substitui em parte | [`entradas.md`](entradas.md): a decisão D3 ("entradas não entram em nenhum cálculo") e a RN-09 (intervalo de navegação). As entradas continuam sem alterar os cartões; o que muda é que a tela das entradas passa a **ler** o usado dos cartões para calcular o saldo. |
| Substituída em parte por | [`tela-de-categorias.md`](tela-de-categorias.md): o diálogo "Categorias" virou a tela `#/categorias`; as regras das categorias continuam as mesmas. |

> Esta spec é a fonte da verdade da funcionalidade. A implementação segue a seção [Tarefas](#11-tarefas) e só termina quando todos os [Critérios de aceite](#10-critérios-de-aceite) forem atendidos. Mudanças de comportamento entram primeiro aqui e só depois no código.

---

## 1. Contexto e objetivo

A aba Entradas só mostra o dinheiro que entra. A pessoa não tem onde registrar o que **sai** do dia a dia (aluguel, internet, mercado, transporte) nem ver quanto **sobra** do que recebeu.

**Objetivo:**

1. Registrar **contas fixas**: despesas mensais que se repetem (aluguel, internet, plano de saúde).
2. Registrar **gastos do dia a dia**: despesas avulsas, com categoria opcional.
3. Mostrar, por mês, o **saldo**: entradas − contas fixas − gastos do dia a dia − o que foi usado nos cartões, **somado ao que sobrou (ou faltou) dos meses anteriores**.
4. Manter tudo na aba Entradas, separada de Cartões e Benefícios.

## 2. Glossário

| Termo | Definição |
| ----- | --------- |
| **Conta fixa** | Despesa que se repete todo mês: nome, valor, dia do mês, mês inicial e mês final opcional. |
| **Ocorrência** | A conta fixa vista num mês específico. |
| **Exceção** | Ajuste de uma ocorrência só: pular o mês ou mudar nome, valor ou dia daquele mês (como em [`entradas.md`](entradas.md#2-glossário)). |
| **Gasto do dia a dia** | Despesa avulsa: descrição, valor, data e categoria opcional. |
| **Cartões** | O total usado em todos os cartões no mês ([`compras-e-categorias.md`](compras-e-categorias.md#2-glossário)). |
| **Resultado do mês** | Entradas − contas fixas − gastos do dia a dia − cartões, só daquele mês. Pode ser negativo. |
| **Saldo anterior** | A soma dos resultados de todos os meses antes do mês visto, a partir do primeiro mês com algo cadastrado. |
| **Saldo do mês** | Saldo anterior + resultado do mês. É o que sobra (ou falta) até o fim do mês, e passa para o mês seguinte. |

## 3. Decisões de produto

| # | Decisão | Motivo |
| - | ------- | ------ |
| D1 | **Tudo fica dentro da aba Entradas**, que passa a mostrar o resumo do mês e três seções: Entradas, Contas fixas e Gastos do dia a dia. A aba mantém o nome e a rota (`#/entradas`). | Escolha do usuário. Continua separada de Cartões e Benefícios. |
| D2 | **Contas fixas são sempre recorrentes**, com mês final opcional. Editar ou excluir uma ocorrência pergunta "Só este mês" ou "Este e os próximos". | Escolha do usuário. Mesmo comportamento das entradas recorrentes (`entradas.md`, D5 a D8). |
| D3 | **Contas fixas não têm "paga / a pagar".** Todas contam no saldo do mês. | Escolha do usuário. Mantém o escopo pequeno. |
| D4 | **Gastos do dia a dia usam as categorias globais**, com categoria opcional, e têm um resumo por categoria no mês. | Escolha do usuário. A mesma lista serve às compras dos cartões e aos benefícios. |
| D5 | **O usado dos cartões também abate do saldo**, numa linha "Cartões". Benefícios continuam fora do saldo. | Escolha do usuário. A fatura do cartão sai do mesmo dinheiro que entra. Benefícios (VR/VA) são um saldo à parte. |
| D6 | **O saldo acumula para os meses seguintes:** o saldo de um mês é o saldo anterior + o resultado do mês, e passa adiante. | Escolha do usuário (revisão de 18/10/2026; antes o saldo era isolado em cada mês). |
| D7 | **A tela das entradas só lê os cartões.** Criar, editar ou excluir entradas, contas e gastos não altera nenhum valor de cartão, compra ou benefício. | Preserva a independência combinada antes. |
| D8 | **Gasto do dia a dia aceita data até 12 meses à frente** do mês corrente. | É o limite de navegação da tela (`entradas.md`, D9), e um gasto fora dele não apareceria. |
| D9 | **Migração v7 → v8 automática**, só acrescenta listas vazias. | Ninguém perde dados. |
| D10 | **A falta também passa adiante.** Um mês no vermelho reduz o saldo dos meses seguintes, sem zerar. | Escolha do usuário. O saldo segue a conta de verdade. |
| D11 | **A conta começa no primeiro mês com entrada, conta fixa ou gasto cadastrado.** Os meses antes dele não acumulam, e os cartões não definem o início. | Escolha do usuário. Evita arrastar para o saldo o histórico antigo dos cartões. |
| D12 | **O resumo mostra a parte que veio dos meses anteriores e a do mês:** "Saldo anterior", "Resultado do mês" e "Saldo" (a soma dos dois). | Escolha do usuário. Dá para ver quanto do saldo é do mês e quanto veio de antes. |
| D13 | **Os meses futuros projetam o saldo:** usam as entradas e contas fixas previstas, os gastos já lançados e o usado previsto dos cartões até lá. | Mostra para onde o saldo está indo. |
| D14 | **Nada novo é gravado.** O saldo anterior é calculado a cada leitura. | Mudar qualquer coisa de um mês passado ajusta os saldos dos meses seguintes sem passo extra. |

## 4. Requisitos

### 4.1 Requisitos funcionais (RF)

| ID | Requisito |
| -- | --------- |
| RF-01 | A tela Entradas mostra, abaixo da navegação de mês, a faixa **"Resumo do mês"** com sete valores: **Entradas**, **Contas fixas**, **Gastos do dia a dia**, **Cartões**, **Resultado do mês**, **Saldo anterior** e **Saldo** (D12). |
| RF-02 | O **Saldo** negativo aparece em vermelho, com o aviso "As saídas passaram das entradas e do saldo anterior." Saldo zero ou positivo aparece em verde. O **Saldo anterior** e o **Resultado do mês** também ficam em vermelho quando negativos. |
| RF-03 | Abaixo do resumo, as seções, em ordem: **Entradas** (como hoje), **Contas fixas** e **Gastos do dia a dia**. Cada uma com o seu botão: "Nova entrada", "Nova conta fixa" e "Novo gasto". |
| RF-04 | O valor **Cartões** mostra o total usado nos cartões no mês e tem o link "Ver cartões", que leva à aba Cartões. |
| RF-05 | O diálogo **"Nova conta fixa"** tem nome, valor, data (o dia e o mês inicial saem dela) e "Até (mês)" opcional. A lista do mês mostra nome, dia, valor e o selo "Mensal". |
| RF-06 | **Editar** ou **excluir** uma conta fixa pergunta o escopo ("Só este mês" ou "Este e os próximos"), como nas entradas recorrentes. |
| RF-07 | O diálogo **"Novo gasto"** tem descrição, valor, categoria (opcional, padrão "Sem categoria") e data (padrão: hoje, se estiver no mês aberto; senão, o dia 1º do mês aberto). A lista do mês mostra, da data mais recente para a mais antiga, descrição, categoria, data e valor, com editar e excluir. |
| RF-08 | Os gastos do mês têm um resumo **"Por categoria"**: soma e participação de cada categoria, e "Sem categoria". |
| RF-09 | O botão **"Categorias"** da tela abre o mesmo diálogo de categorias das abas Cartões e Benefícios. |
| RF-10 | Mês sem conta fixa mostra "Nenhuma conta fixa neste mês."; mês sem gasto mostra "Nenhum gasto neste mês.". |

### 4.2 Regras de negócio (RN)

| ID | Regra |
| -- | ----- |
| RN-01 | **Ocorrência da conta fixa (D2):** a conta ocorre em todo mês de `mêsInicial` até `mêsFinal` inclusive, ou sem fim. A data é o `dia` no mês, ajustado para o último dia se o mês não tiver esse dia. |
| RN-02 | **Exceção:** a exceção de um mês, se existir, substitui nome, valor e dia daquela ocorrência, ou a remove (pular). |
| RN-03 | **Contas fixas do mês:** soma das ocorrências do mês após aplicar as exceções. |
| RN-04 | **Gastos do dia a dia do mês:** soma dos gastos com data no mês. |
| RN-05 | **Cartões (D5):** o usado de todos os cartões no mês, como em `compras-e-categorias.md`, RN-01 e RN-03, inclusive as parcelas previstas e as compras futuras de um mês futuro. |
| RN-06 | **Resultado do mês (D5):** Entradas − Contas fixas − Gastos do dia a dia − Cartões, em centavos, só do mês. Pode ser negativo. |
| RN-15 | **Saldo anterior (D6, D10, D11):** a soma dos resultados (RN-06) de cada mês desde o primeiro mês até o mês anterior ao visto. É 0 no primeiro mês e nos meses antes dele. |
| RN-16 | **Primeiro mês (D11):** o mais antigo entre o mês inicial das entradas, o mês inicial das contas fixas e o mês dos gastos do dia a dia. Os cartões não definem o primeiro mês. Sem nenhum dos três, o saldo anterior é sempre 0. |
| RN-17 | **Saldo (D6, D10):** Saldo anterior + Resultado do mês. Pode ser negativo, e o negativo também passa para o mês seguinte. |
| RN-18 | **Meses futuros (D13) e passados (D14):** o saldo anterior de qualquer mês usa os resultados dos meses antes dele, passados e futuros. Não há valor gravado, então alterar uma entrada, conta, gasto ou compra de um mês muda os saldos dos meses seguintes. |
| RN-07 | **Validação da conta fixa:** nome obrigatório, até 120 caracteres; valor ≥ R$ 0,01 ("Valor deve ser de pelo menos R$ 0,01."); data válida; "Até (mês)" não pode ser anterior ao mês inicial ("O mês final deve ser igual ou posterior ao mês inicial."). |
| RN-08 | **Validação do gasto:** descrição obrigatória, até 200 caracteres; valor ≥ R$ 0,01; data válida e até o último dia do mês corrente + 12 meses ("A data deve ser de até 12 meses à frente."); categoria, se informada, precisa existir ("Categoria não encontrada."). |
| RN-09 | **Editar conta fixa:** "só este mês" grava a exceção do mês; "este e os próximos" funciona como em `entradas.md`, RN-06: no mês inicial atualiza no lugar, senão a original termina no mês anterior e nasce uma nova a partir do mês editado. As exceções de meses ≥ o mês editado da original são apagadas. |
| RN-10 | **Excluir conta fixa:** "só este mês" grava a exceção "pular"; "este e os próximos" remove a conta (se é o mês inicial) ou a termina no mês anterior, como em `entradas.md`, RN-07 e RN-08. |
| RN-11 | **Excluir categoria:** complementa `compras-e-categorias.md`, RN-06: os gastos do dia a dia que a usam passam a sem categoria, e a contagem do diálogo de categorias soma esses gastos. |
| RN-12 | **Navegação:** o intervalo vai do mês mais antigo entre as entradas, as contas fixas e os gastos (ou o corrente, se vier antes) até o mês corrente + 12. Fora dele, `#/entradas/mes/…` volta para `#/entradas`. Sem nada cadastrado, só o mês corrente abre. (Atualiza `entradas.md`, RN-09.) |
| RN-13 | **Isolamento (D7):** nenhuma operação desta spec altera cartões, compras, benefícios ou categorias (exceto a RN-11). |
| RN-14 | A **migração** v7 → v8 é automática, acontece uma vez e não perde dados (D9). |

## 5. Cenários (BDD)

Os cenários usam a data de hoje como **17/10/2026**. O exemplo-base de outubro de 2026: entrada "Salário" de R$ 5.000,00, contas fixas "Aluguel" R$ 1.500,00 e "Internet" R$ 100,00, gasto "Mercado" de R$ 300,00 e R$ 800,00 usados nos cartões.

```gherkin
# language: pt

Funcionalidade: Contas fixas e gastos do dia a dia
  Como pessoa que recebe e gasta dinheiro todo mês
  Quero registrar minhas contas e gastos e ver quanto sobra das entradas
  Para saber se o mês fecha no azul

  # --- RF-01 / RN-06 / D5 --------------------------------------------------------
  Cenário: Resumo do mês
    Dado o exemplo-base de outubro de 2026
    Quando eu abro a aba "Entradas"
    Então o resumo mostra Entradas R$ 5.000,00, Contas fixas R$ 1.600,00, Gastos do dia a dia R$ 300,00, Cartões R$ 800,00
    E o Resultado do mês é R$ 2.300,00 e o Saldo anterior é R$ 0,00, porque outubro é o primeiro mês
    E o Saldo é R$ 2.300,00, em verde

  # --- RF-02 ---------------------------------------------------------------------
  Cenário: Saldo negativo
    Dado que o saldo anterior é R$ 0,00 e as saídas do mês somam R$ 5.600,00 contra R$ 5.000,00 de entradas
    Então o Resultado do mês e o Saldo são -R$ 600,00, em vermelho
    E vejo "As saídas passaram das entradas e do saldo anterior."

  # --- D6 / RF-01 / RN-15 / RN-17 ------------------------------------------------
  Cenário: A sobra passa para o mês seguinte
    Dado o exemplo-base de outubro de 2026, com Resultado do mês de R$ 2.300,00
    E que novembro de 2026 tem a entrada "Salário" de R$ 5.000,00 e as contas fixas de R$ 1.600,00 repetidas, e nada mais
    Quando eu abro novembro de 2026
    Então o Saldo anterior é R$ 2.300,00
    E o Resultado do mês é R$ 3.400,00
    E o Saldo é R$ 5.700,00

  # --- D10 / RN-17 ---------------------------------------------------------------
  Cenário: A falta também passa para o mês seguinte
    Dado que outubro de 2026 termina com Saldo de -R$ 600,00
    E que novembro tem Resultado do mês de R$ 3.400,00
    Quando eu abro novembro de 2026
    Então o Saldo anterior é -R$ 600,00, em vermelho
    E o Saldo é R$ 2.800,00, em verde

  # --- D11 / RN-16 ---------------------------------------------------------------
  Cenário: A conta começa no primeiro mês cadastrado
    Dado que a conta fixa mais antiga começa em julho de 2026 e não há entrada nem gasto antes
    Então o Saldo anterior de julho é R$ 0,00
    E o Saldo anterior de agosto é o Resultado de julho
    E um mês antes de julho tem Saldo anterior R$ 0,00 e não acumula nada

  Cenário: Compras antigas nos cartões não puxam o início
    Dado que o Nubank tem compras em maio de 2026 e a primeira entrada é de julho de 2026
    Então o Saldo anterior de julho é R$ 0,00, sem os gastos de maio

  # --- D13 / RN-18 ---------------------------------------------------------------
  Cenário: Os meses futuros projetam o saldo
    Dado o exemplo-base de outubro de 2026, com Saldo de R$ 2.300,00, e o mesmo salário e as mesmas contas fixas nos meses seguintes
    Quando eu abro dezembro de 2026
    Então o Saldo anterior soma o Resultado de outubro e o de novembro
    E o Resultado do mês de dezembro inclui o usado previsto dos cartões

  # --- D14 / RN-18 ---------------------------------------------------------------
  Cenário: Alterar o passado muda os saldos seguintes
    Dado que outubro tem o gasto "Feira" de R$ 300,00
    Quando eu excluo "Feira" e confirmo
    Então o Saldo de outubro e o Saldo anterior de novembro aumentam R$ 300,00

  Cenário: Mês sem nada cadastrado
    Dado que não há entradas, contas, gastos nem cartões
    Então o resumo mostra tudo zerado, com Saldo anterior, Resultado do mês e Saldo R$ 0,00
    E vejo "Nenhuma conta fixa neste mês." e "Nenhum gasto neste mês."

  # --- RF-04 / RN-05 / D7 --------------------------------------------------------
  Cenário: Cartões no saldo
    Dado que o Nubank tem R$ 500,00 usados e o Inter R$ 300,00 em outubro
    Então "Cartões" mostra R$ 800,00
    Quando eu toco em "Ver cartões"
    Então vejo a aba "Cartões"

  Cenário: O saldo lê os cartões sem alterá-los
    Quando eu registro uma conta fixa e um gasto
    Então o usado e o disponível dos cartões continuam iguais

  Cenário: Mês futuro inclui parcelas previstas
    Dado que "Fone" tem parcela prevista de R$ 33,33 em novembro e há uma compra no cartão de R$ 100,00 com data em novembro
    Quando eu abro novembro de 2026
    Então "Cartões" mostra R$ 133,33

  # --- RF-05 / RN-01 / RN-03 -----------------------------------------------------
  Cenário: Cadastrar uma conta fixa
    Quando eu toco em "Nova conta fixa"
    E informo o nome "Aluguel", o valor "1500" e a data 05/10/2026
    E toco em "Adicionar"
    Então a lista de outubro tem "Aluguel" no dia 5 com R$ 1.500,00 e o selo "Mensal"
    E novembro e dezembro de 2026 também têm "Aluguel"
    E setembro de 2026 não tem

  Cenário: Conta fixa com mês final
    Quando eu cadastro "Curso" de R$ 200,00 em 10/10/2026 até dezembro de 2026
    Então outubro, novembro e dezembro têm "Curso"
    E janeiro de 2027 não tem

  Cenário: Conta fixa no dia 31
    Dado que "Plano" é uma conta fixa no dia 31
    Então em novembro a data é 30/11 e em fevereiro de 2027 é 28/02

  # --- RN-07 ---------------------------------------------------------------------
  Cenário: Validação da conta fixa
    Quando eu cadastro uma conta fixa com valor "0"
    Então vejo "Valor deve ser de pelo menos R$ 0,01."
    Quando eu cadastro uma conta fixa em 10/10/2026 até setembro de 2026
    Então vejo "O mês final deve ser igual ou posterior ao mês inicial."

  # --- RF-06 / RN-02 / RN-09 -----------------------------------------------------
  Cenário: Alterar uma conta só num mês
    Dado que "Aluguel" é uma conta fixa de R$ 1.500,00 desde outubro
    Quando eu edito novembro, escolho "Só este mês" e mudo o valor para "1700"
    Então novembro mostra R$ 1.700,00
    E outubro e dezembro continuam com R$ 1.500,00

  Cenário: Reajuste do aluguel daqui em diante
    Dado que "Aluguel" é uma conta fixa de R$ 1.500,00 desde outubro
    Quando eu edito dezembro, escolho "Este e os próximos" e mudo o valor para "1800"
    Então outubro e novembro continuam com R$ 1.500,00
    E dezembro e os meses seguintes têm R$ 1.800,00

  # --- RN-10 ---------------------------------------------------------------------
  Cenário: Pular um mês e encerrar uma conta fixa
    Quando eu excluo a ocorrência de novembro com "Só este mês"
    Então novembro não tem a conta, e outubro e dezembro têm
    Quando eu excluo a de dezembro com "Este e os próximos"
    Então dezembro e os meses seguintes não têm a conta

  # --- RF-07 / RN-04 / RN-08 -----------------------------------------------------
  Cenário: Registrar um gasto do dia a dia
    Dado que existe a categoria "Mercado"
    Quando eu toco em "Novo gasto"
    E informo a descrição "Feira", o valor "300", a categoria "Mercado" e a data 17/10/2026
    E toco em "Adicionar"
    Então a lista de outubro tem "Feira" em "Mercado" com R$ 300,00
    E "Gastos do dia a dia" soma R$ 300,00 e o saldo diminui R$ 300,00

  Cenário: Gasto sem categoria
    Quando eu registro um gasto de R$ 30,00 sem escolher categoria
    Então ele aparece na lista e no resumo como "Sem categoria"

  Cenário: Gasto em outro mês
    Quando eu registro um gasto com data em dezembro de 2026
    Então ele aparece em dezembro, e não em outubro
    E vejo a mensagem "Gasto registrado em dezembro de 2026."

  Cenário: Gasto com data longe demais
    Quando eu registro um gasto com data daqui a 14 meses
    Então vejo "A data deve ser de até 12 meses à frente."

  Cenário: Editar e excluir um gasto
    Dado que existe o gasto "Feira" de R$ 300,00
    Quando eu edito o valor para "350" e salvo
    Então o gasto mostra R$ 350,00 e o saldo muda
    Quando eu excluo o gasto e confirmo
    Então o gasto some e o saldo volta

  # --- RF-08 ---------------------------------------------------------------------
  Cenário: Resumo dos gastos por categoria
    Dado que há R$ 300,00 em "Mercado", R$ 100,00 em "Lazer" e R$ 100,00 sem categoria
    Então "Por categoria" mostra "Mercado" R$ 300,00 (60%), "Lazer" R$ 100,00 (20%) e "Sem categoria" R$ 100,00 (20%)

  # --- RF-09 / RN-11 -------------------------------------------------------------
  Cenário: Excluir uma categoria usada nos gastos
    Dado que "Mercado" tem 1 compra no cartão e 2 gastos do dia a dia
    Quando eu abro "Categorias" e excluo "Mercado"
    Então vejo a confirmação "3 compras ficarão sem categoria."
    E depois de confirmar, os 2 gastos aparecem sem categoria e o saldo não muda

  # --- RN-12 ---------------------------------------------------------------------
  Cenário: Limite de navegação
    Dado que há uma conta fixa desde julho de 2026
    Então a navegação vai de julho de 2026 até outubro de 2027
    Quando eu abro "#/entradas/mes/2028-10"
    Então o app volta para "#/entradas"

  # --- RN-13 / D7 ----------------------------------------------------------------
  Cenário: Benefícios continuam de fora
    Dado que "VR" tem R$ 800,00 de saldo
    Então o resumo do mês não inclui o "VR"

  # --- RN-14 ---------------------------------------------------------------------
  Cenário: Migração de dados antigos
    Dado que o aparelho tem dados salvos na versão 7
    Quando eu abro o app
    Então entradas, cartões, compras, categorias e benefícios continuam como estavam
    E as seções "Contas fixas" e "Gastos do dia a dia" abrem vazias
```

### 5.1 Matriz de rastreabilidade

| Requisito | Cenário(s) |
| --------- | ---------- |
| RF-01, RN-06 | Resumo do mês; Mês sem nada cadastrado |
| RF-02 | Saldo negativo; A falta também passa para o mês seguinte |
| RF-03 | Resumo do mês; Cadastrar uma conta fixa; Registrar um gasto do dia a dia |
| RF-04, RN-05 | Cartões no saldo; Mês futuro inclui parcelas previstas |
| RF-05 | Cadastrar uma conta fixa |
| RF-06 | Alterar uma conta só num mês; Reajuste do aluguel daqui em diante; Pular um mês e encerrar uma conta fixa |
| RF-07 | Registrar um gasto do dia a dia; Gasto em outro mês; Editar e excluir um gasto |
| RF-08 | Resumo dos gastos por categoria |
| RF-09 | Excluir uma categoria usada nos gastos |
| RF-10 | Mês sem nada cadastrado |
| RN-01 | Cadastrar uma conta fixa; Conta fixa com mês final; Conta fixa no dia 31 |
| RN-02 | Alterar uma conta só num mês; Pular um mês e encerrar uma conta fixa |
| RN-03 | Resumo do mês |
| RN-04 | Registrar um gasto do dia a dia; Resumo do mês |
| RN-07 | Validação da conta fixa |
| RN-08 | Gasto com data longe demais; Gasto sem categoria |
| RN-09 | Alterar uma conta só num mês; Reajuste do aluguel daqui em diante |
| RN-10 | Pular um mês e encerrar uma conta fixa |
| RN-11 | Excluir uma categoria usada nos gastos |
| RN-12 | Limite de navegação |
| RN-13, D7 | O saldo lê os cartões sem alterá-los; Benefícios continuam de fora |
| RN-14 | Migração de dados antigos |
| D1 | Resumo do mês |
| D2, D3 | Cadastrar uma conta fixa; Reajuste do aluguel daqui em diante |
| D4 | Resumo dos gastos por categoria |
| D5 | Cartões no saldo; Benefícios continuam de fora |
| D6 | Resumo do mês |
| D8 | Gasto com data longe demais |
| RN-15, D6 | A sobra passa para o mês seguinte; A conta começa no primeiro mês cadastrado |
| RN-16, D11 | A conta começa no primeiro mês cadastrado; Compras antigas nos cartões não puxam o início |
| RN-17, D10 | A sobra passa para o mês seguinte; A falta também passa para o mês seguinte |
| RN-18, D13, D14 | Os meses futuros projetam o saldo; Alterar o passado muda os saldos seguintes |
| D12 | Resumo do mês; A sobra passa para o mês seguinte |

## 6. Modelo de dados e migração

O estado salvo passa de `version: 7` para `version: 8`:

```ts
// Conta fixa: sempre mensal; as ocorrências são calculadas, nunca gravadas (RN-01).
type StoredBill = {
  id: number; name: string; amount: number;
  firstMonth: MonthKey; day: number; lastMonth: MonthKey | null; // null = sem fim
};

// Ajuste de uma ocorrência (RN-02). skip=true remove a ocorrência.
type StoredBillException = {
  billId: number; month: MonthKey; skip: boolean;
  name?: string; amount?: number; day?: number;
};

type StoredDailyExpense = {
  id: number; categoryId: number | null; description: string; amount: number; date: string;
};

type State = { /* campos da v7 */ version: 8; bills: StoredBill[]; billExceptions: StoredBillException[]; dailyExpenses: StoredDailyExpense[] };
```

**Migração v7 → v8 (RN-14):** `{ ...old, version: 8, bills: [], billExceptions: [], dailyExpenses: [] }`. Mais uma etapa na cadeia, no estilo de `migrateV6`.

## 7. Contrato da camada de dados

Em `src/data/store.ts`:

| Função | Efeito |
| ------ | ------ |
| `getMonthCash(month)` | Devolve o resumo do mês: `incomeAmount`, `billsAmount`, `dailyAmount`, `cardsAmount`, `resultAmount` (RN-06), `previousAmount` (RN-15, RN-16) e `balanceAmount` (RN-17). O saldo anterior é calculado a cada leitura (RN-18), sem nada gravado. |
| `getBills(month)` | `{ month, totalAmount, items }`, com as ocorrências ordenadas por dia: `billId`, `name`, `amount`, `date`, `lastMonth` (RN-01, RN-02). |
| `createBill(input)`, `updateBill(billId, month, scope, input)`, `deleteBill(billId, month, scope)` | RN-07, RN-09, RN-10. `scope` é `'month'` ou `'forward'`. |
| `getDailyExpenses(month)` | `{ month, totalAmount, items, summary }`: `items` do mais recente ao mais antigo, com `categoryName`; `summary` por categoria, em ordem decrescente, com `percent` (RF-07, RF-08). |
| `createDailyExpense(categoryId, input)`, `updateDailyExpense(id, categoryId, input)`, `deleteDailyExpense(id)` | RN-08. |
| `getIncomeRange()` | Passa a considerar também as contas fixas e os gastos (RN-12). |
| `getCategories()` e `deleteCategory(id)` | Passam a considerar os gastos do dia a dia (RN-11). |

Em `src/data/api.ts`: `useGetMonthCash`, `useGetBills`, `useGetDailyExpenses` e as mutações correspondentes, com as query keys. As mutações invalidam as consultas de entradas, contas, gastos, resumo e categorias, e só elas.

## 8. Interface

- **Tela Entradas** (`src/pages/entradas.tsx`), de cima para baixo: abas, navegação de mês, título, a faixa "Resumo do mês" (sete valores: os quatro de entradas e saídas, e abaixo o "Saldo anterior", o "Resultado do mês" e o "Saldo" em destaque), a seção **Entradas** (como hoje), a seção **Contas fixas** (lista com selo "Mensal", editar e excluir) e a seção **Gastos do dia a dia** (lista com editar e excluir, e o resumo "Por categoria"). O botão "Categorias" fica no topo.
- **Diálogos:** "Nova conta fixa" e "Novo gasto", no mesmo estilo dos diálogos de Entradas; a pergunta de escopo (`ScopeDialog`) é reaproveitada, com o texto trocado conforme a conta ou a entrada.
- **Reuso:** `IncomeDialog`/`ScopeDialog` de `entradas.tsx`; `CategoriesDialog`; `Progress`; `AppTabs`; o padrão de ocorrências, exceções e divisão do `store.ts` (`occurrenceOf`, `updateIncome`, `deleteIncome`); `getConsolidated` para o usado dos cartões.
- **Rotas:** inalteradas (`#/entradas`, `#/entradas/mes/AAAA-MM`).

## 9. Fora de escopo

- Marcar conta como paga, vencimentos e lembretes (D3).
- Mudar o ponto de partida do saldo à mão, ou lançar um saldo inicial (o início é o primeiro mês cadastrado, D11).
- Conta fixa avulsa (que não se repete): é um gasto do dia a dia.
- Gastos parcelados ou recorrentes fora das contas fixas.
- Metas e orçamento por categoria.
- Mostrar os benefícios no saldo (D5).
- Renomear a aba Entradas.

## 10. Critérios de aceite

- [ ] RF-01 a RF-10 funcionam como descritos. *Verificados no navegador: RF-01 (resumo com os cinco valores), RF-03, RF-04 (valor de Cartões e o link "Ver cartões"), RF-05 (listas), RF-06 (pergunta de escopo e o diálogo "só este mês") e RF-08 (resumo por categoria). Pendentes de conferência manual pela interface: gravar uma conta ou um gasto novo, editar, excluir, RF-07, RF-09 e RF-10 (cobertos no `store.ts`): a automação do navegador falhou ao clicar em "Salvar" de um formulário.*
- [ ] Todos os cenários da seção 5 passam no navegador (`npm run dev`). *Conferidos no navegador: resumo do mês, cartões no saldo, mês seguinte (contas repetidas e saldo) e o diálogo de edição só neste mês. Os demais foram conferidos só na camada de dados.*
- [x] RN-01 a RN-13 exercitadas em `src/data/store.ts`, incluindo dia 31, virada de ano, saldo negativo, cartões em mês futuro e exclusão de categoria em uso.
- [x] Dados `version: 7` abrem sem perda e passam a `version: 8` (RN-14), inclusive benefícios salvos antes da divisão.
- [x] Cartões, compras, benefícios e as entradas continuam como estavam (RN-13).
- [x] `npm run typecheck` e `npm run build` passam.
- [x] `FUNCIONALIDADES.md` e `README.md` atualizados, e a spec `entradas.md` tem a nota "Substituída em parte por `contas-e-gastos.md`".

*Revisão (saldo acumulado):*

- [ ] RF-01 e RF-02 funcionam com os sete valores do resumo. *Verificados no navegador: os sete valores, o vermelho do Saldo, do Saldo anterior e do Resultado do mês quando negativos e o aviso "As saídas passaram das entradas e do saldo anterior.".*
- [ ] Os cenários de saldo acumulado da seção 5 passam no navegador. *Conferidos no navegador: outubro (anterior R$ 0,00), novembro e dezembro com a sobra passando adiante, voltar a outubro e a falta passando adiante. Os demais (primeiro mês, compras antigas nos cartões, alterar o passado) foram conferidos só na camada de dados.*
- [x] RN-15 a RN-18 exercitadas em `src/data/store.ts`, incluindo sobra e falta que passam adiante, o primeiro mês, meses futuros com o usado previsto dos cartões, alterar o passado e a virada de ano.
- [x] `FUNCIONALIDADES.md` e `README.md` descrevem o saldo acumulado.

## 11. Tarefas

1. `store.ts`: tipos, `State` v8, `emptyState`, `migrateV7` e encadeamento na leitura.
2. `store.ts`: contas fixas, ocorrências e exceções (RN-01 a RN-03), reusando o padrão das entradas; `createBill`, `updateBill`, `deleteBill` (RN-07, RN-09, RN-10).
3. `store.ts`: gastos do dia a dia (RN-04, RN-08) e o resumo por categoria.
4. `store.ts`: `getMonthCash` (RN-05, RN-06), `getIncomeRange` ampliado (RN-12) e a extensão de `getCategories` e `deleteCategory` (RN-11).
5. `api.ts`: hooks, query keys e invalidações.
6. `entradas.tsx`: resumo do mês, seções, diálogos de conta fixa e de gasto, e o botão "Categorias".
7. Atualizar `FUNCIONALIDADES.md` (seção nova e ajustes na seção 12), `README.md` (versão 8, regras de cálculo, estrutura) e a nota em `specs/entradas.md`.
8. Rodar o roteiro de verificação; mudar o Status para `Implementada` e marcar só o que foi verificado.

*Revisão (saldo acumulado), em ordem:*

9. `store.ts`: `getMonthCash` com `resultAmount`, `previousAmount` (RN-15, RN-16) e `balanceAmount` (RN-17).
10. `entradas.tsx`: o resumo com os sete valores, as cores e o novo aviso (RF-01, RF-02).
11. Atualizar `FUNCIONALIDADES.md` (seção 14) e `README.md` (regras de cálculo).
12. Rodar o roteiro e marcar só o que foi verificado.

## 12. Roteiro de verificação

1. `npm run typecheck` e `npm run build`.
2. Script de teste de `store.ts` (esbuild com `localStorage` simulado): saldo acumulado (sobra e falta passando adiante, primeiro mês, meses futuros e virada de ano), recorrência da conta fixa com exceções e "daqui em diante", dia 31 e virada de ano, saldo com cartões (mês corrente e futuro), exclusão de categoria usada em compra, gasto e benefício, intervalo de navegação e a migração v7 → v8.
3. `npm run dev` e percorrer os cenários da seção 5.
4. No console do navegador, gravar um JSON `version: 7` em `controle-cartao:v1`, recarregar e conferir a migração.
5. Conferir que Cartões, Histórico e Benefícios continuam iguais.
