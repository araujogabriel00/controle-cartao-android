# Funcionalidades — Controle do Cartão (BDD)

Especificação das funcionalidades no formato BDD (Gherkin, em português), levantada a partir do comportamento do app em `src/pages/` e das regras em `src/data/store.ts`.

> **Observação:** nesta versão Android não há servidor. Os dados ficam no próprio aparelho e todos os cálculos (valor usado, disponível, percentual e totais) são feitos em `src/data/store.ts`. Os cenários marcados com `@regra` descrevem essas regras de cálculo e validação.
>
> Cada compra **consome o limite do cartão pelo valor gasto**, e as categorias servem só para classificar. Os detalhes estão nas seções [2. Categorias](#2-categorias) e [3. Compras](#3-compras) e na spec [`specs/compras-e-categorias.md`](specs/compras-e-categorias.md).
>
> Todos os valores são calculados **dentro de um mês**: cartão, compras e resumo por categoria mostram só o mês que está aberto no painel. O funcionamento por mês está detalhado na seção [9. Histórico mensal](#9-histórico-mensal) e na spec [`specs/historico-mensal.md`](specs/historico-mensal.md).
>
> O app aceita **vários cartões**, e cada um tem o próprio limite, meses e compras. As compras, o resumo por categoria e o histórico mostram sempre o **cartão selecionado** no carrossel. As categorias são globais, as mesmas para todos os cartões. Os detalhes estão na seção [10. Múltiplos cartões](#10-múltiplos-cartões) e na spec [`specs/multiplos-cartoes.md`](specs/multiplos-cartoes.md).
>
> Uma **compra parcelada** vira uma compra comum em cada mês em que cai, e os meses futuros mostram as parcelas previstas junto com as compras já registradas. Uma **compra recorrente** (assinaturas) funciona do mesmo jeito, repetindo todo mês: seção [15. Compra recorrente](#15-compra-recorrente). Os detalhes estão na seção [11. Parcelamento](#11-parcelamento) e na spec [`specs/parcelamento.md`](specs/parcelamento.md).
>
> O **mês aberto é o mesmo nas três abas** (Entradas, Cartões e Benefícios): o seletor de mês fica acima da barra de abas, trocar de aba mantém o mês, e o app lembra o último mês aberto. Os detalhes estão na seção [16. Mês compartilhado](#16-mês-compartilhado) e na spec [`specs/mes-compartilhado.md`](specs/mes-compartilhado.md).
>
> Os **benefícios** (VR, VA etc.) são um saldo mensal numa aba própria, independente dos cartões e das entradas. Os detalhes estão na seção [13. Benefícios](#13-benefícios) e na spec [`specs/beneficios.md`](specs/beneficios.md).
>
> As **entradas** (salário, pró-labore, bônus) ficam numa aba própria, separada dos cartões, e não alteram nenhum valor deles. A mesma aba tem as **contas fixas**, os **gastos do dia a dia** e o **saldo do mês** (entradas − saídas − o usado dos cartões), que **acumula** para os meses seguintes. Os detalhes estão nas seções [12. Entradas](#12-entradas) e [14. Contas fixas e gastos do dia a dia](#14-contas-fixas-e-gastos-do-dia-a-dia) e nas specs [`specs/entradas.md`](specs/entradas.md) e [`specs/contas-e-gastos.md`](specs/contas-e-gastos.md).

## Sumário

1. [Cartão](#1-cartão)
2. [Categorias](#2-categorias)
3. [Compras](#3-compras)
4. [Visão geral do mês](#4-visão-geral-do-mês)
5. [Sincronização e atualização](#5-sincronização-e-atualização)
6. [Carregamento e erros](#6-carregamento-e-erros)
7. [Formulários](#7-formulários)
8. [Formatação](#8-formatação)
9. [Histórico mensal](#9-histórico-mensal)
10. [Múltiplos cartões](#10-múltiplos-cartões)
11. [Parcelamento](#11-parcelamento)
12. [Entradas](#12-entradas)
13. [Benefícios](#13-benefícios)
14. [Contas fixas e gastos do dia a dia](#14-contas-fixas-e-gastos-do-dia-a-dia)
15. [Compra recorrente](#15-compra-recorrente)
16. [Mês compartilhado](#16-mês-compartilhado)

---

## 1. Cartão

O cadastro do primeiro cartão está abaixo. Adicionar outros cartões, trocar entre eles e as cores estão na seção [10. Múltiplos cartões](#10-múltiplos-cartões).

```gherkin
# language: pt
Funcionalidade: Gerenciar o cartão
  Como usuário
  Quero cadastrar meu cartão com o seu limite
  Para acompanhar quanto do limite já foi usado

  Cenário: Primeiro acesso sem cartão cadastrado
    Dado que não existe nenhum cartão cadastrado
    Quando eu abro o aplicativo
    Então vejo o convite "Vamos anotar o seu cartão?"
    E vejo o botão "Cadastrar cartão"
    E o botão "Registrar compra" está desabilitado

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
    E R$ 1.250,00 já foram usados no mês
    Quando eu vejo a face do cartão no carrossel
    Então vejo "Disponível para usar" com o valor "R$ 3.750,00"
    E vejo "Usado no mês" com o valor "R$ 1.250,00"
    E vejo "Limite utilizado" com "25%"
    E a barra de progresso do limite está preenchida em 25%

  Cenário: Cartão ainda sem gastos
    Dado que o cartão selecionado não tem nenhuma compra no mês
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
    E os meses e as compras do cartão são apagados, inclusive o histórico dele
    Mas as categorias continuam, porque são globais

  Cenário: Desistir de remover o cartão
    Dado que existe um cartão selecionado
    Quando eu clico em "Remover cartão"
    E cancelo a confirmação
    Então o cartão continua cadastrado

  @regra
  Cenário: Percentual acima de 100% não estoura a barra
    Dado que o valor usado é maior que o limite do cartão
    Quando eu vejo a face do cartão no carrossel
    Então a barra de progresso fica limitada a 100%
```

## 2. Categorias

Resumo das categorias. A especificação completa está em [`specs/compras-e-categorias.md`](specs/compras-e-categorias.md) e, para onde elas são gerenciadas, em [`specs/tela-de-categorias.md`](specs/tela-de-categorias.md). As categorias são **globais** (as mesmas para todos os cartões, gastos e benefícios), servem só para classificar e não têm orçamento. Criar, renomear e excluir só se faz na **tela `#/categorias`**.

```gherkin
# language: pt
Funcionalidade: Categorias das compras
  Como usuário
  Quero classificar minhas compras em categorias
  Para ver quanto gasto em cada tipo de gasto

  Cenário: Chegar nas categorias a partir de qualquer aba
    Dado que estou na aba "Cartões", "Entradas" ou "Benefícios"
    Quando eu toco no botão "Categorias"
    Então abre a tela "Categorias", sem diálogo e sem a barra de abas
    E vejo a lista de categorias, cada uma com a quantidade de compras, em ordem alfabética
    E vejo o campo para criar uma categoria nova

  Cenário: Voltar
    Dado que cheguei pela aba "Benefícios"
    Quando eu toco em "Voltar"
    Então volto para a aba "Benefícios"
    Mas se abri "#/categorias" direto, "Voltar" leva ao painel dos cartões

  Cenário: Nenhuma categoria criada
    Dado que não existe nenhuma categoria
    Quando eu abro a tela "Categorias"
    Então vejo "Nenhuma categoria ainda. Crie uma para separar seus gastos."

  Cenário: Criar uma categoria
    Quando eu abro a tela "Categorias", preencho "Transporte" e clico em "Criar"
    Então vejo a mensagem "Categoria criada."
    E "Transporte" aparece na lista e no seletor de categoria da compra
    E o campo "Nova categoria" fica vazio

  @regra
  Cenário: Nome de categoria repetido
    Dado que existe a categoria "Mercado"
    Quando eu tento criar uma categoria chamada "  mercado "
    Então vejo a mensagem de erro "Já existe uma categoria com esse nome."

  Cenário: Renomear uma categoria
    Dado que existe a categoria "Transporte" com compras
    Quando eu clico em "Renomear Transporte", mudo para "Uber e ônibus" e confirmo
    Então vejo a mensagem "Categoria renomeada."
    E as compras dessa categoria passam a mostrar "Uber e ônibus"
    E as parcelas previstas da categoria também
    E ao voltar, a tela de onde vim já mostra o nome novo

  Cenário: Desistir de renomear
    Quando eu clico em "Renomear Transporte" e depois em cancelar
    Então o nome continua "Transporte"

  Cenário: Excluir uma categoria
    Dado que existe a categoria "Lazer" com 2 compras
    Quando eu clico em "Excluir Lazer"
    Então o sistema pede confirmação para "Excluir a categoria “Lazer”? 2 compras ficarão sem categoria. Esta ação não pode ser desfeita."
    Quando eu confirmo
    Então vejo a mensagem "Categoria removida."
    E as 2 compras continuam, agora "Sem categoria"
    E o valor usado dos cartões não muda
    Mas se a categoria também tiver gastos de benefício, eles entram na contagem e ficam sem categoria (seção 13)

  Cenário: Excluir uma categoria sem uso
    Dado que existe a categoria "Viagem" sem compras
    Quando eu clico em "Excluir Viagem"
    Então o sistema pede confirmação sem falar de compras
```

## 3. Compras

Resumo das compras no cartão. A especificação completa, com decisões, regras de negócio e todos os cenários, está em [`specs/compras-e-categorias.md`](specs/compras-e-categorias.md).

```gherkin
# language: pt
Funcionalidade: Registrar e acompanhar compras
  Como usuário
  Quero registrar cada compra direto no cartão
  Para saber quanto do limite já foi usado e quanto ainda posso gastar

  Contexto:
    Dado que existe um cartão cadastrado com limite de R$ 1.000,00
    E existem as categorias "Mercado" e "Lazer"

  Cenário: Registrar uma compra
    Quando eu clico em "Registrar compra"
    Então o formulário "Nova compra" abre com a data de hoje preenchida
    Mas se o painel mostra um mês passado, a data preenchida é o último dia daquele mês
    E se mostra um mês futuro, é o dia 1º dele
    E a categoria vem como "Sem categoria"
    Quando eu preencho "O que foi?" com "Feira", escolho "Mercado" e preencho o valor com "120"
    E clico em "Adicionar"
    Então vejo a mensagem "Compra registrada."
    E "Feira" aparece em "O que já aconteceu" com a categoria "Mercado"

  @regra
  Cenário: A compra consome o limite
    Quando eu registro uma compra de R$ 120,00
    Então o usado do cartão aumenta em R$ 120,00
    E o disponível do cartão diminui em R$ 120,00

  Cenário: Compra sem categoria
    Quando eu registro uma compra sem escolher categoria
    Então ela aparece na lista e no resumo como "Sem categoria"

  @regra
  Cenário: Compra acima do limite
    Dado que o usado do cartão é R$ 900,00
    Quando eu registro uma compra de R$ 300,00
    Então o disponível é -R$ 200,00 e a barra fica limitada a 100%

  @regra
  Cenário: Compra em outro mês
    Quando eu registro uma compra com data em outro mês
    Então ela aparece no mês da data, e não na lista do mês aberto
    E vejo a mensagem "Compra registrada em ‹mês›."
    Mas uma compra em mês futuro não inicia o mês dele

  Cenário: Lista do mês
    Dado que o mês tem compras
    Então a lista mostra da mais recente para a mais antiga
    E cada compra mostra a descrição, a categoria, a data e o valor com sinal de menos

  Cenário: Filtrar por categoria
    Dado que há compras em "Mercado", "Lazer" e sem categoria
    Quando eu escolho o filtro "Mercado"
    Então a lista mostra só as compras de "Mercado"
    E vejo "Total do filtro" com a soma delas

  Cenário: Resumo por categoria
    Dado que há R$ 300,00 em "Mercado", R$ 100,00 em "Lazer" e R$ 100,00 sem categoria
    Então o resumo mostra "Mercado" R$ 300,00 (60%), "Lazer" R$ 100,00 (20%) e "Sem categoria" R$ 100,00 (20%)

  Cenário: Lista longa de compras
    Dado que o mês tem 11 compras
    Então vejo apenas 8 compras e o botão "Ver mais 3 compras"
    Quando eu clico em "Ver mais 3 compras"
    Então vejo as 11 compras e o botão "Mostrar menos"

  Cenário: Mês sem compras
    Dado que o mês não tem compras
    Então vejo "Ainda sem compras" e o link "Registrar a primeira compra"

  Cenário: Editar uma compra
    Dado que existe a compra "Feira" de R$ 120,00 em "Mercado"
    Quando eu clico em "Editar compra"
    Então o formulário "Editar compra" abre preenchido com descrição, categoria, valor e data
    Quando eu altero o valor para "150" e a categoria para "Lazer" e salvo
    Então vejo a mensagem "Compra atualizada."
    Mas se a compra for uma parcela, abre "Editar compra parcelada" (seção 11)

  Cenário: Excluir uma compra
    Dado que existe a compra "Feira"
    Quando eu clico em "Excluir compra"
    Então o sistema pede confirmação para "Remover a compra “Feira”? Esta ação não pode ser desfeita."
    Quando eu confirmo
    Então vejo a mensagem "Compra excluída." e o limite volta a ficar disponível
    Mas se a compra for uma parcela, a exclusão remove a compra parcelada inteira (seção 11)
```

## 4. Visão geral do mês

```gherkin
# language: pt
Funcionalidade: Visão geral do mês
  Como usuário
  Quero ver um resumo do mês
  Para entender rapidamente como está o limite

  Contexto:
    Dado que existe um cartão cadastrado com limite de R$ 1.000,00

  Cenário: Exibir o resumo
    Dado que outubro de 2026 tem R$ 233,34 em compras
    Quando eu vejo o painel "O mês em perspectiva" de outubro de 2026
    Então vejo o título "Outubro de 2026"
    E vejo "Usado" com "R$ 233,34" e "Disponível" com "R$ 766,66"
    E vejo a barra de percentual e "limite de R$ 1.000,00"
    E vejo "3 compras neste mês."

  Cenário: Resumo de um mês passado
    Dado que estou vendo o painel de setembro de 2026
    Então o resumo considera só as compras de setembro
    E vejo "compras em setembro."

  @regra
  Cenário: Cálculo do usado do cartão
    Dado que o mês aberto tem compras que somam R$ 233,34
    Então "Usado" é R$ 233,34
    E "Disponível" é o limite do mês menos R$ 233,34
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
    Então o cartão, as categorias, o histórico e as compras do mês exibido são recarregados
    E o ícone de atualizar gira enquanto o cartão é recarregado

  Cenário: Atualizar ao voltar para a janela
    Dado que eu saí da aba do aplicativo
    Quando eu volto para a aba
    Então o cartão, as categorias e as compras são recarregados
```

## 6. Carregamento e erros

```gherkin
# language: pt
Funcionalidade: Carregamento e tratamento de erros
  Como usuário
  Quero ser avisado quando algo dá errado
  Para poder tentar de novo sem perder minhas informações

  Cenário: Carregando os dados
    Dado que o cartão ou as compras ainda estão carregando
    Então vejo blocos de carregamento no lugar do conteúdo

  Cenário: Falha ao carregar os dados principais
    Dado que a busca do cartão ou das compras falhou
    Então vejo a mensagem "Vamos tentar de novo?"
    E vejo "Não conseguimos abrir seu caderno agora. Sua informação continua segura."
    Quando eu clico em "Tentar novamente"
    Então o cartão e as compras são buscados de novo

  Cenário: Falha de validação ao salvar
    Dado que estou salvando um cartão, categoria ou compra
    Quando os dados não passam numa regra de validação
    Então vejo a mensagem de erro com o motivo, por exemplo "Valor deve ser de pelo menos R$ 0,01."
    E o formulário continua aberto com os dados preenchidos

  Cenário: Falha inesperada ao salvar
    Dado que estou salvando um cartão, categoria ou compra
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
    Quando eu acesso "#/mes/2026-13"
    Então sou levado para o painel do mês atual
    Mas um mês que a aba não abre (por exemplo, um mês futuro depois do último com parcela prevista ou compra registrada) leva ao mês mais próximo que ela abre (seção 16)
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
      | compra      | O que foi?            |
      | compra      | Valor da compra       |
      | compra      | Data da compra        |

  Esquema do Cenário: Limite de tamanho dos textos
    Dado que o formulário de <tipo> está aberto
    Então o campo <campo> aceita no máximo <máximo> caracteres

    Exemplos:
      | tipo       | campo             | máximo |
      | cartão     | Nome do cartão    | 120    |
      | categoria  | Nome da categoria | 120    |
      | compra     | O que foi?        | 200    |

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
      | compra     | criação | Nova compra       | Adicionar         |
      | compra     | edição  | Editar compra     | Salvar alterações |
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

  Cenário: Datas das compras
    Dado uma compra com data "2026-10-07"
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

Resumo do funcionamento por mês. A especificação completa, com decisões, regras de negócio e todos os cenários, está em [`specs/historico-mensal.md`](specs/historico-mensal.md), com o que mudou em [`specs/compras-e-categorias.md`](specs/compras-e-categorias.md).

```gherkin
# language: pt
Funcionalidade: Histórico mensal do cartão
  Como usuário
  Quero ver o cartão mês a mês
  Para saber quanto usei do limite e quais compras fiz em cada mês

  Contexto:
    Dado que existe um cartão cadastrado

  Cenário: Ver o histórico
    Dado que tenho dados em setembro e outubro de 2026
    Quando eu clico em "Histórico"
    Então vejo "Outubro de 2026" antes de "Setembro de 2026"
    E cada mês mostra o usado, o disponível, o limite, o percentual e a quantidade de compras

  Cenário: Abrir um mês do histórico
    Quando eu toco em "Setembro de 2026" no histórico
    Então vejo o painel de setembro de 2026 com as compras daquele mês

  Cenário: Navegar entre meses
    Dado que estou no painel de outubro de 2026, o mês atual
    E que não há parcelas ou cobranças previstas nem compras em meses futuros
    Então o botão "Próximo mês" está desabilitado
    Quando eu clico em "Mês anterior"
    Então vejo o painel de setembro de 2026
    E vejo o link "Voltar para o mês atual"

  Cenário: Virada de mês sem pergunta
    Dado que hoje é 01/11/2026
    Quando eu abro o aplicativo
    Então novembro começa sozinho, com o limite atual do cartão
    E nenhuma pergunta sobre copiar categorias aparece
    E as parcelas devidas de novembro entram como compras (seção 11)

  Cenário: Virada de mês com vários cartões
    Dado que hoje é 01/11/2026 e os cartões "Nubank" e "Inter" existem
    Quando eu abro o aplicativo com "Nubank" selecionado
    Então novembro começa para "Nubank"
    Quando eu deslizo até "Inter"
    Então novembro começa para "Inter", com o limite dele

  Cenário: Registrar uma compra do mês anterior
    Dado que hoje é 01/11/2026
    Quando eu abro o painel de outubro de 2026
    E registro uma compra com data 31/10/2026
    Então a compra entra no usado de outubro de 2026

  @regra
  Cenário: Dados de uma versão anterior do app
    Dado que o app tinha dados salvos antes do histórico mensal existir
    Quando eu abro a nova versão
    Então todos os lançamentos aparecem no mês atual como compras, sem perda
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
    Dado que tenho também o cartão "Inter", com compras próprias
    Quando eu deslizo o carrossel até "Inter"
    Ou toco no pontinho "Cartão Inter"
    Ou uso a seta para a direita com o foco no carrossel
    Então "Inter" fica centralizado e selecionado
    E as compras, o resumo por categoria e o histórico passam a ser os de "Inter"

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
    E que outubro de 2026 tem R$ 2.100,00 usados no "Nubank" e R$ 900,00 no "Inter"
    Quando eu vejo o painel de outubro de 2026
    Então vejo a faixa "Todos os cartões · Outubro de 2026"
    E ela mostra usado R$ 3.000,00, disponível R$ 5.000,00 e limite R$ 8.000,00
    Mas com um só cartão a faixa não aparece

  Cenário: Total de todos os cartões no histórico
    Dado que tenho também o cartão "Inter"
    Quando eu abro o Histórico com "Nubank" selecionado
    Então vejo os meses de "Nubank"
    E cada mês mostra a linha "Todos os cartões" com o usado e o disponível somados

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

Resumo das compras parceladas. A especificação completa, com decisões, regras de negócio e todos os cenários, está em [`specs/parcelamento.md`](specs/parcelamento.md), com o que mudou em [`specs/compras-e-categorias.md`](specs/compras-e-categorias.md).

```gherkin
# language: pt
Funcionalidade: Parcelamento
  Como pessoa que compra parcelado no cartão
  Quero registrar a compra uma vez e ver cada parcela cair no seu mês
  Para saber quanto do limite já está usado agora e nos próximos meses

  Contexto:
    Dado que hoje é 12/10/2026
    E que existe a categoria "Eletrônicos"

  Cenário: Registrar uma compra parcelada
    Quando eu clico em "Registrar compra" e ligo "Compra parcelada"
    E registro "Fone" na categoria "Eletrônicos", com valor total de R$ 100,00 em 3 parcelas, em 15/10/2026
    Então antes de salvar vejo "3x de R$ 33,33 · última em dezembro/2026 · 1ª de R$ 33,34"
    E depois de salvar vejo a mensagem "Compra parcelada registrada."
    E outubro tem a compra "Fone" de R$ 33,34 com o selo "1/3", em "Eletrônicos"

  @regra
  Cenário: Cada mês usa só a sua parcela
    Quando eu registro "Notebook" de R$ 3.000,00 em 10x
    Então só R$ 300,00 entram no usado do cartão em outubro

  Cenário: Compra que já estava em andamento
    Quando eu registro "Geladeira" de R$ 1.000,00 em 10x com "Parcela neste mês" igual a 3
    Então outubro tem a parcela "3/10" de R$ 100,00
    E as parcelas 4 a 10 ficam previstas de novembro de 2026 a maio de 2027

  @regra
  Cenário: Compra parcelada não aceita mês futuro
    Quando eu registro uma compra parcelada com data em novembro de 2026
    Então vejo a mensagem de erro "Compra parcelada não aceita data em mês futuro."

  Cenário: Mês futuro com parcelas previstas e compras
    Dado que registrei "Fone" em 3x e uma compra "Presente" de R$ 100,00 com data em 20/11/2026
    Quando eu clico em "Próximo mês"
    Então vejo novembro com "Presente", que posso editar e excluir
    E vejo "Fone" "2/3" com o selo "prevista", sem editar nem excluir
    E o usado de novembro soma a compra e a parcela
    E o botão "Próximo mês" para no último mês com parcela prevista ou compra registrada

  Cenário: Próximos meses no histórico
    Dado que registrei "Fone" em 3x
    Quando eu abro o Histórico
    Então a seção "Próximos meses" mostra novembro e dezembro de 2026 com o valor das parcelas e das compras
    E tocar num mês abre esse mês

  @regra
  Cenário: A parcela entra quando o mês começa
    Dado que hoje é 01/11/2026
    Quando novembro começa
    Então "Fone" "2/3" entra em novembro como compra, na categoria "Eletrônicos"
    E nenhuma categoria nova é criada

  Cenário: Editar a compra a partir de uma parcela
    Quando eu clico em "Editar compra" na parcela "1/3"
    Então vejo "Editar compra parcelada" com o valor total, as parcelas e "Começa na parcela"
    E vejo o aviso "As mudanças valem para todas as parcelas."
    Quando eu mudo o valor total para R$ 120,00
    Então todas as parcelas passam a valer R$ 40,00, inclusive as de meses passados

  @regra
  Cenário: Excluir a compra parcelada remove todas as parcelas
    Quando eu clico em "Excluir compra" numa parcela
    Então o sistema pede confirmação para remover a compra parcelada e todas as suas parcelas
    E depois de confirmar, as parcelas gravadas e as previstas somem

  @regra
  Cenário: Parcela não se altera sozinha
    Quando eu tento alterar ou excluir uma parcela como compra comum
    Então vejo a mensagem de erro "Este lançamento é uma parcela. Altere a compra parcelada."
```

---

## 12. Entradas

Resumo das entradas de dinheiro. A especificação completa, com decisões, regras de negócio e todos os cenários, está em [`specs/entradas.md`](specs/entradas.md).

```gherkin
# language: pt

Funcionalidade: Entradas
  Como pessoa que recebe salário, pró-labore e bônus
  Quero registrar minhas entradas separadas dos cartões
  Para saber quanto entra em cada mês

  Cenário: Abrir a aba de entradas
    Dado que estou no painel de um cartão
    Quando eu toco na aba "Entradas"
    Então vejo a tela de entradas do mês corrente
    E o painel do cartão não mostra nenhuma entrada

  Cenário: Mês sem entradas
    Dado que não há entradas
    Quando eu abro a aba "Entradas"
    Então vejo "Nenhuma entrada neste mês." e o total R$ 0,00

  Cenário: Registrar uma entrada avulsa
    Quando eu toco em "Nova entrada"
    E escolho o tipo "Bônus", o valor "1500" e uma data do mês
    E toco em "Adicionar"
    Então a lista do mês tem "Bônus" com R$ 1.500,00 e o total do mês é R$ 1.500,00
    E o mês seguinte não tem essa entrada

  Cenário: Registrar um salário que se repete todo mês
    Quando eu registro "Salário" de R$ 5.000,00 ligando "Repetir todo mês"
    Então o mês e os seguintes mostram "Salário" com o selo "Mensal"
    E os meses anteriores não têm essa entrada

  @regra
  Cenário: Repetição com mês final e dia 31
    Dado que registro uma entrada no dia 31 repetindo até um mês final
    Então os meses depois do final não têm a entrada
    E nos meses sem dia 31 a data é o último dia do mês

  Cenário: Editar só um mês de uma entrada recorrente
    Dado que o "Salário" de R$ 5.000,00 se repete todo mês
    Quando eu edito o mês seguinte, escolho "Só este mês" e mudo o valor para "5500"
    Então só esse mês mostra R$ 5.500,00

  Cenário: Reajuste de salário daqui em diante
    Dado que o "Salário" de R$ 5.000,00 se repete todo mês
    Quando eu edito um mês futuro, escolho "Este e os próximos" e mudo o valor para "5800"
    Então os meses anteriores continuam com R$ 5.000,00
    E esse mês e os seguintes mostram R$ 5.800,00

  Cenário: Pular um mês e encerrar uma entrada recorrente
    Quando eu excluo uma ocorrência escolhendo "Só este mês"
    Então só esse mês perde a entrada
    Quando eu excluo outra escolhendo "Este e os próximos"
    Então esse mês e os seguintes perdem a entrada

  @regra
  Cenário: Entradas não mexem nos cartões
    Quando eu registro um salário
    Então o usado e o disponível dos cartões continuam iguais

  @regra
  Cenário: Limite de navegação
    Quando eu abro um mês fora do intervalo (antes da entrada mais antiga ou mais de 12 meses à frente)
    Então o app volta para "#/entradas"
```

---

## 13. Benefícios

Resumo dos benefícios. A especificação completa, com decisões, regras de negócio e todos os cenários, está em [`specs/beneficios.md`](specs/beneficios.md).

```gherkin
# language: pt

Funcionalidade: Benefícios
  Como pessoa que recebe vale-refeição, vale-alimentação ou algo parecido
  Quero acompanhar o saldo de cada benefício, mês a mês
  Para saber quanto ainda posso gastar com ele

  Cenário: Abrir a aba de benefícios
    Dado que estou no painel de um cartão
    Então a barra de abas mostra "Entradas", "Cartões" e "Benefícios", nessa ordem
    Quando eu toco em "Benefícios"
    Então vejo a tela de benefícios do mês corrente
    E o painel do cartão não mostra nenhum benefício

  Cenário: Nenhum benefício cadastrado
    Dado que não há benefícios
    Quando eu abro a aba "Benefícios"
    Então vejo "Nenhum benefício ainda." e o botão "Novo benefício"

  Cenário: Criar um benefício
    Quando eu toco em "Novo benefício"
    E preencho o nome "VR", o valor mensal "800" e mantenho o mês inicial
    E toco em "Adicionar"
    Então vejo o cartão "VR" com o selo "Mensal"
    E ele mostra crédito R$ 800,00, sobra anterior R$ 0,00, gasto R$ 0,00 e disponível R$ 800,00
    E vejo "Sem gastos neste mês."

  @regra
  Cenário: Validação do benefício
    Quando eu tento criar um benefício chamado " vr " quando já existe "VR"
    Então vejo "Já existe um benefício com esse nome."
    Quando eu informo um mês final antes do mês inicial
    Então vejo "O mês final deve ser igual ou posterior ao mês inicial."

  Cenário: Registrar um gasto
    Dado que existe o benefício "VR" e a categoria "Mercado"
    Quando eu toco em "Registrar gasto" no cartão "VR"
    E informo a descrição "Almoço", o valor "300", a categoria "Mercado" e uma data do mês
    Então o cartão "VR" lista "Almoço" em "Mercado" com R$ 300,00
    E mostra gasto R$ 300,00 e disponível R$ 500,00

  @regra
  Cenário: Gasto fora do período do benefício
    Dado que "VR" começa neste mês
    Quando eu registro um gasto com data de um mês anterior
    Então vejo "A data deve estar dentro do período do benefício."

  @regra
  Cenário: A sobra acumula para o mês seguinte
    Dado que "VR" teve gasto de R$ 300,00 neste mês
    Quando eu abro o mês seguinte
    Então "VR" mostra sobra anterior R$ 500,00, crédito R$ 800,00, gasto R$ 0,00 e disponível R$ 1.300,00

  @regra
  Cenário: Gastar mais do que o saldo
    Quando eu registro um gasto maior que o disponível
    Então o disponível fica negativo
    E o mês seguinte começa com essa sobra negativa

  Cenário: Disponível em todos os benefícios
    Dado que "VR" tem R$ 500,00 disponíveis e "VA" tem R$ 200,00
    Então a faixa "Disponível em todos os benefícios" mostra R$ 700,00

  Cenário: Reajuste do valor mensal daqui em diante
    Dado que "VR" vale R$ 800,00 desde o mês inicial
    Quando eu edito "VR" com "Vale a partir de" um mês futuro e valor "900"
    Então os meses anteriores continuam com crédito R$ 800,00
    E esse mês e os seguintes têm crédito R$ 900,00

  @regra
  Cenário: Mês final do benefício
    Quando eu edito "VR" com um mês final
    Então os meses depois dele não mostram "VR"
    Mas se já houver gasto depois do mês final, vejo "Há gastos depois do mês final."

  Cenário: Editar e excluir um gasto
    Dado que "VR" tem o gasto "Almoço"
    Quando eu edito o valor e salvo
    Então o gasto e o disponível mudam
    Quando eu excluo o gasto e confirmo
    Então o gasto some e o disponível volta ao crédito

  Cenário: Excluir um benefício
    Dado que "VR" tem 3 gastos
    Quando eu excluo "VR"
    Então o sistema pede confirmação para "Remover o benefício “VR” e seus 3 gastos? Esta ação não pode ser desfeita."
    E depois de confirmar, "VR" e os gastos dele somem de todos os meses

  Cenário: Dividir o benefício por categoria
    Dado que "VR" vale R$ 800,00 e existem as categorias "Mercado" e "Lazer"
    Quando eu edito "VR", divido R$ 500,00 em "Mercado" e R$ 200,00 em "Lazer" e salvo
    Então o cartão "VR" lista, em "Por categoria", "Mercado" R$ 500,00, "Lazer" R$ 200,00 e "Sem categoria" R$ 100,00
    E o disponível do benefício continua R$ 800,00
    E o diálogo mostra "Sem categoria: R$ 100,00" enquanto eu divido

  @regra
  Cenário: Divisão maior que o valor do benefício
    Quando eu divido R$ 900,00 num benefício de R$ 800,00
    Então o diálogo avisa que a divisão passa do valor
    E ao salvar vejo "A divisão passa do valor mensal do benefício."

  @regra
  Cenário: Cada categoria tem a sua sobra
    Dado que "VR" está dividido em "Mercado" R$ 500,00 e "Lazer" R$ 200,00, e gastei R$ 120,00 em "Mercado"
    Então "Mercado" mostra disponível R$ 380,00 e o disponível do benefício é R$ 680,00
    Quando eu abro o mês seguinte
    Então "Mercado" mostra sobra anterior R$ 380,00 e disponível R$ 880,00
    E a soma das linhas é sempre o disponível do benefício

  Cenário: Gasto numa categoria fora da divisão
    Quando eu registro um gasto numa categoria que não está na divisão
    Então a linha dela aparece negativa e o disponível do benefício diminui

  Cenário: Reajustar a divisão daqui em diante
    Quando eu edito "VR" com "Vale a partir de" um mês e outra divisão
    Então os meses anteriores mantêm a divisão antiga
    E esse mês e os seguintes usam a nova

  Cenário: Fechar uma categoria libera a sobra
    Dado que "Mercado" tem R$ 380,00 sobrando em "VR"
    Quando eu toco em "Fechar" na linha "Mercado"
    Então o sistema pede confirmação para "Fechar “Mercado” em VR? R$ 380,00 que sobram vão para “Sem categoria”."
    E depois de confirmar, "Mercado" mostra o selo "Fechada", disponível R$ 0,00 e "Liberado R$ 380,00"
    E o valor liberado soma ao "Sem categoria", sem mudar o disponível do benefício

  Cenário: A categoria fechada nos meses seguintes
    Dado que "Mercado" foi fechada
    Quando eu abro o mês seguinte
    Então "Mercado" aparece "Fechada" com tudo zerado
    E a parte dela na divisão passa para "Sem categoria"

  @regra
  Cenário: Categoria fechada não recebe gastos
    Dado que "Mercado" está fechada em "VR"
    Quando eu registro, edito ou excluo um gasto de "Mercado" num mês fechado
    Então vejo "A categoria Mercado está fechada neste benefício."

  @regra
  Cenário: Fechar com gastos em meses seguintes
    Dado que "Mercado" tem gasto num mês depois do mês aberto
    Quando eu toco em "Fechar" e confirmo
    Então vejo "Há gastos desta categoria depois de ‹mês›. Exclua-os antes de fechar."

  Cenário: Reabrir uma categoria
    Dado que "Mercado" foi fechada
    Quando eu abro um mês seguinte e toco em "Reabrir"
    Então os meses antes dele continuam fechados
    E dele em diante "Mercado" volta a receber a parte dela, com sobra zero
    Mas se eu reabrir no mês em que fechei, o fechamento é desfeito e a sobra volta

  Cenário: Excluir uma categoria dividida
    Dado que "Lazer" está na divisão de "VR", com gastos
    Quando eu excluo a categoria "Lazer"
    Então a parte dela volta para "Sem categoria", os gastos ficam sem categoria e o disponível não muda

  Cenário: Benefício sem divisão
    Dado que "VR" não tem divisão
    Então o cartão "VR" não mostra a lista "Por categoria"

  Cenário: Categorias na aba Benefícios
    Quando eu toco em "Categorias" na aba "Benefícios"
    Então abre a tela de categorias (seção 2), a mesma das outras abas

  @regra
  Cenário: Limite de navegação
    Quando eu abro um mês fora do intervalo (antes do benefício mais antigo ou mais de 12 meses à frente)
    Então o app volta para "#/beneficios"

  @regra
  Cenário: Benefícios não mexem nos cartões nem nas entradas
    Quando eu registro um gasto num benefício
    Então o usado e o disponível dos cartões e o total das entradas continuam iguais
```

---

## 14. Contas fixas e gastos do dia a dia

Resumo das saídas na aba Entradas. A especificação completa, com decisões, regras de negócio e todos os cenários, está em [`specs/contas-e-gastos.md`](specs/contas-e-gastos.md).

```gherkin
# language: pt

Funcionalidade: Contas fixas e gastos do dia a dia
  Como pessoa que recebe e gasta dinheiro todo mês
  Quero registrar minhas contas e gastos e ver quanto sobra das entradas
  Para saber se o mês fecha no azul

  Cenário: Resumo do mês
    Dado que outubro de 2026 tem a entrada "Salário" de R$ 5.000,00, as contas fixas "Aluguel" R$ 1.500,00 e "Internet" R$ 100,00, o gasto "Mercado" de R$ 300,00 e R$ 800,00 usados nos cartões
    Quando eu abro a aba "Entradas"
    Então o resumo mostra Entradas R$ 5.000,00, Contas fixas R$ 1.600,00, Gastos do dia a dia R$ 300,00 e Cartões R$ 800,00
    E o Resultado do mês é R$ 2.300,00 e o Saldo anterior é R$ 0,00, porque outubro é o primeiro mês
    E o Saldo é R$ 2.300,00, em verde

  Cenário: Saldo negativo
    Dado que o saldo anterior é R$ 0,00 e as saídas passam das entradas
    Então o Resultado do mês e o Saldo aparecem negativos, em vermelho
    E vejo "As saídas passaram das entradas e do saldo anterior."

  Cenário: A sobra passa para o mês seguinte
    Dado que outubro tem Resultado do mês de R$ 2.300,00 e novembro tem Resultado do mês de R$ 3.400,00
    Quando eu abro novembro de 2026
    Então o Saldo anterior é R$ 2.300,00 e o Resultado do mês é R$ 3.400,00
    E o Saldo é R$ 5.700,00
    E dezembro, com o mesmo resultado, tem Saldo anterior R$ 5.700,00 e Saldo R$ 9.100,00

  Cenário: A falta também passa para o mês seguinte
    Dado que outubro termina com Saldo de -R$ 600,00 e novembro tem Resultado do mês de R$ 3.400,00
    Quando eu abro novembro de 2026
    Então o Saldo anterior é -R$ 600,00, em vermelho
    E o Saldo é R$ 2.800,00

  @regra
  Cenário: A conta começa no primeiro mês cadastrado
    Dado que a primeira entrada, conta fixa ou gasto é de julho de 2026
    Então o Saldo anterior de julho e dos meses antes dele é R$ 0,00
    E o de agosto é o Resultado de julho
    E compras antigas nos cartões não puxam o início

  @regra
  Cenário: Os meses futuros projetam o saldo e o passado ajusta os seguintes
    Dado que os meses seguintes repetem o salário e as contas fixas
    Então o Saldo anterior de um mês futuro soma os resultados dos meses até lá, com o usado previsto dos cartões
    Quando eu excluo um gasto de outubro
    Então o Saldo de outubro e os Saldos anteriores dos meses seguintes aumentam o valor do gasto

  Cenário: Mês sem nada cadastrado
    Dado que não há entradas, contas, gastos nem cartões
    Então o resumo mostra tudo zerado, com Saldo anterior, Resultado do mês e Saldo R$ 0,00
    E vejo "Nenhuma conta fixa neste mês." e "Nenhum gasto neste mês."

  @regra
  Cenário: Cartões no saldo
    Dado que o Nubank tem R$ 500,00 usados e o Inter R$ 300,00
    Então "Cartões" mostra R$ 800,00
    Quando eu toco em "Ver cartões"
    Então vejo a aba "Cartões"
    Mas em um mês futuro "Cartões" inclui as parcelas previstas e as compras já registradas

  @regra
  Cenário: O saldo lê os cartões sem alterá-los
    Quando eu registro uma conta fixa ou um gasto
    Então o usado e o disponível dos cartões continuam iguais
    E os benefícios não entram no saldo

  Cenário: Cadastrar uma conta fixa
    Quando eu toco em "Nova conta fixa"
    E informo o nome "Aluguel", o valor "1500" e uma data
    Então a lista do mês tem "Aluguel" no dia da data, com R$ 1.500,00 e o selo "Mensal"
    E os meses seguintes também têm "Aluguel", e os anteriores não

  @regra
  Cenário: Conta fixa com mês final e no dia 31
    Dado que cadastro uma conta fixa até um mês final
    Então os meses depois dele não têm a conta
    E uma conta no dia 31 cai no último dia dos meses mais curtos

  @regra
  Cenário: Validação da conta fixa
    Quando eu cadastro uma conta fixa com valor "0"
    Então vejo "Valor deve ser de pelo menos R$ 0,01."
    Quando eu informo um mês final antes do mês inicial
    Então vejo "O mês final deve ser igual ou posterior ao mês inicial."

  Cenário: Alterar uma conta só num mês
    Dado que "Aluguel" é uma conta fixa de R$ 1.500,00
    Quando eu edito um mês, escolho "Só este mês" e mudo o valor para "1700"
    Então só esse mês mostra R$ 1.700,00

  Cenário: Reajuste do aluguel daqui em diante
    Quando eu edito um mês futuro, escolho "Este e os próximos" e mudo o valor para "1800"
    Então os meses anteriores continuam com R$ 1.500,00
    E esse mês e os seguintes têm R$ 1.800,00

  Cenário: Pular um mês e encerrar uma conta fixa
    Quando eu excluo uma ocorrência com "Só este mês"
    Então só esse mês perde a conta
    Quando eu excluo outra com "Este e os próximos"
    Então esse mês e os seguintes perdem a conta

  Cenário: Registrar um gasto do dia a dia
    Dado que existe a categoria "Mercado"
    Quando eu toco em "Novo gasto"
    E informo "Feira", o valor "300", a categoria "Mercado" e uma data do mês
    Então a lista do mês tem "Feira" em "Mercado" com R$ 300,00
    E o saldo diminui R$ 300,00

  Cenário: Gasto sem categoria e em outro mês
    Quando eu registro um gasto sem escolher categoria
    Então ele aparece como "Sem categoria"
    Quando eu registro um gasto com data em outro mês
    Então ele aparece no mês da data e vejo "Gasto registrado em ‹mês›."

  @regra
  Cenário: Gasto com data longe demais
    Quando eu registro um gasto com data daqui a 14 meses
    Então vejo "A data deve ser de até 12 meses à frente."

  Cenário: Editar e excluir um gasto
    Quando eu edito o valor de um gasto e salvo
    Então o gasto e o saldo mudam
    Quando eu excluo o gasto e confirmo
    Então o gasto some e o saldo volta

  Cenário: Resumo dos gastos por categoria
    Dado que há R$ 300,00 em "Mercado", R$ 100,00 em "Lazer" e R$ 100,00 sem categoria
    Então "Por categoria" mostra "Mercado" R$ 300,00 (60%), "Lazer" R$ 100,00 (20%) e "Sem categoria" R$ 100,00 (20%)

  Cenário: Excluir uma categoria usada nos gastos
    Dado que "Mercado" tem 1 compra no cartão e 2 gastos do dia a dia
    Quando eu abro a tela "Categorias" e excluo "Mercado"
    Então vejo a confirmação "3 compras ficarão sem categoria."
    E depois de confirmar, os 2 gastos aparecem sem categoria e o saldo não muda

  @regra
  Cenário: Limite de navegação
    Dado que há uma conta fixa desde julho de 2026
    Então a navegação vai de julho de 2026 até 12 meses à frente do mês corrente
    E um mês fora do intervalo volta para "#/entradas"
```

---

## 15. Compra recorrente

Resumo das assinaturas no cartão. A especificação completa, com decisões, regras de negócio e todos os cenários, está em [`specs/compra-recorrente.md`](specs/compra-recorrente.md).

```gherkin
# language: pt

Funcionalidade: Compra recorrente
  Como pessoa com assinaturas no cartão
  Quero registrar a cobrança uma vez e vê-la cair todo mês
  Para saber quanto do limite já está comprometido nos próximos meses

  Contexto:
    Dado que hoje é 17/10/2026 e o cartão "Nubank" tem limite de R$ 1.000,00

  Cenário: Registrar uma assinatura
    Quando eu abro "Registrar compra" e ligo "Compra recorrente"
    Então o título é "Nova compra recorrente" e o valor é "Valor mensal"
    Quando eu informo "Streaming", o valor "40" e a data 15/10/2026
    Então a prévia mostra "Todo mês, dia 15, a partir de outubro de 2026 · sem data final"
    Quando eu clico em "Adicionar"
    Então vejo "Compra recorrente registrada."
    E outubro tem "Streaming" de R$ 40,00 com o selo "Mensal"
    E o usado do Nubank em outubro inclui R$ 40,00

  Cenário: Recorrente e parcelada não ficam juntas
    Dado que "Compra parcelada" está ligada
    Quando eu ligo "Compra recorrente"
    Então "Compra parcelada" desliga

  @regra
  Cenário: Cobranças previstas nos meses seguintes
    Dado que "Streaming" é recorrente sem fim
    Quando eu abro novembro de 2026
    Então vejo "Streaming" de R$ 40,00 com os selos "Mensal" e "prevista", sem editar nem excluir
    E o usado de novembro inclui R$ 40,00
    E o botão "Próximo mês" avança até 12 meses à frente do mês corrente

  Cenário: Mês final e dia 31
    Quando eu registro uma recorrente "até" um mês final
    Então os meses depois dele não têm a cobrança
    E uma cobrança no dia 31 cai no último dia dos meses mais curtos

  Cenário: Assinatura que já existia
    Quando eu registro "Nuvem" com data de dois meses atrás
    Então os meses desde então têm "Nuvem" como compra gravada, e os meses do cartão que não existiam passam a existir com o limite atual
    E os meses seguintes têm a cobrança prevista

  @regra
  Cenário: A cobrança entra quando o mês começa
    Dado que um mês novo começa
    Então a cobrança dele entra como compra gravada, com o selo "Mensal"

  @regra
  Cenário: Validação
    Quando eu registro uma recorrente com valor "0"
    Então vejo "Valor deve ser de pelo menos R$ 0,01."
    Quando eu informo uma data daqui a 14 meses
    Então vejo "A data deve ser de até 12 meses à frente."
    Quando eu informo "Até" antes do mês da data
    Então vejo "O mês final deve ser igual ou posterior ao mês inicial."

  Cenário: Alterar só um mês
    Dado que "Streaming" vale R$ 40,00 por mês
    Quando eu edito a cobrança de outubro, escolho "Só este mês" e mudo o valor para "55"
    Então o diálogo avisa "A mudança vale só para outubro de 2026" e não tem "Até (mês)"
    E outubro mostra R$ 55,00 e novembro continua R$ 40,00

  Cenário: Reajuste daqui em diante
    Dado que "Streaming" vale R$ 40,00 desde agosto
    Quando eu edito a cobrança de outubro, escolho "Este e os próximos" e mudo o valor para "55"
    Então agosto e setembro continuam com R$ 40,00
    E outubro e os meses seguintes têm R$ 55,00

  Cenário: Pular um mês e encerrar uma assinatura
    Quando eu excluo a cobrança de outubro com "Só este mês" e confirmo
    Então só outubro perde a cobrança, e o usado diminui
    Quando eu excluo uma cobrança com "Este e os próximos"
    Então esse mês e os seguintes perdem a cobrança, e os anteriores ficam

  @regra
  Cenário: Cobrança não se altera sozinha
    Quando eu tento alterar ou excluir uma cobrança como compra comum
    Então vejo "Esta compra é recorrente. Altere a compra recorrente."

  Cenário: Próximos meses no histórico
    Dado que "Streaming" é recorrente sem fim
    Quando eu abro o Histórico
    Então "Próximos meses" mostra cada mês até 12 meses à frente com a cobrança
```

---

## 16. Mês compartilhado

Resumo da navegação por mês nas três abas. A especificação completa, com decisões, regras de negócio e todos os cenários, está em [`specs/mes-compartilhado.md`](specs/mes-compartilhado.md).

```gherkin
# language: pt

Funcionalidade: Mês compartilhado entre as abas
  Como pessoa que acompanha o dinheiro mês a mês
  Quero trocar de aba sem perder o mês que estou olhando
  Para comparar cartões, entradas e benefícios do mesmo mês

  Contexto:
    Dado que hoje é 18/10/2026

  Cenário: O seletor de mês fica acima das abas
    Dado que estou na aba "Entradas", "Cartões" ou "Benefícios"
    Então o seletor de mês aparece acima da barra de abas, e o conteúdo abaixo dela
    Mas em "Cartões" a linha com "Histórico" e "Atualizar" continua acima do seletor

  Cenário: Trocar de aba mantém o mês
    Dado que estou na aba "Entradas" em dezembro de 2026
    Quando eu toco na aba "Cartões"
    Então vejo "Cartões" em dezembro de 2026, com o endereço "#/mes/2026-12"
    Quando eu toco na aba "Benefícios"
    Então vejo "Benefícios" em dezembro de 2026, com o endereço "#/beneficios/mes/2026-12"

  Cenário: O mês corrente usa a rota curta
    Dado que estou na aba "Cartões" em outubro de 2026
    Quando eu toco na aba "Entradas"
    Então o endereço é "#/entradas"

  @regra
  Cenário: A aba de destino não abre aquele mês
    Dado que estou em "Entradas" em março de 2027 e Cartões só abre meses até dezembro de 2026
    Quando eu toco na aba "Cartões"
    Então vejo "Cartões" em dezembro de 2026, o mês mais próximo que ela abre, sem mensagem
    E do mesmo jeito, um mês antes do primeiro que a aba abre leva ao primeiro

  Cenário: Voltar para o mês atual
    Dado que estou na aba "Benefícios" em dezembro de 2026
    Quando eu toco em "Voltar para o mês atual"
    Então vejo "Benefícios" em outubro de 2026
    E ao tocar na aba "Entradas", vejo outubro de 2026

  Cenário: Trocar de aba a partir do Histórico
    Dado que estou no Histórico
    Quando eu toco na aba "Entradas"
    Então vejo "Entradas" no mês corrente
    Mas ao tocar num mês do Histórico, abre "Cartões" naquele mês

  Cenário: Abrir o app no último mês
    Dado que eu estava vendo dezembro de 2026 e fechei o app
    Quando eu abro o app de novo
    Então vejo "Cartões" em dezembro de 2026, com o link "Voltar para o mês atual"

  @regra
  Cenário: O mês corrente não é lembrado
    Dado que eu estava vendo o mês corrente quando fechei o app
    Quando eu abro o app num mês novo
    Então vejo "Cartões" no mês de hoje, e não no mês em que fechei

  Cenário: Voltar para o mês atual apaga a lembrança
    Dado que o app abriu em dezembro de 2026 por causa da lembrança
    Quando eu toco em "Voltar para o mês atual"
    Então vejo o mês corrente
    E ao fechar e abrir o app de novo, ele abre no mês corrente

  @regra
  Cenário: Um endereço com mês vale mais que a lembrança
    Dado que o mês lembrado é dezembro de 2026
    Quando eu abro "#/entradas/mes/2026-11" direto
    Então vejo "Entradas" em novembro de 2026, e não em dezembro

  @regra
  Cenário: Lembrança fora do alcance ou com falha
    Dado que o mês lembrado é março de 2027 e Cartões só abre até dezembro de 2026
    Quando eu abro o app
    Então vejo "Cartões" em dezembro de 2026
    Mas se a lembrança não puder ser lida ou for inválida, o app abre no mês corrente, sem mensagem
```
