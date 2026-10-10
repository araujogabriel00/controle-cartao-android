# Funcionalidades — Controle do Cartão (BDD)

Especificação das funcionalidades no formato BDD (Gherkin, em português), levantada a partir do comportamento da interface em `src/pages/dashboard.tsx`.

> **Observação:** os cálculos de saldo (valor usado, disponível, percentual e totais da visão geral) são feitos pela API, que não está neste repositório. Os cenários marcados com `@api` descrevem o comportamento esperado do backend, inferido pela descrição do app e pelos campos que a interface consome.

## Sumário

1. [Cartão](#1-cartão)
2. [Categorias de gastos](#2-categorias-de-gastos)
3. [Movimentações](#3-movimentações)
4. [Visão geral do mês](#4-visão-geral-do-mês)
5. [Sincronização e atualização](#5-sincronização-e-atualização)
6. [Carregamento e erros](#6-carregamento-e-erros)
7. [Formulários](#7-formulários)
8. [Formatação](#8-formatação)

---

## 1. Cartão

```gherkin
# language: pt
Funcionalidade: Gerenciar o cartão
  Como usuário
  Quero cadastrar meu cartão com o seu limite
  Para acompanhar quanto do limite já está comprometido

  Cenário: Primeiro acesso sem cartão cadastrado
    Dado que não existe cartão cadastrado
    Quando eu abro o aplicativo
    Então vejo o convite "Vamos anotar o seu cartão?"
    E vejo o botão "Cadastrar cartão"
    E o botão "Nova categoria" está desabilitado

  Cenário: Cadastrar o cartão
    Dado que não existe cartão cadastrado
    Quando eu clico em "Cadastrar cartão"
    E preencho o nome do cartão com "Cartão principal"
    E preencho o limite total com "5000"
    E clico em "Adicionar"
    Então vejo a mensagem "Alterações salvas com cuidado."
    E vejo o painel "Visão do cartão" com o nome "Cartão principal"
    E o limite exibido é "R$ 5.000,00"

  Cenário: Exibir a situação do cartão
    Dado que existe um cartão com limite de R$ 5.000,00
    E R$ 1.250,00 já estão comprometidos
    Quando eu vejo o painel "Visão do cartão"
    Então vejo "Disponível para usar" com o valor "R$ 3.750,00"
    E vejo "Já comprometido" com o valor "R$ 1.250,00"
    E vejo "Limite utilizado" com "25%"
    E a barra de progresso do limite está preenchida em 25%

  Cenário: Cartão ainda sem gastos
    Dado que existe um cartão sem nenhum valor comprometido
    Quando eu vejo o painel "Visão do cartão"
    Então vejo a mensagem "Seu primeiro gasto ainda está por vir. Tudo começa com um registro."

  Cenário: Editar o cartão
    Dado que existe um cartão cadastrado
    Quando eu clico em "Editar cartão"
    Então o formulário "Ajustar cartão" abre preenchido com o nome e o limite atuais
    Quando eu altero o limite para "6000"
    E clico em "Salvar alterações"
    Então vejo a mensagem "Alterações salvas com cuidado."
    E o limite exibido é "R$ 6.000,00"

  Cenário: Remover o cartão
    Dado que existe um cartão cadastrado
    Quando eu clico em "Remover cartão"
    Então o sistema pede confirmação para "Remover o cartão e todos os seus registros? Esta ação não pode ser desfeita."
    Quando eu confirmo
    Então vejo a mensagem "Cartão removido."
    E volto a ver o convite "Vamos anotar o seu cartão?"

  Cenário: Desistir de remover o cartão
    Dado que existe um cartão cadastrado
    Quando eu clico em "Remover cartão"
    E cancelo a confirmação
    Então o cartão continua cadastrado

  @api
  Cenário: Percentual acima de 100% não estoura a barra
    Dado que o valor comprometido é maior que o limite do cartão
    Quando eu vejo o painel "Visão do cartão"
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
    Quando eu clico em "Nova categoria"
    E preencho o nome da categoria com "Mercado"
    E preencho o orçamento planejado com "800"
    E clico em "Adicionar"
    Então vejo a mensagem "Alterações salvas com cuidado."
    E a categoria "Mercado" aparece na aba "Em andamento"
    E o contador da aba "Em andamento" aumenta em 1

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

  @api
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
    E a primeira categoria aberta vem selecionada
    Quando eu escolho a categoria "Mercado"
    E preencho "O que foi?" com "Mercado da semana"
    E preencho o valor confirmado com "235,90"
    E clico em "Adicionar"
    Então vejo a mensagem "Lançamento confirmado."
    E o lançamento "Mercado da semana" aparece em "O que já aconteceu"

  @api
  Cenário: Gasto atualiza a categoria e o cartão
    Dado que a categoria "Mercado" tem R$ 0,00 usado de R$ 800,00
    Quando eu registro um gasto de R$ 200,00 em "Mercado"
    Então a categoria "Mercado" mostra "R$ 200,00 usado de R$ 800,00"
    E o valor "Já comprometido" do cartão aumenta em R$ 200,00
    E o valor "Disponível para usar" do cartão diminui em R$ 200,00

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
    Dado que existem as categorias "Mercado" e "Casa"
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

  Cenário: Excluir um lançamento
    Dado que a categoria "Mercado" tem o lançamento "Mercado da semana"
    Quando eu clico em "Excluir lançamento" no lançamento "Mercado da semana"
    Então o sistema pede confirmação para "Remover o lançamento “Mercado da semana”? Esta ação não pode ser desfeita."
    Quando eu confirmo
    Então vejo a mensagem "Lançamento excluído."
    E o lançamento não aparece mais na lista

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
    Dado que existem as categorias abertas "Mercado" (R$ 800,00) e "Casa" (R$ 1.200,00)
    E existe a categoria fechada "Viagem" com R$ 650,00 gastos
    Quando eu vejo o painel "O mês em perspectiva"
    Então vejo "Orçamentos em aberto" com "R$ 2.000,00"
    E vejo "Categorias fechadas" com "R$ 650,00"
    E vejo "2 categorias ativas para o que importa neste mês."

  Cenário: Resumo sem dados da API
    Dado que a API não retornou os totais da visão geral
    Então "Orçamentos em aberto" é calculado somando o orçamento das categorias abertas
    E "Categorias fechadas" mostra "R$ 0,00"
    E a quantidade de categorias ativas é contada pela lista de categorias
```

## 5. Sincronização e atualização

```gherkin
# language: pt
Funcionalidade: Status de sincronização
  Como usuário
  Quero saber se meus dados estão sincronizados
  Para confiar nos valores exibidos

  Cenário: API disponível
    Dado que a verificação de saúde da API responde com sucesso
    Então vejo o indicador verde "Seu caderno está em dia"

  Cenário: API indisponível
    Dado que a verificação de saúde da API falha
    Então vejo o indicador "Sincronização pausada"

  Cenário: Atualizar os dados manualmente
    Quando eu clico em "Atualizar"
    Então o cartão, a visão geral, as categorias e os lançamentos da categoria exibida são recarregados
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

  Cenário: Falha ao salvar
    Dado que estou salvando um cartão, categoria ou lançamento
    Quando a API retorna erro
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
    E a API ainda não respondeu
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
```
