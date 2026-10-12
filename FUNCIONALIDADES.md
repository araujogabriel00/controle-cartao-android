# Funcionalidades — Controle do Cartão (BDD)

Especificação das funcionalidades no formato BDD (Gherkin, em português), levantada a partir do comportamento do app em `src/pages/` e das regras em `src/data/store.ts`.

> **Observação:** nesta versão Android não há servidor. Os dados ficam no próprio aparelho e todos os cálculos (valor usado, disponível, percentual e totais da visão geral) são feitos em `src/data/store.ts`. Os cenários marcados com `@regra` descrevem essas regras de cálculo e validação.
>
> Todos os valores são calculados **dentro de um mês**: cartão, categorias, lançamentos e visão geral mostram só o mês que está aberto no painel. O funcionamento por mês está detalhado na seção [9. Histórico mensal](#9-histórico-mensal) e na spec [`specs/historico-mensal.md`](specs/historico-mensal.md).
>
> O app aceita **vários cartões**, e cada um tem o próprio limite, meses, categorias e lançamentos. As categorias, os lançamentos, a visão geral e o histórico mostram sempre o **cartão selecionado** no carrossel. Os detalhes estão na seção [10. Múltiplos cartões](#10-múltiplos-cartões) e na spec [`specs/multiplos-cartoes.md`](specs/multiplos-cartoes.md).
>
> Uma **compra parcelada** vira um lançamento comum em cada mês em que cai, e os meses futuros abrem só como prévia das parcelas. Os detalhes estão na seção [11. Parcelamento](#11-parcelamento) e na spec [`specs/parcelamento.md`](specs/parcelamento.md).

## Sumário

1. [Cartão](#1-cartão)
2. [Categorias de gastos](#2-categorias-de-gastos)
3. [Movimentações](#3-movimentações)
4. [Visão geral do mês](#4-visão-geral-do-mês)
5. [Sincronização e atualização](#5-sincronização-e-atualização)
6. [Carregamento e erros](#6-carregamento-e-erros)
7. [Formulários](#7-formulários)
8. [Formatação](#8-formatação)
9. [Histórico mensal](#9-histórico-mensal)
10. [Múltiplos cartões](#10-múltiplos-cartões)
11. [Parcelamento](#11-parcelamento)

---

## 1. Cartão

O cadastro do primeiro cartão está abaixo. Adicionar outros cartões, trocar entre eles e as cores estão na seção [10. Múltiplos cartões](#10-múltiplos-cartões).

```gherkin
# language: pt
Funcionalidade: Gerenciar o cartão
  Como usuário
  Quero cadastrar meu cartão com o seu limite
  Para acompanhar quanto do limite já está comprometido

  Cenário: Primeiro acesso sem cartão cadastrado
    Dado que não existe nenhum cartão cadastrado
    Quando eu abro o aplicativo
    Então vejo o convite "Vamos anotar o seu cartão?"
    E vejo o botão "Cadastrar cartão"
    E o botão "Nova categoria" está desabilitado

  Cenário: Cadastrar o primeiro cartão
    Dado que não existe nenhum cartão cadastrado
    Quando eu clico em "Cadastrar cartão"
    Então o formulário "Seu cartão" abre com a cor verde marcada
    Quando eu preencho o nome do cartão com "Cartão principal"
    E preencho o limite total com "5000"
    E clico em "Adicionar"
    Então vejo a mensagem "Alterações salvas com cuidado."
    E vejo a face verde do cartão "Cartão principal" no carrossel, selecionada
    E o limite exibido é "R$ 5.000,00"
    E o mês atual passa a fazer parte do histórico desse cartão com esse limite

  Cenário: Exibir a situação do cartão
    Dado que o cartão selecionado tem limite de R$ 5.000,00
    E R$ 1.250,00 já estão comprometidos
    Quando eu vejo a face do cartão no carrossel
    Então vejo "Disponível para usar" com o valor "R$ 3.750,00"
    E vejo "Já comprometido" com o valor "R$ 1.250,00"
    E vejo "Limite utilizado" com "25%"
    E a barra de progresso do limite está preenchida em 25%

  Cenário: Cartão ainda sem gastos
    Dado que o cartão selecionado não tem nenhum valor comprometido
    Quando eu vejo a face do cartão no carrossel
    Então vejo a mensagem "Seu primeiro gasto ainda está por vir. Tudo começa com um registro."

  Cenário: Editar o cartão
    Dado que existe um cartão selecionado
    Quando eu clico em "Editar cartão" na face do cartão
    Então o formulário "Ajustar cartão" abre preenchido com o nome, o limite atual e a cor
    Quando eu altero o limite para "6000"
    E clico em "Salvar alterações"
    Então vejo a mensagem "Alterações salvas com cuidado."
    E o limite exibido é "R$ 6.000,00"
    E o limite dos meses anteriores e dos outros cartões não muda

  Cenário: Remover o único cartão
    Dado que existe só o cartão "Cartão principal"
    Quando eu clico em "Remover cartão"
    Então o sistema pede confirmação para "Remover o cartão “Cartão principal” e todos os seus registros? Esta ação não pode ser desfeita."
    Quando eu confirmo
    Então vejo a mensagem "Cartão “Cartão principal” removido."
    E volto a ver o convite "Vamos anotar o seu cartão?"
    E os meses, categorias e lançamentos do cartão são apagados, inclusive o histórico dele

  Cenário: Desistir de remover o cartão
    Dado que existe um cartão selecionado
    Quando eu clico em "Remover cartão"
    E cancelo a confirmação
    Então o cartão continua cadastrado

  @regra
  Cenário: Percentual acima de 100% não estoura a barra
    Dado que o valor comprometido é maior que o limite do cartão
    Quando eu vejo a face do cartão no carrossel
    Então a barra de progresso fica limitada a 100%
```

## 2. Categorias de gastos

```gherkin
# language: pt
Funcionalidade: Planejar o orçamento por categorias
  Como usuário
  Quero separar meu limite em categorias com orçamento próprio
  Para saber quanto ainda posso gastar em cada uma

  Contexto:
    Dado que existe um cartão cadastrado

  Cenário: Nenhuma categoria criada
    Dado que não existe nenhuma categoria
    Quando eu vejo a seção "Categorias de gastos" na aba "Em andamento"
    Então vejo a mensagem "Uma categoria de cada vez."
    E vejo o link "Criar minha primeira categoria"

  Cenário: Criar uma categoria
    Dado que estou vendo o painel de um mês
    Quando eu clico em "Nova categoria"
    E preencho o nome da categoria com "Mercado"
    E preencho o orçamento planejado com "800"
    E clico em "Adicionar"
    Então vejo a mensagem "Alterações salvas com cuidado."
    E a categoria "Mercado" aparece na aba "Em andamento"
    E o contador da aba "Em andamento" aumenta em 1
    E a categoria pertence ao mês que está aberto no painel

  Cenário: Exibir o andamento de uma categoria
    Dado que existe a categoria "Mercado" com orçamento de R$ 800,00
    E R$ 200,00 já foram gastos nela
    Quando eu vejo a categoria "Mercado"
    Então vejo "R$ 200,00 usado de R$ 800,00"
    E vejo "R$ 600,00" como disponível
    E vejo o percentual "25%"

  Esquema do Cenário: Cor da barra de progresso da categoria
    Dado que existe uma categoria <situação> com <percentual>% do orçamento usado
    Quando eu vejo a categoria na lista
    Então a barra de progresso aparece na cor <cor>

    Exemplos:
      | situação | percentual | cor     |
      | aberta   | 50         | verde   |
      | aberta   | 85         | verde   |
      | aberta   | 86         | pêssego |
      | fechada  | 40         | dourada |

  Cenário: Editar uma categoria
    Dado que existe a categoria "Mercado"
    Quando eu abro o menu de ações da categoria "Mercado"
    E clico em "Editar categoria"
    Então o formulário "Editar categoria" abre preenchido com o nome e o orçamento atuais
    Quando eu altero o orçamento para "1000"
    E clico em "Salvar alterações"
    Então vejo a mensagem "Alterações salvas com cuidado."
    E a categoria "Mercado" mostra o orçamento de "R$ 1.000,00"

  Cenário: Fechar uma categoria
    Dado que existe a categoria aberta "Mercado"
    Quando eu abro o menu de ações da categoria "Mercado"
    E clico em "Fechar"
    Então vejo a mensagem "Planejamento atualizado."
    E a categoria "Mercado" sai da aba "Em andamento"
    E a categoria "Mercado" aparece na aba "Fechadas" com o selo "Encerrado"

  @regra
  Cenário: Categoria fechada é consolidada no saldo do cartão
    Dado que a categoria "Mercado" tem R$ 650,00 gastos
    Quando eu fecho a categoria "Mercado"
    Então o orçamento dela deixa de contar em "Orçamentos em aberto"
    E os R$ 650,00 passam a contar em "Categorias fechadas"
    E o valor gasto continua comprometido no saldo do cartão

  Cenário: Reabrir uma categoria
    Dado que existe a categoria fechada "Mercado"
    Quando eu vou para a aba "Fechadas"
    E abro o menu de ações da categoria "Mercado"
    E clico em "Reabrir"
    Então vejo a mensagem "Planejamento atualizado."
    E a categoria "Mercado" volta para a aba "Em andamento"

  Cenário: Remover uma categoria
    Dado que existe a categoria "Mercado"
    Quando eu abro o menu de ações da categoria "Mercado"
    E clico em "Remover"
    Então o sistema pede confirmação para "Remover a categoria “Mercado”? Esta ação não pode ser desfeita."
    Quando eu confirmo
    Então vejo a mensagem "Envelope removido."
    E a categoria "Mercado" não aparece mais na lista

  @regra
  Cenário: Categoria com parcelas não pode ser removida
    Dado que a categoria "Eletrônicos" tem a parcela "1/3" de uma compra parcelada
    Quando eu removo "Eletrônicos" e confirmo
    Então vejo a mensagem de erro "Esta categoria tem parcelas. Exclua a compra parcelada antes."

  Cenário: Renomear uma categoria com parcelas
    Dado que a categoria "Eletrônicos" tem a parcela "1/3" de "Fone"
    Quando eu renomeio "Eletrônicos" para "Tecnologia"
    Então as parcelas de "Fone" dos próximos meses passam a cair em "Tecnologia"

  Cenário: Alternar entre categorias abertas e fechadas
    Dado que existem 3 categorias abertas e 1 fechada
    Então a aba "Em andamento" mostra o contador "3"
    E a aba "Fechadas" mostra o contador "1"
    Quando eu clico na aba "Fechadas"
    Então vejo apenas a categoria fechada

  Cenário: Nenhuma categoria fechada
    Dado que não existe categoria fechada
    Quando eu clico na aba "Fechadas"
    Então vejo a mensagem "Nenhuma categoria fechada."
    E vejo "Quando uma categoria terminar, ela ficará guardada aqui."

  Cenário: Não é possível criar categoria sem cartão
    Dado que não existe cartão cadastrado
    Então o botão "Nova categoria" está desabilitado
```

## 3. Movimentações

```gherkin
# language: pt
Funcionalidade: Registrar e acompanhar gastos
  Como usuário
  Quero registrar cada gasto em uma categoria
  Para que o orçamento e o limite do cartão fiquem sempre atualizados

  Contexto:
    Dado que existe um cartão cadastrado
    E existe a categoria aberta "Mercado"

  Cenário: Registrar um gasto
    Quando eu clico em "Registrar gasto"
    Então o formulário "Novo lançamento" abre com a data de hoje preenchida
    Mas se o painel mostra um mês passado, a data preenchida é o último dia daquele mês
    E a primeira categoria aberta vem selecionada
    Quando eu escolho a categoria "Mercado"
    E preencho "O que foi?" com "Mercado da semana"
    E preencho o valor confirmado com "235,90"
    E clico em "Adicionar"
    Então vejo a mensagem "Lançamento confirmado."
    E o lançamento "Mercado da semana" aparece em "O que já aconteceu"

  @regra
  Cenário: Gasto atualiza a categoria e o cartão
    Dado que a categoria "Mercado" tem R$ 0,00 usado de R$ 800,00
    Quando eu registro um gasto de R$ 200,00 em "Mercado"
    Então a categoria "Mercado" mostra "R$ 200,00 usado de R$ 800,00"
    E o valor "Já comprometido" do cartão aumenta em R$ 200,00
    E o valor "Disponível para usar" do cartão diminui em R$ 200,00

  @regra
  Cenário: Data do lançamento dentro do mês da categoria
    Dado que a categoria "Mercado" pertence a outubro de 2026
    Quando eu abro o formulário "Novo lançamento"
    Então o campo "Data da compra" só aceita datas de 01/10/2026 a 31/10/2026
    Quando eu tento salvar um lançamento em "Mercado" com data 05/11/2026
    Então vejo a mensagem de erro "A data deve estar dentro de outubro de 2026."
    E a mesma regra vale ao editar um lançamento

  Cenário: Só categorias abertas aceitam novos gastos
    Dado que existe também a categoria fechada "Viagem"
    Quando eu abro o formulário "Novo lançamento"
    Então a categoria "Viagem" não aparece na lista de envelopes

  Cenário: Não há categoria aberta
    Dado que todas as categorias estão fechadas
    Então o botão "Registrar gasto" está desabilitado

  Cenário: Ver os gastos de uma categoria
    Dado que a categoria "Mercado" tem lançamentos
    Quando eu clico na categoria "Mercado" na lista de categorias
    Então a seção "O que já aconteceu" mostra os lançamentos de "Mercado"
    E cada lançamento mostra a descrição, a data e o valor com sinal de menos

  Cenário: Trocar a categoria exibida pelo seletor
    Dado que existem as categorias "Mercado" e "Casa" no mês aberto
    Quando eu escolho "Casa" no seletor da seção "O que já aconteceu"
    Então vejo os lançamentos de "Casa"

  Cenário: Categoria exibida por padrão
    Dado que nenhuma categoria foi selecionada
    Quando eu abro o aplicativo
    Então a seção "O que já aconteceu" mostra a primeira categoria aberta
    Mas se não houver categoria aberta, mostra a primeira categoria da lista

  Cenário: Lista longa de lançamentos
    Dado que a categoria "Mercado" tem 8 lançamentos
    Quando eu vejo a seção "O que já aconteceu"
    Então vejo apenas 5 lançamentos
    E vejo o botão "Ver mais 3 lançamentos"
    Quando eu clico em "Ver mais 3 lançamentos"
    Então vejo os 8 lançamentos
    E vejo o botão "Mostrar menos"

  Cenário: Categoria sem lançamentos
    Dado que a categoria "Mercado" não tem lançamentos
    Quando eu vejo a seção "O que já aconteceu"
    Então vejo a mensagem "Ainda sem lançamentos"
    E vejo "Os gastos de “Mercado” aparecem aqui assim que você registrar."
    E vejo o link "Registrar o primeiro gasto"

  Cenário: Registrar o primeiro gasto pelo atalho
    Dado que a categoria "Mercado" não tem lançamentos
    Quando eu clico em "Registrar o primeiro gasto"
    Então o formulário "Novo lançamento" abre com a categoria "Mercado" selecionada

  Cenário: Editar um lançamento
    Dado que a categoria "Mercado" tem o lançamento "Mercado da semana"
    Quando eu clico em "Editar lançamento" no lançamento "Mercado da semana"
    Então o formulário "Editar lançamento" abre preenchido com a categoria, descrição, valor e data
    Quando eu altero o valor para "250"
    E clico em "Salvar alterações"
    Então vejo a mensagem "Lançamento atualizado."
    E o lançamento mostra "− R$ 250,00"
    Mas se o lançamento for uma parcela, abre "Editar compra parcelada" (seção 11)

  Cenário: Excluir um lançamento
    Dado que a categoria "Mercado" tem o lançamento "Mercado da semana"
    Quando eu clico em "Excluir lançamento" no lançamento "Mercado da semana"
    Então o sistema pede confirmação para "Remover o lançamento “Mercado da semana”? Esta ação não pode ser desfeita."
    Quando eu confirmo
    Então vejo a mensagem "Lançamento excluído."
    E o lançamento não aparece mais na lista
    Mas se o lançamento for uma parcela, a exclusão remove a compra parcelada inteira (seção 11)

  Cenário: Lançamentos de categoria fechada não podem ser alterados
    Dado que a categoria "Viagem" está fechada e tem lançamentos
    Quando eu vejo os lançamentos de "Viagem"
    Então não vejo as ações "Editar lançamento" e "Excluir lançamento"
    E não vejo o link "Registrar o primeiro gasto"

  Cenário: Sem nenhuma categoria criada
    Dado que não existe nenhuma categoria
    Quando eu vejo a seção "O que já aconteceu"
    Então vejo "Crie uma categoria para começar a registrar seus gastos."
```

## 4. Visão geral do mês

```gherkin
# language: pt
Funcionalidade: Visão geral do mês
  Como usuário
  Quero ver um resumo do planejamento
  Para entender rapidamente como está o mês

  Contexto:
    Dado que existe um cartão cadastrado

  Cenário: Exibir o resumo
    Dado que outubro de 2026 tem as categorias abertas "Mercado" (R$ 800,00) e "Casa" (R$ 1.200,00)
    E tem a categoria fechada "Viagem" com R$ 650,00 gastos
    Quando eu vejo o painel "O mês em perspectiva" de outubro de 2026
    Então vejo o título "Outubro de 2026"
    E vejo "Orçamentos em aberto" com "R$ 2.000,00"
    E vejo "Categorias fechadas" com "R$ 650,00"
    E vejo "2 categorias ativas para o que importa neste mês."

  Cenário: Resumo de um mês passado
    Dado que estou vendo o painel de setembro de 2026
    Então o resumo considera só as categorias de setembro
    E vejo "categorias ativas para o que importa em setembro."

  @regra
  Cenário: Cálculo do comprometido do cartão
    Dado que o mês aberto tem categorias abertas com orçamentos que somam R$ 2.000,00
    E categorias fechadas com gastos que somam R$ 650,00
    Então "Já comprometido" é R$ 2.650,00
    E "Disponível para usar" é o limite do mês menos R$ 2.650,00
```

## 5. Sincronização e atualização

```gherkin
# language: pt
Funcionalidade: Status e atualização dos dados
  Como usuário
  Quero saber que meus dados estão em dia
  Para confiar nos valores exibidos

  Cenário: Dados salvos no aparelho
    Dado que os dados ficam salvos no próprio aparelho, sem servidor
    Então vejo o indicador verde "Seu caderno está em dia"

  Cenário: Atualizar os dados manualmente
    Quando eu clico em "Atualizar"
    Então o cartão, a visão geral, as categorias, o histórico e os lançamentos da categoria exibida são recarregados
    E o ícone de atualizar gira enquanto o cartão é recarregado

  Cenário: Atualizar ao voltar para a janela
    Dado que eu saí da aba do aplicativo
    Quando eu volto para a aba
    Então o cartão, a visão geral, as categorias e os lançamentos são recarregados
```

## 6. Carregamento e erros

```gherkin
# language: pt
Funcionalidade: Carregamento e tratamento de erros
  Como usuário
  Quero ser avisado quando algo dá errado
  Para poder tentar de novo sem perder minhas informações

  Cenário: Carregando os dados
    Dado que o cartão, as categorias ou a visão geral ainda estão carregando
    Então vejo blocos de carregamento no lugar do conteúdo

  Cenário: Falha ao carregar os dados principais
    Dado que a busca do cartão, das categorias ou da visão geral falhou
    Então vejo a mensagem "Vamos tentar de novo?"
    E vejo "Não conseguimos abrir seu caderno agora. Sua informação continua segura."
    Quando eu clico em "Tentar novamente"
    Então o cartão, as categorias e a visão geral são buscados de novo

  Cenário: Falha ao carregar os lançamentos
    Dado que a busca dos lançamentos da categoria falhou
    Então vejo "Não foi possível carregar os lançamentos."
    Quando eu clico em "Tentar novamente"
    Então os lançamentos são buscados de novo

  Cenário: Falha de validação ao salvar
    Dado que estou salvando um cartão, categoria ou lançamento
    Quando os dados não passam numa regra de validação
    Então vejo a mensagem de erro com o motivo, por exemplo "A data deve estar dentro de outubro de 2026."
    E o formulário continua aberto com os dados preenchidos

  Cenário: Falha inesperada ao salvar
    Dado que estou salvando um cartão, categoria ou lançamento
    Quando ocorre um erro sem mensagem
    Então vejo a mensagem de erro "Não foi possível salvar. Tente novamente."
    E o formulário continua aberto com os dados preenchidos

  Cenário: Duração das mensagens
    Quando uma mensagem de sucesso aparece
    Então ela some depois de cerca de 3 segundos
    Quando uma mensagem de erro aparece
    Então ela some depois de cerca de 4 segundos

  Cenário: Rota inexistente
    Quando eu acesso um endereço que não existe
    Então vejo a página de "não encontrado"

  Cenário: Mês inválido ou futuro
    Quando eu acesso "#/mes/2026-13" ou um mês depois do último mês com parcelas previstas
    Então sou levado para o painel do mês atual
```

## 7. Formulários

```gherkin
# language: pt
Funcionalidade: Regras dos formulários
  Como usuário
  Quero que os formulários validem o que eu digito
  Para não registrar informações inválidas

  Esquema do Cenário: Campos obrigatórios
    Dado que o formulário de <tipo> está aberto
    Quando eu tento salvar com o campo <campo> vazio
    Então o formulário não é enviado

    Exemplos:
      | tipo        | campo                 |
      | cartão      | Nome do cartão        |
      | cartão      | Limite total          |
      | categoria   | Nome da categoria     |
      | categoria   | Orçamento planejado   |
      | lançamento  | Em qual envelope?     |
      | lançamento  | O que foi?            |
      | lançamento  | Valor confirmado      |
      | lançamento  | Data da compra        |

  Cenário: Data fora do mês no formulário
    Dado que o formulário de lançamento está aberto no painel de setembro de 2026
    Quando eu informo uma data fora de setembro de 2026
    Então o formulário não é enviado

  Esquema do Cenário: Limite de tamanho dos textos
    Dado que o formulário de <tipo> está aberto
    Então o campo <campo> aceita no máximo <máximo> caracteres

    Exemplos:
      | tipo       | campo             | máximo |
      | cartão     | Nome do cartão    | 120    |
      | categoria  | Nome da categoria | 120    |
      | lançamento | O que foi?        | 200    |

  Cenário: Valores devem ser positivos
    Dado que um formulário com campo de valor está aberto
    Quando eu informo um valor menor que R$ 0,01
    Então o formulário não é enviado
    E o valor aceita até duas casas decimais

  Cenário: Salvando
    Dado que eu cliquei para salvar um formulário
    E a gravação ainda não terminou
    Então o botão mostra "Salvando…" e fica desabilitado

  Esquema do Cenário: Fechar o formulário sem salvar
    Dado que um formulário está aberto
    Quando eu <ação>
    Então o formulário fecha sem salvar

    Exemplos:
      | ação                           |
      | clico em "Cancelar"            |
      | clico no botão "Fechar" (X)    |
      | clico fora do formulário       |

  Esquema do Cenário: Título do formulário
    Quando eu abro o formulário de <tipo> em modo <modo>
    Então o título é "<título>"
    E o botão de confirmar é "<botão>"

    Exemplos:
      | tipo       | modo    | título            | botão             |
      | cartão     | criação | Seu cartão        | Adicionar         |
      | cartão     | edição  | Ajustar cartão    | Salvar alterações |
      | categoria  | criação | Nova categoria    | Adicionar         |
      | categoria  | edição  | Editar categoria  | Salvar alterações |
      | lançamento | criação | Novo lançamento   | Adicionar         |
      | lançamento | edição  | Editar lançamento | Salvar alterações |
```

## 8. Formatação

```gherkin
# language: pt
Funcionalidade: Formatação de valores e datas
  Como usuário brasileiro
  Quero ver valores e datas no padrão do Brasil

  Cenário: Valores em reais
    Dado um valor de 1234.5
    Então ele é exibido como "R$ 1.234,50"

  Cenário: Datas dos lançamentos
    Dado um lançamento com data "2026-10-07"
    Então a data é exibida como "07 out"

  Cenário: Percentuais
    Dado que o cartão tem 33,333% do limite usado
    Então o percentual do cartão é exibido como "33,3%"
    E o percentual das categorias é exibido sem casas decimais

  Cenário: Nomes dos meses
    Dado o mês "2026-10"
    Então ele é exibido como "Outubro de 2026"
```

## 9. Histórico mensal

Resumo do funcionamento por mês. A especificação completa, com decisões, regras de negócio e todos os cenários, está em [`specs/historico-mensal.md`](specs/historico-mensal.md).

```gherkin
# language: pt
Funcionalidade: Histórico mensal do cartão
  Como usuário
  Quero ver o cartão mês a mês
  Para saber quanto gastei em cada mês, em quais categorias e com quais lançamentos

  Contexto:
    Dado que existe um cartão cadastrado

  Cenário: Ver o histórico
    Dado que tenho dados em setembro e outubro de 2026
    Quando eu clico em "Histórico"
    Então vejo "Outubro de 2026" antes de "Setembro de 2026"
    E cada mês mostra o valor do mês, o comprometido, o limite e a quantidade de categorias e lançamentos

  Cenário: Abrir um mês do histórico
    Quando eu toco em "Setembro de 2026" no histórico
    Então vejo o painel de setembro de 2026 com as categorias e os lançamentos daquele mês

  Cenário: Navegar entre meses
    Dado que estou no painel de outubro de 2026, o mês atual
    E que não há parcelas previstas para os próximos meses
    Então o botão "Próximo mês" está desabilitado
    Quando eu clico em "Mês anterior"
    Então vejo o painel de setembro de 2026
    E vejo o link "Voltar para o mês atual"

  Cenário: Virada de mês copiando as categorias
    Dado que hoje é 01/11/2026
    E que outubro de 2026 tem categorias
    Quando eu abro o aplicativo
    Então vejo o diálogo "Começou novembro"
    Quando eu clico em "Copiar categorias"
    Então novembro começa com as mesmas categorias e orçamentos, todas abertas e sem lançamentos
    E vejo a mensagem "Categorias de outubro copiadas."

  Cenário: Virada de mês começando do zero
    Dado que hoje é 01/11/2026
    E que outubro de 2026 tem categorias
    Quando eu abro o aplicativo e clico em "Começar do zero"
    Então novembro começa sem categorias
    Mas as categorias com parcelas previstas para novembro são criadas com as parcelas (seção 11)

  Cenário: Virada de mês com vários cartões
    Dado que hoje é 01/11/2026
    E que os cartões "Nubank" e "Inter" têm categorias em outubro de 2026
    Quando eu abro o aplicativo com "Nubank" selecionado
    Então o diálogo "Começou novembro" vale só para "Nubank" e copia só as categorias dele
    Quando eu deslizo até "Inter"
    Então o diálogo "Começou novembro" aparece para "Inter"

  Cenário: Virada de mês sem categorias para copiar
    Dado que hoje é 01/11/2026
    E que outubro de 2026 não tem categorias
    Quando eu abro o aplicativo
    Então o diálogo de virada não aparece
    E novembro começa sem categorias

  Cenário: Registrar uma compra do mês anterior
    Dado que hoje é 01/11/2026
    Quando eu abro o painel de outubro de 2026
    E registro um gasto com data 31/10/2026 numa categoria aberta de outubro
    Então o gasto entra no valor de outubro de 2026

  @regra
  Cenário: Dados de uma versão anterior do app
    Dado que o app tinha dados salvos antes do histórico mensal existir
    Quando eu abro a nova versão
    Então todas as categorias e lançamentos aparecem no mês atual, sem perda
```

## 10. Múltiplos cartões

Resumo do funcionamento com vários cartões. A especificação completa, com decisões, regras de negócio e todos os cenários, está em [`specs/multiplos-cartoes.md`](specs/multiplos-cartoes.md).

```gherkin
# language: pt
Funcionalidade: Múltiplos cartões
  Como pessoa que usa mais de um cartão de crédito
  Quero controlar cada cartão separadamente e trocar entre eles como numa carteira digital
  Para saber quanto posso gastar em cada um e no total

  Contexto:
    Dado que tenho o cartão "Nubank", verde, com limite de R$ 5.000,00

  Cenário: Adicionar um segundo cartão
    Quando eu deslizo o carrossel até o slot "Adicionar cartão" e toco nele
    Então o formulário "Seu cartão" abre com a primeira cor ainda não usada (azul) marcada
    Quando eu cadastro o cartão "Inter" com limite de R$ 3.000,00
    Então o carrossel desliza até "Inter", na cor azul, e ele fica selecionado
    E vejo um pontinho para cada cartão e um "+"

  Cenário: Trocar de cartão
    Dado que tenho também o cartão "Inter", com categorias próprias
    Quando eu deslizo o carrossel até "Inter"
    Ou toco no pontinho "Cartão Inter"
    Ou uso a seta para a direita com o foco no carrossel
    Então "Inter" fica centralizado e selecionado
    E as categorias, os lançamentos, a visão geral e o histórico passam a ser os de "Inter"

  Cenário: Lembrar o último cartão usado
    Dado que deixei "Inter" selecionado
    Quando eu fecho e abro o aplicativo
    Então o carrossel abre em "Inter", sem animação

  Cenário: Escolher a cor do cartão
    Quando eu clico em "Editar cartão" na face de "Nubank"
    Então vejo as amostras verde, azul, roxo, vinho, grafite e terracota, com a cor atual marcada
    Quando eu escolho vinho e salvo
    Então a face de "Nubank" fica vinho

  @regra
  Cenário: Nome de cartão repetido
    Quando eu tento cadastrar um cartão chamado " nubank "
    Então vejo a mensagem de erro "Já existe um cartão com esse nome."
    E o formulário continua aberto

  @regra
  Cenário: Total de todos os cartões
    Dado que tenho também o cartão "Inter", com limite de R$ 3.000,00
    E que outubro de 2026 tem R$ 2.100,00 comprometidos no "Nubank" e R$ 900,00 no "Inter"
    Quando eu vejo o painel de outubro de 2026
    Então vejo a faixa "Todos os cartões · Outubro de 2026"
    E ela mostra comprometido R$ 3.000,00, disponível R$ 5.000,00 e limite R$ 8.000,00
    Mas com um só cartão a faixa não aparece

  Cenário: Total de todos os cartões no histórico
    Dado que tenho também o cartão "Inter"
    Quando eu abro o Histórico com "Nubank" selecionado
    Então vejo os meses de "Nubank"
    E cada mês mostra a linha "Todos os cartões" com o valor e o comprometido somados

  Cenário: Remover um de vários cartões
    Dado que tenho também o cartão "Inter", selecionado
    Quando eu removo "Inter" e confirmo
    Então "Inter" sai do carrossel com todos os seus registros
    E "Nubank" fica selecionado, sem nenhuma alteração

  @regra
  Cenário: Dados de uma versão anterior do app
    Dado que o app tinha um único cartão salvo antes dos múltiplos cartões existirem
    Quando eu abro a nova versão
    Então ele aparece como o primeiro cartão do carrossel, verde e selecionado, sem perda de dados
```

## 11. Parcelamento

Resumo das compras parceladas. A especificação completa, com decisões, regras de negócio e todos os cenários, está em [`specs/parcelamento.md`](specs/parcelamento.md).

```gherkin
# language: pt
Funcionalidade: Parcelamento
  Como pessoa que compra parcelado no cartão
  Quero registrar a compra uma vez e ver cada parcela cair no seu mês
  Para saber quanto do cartão já está comprometido agora e nos próximos meses

  Contexto:
    Dado que hoje é 12/10/2026
    E que o cartão "Nubank" tem a categoria aberta "Eletrônicos" em outubro de 2026

  Cenário: Registrar uma compra parcelada
    Quando eu clico em "Registrar gasto" e ligo "Compra parcelada"
    E registro "Fone" com valor total de R$ 100,00 em 3 parcelas, em 15/10/2026
    Então antes de salvar vejo "3x de R$ 33,33 · última em dezembro/2026 · 1ª de R$ 33,34"
    E depois de salvar vejo a mensagem "Compra parcelada registrada."
    E "Eletrônicos" de outubro tem "Fone" de R$ 33,34 com o selo "1/3"

  @regra
  Cenário: Cada mês compromete só a sua parcela
    Quando eu registro "Notebook" de R$ 3.000,00 em 10x
    Então só R$ 300,00 entram no usado de "Eletrônicos" em outubro

  Cenário: Compra que já estava em andamento
    Quando eu registro "Geladeira" de R$ 1.000,00 em 10x com "Parcela neste mês" igual a 3
    Então outubro tem a parcela "3/10" de R$ 100,00
    E as parcelas 4 a 10 ficam previstas de novembro de 2026 a maio de 2027

  Cenário: Prévia de um mês futuro
    Dado que registrei "Fone" em 3x
    Quando eu clico em "Próximo mês"
    Então vejo a prévia de novembro, só para leitura, com "Fone" "2/3" no grupo "Eletrônicos"
    E não vejo "Registrar gasto" nem "Nova categoria"
    E o botão "Próximo mês" para no último mês com parcelas previstas

  Cenário: Próximos meses no histórico
    Dado que registrei "Fone" em 3x
    Quando eu abro o Histórico
    Então a seção "Próximos meses" mostra novembro e dezembro de 2026 com o valor das parcelas
    E tocar num mês abre a prévia dele

  @regra
  Cenário: A parcela entra quando o mês começa
    Dado que hoje é 01/11/2026
    Quando novembro começa, copiando as categorias ou do zero
    Então "Fone" "2/3" entra em "Eletrônicos" de novembro
    E se a categoria não existir, ela é criada com orçamento igual às parcelas

  Cenário: Editar a compra a partir de uma parcela
    Quando eu clico em "Editar lançamento" na parcela "1/3"
    Então vejo "Editar compra parcelada" com o valor total, as parcelas e "Começa na parcela"
    E vejo o aviso "As mudanças valem para todas as parcelas, menos as que estão em categorias fechadas."
    Quando eu mudo o valor total para R$ 120,00
    Então todas as parcelas passam a valer R$ 40,00

  @regra
  Cenário: Parcelas em categorias fechadas não mudam
    Dado que a parcela "1/6" de "TV" está numa categoria fechada
    Quando eu edito a compra ou a excluo
    Então a parcela "1/6" continua igual
    E ao excluir, ela fica como lançamento comum

  @regra
  Cenário: Parcela não se altera sozinha
    Quando eu clico em "Excluir lançamento" numa parcela
    Então o sistema pede confirmação para remover a compra parcelada e todas as suas parcelas
```
