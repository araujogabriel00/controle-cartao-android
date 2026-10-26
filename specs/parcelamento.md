# Spec — Parcelamento

| Campo | Valor |
| ----- | ----- |
| Status | Implementada |
| Criada em | 12/10/2026 |
| Escopo | `src/data/store.ts`, `src/data/api.ts`, `src/App.tsx`, `src/pages/dashboard.tsx`, `src/pages/historico.tsx`, `FUNCIONALIDADES.md`, `specs/historico-mensal.md`, `README.md` |
| Depende de | [`historico-mensal.md`](historico-mensal.md), [`multiplos-cartoes.md`](multiplos-cartoes.md) |
| Substituída em parte por | [`editar-parcela-prevista.md`](editar-parcela-prevista.md): as parcelas previstas da prévia podem ser editadas, e a edição aceita data em mês futuro. |
| Substituída em parte por | [`compras-e-categorias.md`](compras-e-categorias.md): as parcelas caem na categoria global da compra parcelada (sem criar categoria por mês nem orçamento), não existe mais parcela fixa em categoria fechada, e o mês futuro passa a mostrar também compras registradas. |

> Esta spec é a fonte da verdade da funcionalidade. A implementação segue a seção [Tarefas](#11-tarefas) e só termina quando todos os [Critérios de aceite](#10-critérios-de-aceite) forem atendidos. Mudanças de comportamento entram primeiro aqui e só depois no código.

---

## 1. Contexto e objetivo

Hoje um lançamento pertence a uma categoria de um único mês, e o app não abre meses futuros. Para controlar uma compra em 10x, a pessoa precisa lembrar de lançar a parcela à mão em cada mês, e não tem como ver o que já está comprometido nos meses seguintes.

**Objetivo:**

1. Registrar uma **compra parcelada** uma única vez: valor total, nº de parcelas e categoria.
2. Cada parcela vira um **lançamento comum no mês em que cai**, numa categoria com o mesmo nome. Assim, as regras de cálculo atuais continuam valendo.
3. Cadastrar uma compra **que já está em andamento** (ex.: parcela 3 de 10).
4. **Abrir os meses futuros como prévia** para ver as parcelas restantes, e ver no Histórico quanto já está comprometido em cada um.
5. **Editar ou excluir a compra inteira** a partir de qualquer parcela, inclusive mudando a parcela inicial.

## 2. Glossário

| Termo | Definição |
| ----- | --------- |
| **Compra parcelada** | O registro único da compra: cartão, nome da categoria, descrição, valor total, nº de parcelas, parcela inicial e mês e dia da parcela inicial. Fica em `purchases`. |
| **Parcela** | Um lançamento com `purchaseId`, `installment` (o número k, de 1 a N) e `installmentCount` (N). |
| **Parcela inicial** | A primeira parcela registrada no app: 1 numa compra nova, maior que 1 numa compra em andamento. As parcelas anteriores a ela não são registradas. |
| **Parcela gravada** | Parcela que já existe como lançamento, porque cai num mês passado ou no corrente. |
| **Parcela fixa** | Parcela gravada que está numa categoria **fechada**. Ela não muda quando a compra é editada ou excluída (D8). |
| **Parcela prevista** | Parcela de um mês futuro. Não é guardada: é calculada a partir da compra até o mês chegar. |
| **Prévia do mês** | Um mês futuro aberto só para leitura, com as parcelas previstas. |
| **Mês da parcela k** | `mêsInicial + (k − parcelaInicial)`. |

Os termos de mês e de cartão seguem [`historico-mensal.md`](historico-mensal.md#2-glossário) e [`multiplos-cartoes.md`](multiplos-cartoes.md#2-glossário).

## 3. Decisões de produto

| # | Decisão | Motivo |
| - | ------- | ------ |
| D1 | **Cada parcela é um lançamento** no mês dela, numa categoria com o mesmo nome da categoria da compra. | Escolha do usuário. A parcela entra no "usado" da categoria e no comprometido do cartão pelas regras atuais, sem cálculo novo. |
| D2 | **Cada mês compromete só a parcela que cai nele.** O saldo restante não bloqueia o limite do mês corrente. | Escolha do usuário. Combina com o modelo de orçamento mensal do app. |
| D3 | **A pessoa informa o valor total e o nº de parcelas.** O app divide em centavos, e o resto fica na parcela 1 (R$ 100,00 em 3x = 33,34 + 33,33 + 33,33). | Escolha do usuário. É o valor que aparece na hora da compra, e o resto na parcela 1 segue o costume das operadoras. |
| D4 | **Parcelas de meses futuros não são gravadas até o mês chegar.** Viram lançamento quando o mês é iniciado. | O mês futuro ainda não tem categorias, e a virada de mês precisa continuar perguntando se a pessoa quer copiar as categorias do mês anterior. |
| D5 | **Meses futuros abrem como prévia só para leitura.** A seta "Próximo mês" avança até o último mês com parcelas previstas (de qualquer cartão). A prévia mostra as parcelas agrupadas por categoria e o comprometido previsto, sem criar categorias nem lançamentos. | Escolha do usuário. Mostra as parcelas restantes sem quebrar a regra do D4. |
| D6 | **Ao gravar uma parcela, a categoria com o mesmo nome é criada se não existir no mês.** O orçamento dela é a soma das parcelas que caem nela. Se a categoria existir, recebe só o lançamento. | Sem isso a parcela não teria onde ficar. Com o orçamento igual às parcelas, a categoria criada não sobra nem estoura. |
| D7 | **Compra em andamento:** o campo "Parcela neste mês" diz qual parcela cai no mês da data. Na criação, a parcela inicial é essa, e as anteriores não são gravadas. | Escolha do usuário. Permite cadastrar compras feitas antes de usar o app. |
| D8 | **Editar ou excluir muda a compra inteira, menos as parcelas fixas.** As parcelas em categorias fechadas ficam como estão. As demais são apagadas e recalculadas. | Escolha do usuário. Mantém a regra de que uma categoria fechada não muda, sem travar a compra toda por causa de um mês já fechado. |
| D9 | **A parcela inicial pode ser alterada na edição.** | Escolha do usuário. Corrige uma compra em andamento cadastrada com a parcela errada. |
| D10 | **Renomear uma categoria que tem parcelas renomeia a categoria da compra.** As parcelas dos próximos meses passam a cair na categoria com o nome novo. | Escolha do usuário. A compra acompanha a categoria em que a pessoa a organizou. |
| D11 | **"Próximos meses" no Histórico** mostra só o cartão selecionado, e cada linha abre a prévia daquele mês. | O histórico já é a tela de "olhar o tempo". |
| D12 | **De 2 a 24 parcelas.** | Cobre o parcelamento comum no Brasil. Um "parcelado" em 1x é só um lançamento. |
| D13 | **Migração v3 → v4 automática:** acrescenta `purchases: []`, e os lançamentos atuais não mudam. | Ninguém perde dados. |

## 4. Requisitos

### 4.1 Requisitos funcionais (RF)

| ID | Requisito |
| -- | --------- |
| RF-01 | No diálogo **"Novo lançamento"**, o interruptor **"Compra parcelada"** mostra os campos "Nº de parcelas" (padrão 2) e "Parcela neste mês" (padrão 1). O valor passa a se chamar "Valor total da compra", e o título vira "Nova compra parcelada". |
| RF-02 | Com o interruptor ligado, o diálogo mostra uma **prévia**: "‹N›x de R$ ‹parcela› · última em ‹mês/ano›". Se a parcela 1 tiver centavos a mais, mostra também "1ª de R$ ‹valor›". |
| RF-03 | Ao salvar, a compra é registrada, e as parcelas de meses passados e do corrente são gravadas na hora (RN-03). |
| RF-04 | Na lista de lançamentos, cada parcela mostra o selo **"k/N"** ao lado da descrição. |
| RF-05 | **Editar** uma parcela abre "Editar compra parcelada" com a categoria, a descrição, o valor total, o nº de parcelas, "Parcela neste mês", "Começa na parcela" e a data daquela parcela. Todos podem ser editados. O aviso "As mudanças valem para todas as parcelas, menos as que estão em categorias fechadas." fica acima dos botões. |
| RF-06 | **Excluir** uma parcela pede a confirmação "Remover a compra parcelada “‹descrição›” e todas as suas parcelas? As parcelas em categorias fechadas ficam. Esta ação não pode ser desfeita." e então remove a compra (RN-08). |
| RF-07 | O **Histórico** ganha a seção **"Próximos meses"**, com uma linha por mês futuro que tem parcelas previstas do cartão selecionado: mês, total e quantidade de parcelas. Tocar numa linha abre a prévia daquele mês. Sem parcelas previstas, a seção não aparece. |
| RF-08 | Na edição de um lançamento comum, o interruptor "Compra parcelada" não aparece. Um lançamento comum não vira compra parcelada. |
| RF-09 | **Prévia de mês futuro** (`#/mes/AAAA-MM`):<br>• a faixa "Prévia de ‹mês›: aqui aparecem só as parcelas já previstas." fica abaixo da navegação de mês;<br>• "Registrar gasto" e "Nova categoria" não aparecem;<br>• o carrossel e a faixa "Todos os cartões" mostram o comprometido previsto;<br>• no lugar de categorias e lançamentos, aparece "Parcelas previstas": um grupo por nome de categoria, com o total do grupo e as parcelas (descrição, selo k/N, data e valor), sem ações. |

### 4.2 Regras de negócio (RN)

| ID | Regra |
| -- | ----- |
| RN-01 | **Valor das parcelas (D3):** `base = floor(total × 100 / N) / 100`. A parcela 1 vale `total − base × (N − 1)`, e as demais valem `base`. Numa compra em andamento, a conta é a mesma, sobre o total da compra. |
| RN-02 | **Mês e data:** a parcela k cai no mês `mês(data) + (k − parcelaNesteMês)`, no mesmo dia da data. Se o mês não tiver esse dia, a data é o último dia do mês. |
| RN-03 | **Gravação:** depois de criar ou editar uma compra, e depois de iniciar um mês, toda parcela que cai num mês ≤ mês corrente e ainda não existe é gravada.<br>• Se o mês da parcela não foi iniciado, ele é iniciado com o limite atual do cartão.<br>• Se o mês não tem categoria com o nome da compra, ela é criada (D6).<br>• Se a categoria do mês está fechada, a operação falha com "A categoria ‹nome› está fechada em ‹mês de ano›." e é desfeita inteira. |
| RN-04 | **Nome da categoria:** a comparação ignora maiúsculas e minúsculas e espaços nas pontas, como na RN-04 de cartões. |
| RN-05 | **Validação:**<br>• valor total ≥ N × R$ 0,01: "Valor total deve ser de pelo menos R$ ‹N × 0,01›.";<br>• nº de parcelas inteiro de 2 a 24: "Nº de parcelas deve ser de 2 a 24.";<br>• "Parcela neste mês" inteira de 1 a N: "A parcela neste mês deve ser de 1 a ‹N›.";<br>• "Começa na parcela" inteira de 1 até a parcela neste mês: "A compra deve começar entre a parcela 1 e a ‹k›.";<br>• a data fica dentro do mês da categoria escolhida, que precisa estar aberta;<br>• a descrição segue as regras atuais (obrigatória, até 200 caracteres). |
| RN-06 | **Edição (D8, D9):** a parcela editada (k) e a data definem o novo mês e o novo dia. "Começa na parcela" define a nova parcela inicial. A categoria escolhida define o novo nome. As parcelas gravadas que não são fixas são apagadas e gravadas de novo pela RN-03, já com o nome novo. As categorias criadas automaticamente continuam existindo, mesmo que fiquem vazias. |
| RN-07 | **Parcelas fixas na edição:** elas mantêm valor, data, descrição e categoria, e o selo passa a mostrar o novo N. A edição falha com "A parcela ‹k›/‹N› está numa categoria fechada e não pode mudar de mês nem sair da compra." se o novo cálculo tirar uma parcela fixa da compra (k fora do intervalo entre a parcela inicial e N) ou a puser em outro mês. |
| RN-08 | **Exclusão (D8):** remove a compra, as parcelas gravadas não fixas e as previstas. As parcelas fixas ficam como lançamentos comuns: perdem o vínculo com a compra e mantêm o selo k/N. |
| RN-09 | **Parcela não se altera sozinha:** `updateMovement` e `deleteMovement` falham com "Este lançamento é uma parcela. Altere a compra parcelada." quando recebem uma parcela ligada a uma compra. A interface encaminha para a compra (RF-05, RF-06). |
| RN-10 | **Excluir categoria:** uma categoria com parcelas ligadas a uma compra não pode ser excluída. A operação falha com "Esta categoria tem parcelas. Exclua a compra parcelada antes.". |
| RN-11 | **Renomear categoria (D10):** ao renomear uma categoria que tem parcelas, toda compra com parcela nela passa a usar o nome novo. As parcelas previstas e as prévias seguem o nome novo. As parcelas já gravadas em outros meses ficam onde estão, até a compra ser editada (RN-06). |
| RN-12 | **Excluir cartão:** remover um cartão apaga também as compras parceladas dele (complementa a RN-05 de cartões). |
| RN-13 | **Próximos meses:** para o cartão, soma as parcelas previstas (mês > mês corrente), agrupadas por mês e em ordem crescente. |
| RN-14 | **Prévia (D5):**<br>• um mês futuro só abre se for ≤ o último mês com parcelas previstas de qualquer cartão; depois disso, a rota volta para `/`;<br>• na prévia, o comprometido e o valor de cada cartão são a soma das parcelas previstas dele naquele mês, e o limite é o limite atual do cartão;<br>• a prévia não grava nada. |
| RN-15 | **Iniciar o mês com cópia:** em `startMonth`, as categorias do mês anterior são copiadas **antes** da gravação das parcelas. Assim a parcela entra na categoria copiada e não cria uma duplicada. |
| RN-16 | A **migração** v3 → v4 é automática, acontece uma vez e não perde dados (D13). |

## 5. Cenários (BDD)

Os cenários usam a data de hoje como **12/10/2026**, salvo indicação, e o cartão "Nubank" selecionado.

```gherkin
# language: pt

Funcionalidade: Parcelamento
  Como pessoa que compra parcelado no cartão
  Quero registrar a compra uma vez e ver cada parcela cair no seu mês
  Para saber quanto do cartão já está comprometido agora e nos próximos meses

  Contexto:
    Dado que o cartão "Nubank" tem a categoria aberta "Eletrônicos" em outubro de 2026

  # --- RF-01 / RF-02 / RF-03 / RF-04 / RN-01 / RN-02 / D1 / D3 ------------------
  Cenário: Registrar uma compra nova em 3x
    Quando eu abro "Registrar gasto"
    E ligo "Compra parcelada"
    E escolho a categoria "Eletrônicos", a descrição "Fone", o valor total "100", "3" parcelas e a data 15/10/2026
    Então a prévia mostra "3x de R$ 33,33 · última em dezembro/2026" e "1ª de R$ 33,34"
    Quando eu clico em "Adicionar"
    Então "Eletrônicos" de outubro de 2026 tem o lançamento "Fone" de R$ 33,34 em 15/10/2026 com o selo "1/3"
    E as parcelas 2 e 3 ficam previstas para novembro e dezembro de 2026

  # --- D2 -----------------------------------------------------------------------
  Cenário: Só a parcela do mês entra no comprometido
    Dado que "Eletrônicos" tem orçamento de R$ 500,00
    E que registrei "Notebook" de R$ 3.000,00 em 10x em outubro de 2026
    Quando eu fecho "Eletrônicos"
    Então o comprometido de outubro de 2026 conta R$ 300,00 de "Eletrônicos"

  # --- RF-09 / RN-14 / D5 -------------------------------------------------------
  Cenário: Abrir a prévia de um mês futuro
    Dado que registrei "Fone" de R$ 100,00 em 3x em 15/10/2026
    Quando eu toco em "Próximo mês"
    Então vejo novembro de 2026 com a faixa "Prévia de novembro: aqui aparecem só as parcelas já previstas."
    E vejo o grupo "Eletrônicos" com "Fone" "2/3" de R$ 33,33 em 15/11/2026
    E o cartão "Nubank" mostra R$ 33,33 comprometidos
    E não vejo "Registrar gasto" nem "Nova categoria"
    Quando eu toco em "Próximo mês"
    Então vejo a prévia de dezembro de 2026 com "Fone" "3/3"
    E o botão "Próximo mês" fica desabilitado

  Cenário: Mês futuro sem parcelas previstas não abre
    Dado que não há parcelas previstas em nenhum cartão
    Então o botão "Próximo mês" fica desabilitado no mês corrente
    Quando eu abro o endereço "#/mes/2026-11"
    Então volto para o mês corrente

  Cenário: A prévia não grava nada
    Dado que registrei "Fone" em 3x em outubro de 2026
    Quando eu abro a prévia de novembro de 2026
    E que hoje passa a ser 01/11/2026
    Então vejo o diálogo "Começou novembro" para "Nubank"

  # --- D4 / RN-03 / RN-15 / D6 --------------------------------------------------
  Cenário: A parcela entra quando o mês começa, copiando as categorias
    Dado que registrei "Fone" de R$ 100,00 em 3x em 15/10/2026
    E que hoje é 01/11/2026
    Quando eu escolho "Copiar categorias" no diálogo "Começou novembro"
    Então novembro de 2026 tem uma única categoria "Eletrônicos"
    E ela tem o lançamento "Fone" de R$ 33,33 em 15/11/2026 com o selo "2/3"

  Cenário: A parcela entra quando o mês começa do zero
    Dado que registrei "Fone" de R$ 100,00 em 3x em 15/10/2026
    E que hoje é 01/11/2026
    Quando eu escolho "Começar do zero"
    Então novembro de 2026 tem a categoria "Eletrônicos" com orçamento R$ 33,33
    E ela tem o lançamento "Fone" de R$ 33,33 com o selo "2/3"

  Cenário: Mês pulado recebe a parcela
    Dado que registrei "Fone" de R$ 100,00 em 3x em 15/10/2026
    E que não abri o app em novembro de 2026
    E que hoje é 05/12/2026
    Quando o mês de dezembro de 2026 é iniciado
    Então novembro de 2026 é iniciado com o limite atual do cartão
    E novembro e dezembro de 2026 têm as parcelas "2/3" e "3/3"

  # --- RN-02 --------------------------------------------------------------------
  Cenário: Dia que não existe no mês da parcela
    Dado que hoje é 31/01/2027 e que "Eletrônicos" existe em janeiro de 2027
    Quando eu registro "Cadeira" de R$ 200,00 em 2x em 31/01/2027
    Então a parcela "2/2" fica prevista para 28/02/2027

  # --- D7 / RN-01 / RN-03 -------------------------------------------------------
  Cenário: Cadastrar uma compra já em andamento
    Quando eu registro "Geladeira" de R$ 1.000,00 em 10x, com "Parcela neste mês" igual a 3, em 05/10/2026
    Então outubro de 2026 tem o lançamento "Geladeira" de R$ 100,00 com o selo "3/10"
    E as parcelas 1 e 2 não são registradas
    E as parcelas 4 a 10 ficam previstas de novembro de 2026 a maio de 2027

  Cenário: Compra registrada num mês passado grava as parcelas até o mês corrente
    Dado que "Eletrônicos" existe em agosto de 2026
    E que "Eletrônicos" não existe em setembro de 2026
    Quando eu registro, em agosto de 2026, "TV" de R$ 900,00 em 6x em 20/08/2026
    Então agosto, setembro e outubro de 2026 têm as parcelas "1/6", "2/6" e "3/6"
    E setembro de 2026 ganha a categoria "Eletrônicos" com orçamento R$ 150,00
    E as parcelas 4 a 6 ficam previstas

  Cenário: Compra recusada por cair em categoria fechada
    Dado que "Eletrônicos" existe em agosto de 2026
    E que "Eletrônicos" de setembro de 2026 está fechada
    Quando eu tento registrar, em agosto de 2026, "TV" em 6x
    Então vejo a mensagem de erro "A categoria Eletrônicos está fechada em setembro de 2026."
    E nada é gravado

  # --- RN-04 --------------------------------------------------------------------
  Cenário: Categoria com outra grafia é reaproveitada
    Dado que registrei "Fone" em 3x em "Eletrônicos" em outubro de 2026
    E que novembro de 2026 começou com a categoria " eletrônicos "
    Quando a parcela "2/3" é gravada
    Então ela entra em " eletrônicos ", sem criar outra categoria

  # --- RN-05 / D12 --------------------------------------------------------------
  Cenário: Recusar nº de parcelas fora do intervalo
    Quando eu tento registrar uma compra em 30x
    Então vejo a mensagem de erro "Nº de parcelas deve ser de 2 a 24."
    E o diálogo continua aberto com os dados preenchidos

  Cenário: Recusar parcela neste mês maior que o total
    Quando eu tento registrar uma compra em 5x com "Parcela neste mês" igual a 6
    Então vejo a mensagem de erro "A parcela neste mês deve ser de 1 a 5."

  # --- RF-05 / RN-06 / D8 -------------------------------------------------------
  Cenário: Editar o valor total recalcula todas as parcelas
    Dado que registrei "Fone" de R$ 100,00 em 3x em outubro de 2026
    Quando eu toco em "Editar lançamento" na parcela "1/3"
    Então vejo o diálogo "Editar compra parcelada" com "Parcela neste mês" igual a 1 e "Começa na parcela" igual a 1
    E vejo o aviso "As mudanças valem para todas as parcelas, menos as que estão em categorias fechadas."
    Quando eu mudo o valor total para "120" e salvo
    Então a parcela "1/3" passa a valer R$ 40,00
    E "Próximos meses" mostra R$ 40,00 em novembro e em dezembro de 2026

  Cenário: Editar a partir de uma parcela do meio
    Dado que registrei "Geladeira" em 10x com a parcela 3 em outubro de 2026
    Quando eu edito a parcela "3/10" e mudo o nº de parcelas para 12
    Então as parcelas vão até a "12/12", prevista para julho de 2027

  # --- RN-06 / D9 ---------------------------------------------------------------
  Cenário: Corrigir a parcela inicial
    Dado que registrei "Geladeira" em 10x com "Parcela neste mês" igual a 3 em outubro de 2026
    Quando eu edito a parcela "3/10" e mudo "Parcela neste mês" para 4 e "Começa na parcela" para 4
    Então outubro de 2026 tem a parcela "4/10"
    E as parcelas 5 a 10 ficam previstas de novembro de 2026 a abril de 2027

  Cenário: Incluir parcelas anteriores mudando a parcela inicial
    Dado que "Eletrônicos" existe em agosto e setembro de 2026
    E que registrei "Geladeira" em 10x com "Parcela neste mês" igual a 3 em outubro de 2026
    Quando eu edito a parcela "3/10" e mudo "Começa na parcela" para 1
    Então agosto e setembro de 2026 ganham as parcelas "1/10" e "2/10"

  # --- RN-07 / RN-08 / D8 -------------------------------------------------------
  Cenário: Editar a compra sem mexer na parcela fixa
    Dado que registrei "TV" de R$ 900,00 em 6x a partir de agosto de 2026
    E que fechei "Eletrônicos" de agosto de 2026
    Quando eu edito a parcela "3/6" e mudo o valor total para "1200"
    Então a parcela "1/6" de agosto continua com R$ 150,00
    E as parcelas "2/6" e "3/6" passam a valer R$ 200,00

  Cenário: Edição recusada por tirar a parcela fixa do lugar
    Dado que registrei "TV" em 6x a partir de agosto de 2026
    E que fechei "Eletrônicos" de agosto de 2026
    Quando eu edito a parcela "3/6" e mudo "Começa na parcela" para 2
    Então vejo a mensagem de erro "A parcela 1/6 está numa categoria fechada e não pode mudar de mês nem sair da compra."
    E nenhuma parcela muda

  Cenário: Excluir a compra mantém as parcelas fixas
    Dado que registrei "TV" em 6x com parcelas em agosto, setembro e outubro de 2026
    E que fechei "Eletrônicos" de agosto de 2026
    Quando eu toco em "Excluir lançamento" na parcela "3/6"
    Então o sistema pede confirmação para "Remover a compra parcelada “TV” e todas as suas parcelas? As parcelas em categorias fechadas ficam. Esta ação não pode ser desfeita."
    Quando eu confirmo
    Então as parcelas de setembro e outubro de 2026 somem
    E a parcela "1/6" de agosto continua lá, como lançamento comum
    E "Próximos meses" não mostra mais parcelas de "TV"

  # --- RN-09 --------------------------------------------------------------------
  Cenário: A camada de dados não altera uma parcela sozinha
    Dado que a parcela "1/3" de "Fone" é o lançamento de id 50
    Quando a camada de dados recebe um pedido para excluir o lançamento 50
    Então a operação falha com "Este lançamento é uma parcela. Altere a compra parcelada."

  # --- RF-08 --------------------------------------------------------------------
  Cenário: Lançamento comum não vira parcelado
    Dado que "Eletrônicos" tem o lançamento comum "Cabo"
    Quando eu edito "Cabo"
    Então não vejo o interruptor "Compra parcelada"

  # --- RN-10 --------------------------------------------------------------------
  Cenário: Recusar excluir categoria com parcelas
    Dado que "Eletrônicos" de outubro de 2026 tem a parcela "1/3" de "Fone"
    Quando eu removo "Eletrônicos" e confirmo
    Então vejo a mensagem de erro "Esta categoria tem parcelas. Exclua a compra parcelada antes."
    E "Eletrônicos" continua lá

  # --- RN-11 / D10 --------------------------------------------------------------
  Cenário: Renomear a categoria leva as próximas parcelas junto
    Dado que registrei "Fone" em 3x em "Eletrônicos" em outubro de 2026
    Quando eu renomeio "Eletrônicos" de outubro de 2026 para "Tecnologia"
    Então a prévia de novembro de 2026 mostra "Fone" "2/3" no grupo "Tecnologia"
    Quando novembro de 2026 começa do zero
    Então a parcela "2/3" entra na categoria "Tecnologia"

  # --- RN-12 --------------------------------------------------------------------
  Cenário: Remover o cartão apaga as compras parceladas
    Dado que "Nubank" e "Inter" têm compras parceladas
    Quando eu removo "Inter" e confirmo
    Então as compras parceladas de "Inter" somem
    E as de "Nubank" continuam iguais

  # --- RF-07 / RN-13 / D11 ------------------------------------------------------
  Cenário: Ver o que está comprometido nos próximos meses
    Dado que registrei "Fone" de R$ 100,00 em 3x e "Notebook" de R$ 3.000,00 em 10x em outubro de 2026
    Quando eu abro o Histórico
    Então vejo a seção "Próximos meses"
    E novembro de 2026 mostra R$ 333,33 em 2 parcelas
    E dezembro de 2026 mostra R$ 333,33 em 2 parcelas
    E janeiro de 2027 mostra R$ 300,00 em 1 parcela
    Quando eu toco em novembro de 2026
    Então vejo a prévia de novembro de 2026

  Cenário: Próximos meses é do cartão selecionado
    Dado que só "Inter" tem compras parceladas
    E que o cartão selecionado é "Nubank"
    Quando eu abro o Histórico
    Então não vejo a seção "Próximos meses"

  # --- RN-16 / D13 --------------------------------------------------------------
  Cenário: Migrar dados v3
    Dado que o app tem dados no formato v3 com 2 cartões, meses, categorias e lançamentos
    Quando eu abro a nova versão do app
    Então os dados ficam no formato v4, com a lista de compras parceladas vazia
    E os cartões, meses, categorias e lançamentos continuam iguais
```

### Matriz de cobertura

| Requisito | Cenário(s) |
| --------- | ---------- |
| RF-01, RF-02, RF-03, RF-04, D1, D3 | Registrar uma compra nova em 3x |
| RF-05, RN-06 | Editar o valor total recalcula todas as parcelas / Editar a partir de uma parcela do meio |
| RF-06, RN-08 | Excluir a compra mantém as parcelas fixas |
| RF-07, RN-13, D11 | Ver o que está comprometido nos próximos meses / Próximos meses é do cartão selecionado |
| RF-08 | Lançamento comum não vira parcelado |
| RF-09, RN-14, D5 | Abrir a prévia de um mês futuro / Mês futuro sem parcelas previstas não abre / A prévia não grava nada |
| RN-01 | Registrar uma compra nova em 3x / Cadastrar uma compra já em andamento |
| RN-02 | Registrar uma compra nova em 3x / Dia que não existe no mês da parcela |
| RN-03, D4, D6 | A parcela entra quando o mês começa (copiando e do zero) / Mês pulado recebe a parcela / Compra registrada num mês passado / Compra recusada por cair em categoria fechada |
| RN-04 | Categoria com outra grafia é reaproveitada |
| RN-05, D12 | Recusar nº de parcelas fora do intervalo / Recusar parcela neste mês maior que o total |
| RN-07, D8 | Editar a compra sem mexer na parcela fixa / Edição recusada por tirar a parcela fixa do lugar |
| D9 | Corrigir a parcela inicial / Incluir parcelas anteriores mudando a parcela inicial |
| RN-09 | A camada de dados não altera uma parcela sozinha |
| RN-10 | Recusar excluir categoria com parcelas |
| RN-11, D10 | Renomear a categoria leva as próximas parcelas junto |
| RN-12 | Remover o cartão apaga as compras parceladas |
| RN-15 | A parcela entra quando o mês começa, copiando as categorias |
| RN-16, D13 | Migrar dados v3 |
| D2 | Só a parcela do mês entra no comprometido |
| D7 | Cadastrar uma compra já em andamento |

## 6. Modelo de dados e migração

### 6.1 Estado v4 (`src/data/store.ts`)

```ts
export type StoredPurchase = {
  id: number;
  cardId: number;
  categoryName: string;      // nome da categoria da compra (RN-04, RN-11)
  description: string;
  totalAmount: number;
  installmentCount: number;  // N, de 2 a 24
  firstInstallment: number;  // parcela inicial
  firstMonth: MonthKey;      // mês da parcela inicial
  day: number;               // dia da compra, de 1 a 31 (RN-02)
};

export type StoredMovement = {
  id: number; categoryId: number; description: string; amount: number; date: string;
  purchaseId?: number;       // só nas parcelas ligadas a uma compra
  installment?: number;      // k
  installmentCount?: number; // N, mantido também nas parcelas fixas de compras excluídas (RN-08)
};

type State = {
  version: 4;
  nextId: number;
  selectedCardId: number | null;
  cards: StoredCard[];
  months: StoredMonth[];
  categories: StoredCategory[];
  movements: StoredMovement[];
  purchases: StoredPurchase[];   // novo
};
```

As parcelas previstas não são guardadas. Elas são calculadas a partir da compra, e o par `(purchaseId, installment)` impede gravar a mesma parcela duas vezes.

### 6.2 Migração

Ela fica encadeada em `load()`:

1. `version === 4` → usar o estado como está.
2. `version === 3` → `migrateV3`: `{ ...v3, version: 4, purchases: [] }`.
3. `version === 2` → `migrateV3(migrateV2(v2))`. `version === 1` → `migrateV3(migrateV2(migrateV1(v1)))`.
4. Qualquer outro valor, ou JSON inválido → `emptyState()`.

O estado migrado é gravado logo depois da migração, como hoje.

## 7. Contrato da camada de dados

### 7.1 `src/data/store.ts`

```ts
export type PurchaseInput = {
  description: string;
  totalAmount: number;
  installmentCount: number;
  installment: number;         // a parcela que cai no mês de `date`
  firstInstallment?: number;   // só na edição; na criação é igual a `installment`
  date: string;                // dentro do mês da categoria
};
export type Movement = StoredMovement & {
  purchase?: { id: number; totalAmount: number; installmentCount: number; firstInstallment: number };
};
export type PlannedInstallment = { purchaseId: number; description: string; installment: number; installmentCount: number; amount: number; date: string };
export type MonthPreview = { month: MonthKey; amount: number; groups: { categoryName: string; amount: number; installments: PlannedInstallment[] }[] };
export type FutureInstallments = { month: MonthKey; amount: number; count: number };
```

| Função | Mudança |
| ------ | ------- |
| `createPurchase(categoryId, input)` | **Nova.** Valida a RN-05, cria a compra com `firstInstallment = input.installment` e grava as parcelas (RN-03). |
| `updatePurchase(purchaseId, categoryId, input)` | **Nova.** Aplica a RN-05, a RN-06 e a RN-07. |
| `deletePurchase(purchaseId)` | **Nova.** Aplica a RN-08. |
| `getFutureInstallments(cardId)` | **Nova.** Segue a RN-13. |
| `getMonthPreview(cardId, month)` | **Nova.** As parcelas previstas do cartão no mês, agrupadas pelo nome da categoria (RF-09). |
| `getLastPlannedMonth()` | **Nova.** O último mês com parcela prevista em qualquer cartão, ou `null` (RN-14). |
| `getCards(month)`, `getConsolidated(month)` | Num mês futuro, seguem a RN-14. |
| `getMovements(categoryId)` | Cada parcela ligada a uma compra vem com `purchase`. |
| `startMonth` | Segue a RN-15 e, no fim, grava as parcelas do cartão (RN-03). |
| `updateCategory` | Segue a RN-11. |
| `updateMovement`, `deleteMovement` | Seguem a RN-09. |
| `deleteCategory` | Segue a RN-10. |
| `deleteCard` | Segue a RN-12. |

Helpers internos novos:

- `installmentAmount(purchase, k)` (RN-01);
- `installmentMonth(purchase, k)` e `installmentDate(purchase, k)` (RN-02, com `shiftMonth` e `lastDayOf` de `src/lib/format.ts`);
- `plannedOf(state, cardId, month?)`: as parcelas previstas;
- `syncPurchases(state, cardId)`: grava as parcelas que faltam (RN-03).

### 7.2 `src/data/api.ts`

- **Hooks novos:** `useCreatePurchase`, `useUpdatePurchase`, `useDeletePurchase`, `useGetFutureInstallments`, `useGetMonthPreview` e `useGetLastPlannedMonth`.
- **Keys novas:** `['installments', cardId]`, `['installments', cardId, 'preview', month]` e `['installments', 'last']`. Sem argumento, `['installments']` funciona como prefixo.
- O `refresh()` do painel também invalida `installments`, `months` e `movements`, porque gravar parcelas pode iniciar meses e mexer em outras categorias.

## 8. Interface

### 8.1 Rotas (`src/App.tsx`)

- `#/mes/AAAA-MM` aceita um mês futuro até `getLastPlannedMonth()` (RN-14).
- Enquanto a consulta carrega, a rota não redireciona.
- Depois desse mês, ou sem parcelas previstas, a rota volta para `/`.

### 8.2 Diálogo de lançamento (`src/pages/dashboard.tsx`)

- **Interruptor "Compra parcelada":** um `role="switch"` abaixo da descrição. Aparece só na criação (RF-08) e vem ligado e travado na edição de uma parcela.
- **Com o interruptor ligado:**
  - o rótulo do valor vira "Valor total da compra";
  - aparece uma linha com os campos numéricos "Nº de parcelas" e "Parcela neste mês", e, só na edição, "Começa na parcela";
  - a prévia (RF-02) fica abaixo da data.
- **Edição de parcela:** o aviso da RF-05 fica acima dos botões.

### 8.3 Lista de lançamentos

- O selo "k/N" é um `span` pequeno, no estilo do selo "Encerrado", e aparece em todo lançamento com `installment`.
- Numa parcela ligada a uma compra:
  - "Editar lançamento" abre o diálogo em modo de compra;
  - "Excluir lançamento" usa a confirmação da RF-06 e chama `deletePurchase`.

### 8.4 Prévia de mês futuro (`src/pages/dashboard.tsx`)

- **Navegação:** a seta "Próximo mês" fica habilitada enquanto `month < getLastPlannedMonth()`.
- **O que muda:** num mês futuro, o painel mostra a faixa de prévia e esconde "Registrar gasto", "Nova categoria" e o diálogo de virada de mês. O bloco "O mês em perspectiva" mostra só o total previsto.
- **Parcelas previstas:** a lista vem de `useGetMonthPreview` e ocupa o lugar das seções de categorias e lançamentos.
- **Carrossel:** continua permitindo trocar de cartão, e a prévia acompanha o cartão selecionado.

### 8.5 Histórico (`src/pages/historico.tsx`)

- A seção "Próximos meses" fica acima da lista de meses e usa o visual dos cartões de mês.
- Cada linha mostra "‹Mês de AAAA›", o total em `money` e "‹n› parcela(s)", e abre a prévia.

## 9. Fora de escopo

- Antecipar ou quitar parcelas.
- Juros, IOF ou parcelas com valores diferentes (além do resto da parcela 1).
- Lançar ou criar categorias em meses futuros.
- Visão de próximos meses consolidada com todos os cartões no Histórico.
- Transformar um lançamento comum em parcelado, ou o contrário.
- Levar a renomeação para as parcelas já gravadas em outros meses (RN-11).

## 10. Critérios de aceite

- [x] Todos os cenários da seção 5 passam. As regras de dados foram verificadas com um script contra `store.ts` (55 verificações, com a data simulada).
  - Conferido no navegador: o interruptor, a prévia do diálogo, o selo, a edição de uma parcela, o diálogo sem interruptor num lançamento comum, a prévia de novembro e dezembro, o redirecionamento depois do último mês previsto e "Próximos meses" no Histórico.
  - A exclusão pela parcela (que abre um `confirm`), a virada de mês e as mensagens de erro foram verificadas só pelo script, não na tela.
- [x] `npm run typecheck` e `npm run build` passam sem erros.
- [x] Dados v3 migram para v4 sem perda (verificado com dados de exemplo, incluindo a cadeia v1 → v4; falta conferir com os dados reais do aparelho).
- [x] Em 360px de largura, o diálogo de edição de parcela (com os três campos), a prévia e o Histórico não têm rolagem horizontal.
- [x] `FUNCIONALIDADES.md`, `specs/historico-mensal.md` (nota sobre meses futuros) e o README foram atualizados.
- [ ] O APK de debug instala e abre no aparelho com os dados preservados (não testado nesta sessão).

## 11. Tarefas

1. **Store, modelo:** tipos v4, `migrateV3` e a cadeia de migração em `load()`.
2. **Store, cálculo:** `installmentAmount`, `installmentMonth`, `installmentDate`, `plannedOf` e `syncPurchases`, além da prévia em `summaryOf` para meses futuros.
3. **Store, funções:**
   - funções novas `createPurchase`, `updatePurchase`, `deletePurchase`, `getFutureInstallments`, `getMonthPreview` e `getLastPlannedMonth`;
   - ajustes em `startMonth`, `updateCategory`, `getMovements`, `updateMovement`, `deleteMovement`, `deleteCategory` e `deleteCard`.
4. **API:** hooks e keys `installments`.
5. **Rotas:** meses futuros até o último mês previsto.
6. **Painel:** interruptor, campos e prévia no diálogo; selo na lista; edição e exclusão pela compra; prévia de mês futuro; `refresh()` ampliado.
7. **Histórico:** seção "Próximos meses".
8. **Documentação:**
   - `FUNCIONALIDADES.md`: seção nova com link para esta spec e ajustes nos cenários de excluir categoria, editar lançamento e navegar para meses futuros;
   - `specs/historico-mensal.md`: nota de revisão sobre meses futuros abrirem como prévia;
   - README: formato v4, parcelas como lançamento comum e prévia.
9. **Verificação:** percorrer a seção 12 e marcar os critérios de aceite.

## 12. Verificação

1. `npm run typecheck` e `npm run build`.
2. **Script de regras:** um script via Vite SSR contra `store.ts`, fingindo a data atual, cobrindo:
   - divisão de centavos, fim de mês e compra em andamento;
   - gravação ao iniciar o mês: com cópia, do zero e com mês pulado;
   - categoria com outra grafia e renomeação;
   - edição (inclusive da parcela inicial) e exclusão com parcelas fixas, e os bloqueios;
   - RN-09, RN-10 e RN-12;
   - prévia, próximos meses e último mês previsto;
   - migração v3.
3. **Navegador** (`npm run dev`):
   - registrar uma compra em 3x e uma em andamento, e conferir o selo e a prévia do diálogo;
   - navegar até as prévias de meses futuros;
   - editar e excluir pela parcela;
   - conferir "Próximos meses" no Histórico.
4. **360px:** conferir que o diálogo, a prévia e o Histórico não ganham rolagem horizontal.
