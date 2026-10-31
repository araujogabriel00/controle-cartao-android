# Funcionalidades — Controle do Cartão (BDD)

Especificação das funcionalidades no formato BDD (Gherkin, em português), levantada a partir do comportamento do app em `src/pages/` e das regras em `src/data/store.ts`.

> **Observação:** nesta versão Android não há servidor. Os dados ficam no próprio aparelho e todos os cálculos (fatura, percentuais e totais) são feitos em `src/data/store.ts`. Os cenários marcados com `@regra` descrevem essas regras de cálculo e validação.
>
> O cartão **não tem limite**: cada mês mostra o total da **fatura** (a soma das compras), e as categorias servem só para classificar. Seção [17. Cartão sem limite](#17-cartão-sem-limite) e spec [`specs/cartao-sem-limite.md`](specs/cartao-sem-limite.md). Os detalhes estão nas seções [2. Categorias](#2-categorias) e [3. Compras](#3-compras) e na spec [`specs/compras-e-categorias.md`](specs/compras-e-categorias.md).
>
> Todos os valores são calculados **dentro de um mês**: cartão, compras e resumo por categoria mostram só o mês que está aberto no painel. O funcionamento por mês está detalhado na seção [9. Histórico mensal](#9-histórico-mensal) e na spec [`specs/historico-mensal.md`](specs/historico-mensal.md).
>
> O app aceita **vários cartões**, e cada um tem o próprio nome, cor, meses e compras. As compras, o resumo por categoria e o histórico mostram sempre o **cartão selecionado** na fileira de cartões. As categorias são globais, as mesmas para todos os cartões. Os detalhes estão na seção [10. Múltiplos cartões](#10-múltiplos-cartões) e na spec [`specs/multiplos-cartoes.md`](specs/multiplos-cartoes.md).
>
> Uma **compra parcelada** vira uma compra comum em cada mês em que cai, e os meses futuros mostram as parcelas previstas junto com as compras já registradas. Uma **compra recorrente** (assinaturas) funciona do mesmo jeito, repetindo todo mês: seção [15. Compra recorrente](#15-compra-recorrente). Os detalhes estão na seção [11. Parcelamento](#11-parcelamento) e na spec [`specs/parcelamento.md`](specs/parcelamento.md).
>
> O **mês aberto é o mesmo nas três abas** (Entradas, Cartões e Benefícios): o seletor de mês fica acima da barra de abas, trocar de aba mantém o mês, e o app lembra o último mês aberto. Os detalhes estão na seção [16. Mês compartilhado](#16-mês-compartilhado) e na spec [`specs/mes-compartilhado.md`](specs/mes-compartilhado.md).
>
> Os **benefícios** (VR, VA etc.) são um saldo mensal numa aba própria, independente dos cartões e das entradas. Os detalhes estão na seção [13. Benefícios](#13-benefícios) e na spec [`specs/beneficios.md`](specs/beneficios.md).
>
> As **entradas** (salário, pró-labore, bônus) ficam numa aba própria, separada dos cartões, e não alteram nenhum valor deles. A mesma aba tem as **contas fixas**, os **gastos do dia a dia** e o **saldo do mês** (entradas − saídas − o total das faturas), que **acumula** para os meses seguintes. Os detalhes estão nas seções [12. Entradas](#12-entradas) e [14. Contas fixas e gastos do dia a dia](#14-contas-fixas-e-gastos-do-dia-a-dia) e nas specs [`specs/entradas.md`](specs/entradas.md) e [`specs/contas-e-gastos.md`](specs/contas-e-gastos.md).

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
17. [Cartão sem limite](#17-cartão-sem-limite)
18. [Histórico no card do cartão](#18-histórico-no-card-do-cartão)
19. [Botão Lançar](#19-botão-lançar)
20. [Telas de entradas, contas fixas, gastos e cartões](#20-telas-de-entradas-contas-fixas-gastos-e-cartões)
21. [Benefícios em carrossel](#21-benefícios-em-carrossel)
22. [Lançamentos do benefício](#22-lançamentos-do-benefício)
23. [Redesign da tela Entradas](#23-redesign-da-tela-entradas)
23. [Editar parcela prevista](#23-editar-parcela-prevista)
24. [Todas as compras do cartão](#24-todas-as-compras-do-cartão)
25. [Redesign da aba Cartões](#25-redesign-da-aba-cartões)
26. [Redesign da aba Benefícios](#26-redesign-da-aba-benefícios)
27. [Opção D: Entradas](#27-opção-d-entradas)
28. [Opção D: Cartões](#28-opção-d-cartões)
29. [Opção D: Benefícios](#29-opção-d-benefícios)
30. [Opção D: telas de apoio](#30-opção-d-telas-de-apoio)
31. [Compras do cartão em qualquer mês](#31-compras-do-cartão-em-qualquer-mês)
32. [Nova versão (v2): fundação](#32-nova-versão-v2-fundação)
33. [Início com mini-gráficos](#33-início-com-mini-gráficos)
34. [Desfazer a exclusão](#34-desfazer-a-exclusão)
35. [Aba Entradas no desenho v3](#35-aba-entradas-no-desenho-v3)
36. [Aba Cartões na nova versão](#36-aba-cartões-na-nova-versão)
37. [Sonhos](#37-sonhos)
38. [Carrinho de compras](#38-carrinho-de-compras)
39. [Fatura com todas as compras do mês](#39-fatura-com-todas-as-compras-do-mês)
40. [Histórico e Todas as compras na nova versão](#40-histórico-e-todas-as-compras-na-nova-versão)

---

## 1. Cartão

O cadastro do primeiro cartão está abaixo. Adicionar outros cartões, trocar entre eles e as cores estão na seção [10. Múltiplos cartões](#10-múltiplos-cartões).

```gherkin
# language: pt
Funcionalidade: Gerenciar o cartão
  Como usuário
  Quero cadastrar meu cartão só com nome e cor
  Para lançar as compras e ver o total da fatura de cada mês

  Cenário: Primeiro acesso sem cartão cadastrado
    Dado que não existe nenhum cartão cadastrado
    Quando eu abro o aplicativo
    Então vejo o convite "Vamos anotar o seu cartão?"
    E vejo o botão "Cadastrar cartão"
    E a aba não tem botão de registrar compra; o "+" do rodapé deixa "Compra no cartão" desabilitada

  Cenário: Cadastrar o primeiro cartão
    Dado que não existe nenhum cartão cadastrado
    Quando eu clico em "Cadastrar cartão"
    Então o formulário "Seu cartão" abre com a cor verde marcada
    Quando eu preencho o nome do cartão com "Cartão principal"
    E clico em "Adicionar"
    Então vejo a mensagem "Alterações salvas com cuidado."
    E vejo o cartão "Cartão principal" na fileira de cartões, selecionado, com a bolinha verde
    E o formulário não pede limite
    E o mês atual passa a fazer parte do histórico desse cartão

  Cenário: Exibir a situação do cartão
    Dado que o cartão selecionado tem 2 compras somando R$ 1.250,00 em outubro de 2026
    Quando eu abro a aba "Cartões"
    Então vejo "Fatura de outubro de 2026" com o valor "R$ 1.250,00"
    E vejo "2 compras"
    E não vejo disponível, limite nem barra de progresso

  Cenário: Cartão ainda sem gastos
    Dado que o cartão selecionado não tem nenhuma compra no mês
    Quando eu abro a aba "Cartões"
    Então vejo a fatura "R$ 0,00" e a mensagem "Nenhuma compra neste mês."

  Cenário: Editar o cartão
    Dado que existe um cartão selecionado
    Quando eu toco em "Mais opções do cartão" e em "Editar cartão"
    Então o formulário "Ajustar cartão" abre preenchido com o nome e a cor, sem limite
    Quando eu altero o nome para "Cartão roxo"
    E clico em "Salvar alterações"
    Então vejo a mensagem "Alterações salvas com cuidado."
    E a fileira de cartões mostra o nome novo
    E as compras e as faturas dos meses não mudam

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
    Quando eu toco no ícone de categorias do rodapé
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
    Quando eu toco em "Mais opções de Transporte" e em "Renomear", mudo para "Uber e ônibus" e salvo
    Então vejo a mensagem "Categoria renomeada."
    E as compras dessa categoria passam a mostrar "Uber e ônibus"
    E as parcelas previstas da categoria também
    E ao voltar, a tela de onde vim já mostra o nome novo

  Cenário: Desistir de renomear
    Quando eu toco em "Mais opções de Transporte", em "Renomear" e depois em "Cancelar"
    Então o nome continua "Transporte"

  Cenário: Excluir uma categoria
    Dado que existe a categoria "Lazer" com 2 compras
    Quando eu toco em "Mais opções de Lazer" e em "Excluir"
    Então o sistema abre a confirmação (seção 30) com "Excluir a categoria “Lazer”? 2 compras ficarão sem categoria. Esta ação não pode ser desfeita."
    Quando eu confirmo
    Então vejo a mensagem "Categoria removida."
    E as 2 compras continuam, agora "Sem categoria"
    E a fatura dos cartões não muda
    Mas se a categoria também tiver gastos de benefício, eles entram na contagem e ficam sem categoria (seção 13)

  Cenário: Excluir uma categoria sem uso
    Dado que existe a categoria "Viagem" sem compras
    Quando eu toco em "Mais opções de Viagem" e em "Excluir"
    Então o sistema pede confirmação sem falar de compras
```

## 3. Compras

Resumo das compras no cartão. A especificação completa, com decisões, regras de negócio e todos os cenários, está em [`specs/compras-e-categorias.md`](specs/compras-e-categorias.md).

```gherkin
# language: pt
Funcionalidade: Registrar e acompanhar compras
  Como usuário
  Quero registrar cada compra direto no cartão
  Para saber quanto as compras deram na fatura do mês

  Contexto:
    Dado que existe um cartão cadastrado
    E existem as categorias "Mercado" e "Lazer"

  Cenário: Registrar uma compra
    Quando eu toco no botão "+" do rodapé e em "Compra no cartão"
    Então o formulário "Nova compra" abre com a data de hoje preenchida
    Mas se o painel mostra um mês passado, a data preenchida é o último dia daquele mês
    E se mostra um mês futuro, é o dia 1º dele
    E a categoria vem como "Sem categoria"
    Quando eu preencho "O que foi?" com "Feira", escolho "Mercado" e preencho o valor com "120"
    E clico em "Adicionar"
    Então vejo a mensagem "Compra registrada."
    E "Feira" aparece em "Compras" com a categoria "Mercado"

  @regra
  Cenário: A compra entra na fatura
    Quando eu registro uma compra de R$ 120,00
    Então a fatura do cartão no mês aumenta em R$ 120,00

  Cenário: Compra sem categoria
    Quando eu registro uma compra sem escolher categoria
    Então ela aparece na lista e no resumo como "Sem categoria"

  @regra
  Cenário: Compra em outro mês
    Quando eu registro uma compra com data em outro mês
    Então ela aparece no mês da data, e não na lista do mês aberto
    E vejo a mensagem "Compra registrada em ‹mês›."
    Mas uma compra em mês futuro não inicia o mês dele

  Cenário: Lista do mês
    Dado que o mês tem compras
    Então "Compras" mostra todas as compras do mês, da mais recente para a mais antiga (seção 39)
    E cada compra mostra a descrição, a categoria, a data e o valor com sinal de menos

  Cenário: Filtrar por categoria
    Dado que há compras em "Mercado", "Lazer" e sem categoria
    Quando eu toco em "Mercado" em "Para onde foi"
    Então "Compras" mostra só as compras de "Mercado"
    E vejo "Total do filtro" com a soma delas e o botão "Limpar filtro"

  Cenário: Resumo por categoria
    Dado que há R$ 300,00 em "Mercado", R$ 100,00 em "Lazer" e R$ 100,00 sem categoria
    Então o resumo mostra "Mercado" R$ 300,00 (60%), "Lazer" R$ 100,00 (20%) e "Sem categoria" R$ 100,00 (20%)

  Cenário: Lista longa de compras
    Dado que o mês tem 11 compras
    Então "Compras" mostra as 11, da mais recente para a mais antiga (seção 39)
    E o link "Todas as compras" abre a lista de todos os meses, sem filtro (seção 24)

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
    Então a compra é apagada na hora, sem pedir confirmação (seção 34)
    E vejo o aviso "Feira removida." com o botão "Desfazer", e a fatura do mês diminui o valor dela
    Mas se a compra for uma parcela, a exclusão remove a compra parcelada inteira (seção 11)
```

## 4. Visão geral do mês

Não há mais um painel separado: o resumo do mês é a própria **face do cartão** (fatura e número de compras). O painel "O mês em perspectiva" e a faixa "Todos os cartões" saíram com o limite ([seção 17](#17-cartão-sem-limite)).

```gherkin
# language: pt
Funcionalidade: Visão geral do mês
  Como usuário
  Quero ver um resumo do mês
  Para saber quanto as compras deram

  Contexto:
    Dado que existe um cartão cadastrado

  Cenário: Exibir o resumo
    Dado que outubro de 2026 tem 3 compras somando R$ 233,34
    Quando eu abro a aba "Cartões" em outubro de 2026
    Então vejo "Fatura de outubro de 2026" com "R$ 233,34" e "3 compras"

  Cenário: Resumo de um mês passado
    Dado que estou vendo setembro de 2026
    Então a fatura considera só as compras de setembro

  @regra
  Cenário: Cálculo da fatura do cartão
    Dado que o mês aberto tem compras que somam R$ 233,34
    Então a fatura é R$ 233,34
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

  Cenário: Não há botão para atualizar
    Então a aba "Cartões" não tem botão "Atualizar"
    E os dados se atualizam sozinhos a cada mudança e ao voltar para a janela

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
    Dado que uma categoria tem 33,333% do total do mês
    Então o percentual da categoria é exibido sem casas decimais

  Cenário: Nomes dos meses
    Dado o mês "2026-10"
    Então ele é exibido como "Outubro de 2026"
```

## 9. Histórico mensal

Resumo do funcionamento por mês. A especificação completa, com decisões, regras de negócio e todos os cenários, está em [`specs/historico-mensal.md`](specs/historico-mensal.md), com o que mudou em [`specs/compras-e-categorias.md`](specs/compras-e-categorias.md). O visual da tela (gráfico de 6 colunas, média dos 5 meses fechados e listas v2) está na seção 40.

```gherkin
# language: pt
Funcionalidade: Histórico mensal do cartão
  Como usuário
  Quero ver o cartão mês a mês
  Para saber a fatura e quais compras fiz em cada mês

  Contexto:
    Dado que existe um cartão cadastrado

  Cenário: Ver o histórico
    Dado que tenho dados em setembro e outubro de 2026
    Quando eu toco em "Histórico", no título de "Próximas faturas"
    Então vejo o histórico daquele cartão, com "Outubro de 2026" antes de "Setembro de 2026"
    E cada mês mostra a fatura e a quantidade de compras, sem limite nem disponível

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
    Então novembro começa sozinho
    E nenhuma pergunta sobre copiar categorias aparece
    E as parcelas devidas de novembro entram como compras (seção 11)

  Cenário: Virada de mês com vários cartões
    Dado que hoje é 01/11/2026 e os cartões "Nubank" e "Inter" existem
    Quando eu abro o aplicativo com "Nubank" selecionado
    Então novembro começa para "Nubank"
    Quando eu deslizo até "Inter"
    Então novembro começa para "Inter"

  Cenário: Registrar uma compra do mês anterior
    Dado que hoje é 01/11/2026
    Quando eu abro o painel de outubro de 2026
    E registro uma compra com data 31/10/2026
    Então a compra entra na fatura de outubro de 2026

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
  Para ver a fatura de cada um

  Contexto:
    Dado que tenho o cartão "Nubank", verde

  Cenário: Adicionar um segundo cartão
    Quando eu toco em "Novo cartão" na fileira de cartões
    Então o formulário "Seu cartão" abre com a primeira cor ainda não usada (azul) marcada
    Quando eu cadastro o cartão "Inter"
    Então "Inter" aparece na fileira, com a bolinha azul, e fica selecionado

  Cenário: Trocar de cartão
    Dado que tenho também o cartão "Inter", com compras próprias
    Quando eu toco em "Inter" na fileira de cartões
    Então "Inter" fica selecionado
    E as compras, o resumo por categoria e o histórico passam a ser os de "Inter"

  Cenário: Lembrar o último cartão usado
    Dado que deixei "Inter" selecionado
    Quando eu fecho e abro o aplicativo
    Então a aba "Cartões" abre com "Inter" selecionado

  Cenário: Escolher a cor do cartão
    Quando eu toco em "Mais opções do cartão" e em "Editar cartão" com "Nubank" selecionado
    Então vejo as amostras verde, azul, roxo, vinho, grafite e terracota, com a cor atual marcada
    Quando eu escolho vinho e salvo
    Então a bolinha de "Nubank" na fileira fica vinho

  @regra
  Cenário: Nome de cartão repetido
    Quando eu tento cadastrar um cartão chamado " nubank "
    Então vejo a mensagem de erro "Já existe um cartão com esse nome."
    E o formulário continua aberto

  Cenário: Total de todos os cartões no histórico
    Dado que tenho também o cartão "Inter"
    Quando eu abro o Histórico com "Nubank" selecionado
    Então vejo os meses de "Nubank"
    E cada mês mostra a linha "Todos os cartões" com o total das faturas
    Mas com um só cartão essa linha não aparece

  Cenário: Remover um de vários cartões
    Dado que tenho também o cartão "Inter", selecionado
    Quando eu removo "Inter" e confirmo
    Então "Inter" sai da fileira de cartões com todos os seus registros
    E "Nubank" fica selecionado, sem nenhuma alteração

  @regra
  Cenário: Dados de uma versão anterior do app
    Dado que o app tinha um único cartão salvo antes dos múltiplos cartões existirem
    Quando eu abro a nova versão
    Então ele aparece como o primeiro cartão da fileira, com a bolinha verde, selecionado, sem perda de dados
```

## 11. Parcelamento

Resumo das compras parceladas. A especificação completa, com decisões, regras de negócio e todos os cenários, está em [`specs/parcelamento.md`](specs/parcelamento.md), com o que mudou em [`specs/compras-e-categorias.md`](specs/compras-e-categorias.md).

```gherkin
# language: pt
Funcionalidade: Parcelamento
  Como pessoa que compra parcelado no cartão
  Quero registrar a compra uma vez e ver cada parcela cair no seu mês
  Para saber quanto as parcelas pesam na fatura agora e nos próximos meses

  Contexto:
    Dado que hoje é 12/10/2026
    E que existe a categoria "Eletrônicos"

  Cenário: Registrar uma compra parcelada
    Quando eu toco no botão "+" do rodapé, em "Compra no cartão" e ligo "Compra parcelada"
    E registro "Fone" na categoria "Eletrônicos", com valor total de R$ 100,00 em 3 parcelas, em 15/10/2026
    Então antes de salvar vejo "3x de R$ 33,33 · última em dezembro/2026 · 1ª de R$ 33,34"
    E depois de salvar vejo a mensagem "Compra parcelada registrada."
    E outubro tem a compra "Fone" de R$ 33,34 com o selo "1/3", em "Eletrônicos"

  @regra
  Cenário: Cada mês usa só a sua parcela
    Quando eu registro "Notebook" de R$ 3.000,00 em 10x
    Então só R$ 300,00 entram na fatura do cartão em outubro

  Cenário: Compra que já estava em andamento
    Quando eu registro "Geladeira" de R$ 1.000,00 em 10x com "Parcela neste mês" igual a 3
    Então outubro tem a parcela "3/10" de R$ 100,00
    E as parcelas 4 a 10 ficam previstas de novembro de 2026 a maio de 2027

  @regra
  Cenário: Compra parcelada aceita mês futuro até 12 meses à frente
    Quando eu registro uma compra parcelada com data em dezembro de 2027
    Então vejo a mensagem de erro "A data deve ser de até 12 meses à frente."
    Mas com data em novembro de 2026, as parcelas ficam todas previstas (seção 31)

  Cenário: Mês futuro com parcelas previstas e compras
    Dado que registrei "Fone" em 3x e uma compra "Presente" de R$ 100,00 com data em 20/11/2026
    Quando eu clico em "Próximo mês"
    Então vejo novembro com "Presente", que posso editar e excluir
    E vejo "Fone" "2/3" com o selo "prevista", que posso editar e excluir (seções 23 e 24)
    E a fatura de novembro soma a compra e a parcela
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
    Então a compra parcelada é apagada na hora, sem confirmação, e as parcelas gravadas e as previstas somem
    E o aviso "Fone removida." tem "Desfazer", que devolve todas as parcelas (seção 34)

  @regra
  Cenário: Parcela não se altera sozinha
    Quando eu tento alterar ou excluir uma parcela como compra comum
    Então vejo a mensagem de erro "Este lançamento é uma parcela. Altere a compra parcelada."
```

---

## 12. Entradas

As listas de entradas, contas fixas e gastos do dia a dia ficam em telas próprias, abertas pelo resumo da aba ([seção 20](#20-telas-de-entradas-contas-fixas-gastos-e-cartões)); criar é pelo "+" do rodapé. Resumo das entradas de dinheiro. A especificação completa, com decisões, regras de negócio e todos os cenários, está em [`specs/entradas.md`](specs/entradas.md).

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
    Quando eu abro a tela "Entradas" pelo resumo da aba
    Então vejo "Nenhuma entrada neste mês." e o total R$ 0,00

  Cenário: Registrar uma entrada avulsa
    Quando eu toco no "+" do rodapé e em "Entrada"
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
    Então a fatura dos cartões continua igual

  @regra
  Cenário: Limite de navegação
    Quando eu abro um mês fora do intervalo (antes da entrada mais antiga ou mais de 12 meses à frente)
    Então o app volta para "#/entradas"
```

---

## 13. Benefícios

Os benefícios aparecem numa fileira de botões, como os cartões ([seção 21](#21-benefícios-em-carrossel)). Resumo dos benefícios. A especificação completa, com decisões, regras de negócio e todos os cenários, está em [`specs/beneficios.md`](specs/beneficios.md).

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
    Então vejo só o card "Novo benefício", com "Nenhum benefício ainda."

  Cenário: Criar um benefício
    Quando eu toco no card "Novo benefício"
    E preencho o nome "VR", o valor mensal "800" e mantenho o mês inicial
    E toco em "Adicionar"
    Então vejo "VR" na fileira de benefícios, selecionado
    E vejo disponível R$ 800,00 e as colunas "Crédito R$ 800,00", "Gasto R$ 0,00" e "Disponível R$ 800,00", com "Sobra anterior R$ 0,00"
    E o botão "Todos os lançamentos (0)"

  @regra
  Cenário: Validação do benefício
    Quando eu tento criar um benefício chamado " vr " quando já existe "VR"
    Então vejo "Já existe um benefício com esse nome."
    Quando eu informo um mês final antes do mês inicial
    Então vejo "O mês final deve ser igual ou posterior ao mês inicial."

  Cenário: Registrar um gasto
    Dado que existe o benefício "VR" e a categoria "Mercado"
    Quando eu toco no botão "+" do rodapé, em "Gasto de benefício" e escolho "VR"
    E informo a descrição "Almoço", o valor "300", a categoria "Mercado" e uma data do mês
    Então o card "VR" mostra gasto R$ 300,00 e disponível R$ 500,00
    E "Almoço" aparece na tela de lançamentos de "Mercado" e na de todos os lançamentos (seção 22)

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

  Cenário: Sem faixa de total
    Dado que "VR" tem R$ 500,00 disponíveis e "VA" tem R$ 200,00
    Então a aba não mostra a faixa "Disponível em todos os benefícios"; cada card mostra o seu disponível

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
    Quando eu excluo o gasto
    Então o gasto some na hora, sem confirmação, e o disponível volta ao crédito
    E o aviso "Almoço removido." tem "Desfazer" (seção 34)

  Cenário: Excluir um benefício
    Dado que "VR" tem 3 gastos
    Quando eu excluo "VR"
    Então o sistema pede confirmação para "Remover o benefício “VR” e seus 3 gastos? Esta ação não pode ser desfeita."
    E depois de confirmar, "VR" e os gastos dele somem de todos os meses

  Cenário: Dividir o benefício por categoria
    Dado que "VR" vale R$ 800,00 e existem as categorias "Mercado" e "Lazer"
    Quando eu edito "VR", divido R$ 500,00 em "Mercado" e R$ 200,00 em "Lazer" e salvo
    Então o benefício "VR" lista, em "Uso por categoria", "Mercado" R$ 500,00, "Lazer" R$ 200,00 e "Sem categoria" R$ 100,00
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
    Quando eu toco em "Fechar categoria" na linha "Mercado"
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
    Quando eu toco em "Fechar categoria" e confirmo
    Então vejo "Há gastos desta categoria depois de ‹mês›. Exclua-os antes de fechar."

  Cenário: Reabrir uma categoria
    Dado que "Mercado" foi fechada
    Quando eu abro um mês seguinte e toco em "Reabrir categoria"
    Então os meses antes dele continuam fechados
    E dele em diante "Mercado" volta a receber a parte dela, com sobra zero
    Mas se eu reabrir no mês em que fechei, o fechamento é desfeito e a sobra volta

  Cenário: Excluir uma categoria dividida
    Dado que "Lazer" está na divisão de "VR", com gastos
    Quando eu excluo a categoria "Lazer"
    Então a parte dela volta para "Sem categoria", os gastos ficam sem categoria e o disponível não muda

  Cenário: Benefício sem divisão
    Dado que "VR" não tem divisão
    Então o benefício "VR" não mostra "Uso por categoria"

  Cenário: Categorias na aba Benefícios
    Quando eu toco no ícone de categorias do rodapé, na aba "Benefícios"
    Então abre a tela de categorias (seção 2), a mesma das outras abas

  @regra
  Cenário: Limite de navegação
    Quando eu abro um mês fora do intervalo (antes do benefício mais antigo ou mais de 12 meses à frente)
    Então o app volta para "#/beneficios"

  @regra
  Cenário: Benefícios não mexem nos cartões nem nas entradas
    Quando eu registro um gasto num benefício
    Então a fatura dos cartões e o total das entradas continuam iguais
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
    Então o Saldo anterior de um mês futuro soma os resultados dos meses até lá, com a fatura prevista dos cartões
    Quando eu excluo um gasto de outubro
    Então o Saldo de outubro e os Saldos anteriores dos meses seguintes aumentam o valor do gasto

  Cenário: Mês sem nada cadastrado
    Dado que não há entradas, contas, gastos nem cartões
    Então o resumo mostra tudo zerado, com Saldo anterior, Resultado do mês e Saldo R$ 0,00
    E vejo "Nenhuma conta fixa neste mês." e "Nenhum gasto neste mês."

  @regra
  Cenário: Cartões no saldo
    Dado que o Nubank tem fatura de R$ 500,00 e o Inter de R$ 300,00
    Então "Cartões" mostra R$ 800,00
    Quando eu toco no bloco "Cartões"
    Então abre a tela "Cartões" com o total e uma linha por cartão (seção 20)
    Mas em um mês futuro "Cartões" inclui as parcelas previstas e as compras já registradas

  @regra
  Cenário: O saldo lê os cartões sem alterá-los
    Quando eu registro uma conta fixa ou um gasto
    Então a fatura dos cartões continua igual
    E os benefícios não entram no saldo

  Cenário: Cadastrar uma conta fixa
    Quando eu toco no "+" do rodapé e em "Conta fixa"
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
    Quando eu toco no "+" do rodapé e em "Gasto do dia a dia"
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
    Quando eu excluo o gasto
    Então o gasto some na hora, sem confirmação, e o saldo volta
    E o aviso "‹Gasto› removido." tem "Desfazer" (seção 34)

  Cenário: Resumo dos gastos por categoria
    Dado que há R$ 300,00 em "Mercado", R$ 100,00 em "Lazer" e R$ 100,00 sem categoria
    Então "Para onde foi" mostra "Mercado" R$ 300,00 · 60%, "Lazer" R$ 100,00 · 20% e "Sem categoria" R$ 100,00 · 20%

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
  Para saber quanto já está comprometido na fatura dos próximos meses

  Contexto:
    Dado que hoje é 17/10/2026 e o cartão "Nubank" existe

  Cenário: Registrar uma assinatura
    Quando eu abro "Compra no cartão" pelo rodapé e ligo "Compra recorrente"
    Então o título é "Nova compra recorrente" e o valor é "Valor mensal"
    Quando eu informo "Streaming", o valor "40" e a data 15/10/2026
    Então a prévia mostra "Todo mês, dia 15, a partir de outubro de 2026 · sem data final"
    Quando eu clico em "Adicionar"
    Então vejo "Compra recorrente registrada."
    E outubro tem "Streaming" de R$ 40,00 com o selo "Mensal"
    E a fatura do Nubank em outubro inclui R$ 40,00

  Cenário: Recorrente e parcelada não ficam juntas
    Dado que "Compra parcelada" está ligada
    Quando eu ligo "Compra recorrente"
    Então "Compra parcelada" desliga

  @regra
  Cenário: Cobranças previstas nos meses seguintes
    Dado que "Streaming" é recorrente sem fim
    Quando eu abro novembro de 2026
    Então vejo "Streaming" de R$ 40,00 com os selos "Mensal" e "prevista", que posso editar e excluir com a pergunta de escopo (seção 31)
    E a fatura de novembro inclui R$ 40,00
    E o botão "Próximo mês" avança até 12 meses à frente do mês corrente

  Cenário: Mês final e dia 31
    Quando eu registro uma recorrente "até" um mês final
    Então os meses depois dele não têm a cobrança
    E uma cobrança no dia 31 cai no último dia dos meses mais curtos

  Cenário: Assinatura que já existia
    Quando eu registro "Nuvem" com data de dois meses atrás
    Então os meses desde então têm "Nuvem" como compra gravada, e os meses do cartão que não existiam passam a existir
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
    Quando eu excluo a cobrança de outubro com "Só este mês"
    Então só outubro perde a cobrança, sem confirmação depois da escolha, e a fatura diminui
    E o aviso diz "‹Assinatura› removida deste mês." e tem "Desfazer" (seção 34)
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

  Cenário: O seletor de mês fica no cabeçalho
    Dado que estou no "Início", em "Entradas", "Cartões" ou "Benefícios"
    Então o seletor de mês aparece no cabeçalho, entre o olho e o "⋯", e o conteúdo abaixo dele (seção 32)
    Mas em "Cartões" o aviso "Seu caderno está em dia" continua acima do cabeçalho, só em telas largas

  Cenário: Trocar de aba mantém o mês
    Dado que estou na aba "Entradas" em dezembro de 2026
    Quando eu toco em "Cartões" na barra inferior
    Então vejo "Cartões" em dezembro de 2026, com o endereço "#/cartoes/mes/2026-12"
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
    Então vejo o "Início" em dezembro de 2026, com o link "Voltar para o mês atual"

  @regra
  Cenário: O mês corrente não é lembrado
    Dado que eu estava vendo o mês corrente quando fechei o app
    Quando eu abro o app num mês novo
    Então vejo o "Início" no mês de hoje, e não no mês em que fechei

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
    Então vejo o "Início" em dezembro de 2026, o último mês que ele abre
    Mas se a lembrança não puder ser lida ou for inválida, o app abre no mês corrente, sem mensagem
```

---

## 17. Cartão sem limite

Resumo da fatura sem limite. A especificação completa, com decisões, regras de negócio e todos os cenários, está em [`specs/cartao-sem-limite.md`](specs/cartao-sem-limite.md).

```gherkin
# language: pt

Funcionalidade: Cartão sem limite
  Como pessoa que lança as compras do cartão
  Quero ver o total da fatura de cada mês
  Para saber quanto as compras deram, sem controlar limite

  Cenário: Cadastrar um cartão só com nome e cor
    Quando eu clico em "Cadastrar cartão"
    Então o formulário "Seu cartão" abre com nome e cor, e sem campo de limite

  Cenário: A aba mostra a fatura do mês
    Dado que o "Nubank" tem as compras de R$ 120,00 e R$ 80,00 em outubro de 2026
    Então vejo "Fatura de outubro de 2026" com R$ 200,00 e "2 compras"
    E não mostra disponível, limite nem barra de limite utilizado

  Cenário: Mês futuro mostra a fatura prevista
    Dado que o "Nubank" tem a parcela "2/3" de R$ 33,33 e a cobrança recorrente de R$ 40,00 previstas para novembro
    Quando eu abro novembro de 2026
    Então vejo "Fatura prevista de novembro de 2026" com R$ 73,33

  Cenário: A aba Cartões sem a faixa e sem o painel do mês
    Dado que existem 2 cartões
    Quando eu abro a aba "Cartões"
    Então não vejo "Todos os cartões" nem "O mês em perspectiva"

  Cenário: Todos os cartões no Histórico
    Dado que o "Nubank" tem R$ 200,00 e o "Inter" R$ 100,00 em outubro
    Quando eu abro o Histórico
    Então outubro mostra "Todos os cartões: fatura R$ 300,00"
    Mas com um só cartão essa linha não aparece

  @regra
  Cenário: Migração de dados antigos
    Dado que o aparelho tem dados salvos na versão 9, com cartões e meses com limite
    Quando eu abro o app
    Então os cartões e os meses perdem o limite
    E as compras, as categorias, as entradas e o resto continuam como estavam
    E as faturas são as mesmas somas de antes
```

---

## 18. Histórico no card do cartão

Resumo. A especificação completa está em [`specs/historico-no-cartao.md`](specs/historico-no-cartao.md).

```gherkin
# language: pt

Funcionalidade: Histórico no card do cartão

  Cenário: Os botões saem do topo
    Dado que existe um cartão
    Quando eu abro a aba "Cartões"
    Então não há botões "Atualizar" nem "Histórico" no topo
    E no celular a linha de controles não aparece

  Cenário: O link fica em "Próximas faturas"
    Dado que "Nubank" é o cartão selecionado
    Então o título de "Próximas faturas" tem o link "Histórico" (ver seção 28)

  Cenário: Abrir o histórico do cartão
    Dado que "Inter" é o cartão selecionado
    Quando eu toco em "Ver histórico de Inter"
    Então vejo "Histórico" com "Inter · a fatura de cada mês" (seção 40)
    E as mesmas informações de antes: fatura e compras por mês, "Todos os cartões" e "Próximos meses"
```

---

## 19. Botão Lançar

Resumo. A especificação completa está em [`specs/botao-lancar.md`](specs/botao-lancar.md).

```gherkin
# language: pt

Funcionalidade: Botão Lançar

  Cenário: O botão aparece nas quatro áreas
    Quando eu abro o "Início", "Entradas", "Cartões" e "Benefícios"
    Então vejo a barra inferior e, sobre ela, o botão flutuante "Lançar" (ícone "+" e texto) no canto direito
    E o botão "Categorias" não está mais no rodapé: ele passou para o menu "⋯" do cabeçalho (seção 32)
    Mas no Histórico e em Categorias nem a barra nem o botão aparecem

  Cenário: As opções do menu
    Quando eu toco no botão "+"
    Então vejo "Entrada", "Conta fixa", "Gasto do dia a dia", "Compra no cartão" e "Gasto de benefício"

  Cenário: Lançar sem trocar de aba
    Dado que estou na aba "Cartões" em outubro de 2026
    Quando eu toco no botão "+" e em "Entrada" e salvo "Salário" de R$ 5.000,00
    Então vejo "Entrada registrada." e continuo na aba "Cartões"
    E ao abrir "Entradas" vejo o salário em outubro

  Cenário: Compra no cartão selecionado
    Quando eu toco no botão "+" e em "Compra no cartão" e salvo "Feira" de R$ 120,00
    Então a fatura do cartão selecionado sobe R$ 120,00

  Cenário: Gasto de benefício
    Dado que existem os benefícios "VR" e "VA"
    Quando eu toco no botão "+" e em "Gasto de benefício"
    Então escolho o benefício e abre o formulário de gasto
    Se existe só um benefício, o formulário abre direto

  Cenário: A entrada é só o botão do rodapé
    Quando eu abro a aba "Cartões" ou "Benefícios"
    Então não há botão "Registrar compra" nem "Registrar gasto"
    Mas editar e excluir um lançamento continuam na lista

  Cenário: Sem cartão ou sem benefício
    Quando eu toco no botão "+"
    Então "Compra no cartão" e "Gasto de benefício" ficam desabilitadas, com "Cadastre um cartão primeiro" e "Cadastre um benefício primeiro"
```

---

## 20. Telas de entradas, contas fixas, gastos e cartões

Resumo. A especificação completa está em [`specs/telas-de-entradas.md`](specs/telas-de-entradas.md).

```gherkin
# language: pt

Funcionalidade: Telas próprias de entradas, contas fixas e gastos do dia a dia
  Contexto:
    Dado que outubro tem a entrada "Salário" de R$ 5.000,00, a conta fixa "Aluguel" de R$ 1.500,00 e o gasto "Mercado" de R$ 300,00

  Cenário: A aba Entradas não tem as listas
    Quando eu abro a aba "Entradas"
    Então vejo o saldo e o gráfico "Entrou e saiu"
    E não vejo as listas nem botões de criar

  Cenário: Abrir a tela de cada bloco
    Quando eu toco no bloco "Entradas", "Contas fixas", "Gastos do dia a dia" ou "Cartões" da tela "Resumo do mês"
    Então abre a tela dele no mês aberto, com "Voltar", o total do mês e a lista
    E a de gastos traz o resumo "Por categoria"
    E a de cartões lista cada cartão com a fatura e o nº de compras, sem botões de criar
    Mas os saldos não abrem tela

  Cenário: Abrir um cartão pela tela de cartões
    Dado que estou na tela "Cartões" de novembro de 2026
    Quando eu toco em "Inter"
    Então vejo a aba "Cartões" de novembro de 2026 com o "Inter" selecionado

  Cenário: Editar na tela
    Dado que estou na tela "Contas fixas"
    Quando eu toco na linha "Aluguel" ou em "Mais opções de Aluguel" e em "Editar"
    Então o app pergunta "Só este mês" ou "Este e os próximos" e a lista se atualiza ao salvar

  Cenário: Criar pelo rodapé estando na tela
    Dado que estou na tela "Contas fixas"
    Quando eu toco no botão "Lançar", em "Conta fixa" e salvo "Internet" de R$ 100,00
    Então a lista mostra "Internet" e o total sobe R$ 100,00

  Cenário: Voltar mantém o mês
    Dado que estou na tela "Contas fixas" de novembro de 2026
    Quando eu toco em "Voltar"
    Então vejo a aba "Entradas" de novembro de 2026

  Cenário: Mês fora do alcance
    Quando eu abro uma tela com um mês depois do último que a aba abre
    Então vejo a mesma tela no mês mais próximo que ela abre
```

---

## 21. Benefícios em carrossel

Resumo. A especificação completa está em [`specs/beneficios-em-carrossel.md`](specs/beneficios-em-carrossel.md).

```gherkin
# language: pt

Funcionalidade: Benefícios em carrossel
  Contexto:
    Dado que existem os benefícios "VR" (R$ 800,00) e "VA" (R$ 500,00)

  Cenário: Benefícios numa fileira de botões
    Quando eu abro a aba "Benefícios"
    Então vejo os botões "VR" e "VA" lado a lado, com "Novo benefício" depois do último (seção 29)
    E não há botão "Novo benefício" no topo

  Cenário: O que a tela mostra do benefício selecionado
    Então vejo o Disponível do mês, "Crédito · Gasto · Disponível" e a barra "Uso do crédito"
    E o botão "⋯" (Editar e Excluir benefício) ao lado do valor

  Cenário: Trocar de benefício
    Quando eu toco em "VA" na fileira
    Então o "VA" fica selecionado
    E "Uso por categoria" abaixo passa a ser o do "VA"

  Cenário: A seleção acompanha o mês e a aba
    Dado que o "VA" está selecionado
    Quando eu troco de mês ou de aba e volto
    Então o "VA" continua selecionado, enquanto o app está aberto
    Mas se ele não existe naquele mês, o primeiro benefício fica selecionado
```

---

## 22. Lançamentos do benefício

Resumo. A especificação completa está em [`specs/lancamentos-do-beneficio.md`](specs/lancamentos-do-beneficio.md).

```gherkin
# language: pt

Funcionalidade: Lançamentos do benefício em tela própria
  Contexto:
    Dado que o benefício "VR" tem os lançamentos "Almoço" (Mercado) R$ 300,00, "Jantar" (Mercado) R$ 80,00 e "Cinema" (sem categoria) R$ 50,00 em outubro

  Cenário: A aba não lista mais os gastos
    Quando eu abro a aba "Benefícios"
    Então vejo o "VR", o "Uso por categoria" e o botão "Todos os lançamentos (3)"
    E não vejo a lista de lançamentos

  Cenário: Abrir uma categoria
    Quando eu toco em "Mercado" no "Uso por categoria"
    Então abre a tela "Mercado" do "VR" com o total R$ 380,00, "Almoço" e "Jantar"
    Mas "Fechar categoria" e "Reabrir categoria" ficam numa linha própria e não abrem a tela

  Cenário: Abrir sem categoria e todos
    Quando eu toco em "Sem categoria"
    Então a tela mostra só "Cinema" com R$ 50,00
    Quando eu toco em "Todos os lançamentos (3)"
    Então a tela mostra os 3 lançamentos com o total R$ 430,00

  Cenário: Editar, excluir e criar
    Dado que estou numa tela de lançamentos
    Então cada lançamento tem editar e excluir, e não há botão de criar
    E lançar pelo "+" do rodapé atualiza a lista e o total

  Cenário: Voltar
    Quando eu toco em "Voltar"
    Então vejo a aba "Benefícios" no mesmo mês, com o mesmo benefício selecionado

  Cenário: Endereço inválido
    Quando eu abro a tela de um benefício que não existe ou um mês fora do alcance
    Então volto à aba "Benefícios" ou ao mês mais próximo
```

---

## 23. Redesign da tela Entradas

Resumo. A especificação completa está em [`specs/redesign-entradas.md`](specs/redesign-entradas.md). Nenhuma regra de cálculo muda.

> O conteúdo da aba Entradas foi refeito na v2 (saldo com resultado, "Saldo mês a mês" e origens em linhas): veja a seção 35.
## 23. Editar parcela prevista

Resumo. A especificação completa está em [`specs/editar-parcela-prevista.md`](specs/editar-parcela-prevista.md). A prévia de mês futuro (seção 11) deixa de ser só leitura para as parcelas: elas podem ser editadas.

```gherkin
# language: pt

Funcionalidade: Tela Entradas redesenhada

  Cenário: O saldo é o primeiro bloco
    Quando eu abro a aba "Entradas"
    Então o "Saldo" aparece logo abaixo das abas, sem card
    E "Saldo anterior" e "Resultado do mês" ficam na tela "Resumo do mês" (seção 27)

  Cenário: Origens do mês como linhas
    Dado que o mês tem entradas de R$ 4.527,00 e faturas de R$ 520,14
    Quando eu olho a tela "Resumo do mês"
    Então vejo "Entradas" com "+ R$ 4.527,00"
    E "Cartões" com "− R$ 520,14"
    E "Contas fixas" e "Gastos do dia a dia" com "R$ 0,00", sem sinal e sem vermelho

  Cenário: Abrir uma lista
    Quando eu toco na linha "Cartões"
    Então abre a tela de faturas por cartão do mês

  Cenário: Saldo negativo
    Dado que as saídas passam das entradas e do saldo anterior
    Então o card de saldo aparece na cor de alerta
    E mostra "As saídas passaram das entradas e do saldo anterior."

  Cenário: Rodapé com texto
    Quando eu abro as abas "Entradas", "Cartões" e "Benefícios"
    Então vejo o botão "Lançar" com texto e o botão "Categorias" com texto
    E tocar em "Lançar" abre as mesmas cinco opções de antes
Funcionalidade: Editar parcela prevista
  Contexto:
    Dado que hoje é 25/10/2026
    E que existe a compra "Fone" de R$ 100,00 em 3x, com a parcela 1 em 15/10/2026

  Cenário: Editar a compra pela parcela prevista
    Quando eu abro novembro de 2026
    E toco em "Editar compra parcelada" na parcela "Fone" "2/3"
    Então vejo "Editar compra parcelada" com "Parcela neste mês" "2" e data 15/11/2026
    Quando mudo o valor total para "150" e salvo
    Então novembro de 2026 mostra "Fone" "2/3" de R$ 50,00

  Cenário: Cobrança recorrente prevista tem o próprio fluxo
    Então a cobrança recorrente prevista não mostra "Editar compra parcelada"
    Mas ela pode ser editada e excluída com a pergunta de escopo (seção 31)
```

---

## 24. Todas as compras do cartão

Resumo. A especificação completa está em [`specs/todas-as-compras.md`](specs/todas-as-compras.md). A prévia de mês futuro (seção 11) também passa a permitir excluir a compra parcelada pela parcela prevista.

```gherkin
# language: pt

Funcionalidade: Todas as compras do cartão
  Contexto:
    Dado que hoje é 25/10/2026
    E a compra "Mercado" de R$ 80,00 em 05/08/2026
    E a compra parcelada "Fone" de R$ 100,00 em 3x com a parcela 1 em 15/10/2026

  Cenário: Ver as compras de todos os meses
    Quando toco em "Todas as compras" na aba Cartões
    Então vejo os grupos dezembro, novembro, outubro e agosto de 2026, nessa ordem
    E novembro e dezembro mostram "Fone" como "prevista"

  Cenário: Editar ou excluir uma compra de um mês antigo
    Quando edito "Mercado" para R$ 95,00 em 07/09/2026
    Então "Mercado" passa para o grupo setembro de 2026
    Quando excluo "Mercado"
    Então o grupo some, sem confirmação, e o aviso "Mercado removida." tem "Desfazer" (seção 34)

  Cenário: Excluir uma parcela exclui a compra parcelada
    Quando excluo "Fone" "1/3"
    Então "Fone" some de todos os meses, sem confirmação, e o "Desfazer" do aviso devolve todas as parcelas (seção 34)

  Cenário: Compra recorrente pergunta o escopo
    Quando excluo uma cobrança de compra recorrente
    Então o app pergunta "Só este mês" ou "Deste mês em diante"

  Cenário: Excluir pela prévia de mês futuro
    Quando abro novembro de 2026 e excluo a parcela "Fone" "2/3"
    Então "Fone" é removido de todos os meses

  Cenário: Abrir no mês de onde vim (seção 40)
    Dado que estou na aba Cartões em setembro de 2026
    Quando eu toco em "Todas as compras"
    Então abre `#/compras/mes/2026-09` rolada até "Setembro de 2026"
    E o voltar leva à aba Cartões em setembro
```


---

## 25. Redesign da aba Cartões

Resumo. A especificação completa está em [`specs/redesign-cartoes.md`](specs/redesign-cartoes.md). Nenhuma regra de compra, parcela, recorrência, categoria, fatura ou histórico muda; só o visual e o lugar das ações de editar e excluir.

> Na v2 as abas viraram a barra inferior (Início, Entradas, Cartões, Benefícios); o conteúdo desta seção não mudou (seção 32).

```gherkin
# language: pt

Funcionalidade: Aba Cartões redesenhada
  Cenário: Face do cartão
    Dado que o cartão "Nubank" tem fatura de R$ 490,50 em outubro de 2026 com 4 compras
    Quando eu abro a aba "Cartões"
    Então vejo "Nubank" na fileira, "Fatura de outubro de 2026", "R$ 490,50" e "4 compras"
    E vejo o botão "Mais opções do cartão" (o "Histórico" passou para "Próximas faturas", seção 28)

  Cenário: Editar ou excluir o cartão pelo menu
    Quando eu toco em "Mais opções do cartão"
    Então vejo "Editar cartão" e "Excluir cartão"
    E excluir só apaga o cartão e os registros dele depois da confirmação

  Cenário: Editar uma compra tocando na linha
    Quando eu toco na linha da compra "Cabo"
    Então abre o formulário de edição, que tem o botão "Excluir compra"
    E a linha não tem lápis nem lixeira

  Cenário: Excluir pelo formulário
    Quando eu toco em "Excluir compra" numa compra comum, parcelada ou recorrente
    Então a compra comum ou a compra parcelada inteira é apagada na hora, com o aviso "Desfazer" (seção 34), ou vejo antes a pergunta "Só este mês" / "Este e os próximos" se for recorrente

  Cenário: Criar uma compra não mostra "Excluir compra"
    Quando eu toco em "Lançar" e em "Compra no cartão"
    Então o formulário não tem o botão "Excluir compra"

  Cenário: Linhas previstas
    Dado que estou num mês futuro
    Então uma parcela prevista abre a edição da compra parcelada
    E uma cobrança recorrente prevista abre a pergunta de escopo (seção 31)
```


---

## 26. Redesign da aba Benefícios

Resumo. A especificação completa está em [`specs/redesign-beneficios.md`](specs/redesign-beneficios.md). Nenhuma regra de crédito, sobra, gasto, divisão por categoria ou fechamento muda; só o visual e o lugar dos botões.

> Na v2 as abas viraram a barra inferior (Início, Entradas, Cartões, Benefícios); o conteúdo desta seção não mudou (seção 32).

```gherkin
# language: pt

Funcionalidade: Aba Benefícios redesenhada
  Cenário: Face do benefício
    Dado que o benefício "FLASH" tem crédito de R$ 800,00, sobra anterior de R$ 0,00 e gasto de R$ 580,00 em outubro de 2026
    Quando eu abro a aba "Benefícios"
    Então vejo "FLASH", "Disponível em outubro de 2026" e "R$ 220,00"
    E vejo três colunas: "Crédito", "Gasto" e "Disponível" com os valores e a "Sobra anterior" abaixo
    E vejo a barra "Uso do crédito" e o botão "Mais opções do benefício"

  Cenário: Editar ou excluir o benefício pelo menu
    Quando eu toco em "Mais opções do benefício"
    Então vejo "Editar benefício" e "Excluir benefício"
    E excluir só apaga depois da confirmação

  Cenário: Abrir os lançamentos de uma categoria
    Quando eu toco em qualquer parte da linha da categoria "Mercado"
    Então abre a tela de lançamentos de "Mercado"

  Cenário: Fechar e reabrir uma categoria
    Quando eu toco em "Fechar categoria", na linha própria abaixo de "Mercado"
    Então vejo a confirmação com o valor que será liberado
    E depois de confirmar "Mercado" mostra "Fechada", sem barra, e o botão "Reabrir categoria"

  Cenário: Sem categoria não fecha
    Então a linha "Sem categoria" não tem "Fechar categoria" nem "Reabrir categoria"

  Cenário: Alerta de categoria estourada
    Dado uma categoria com disponível negativo
    Então o valor dela aparece na cor de alerta
    E a barra continua na cor única dos gráficos de Benefícios
```

---

## 27. Opção D: Entradas

Resumo. A especificação completa está em [`specs/redesign-opcao-d-entradas.md`](specs/redesign-opcao-d-entradas.md). Nenhuma regra de cálculo muda. A aba Entradas mostrava o saldo sem card e o gráfico "Entrou e saiu" (hoje trocado pelo desenho da seção 35); o resumo em quatro linhas virou a tela "Resumo do mês" (`#/entradas/resumo`, com `/mes/AAAA-MM` no fim para outro mês), aberta pelo link "Resumo" do cartão "Entrou e saiu" da aba.

```gherkin
# language: pt

Funcionalidade: Aba Entradas na Opção D
  Contexto:
    Dado que em outubro de 2026 as entradas são R$ 4.527,00, os cartões R$ 520,14 e contas fixas e gastos R$ 0,00

  Cenário: Saldo e origens
    Quando eu abro a aba "Entradas"
    Então vejo "Saldo" e "R$ 4.006,86" sem card, com "+ R$ 4.006,86 neste mês" abaixo (o gráfico de barras divergentes foi trocado, seção 35)
    E em "Entrou e saiu" vejo "+ R$ 4.527,00" em Entradas e "− R$ 520,14" em Cartões
    E "R$ 0,00" em Contas fixas e em Gastos do dia a dia, sem sinal

  Cenário: Abrir o resumo pelo link de Entradas
    Quando eu toco em "Resumo" no cartão "Entrou e saiu" da aba "Entradas"
    Então abre a tela "Resumo do mês" com "Saldo anterior", "Resultado do mês" e as cinco linhas (a quinta, "Guardado em sonhos", vem da seção 37)

  Cenário: O link Resumo só existe em Entradas
    Quando eu abro as abas "Cartões" e "Benefícios"
    Então não há link "Resumo" e o rodapé não tem botão de resumo

  Cenário: Resultado negativo
    Dado que o resultado do mês é − R$ 300,00
    Então o resultado aparece como "− R$ 300,00 neste mês" e, se o saldo ficar negativo, o saldo vem em cor de alerta com o aviso

  Cenário: Acessibilidade
    Então as linhas de origem têm nome, quantidade, valor e percentual, e uma tabela de apoio visível só para leitor de tela
```

---

## 28. Opção D: Cartões

Resumo. A especificação completa está em [`specs/redesign-opcao-d-cartoes.md`](specs/redesign-opcao-d-cartoes.md). Nenhuma regra de fatura, parcela, categoria ou histórico muda. A face colorida do cartão saiu: a aba mostra uma fileira de botões de cartão, a fatura em texto grande e três gráficos ("Ritmo do mês", "Para onde foi" e "Próximas faturas") antes da lista de compras. Na v2 o "Ritmo do mês" foi removido; a lista de compras mostra todas as compras do mês (seções 36 e 39).

```gherkin
# language: pt

Funcionalidade: Aba Cartões na Opção D
  Contexto:
    Dado que hoje é 26/10/2026 e existe o cartão "Nubank"
    E em outubro há "Cabo" de R$ 20,00 (02/10), "Fone" 1/3 de R$ 40,00 (15/10) e "teste" 1/7 de R$ 357,16 (17/10)

  Cenário: Fatura em destaque
    Quando eu abro a aba "Cartões"
    Então vejo "Fatura de outubro de 2026" e "R$ 417,16"
    E "3 compras · próxima fatura prevista R$ 397,16"
    E não vejo a face colorida do cartão

  Cenário: Trocar de cartão
    Dado que existem os cartões "Nubank" e "Inter"
    Quando eu toco em "Inter" na fileira
    Então o cartão selecionado passa a ser "Inter" e a tela mostra a fatura dele

  Cenário: Ritmo do mês (removido)
    Então a aba não tem mais o gráfico "Ritmo do mês" (seção 36)

  Cenário: Para onde foi
    Então vejo "testes R$ 357,16 · 86%" e "Eletrônicos R$ 60,00 · 14%", na mesma cor
    Quando eu toco em "Eletrônicos"
    Então a lista de Compras mostra só "Fone" e "Cabo", com o "Total do filtro" e o botão "Limpar filtro"

  Cenário: Próximas faturas
    Então vejo sete colunas: outubro cheia com R$ 417,16
    E novembro e dezembro claras com R$ 397,16 e janeiro a abril claras com R$ 357,16

  Cenário: Abrir o histórico
    Quando eu toco em "Histórico" no título de "Próximas faturas"
    Então abre a tela de histórico do cartão

  Cenário: Editar e excluir o cartão
    Quando eu toco em "Mais opções do cartão" e em "Excluir cartão"
    Então vejo a confirmação e o cartão só some se eu confirmar

  Cenário: Mês passado
    Quando eu volto para setembro de 2026
    Então a primeira coluna de "Próximas faturas" é setembro, em cor cheia

  Cenário: Mês futuro
    Quando eu abro novembro de 2026
    Então o rótulo é "Fatura prevista de novembro de 2026"
    E "Compras" mostra as parcelas previstas com o selo "prevista"

  Cenário: Mês sem compras
    Dado que um mês não tem compras
    Então "Compras" mostra o estado vazio com a chamada para lançar
    E "Para onde foi" mostra a mensagem de resumo vazio
```

---

## 29. Opção D: Benefícios

Resumo. A especificação completa está em [`specs/redesign-opcao-d-beneficios.md`](specs/redesign-opcao-d-beneficios.md). Nenhuma regra de saldo, período ou categoria muda. A face colorida saiu: a aba mostra a fileira de benefícios, o disponível em texto grande, a barra "Uso do crédito" e o "Uso por categoria". Os lançamentos continuam em tela própria, aberta pelas categorias e por "Todos os lançamentos".

> Na v2 as abas viraram a barra inferior (Início, Entradas, Cartões, Benefícios); o conteúdo desta seção não mudou (seção 32).

```gherkin
# language: pt

Funcionalidade: Aba Benefícios na Opção D
  Contexto:
    Dado o benefício "Vale-refeição" com crédito mensal de R$ 600,00
    E em outubro de 2026 há R$ 120,00 em lançamentos

  Cenário: Disponível em destaque
    Quando eu abro a aba "Benefícios"
    Então vejo "Disponível em outubro de 2026" e "R$ 480,00"
    E "de R$ 600,00 de crédito · 2 lançamentos"

  Cenário: Uso do crédito
    Então a barra mostra 20% de gasto e 80% de disponível
    E vejo Crédito R$ 600,00, Gasto R$ 120,00 e Disponível R$ 480,00, com "Sobra anterior"

  Cenário: Passou do crédito
    Dado que os lançamentos somam R$ 650,00
    Então a barra fica toda na cor de gasto
    E vejo "Passou R$ 50,00 do crédito" e o disponível na cor de alerta

  Cenário: Abrir os lançamentos de uma categoria
    Quando eu toco numa categoria em "Uso por categoria"
    Então abre a tela de lançamentos dela

  Cenário: Fechar categoria
    Quando eu toco em "Fechar categoria" e confirmo
    Então a categoria é fechada como antes

  Cenário: Mês fora do período
    Quando eu abro um mês depois do mês final do benefício
    Então vejo "Sem crédito em dezembro de 2026", o botão "Novo benefício" e nenhum gráfico

  Cenário: Sem nenhum benefício
    Então vejo "Nenhum benefício ainda. Crie o primeiro para registrar os gastos." e o botão "Novo benefício"
```

---

## 30. Opção D: telas de apoio

Resumo. A especificação completa está em [`specs/redesign-opcao-d-telas-de-apoio.md`](specs/redesign-opcao-d-telas-de-apoio.md). Nenhuma regra de dados muda: o que cada formulário grava, o que cada exclusão apaga e o que cada escopo afeta continuam como antes. As telas abertas a partir das abas ganham botão "Voltar", título de 28 px e linhas com hairline; os formulários, o diálogo de escopo e os menus abrem como folha de rodapé; as perguntas antes de apagar usam um diálogo próprio no lugar de `window.confirm`; e os avisos ficam acima do rodapé.

```gherkin
# language: pt

Funcionalidade: Telas de apoio na Opção D

  Cenário: Voltar de uma lista
    Dado que estou em "Gastos do dia a dia"
    Quando eu toco em "Voltar"
    Então volto para a aba Entradas, no mesmo mês

  Cenário: Lista com total e "⋯" por linha
    Então vejo o título, o total do mês em destaque e uma linha por item, com a linha inteira abrindo a edição
    E cada linha tem o botão "⋯" (Mais opções) com "Editar" e "Excluir"
    E o selo "Mensal" fica na linha de subtítulo, nunca ao lado do valor

  Cenário: Excluir item recorrente
    Quando eu toco em "⋯" e em "Excluir" numa entrada recorrente
    Então vejo a folha com "Só este mês" e "Este e os próximos"
    E ao escolher uma opção o item é apagado na hora, sem confirmação (seção 34)
    E vejo o aviso "‹Item› removido deste mês." (ou "deste mês em diante.") com o botão "Desfazer"

  Cenário: Cancelar confirmação
    Quando a confirmação de um cartão, benefício ou categoria aparece e eu toco em "Cancelar"
    Então nada é apagado
    E "Cancelar" é o botão que já vem com o foco

  Cenário: Formulário em folha
    Quando eu toco em "Lançar" e em "Entrada"
    Então o formulário sobe do rodapé, com o foco no primeiro campo, campos de 48 px e botão de 52 px
    E fecha ao salvar, em "Cancelar", em "Fechar", com Esc ou ao tocar fora

  Cenário: Formulário com erro
    Quando eu salvo um formulário e o app recusa (por exemplo, renomear para um nome que já existe)
    Então vejo a mensagem de erro dentro da folha, acima dos botões, avisada ao leitor de tela
    E a folha continua aberta

  Cenário: Avisos
    Quando eu salvo ou apago algo
    Então o aviso aparece acima do rodapé, com texto de 14 px, e some em 4 segundos
    E erros fora de um formulário são avisados como alerta

  Cenário: Categorias
    Então criar continua num campo e um botão na própria tela
    E renomear abre uma folha, e excluir pede confirmação, ambos pelo "⋯" da linha

  Cenário: Histórico
    Quando eu abro o histórico pela aba Cartões
    Então vejo o gráfico de colunas "Fatura por mês" com os últimos 12 meses, os "Próximos meses" e a lista de todos os meses
    E "Voltar" leva à aba Cartões
```

## 31. Compras do cartão em qualquer mês

Resumo. A especificação completa está em [`specs/compras-em-qualquer-mes.md`](specs/compras-em-qualquer-mes.md). Qualquer compra do cartão, à vista, parcelada ou recorrente, pode ser registrada, editada e excluída em qualquer mês, passado, corrente ou futuro. A cobrança recorrente prevista passa a ter editar e excluir (com a pergunta "Só este mês" / "Este e os próximos"), aparece em "Todas as compras", e a compra parcelada aceita data até 12 meses à frente. O formato salvo não muda.

```gherkin
# language: pt

Funcionalidade: Compras do cartão em qualquer mês
  Contexto:
    Dado que hoje é 26/10/2026
    E a compra recorrente "Academia" de R$ 100,00 todo dia 10, desde setembro de 2026

  Cenário: Editar a cobrança prevista só neste mês
    Quando abro dezembro de 2026, toco em "Academia" e escolho "Só este mês"
    E mudo o valor para "120"
    Então dezembro mostra R$ 120,00 e janeiro de 2027 continua R$ 100,00

  Cenário: Editar a cobrança prevista deste mês em diante
    Quando escolho "Este e os próximos" e mudo o valor para "120" em dezembro
    Então novembro continua R$ 100,00 e dezembro em diante mostram R$ 120,00

  Cenário: Excluir a cobrança prevista
    Quando excluo "Academia" de dezembro e escolho "Só este mês"
    Então dezembro não mostra "Academia" e janeiro de 2027 mostra

  Cenário: Todas as compras lista a cobrança prevista
    Quando abro "Todas as compras"
    Então os meses futuros mostram "Academia" com "Mensal" e "prevista", com editar e excluir

  Cenário: Registrar compra parcelada em mês futuro
    Quando registro "Sofá" de R$ 300,00 em 3x com data 15/12/2026
    Então "Sofá" "1/3", "2/3" e "3/3" aparecem como previstas de dezembro a fevereiro
    E nenhuma parcela é gravada ainda

  @regra
  Cenário: Compra parcelada além de 12 meses
    Quando registro uma compra parcelada com data em dezembro de 2027
    Então vejo a mensagem de erro "A data deve ser de até 12 meses à frente."
```

---

## 32. Nova versão (v2): fundação

Resumo. A especificação completa está em [`specs/redesign-v2-fundacao.md`](specs/redesign-v2-fundacao.md). Nenhuma regra de cálculo muda. O app ganha o tema claro/escuro, a barra inferior, o cabeçalho único, a tela Início e o botão de esconder valores. As cores de todas as telas passaram a ter nome, com valor claro e escuro.

```gherkin
# language: pt

Funcionalidade: Fundação da nova versão

  Cenário: Abrir o app
    Dado que o endereço está vazio
    Quando eu abro o app
    Então vejo o Início do mês corrente
    E a barra inferior mostra "Início" como ativo

  Cenário: Abrir o app num mês lembrado
    Dado que eu fechei o app em outro mês
    Quando eu abro o app
    Então vejo o Início nesse mês

  Cenário: Navegar pela barra
    Dado que estou no Início em um mês diferente do atual
    Quando eu toco em "Cartões" na barra inferior
    Então abre a aba Cartões no mesmo mês
    E tocar no item já ativo volta à tela raiz da área

  Cenário: Endereço antigo de Cartões
    Quando eu abro "#/mes/2026-08"
    Então sou levado para "#/cartoes/mes/2026-08"

  Cenário: Lançar de qualquer lugar
    Quando eu toco em "Lançar"
    Então vejo as cinco opções de lançamento
    E o formulário escolhido abre no mês aberto

  Cenário: Menu do cabeçalho
    Quando eu toco no botão "⋯"
    Então vejo "Categorias", "Histórico" e "Aparência"

  Cenário: Tema escuro automático
    Dado que a aparência está em "Auto"
    Quando o celular troca para o modo escuro
    Então o app troca para o tema escuro sem recarregar

  Cenário: Escolher o tema
    Quando eu escolho "Escuro" em Aparência
    Então o app fica escuro
    E continua escuro quando eu fecho e abro o app

  Cenário: Esconder valores
    Quando eu toco no olho
    Então todos os valores em reais aparecem como "R$ ••••"
    E tocar de novo mostra os valores

  Cenário: Início vazio
    Dado que não há cartão, entrada nem benefício
    Quando eu abro o Início
    Então vejo os 3 passos de primeiro uso
    E o botão "Lançar" continua disponível

  Cenário: Resumo a partir de Entradas
    Quando eu toco em "Resumo do mês" na aba Entradas
    Então abre a tela de resumo do mês aberto
```

Endereços: `#/` (Início), `#/inicio/mes/AAAA-MM`, `#/cartoes`, `#/cartoes/mes/AAAA-MM`. O Início só lê os dados das outras áreas e não grava nada.

> O corpo do Início (saldo, entrou/saiu, próxima fatura e lista de benefícios) foi trocado por painéis com mini-gráfico na seção 33. O estado vazio, os 3 passos do primeiro uso e os atalhos seguem como aqui.

---

## 33. Início com mini-gráficos

Resumo. A especificação completa está em [`specs/inicio-com-minigraficos.md`](specs/inicio-com-minigraficos.md). Nenhuma regra de cálculo muda e nada é gravado. O Início mostra três painéis, cada um com o valor em texto e um mini-gráfico, e a lista dos gastos recentes. Cada painel inteiro é um botão que abre a área no mês aberto.

```gherkin
# language: pt

Funcionalidade: Início com mini-gráficos

  Cenário: Painéis do Início
    Dado que há saldo, uma fatura e um benefício
    Quando eu abro o Início
    Então vejo os painéis "Saldo", "Cartões", "Benefícios" e "Sonhos" (seção 37), nessa ordem
    E, com produtos no carrinho, a barra "Carrinho · N itens" (seção 38) acima da barra inferior
    E cada painel mostra o valor e um mini-gráfico

  Cenário: Tendência do saldo
    Dado que o app tem dados desde 6 meses atrás
    Quando eu olho o painel "Saldo"
    Então vejo uma linha com 6 pontos e o último destacado
    E a legenda "últimos 6 meses"

  Cenário: Saldo com pouco histórico
    Dado que só existe o mês corrente
    Quando eu olho o painel "Saldo"
    Então vejo o valor e o texto "Ainda sem histórico", sem linha

  Cenário: Faturas dos próximos meses
    Dado que há uma compra parcelada em 7 vezes
    Quando eu olho o painel "Cartões"
    Então vejo 7 colunas, a primeira mais forte
    E a legenda "próximas 7 faturas"

  Cenário: Uso do benefício
    Dado um benefício de R$ 600,00 com R$ 120,00 gastos
    Quando eu olho o painel "Benefícios"
    Então vejo "disponível de R$ 600,00", "R$ 480,00" e "20% usado"
    E uma barra com 20% preenchida

  Cenário: Abrir a área pelo painel
    Dado que estou no Início de agosto de 2026
    Quando eu toco no painel "Cartões"
    Então abre a aba Cartões em agosto de 2026

  Cenário: Lançamentos recentes
    Dado que o mês tem 5 gastos até hoje
    Quando eu olho "Lançamentos recentes"
    Então vejo os 3 mais recentes, com valor precedido de "−"
    E "Ver todos" abre o Resumo do mês

  Cenário: Valores escondidos
    Quando eu toco no olho
    Então os valores aparecem como "R$ ••••"
    E os gráficos viram barras neutras sem formato
    E o percentual de uso aparece como "••% usado"

  Cenário: Leitor de tela
    Quando um leitor de tela chega ao painel "Saldo"
    Então lê o valor, o resultado e a descrição do gráfico
    E há uma tabela de apoio com o saldo de cada mês

  Cenário: Falha numa leitura
    Dado que a leitura das faturas dos próximos meses falha
    Quando eu abro o Início
    Então o painel "Cartões" mostra o valor e "Gráfico indisponível"
    E os outros painéis aparecem normalmente
```

O que mudou em relação à seção 32 (Início da fundação): os blocos "Entrou", "Saiu", "Próxima fatura" e a lista de benefícios saíram (`card-home-in`, `card-home-out` e `row-home-benefit-N`). "Entrou" e "Saiu" continuam na aba Entradas e no Resumo do mês. O painel Saldo mostra o resultado do mês ("+ R$ X neste mês"), o painel Cartões mostra a fatura total do mês aberto e o Benefícios soma todos os benefícios.

---

## 34. Desfazer a exclusão

Resumo. A especificação completa está em [`specs/desfazer-exclusao.md`](specs/desfazer-exclusao.md). Nenhuma regra de cálculo muda e nenhum formato salvo muda. Apagar um lançamento (entrada, conta fixa, gasto do dia a dia, compra do cartão avulsa, parcelada ou recorrente, e gasto de benefício) é imediato e abre um aviso com **Desfazer** por 6 segundos. Cartão, benefício e categoria continuam pedindo confirmação, sem "Desfazer". O desfazer fica só na memória: se o app fechar durante o aviso, a exclusão é definitiva.

```gherkin
# language: pt

Funcionalidade: Desfazer a exclusão

  Cenário: Apagar e desfazer um gasto
    Dado um gasto do dia a dia "Mercado" de R$ 80,00
    Quando eu apago "Mercado"
    Então ele some da lista sem pedir confirmação
    E aparece o aviso "Mercado removido." com o botão "Desfazer"
    Quando eu toco em "Desfazer"
    Então "Mercado" volta à lista, com o mesmo valor e a mesma data
    E o aviso diz "Mercado de volta."

  Cenário: O aviso some sozinho
    Dado que apaguei um gasto
    Quando passam 6 segundos
    Então o aviso desaparece
    E a exclusão fica definitiva

  Cenário: O aviso espera enquanto há foco no botão
    Dado que apaguei um gasto
    E o botão "Desfazer" está com o foco
    Quando passam 6 segundos
    Então o aviso continua na tela

  Cenário: Desfazer uma compra parcelada
    Dado uma compra "Fone" em 3 parcelas
    Quando eu apago a compra e desfaço
    Então as 3 parcelas voltam, cada uma no seu mês
    E a fatura de cada mês é a de antes

  Cenário: Desfazer uma recorrente daqui para a frente
    Dado uma conta fixa "Internet" que começou em janeiro
    Quando eu apago "Internet" em junho, "deste mês em diante", e desfaço
    Então "Internet" volta sem data final, e junho e os meses seguintes mostram a conta

  Cenário: Desfazer uma exceção de mês
    Dado uma entrada recorrente "Salário"
    Quando eu apago "Salário" só em julho e desfaço
    Então julho volta a mostrar "Salário"

  Cenário: Apagar outro lançamento antes do prazo
    Dado que apaguei o gasto A e o aviso está aberto
    Quando eu apago o gasto B
    Então o aviso passa a falar do gasto B
    E desfazer devolve só o gasto B
    E o gasto A continua apagado

  Cenário: Lançar depois de apagar não se perde ao desfazer
    Dado que apaguei o gasto A
    E lancei o gasto C
    Quando eu toco em "Desfazer"
    Então os gastos A e C aparecem

  Cenário: Exclusão grande continua pedindo confirmação
    Dado um cartão com compras
    Quando eu peço para excluir o cartão
    Então aparece o diálogo "Remover …?" com "Cancelar" e "Remover"
    E não aparece "Desfazer" depois

  Cenário: Desfazer que não pode ser aplicado
    Dado que apaguei uma compra recorrente
    E o mesmo item foi alterado antes de eu desfazer
    Quando eu toco em "Desfazer"
    Então vejo "Não foi possível desfazer."
    E nada muda

  Cenário: Falha ao apagar
    Dado que a exclusão falha
    Quando eu apago um gasto
    Então o gasto continua na lista
    E aparece o aviso de erro, sem "Desfazer"
```

Detalhes que a spec fecha na implementação: o aviso diz o alcance nas recorrentes ("Salário removido deste mês." ou "deste mês em diante."); o cursor ou o dedo sobre o aviso também pausa a contagem; ao apagar a partir do formulário de edição ("Excluir compra"), o formulário fecha; o aviso de sucesso e o de desfazer nunca aparecem juntos. Identificadores: `snackbar-undo`, `button-undo` e `text-undo`; `button-confirm-ok` e `button-confirm-cancel` continuam só nas exclusões grandes.

---

## 35. Aba Entradas no desenho v3

Resumo. A especificação completa está em [`specs/redesign-v2-entradas.md`](specs/redesign-v2-entradas.md). Nenhuma regra de cálculo muda e a aba só lê. O gráfico de barras divergentes "Entrou e saiu" saiu: a aba mostra o saldo com o resultado do mês, um gráfico de linha "Saldo mês a mês" (saldo ao fim de cada um dos últimos 6 meses, do mesmo `getBalanceSeries` do Início) e as origens como linhas tocáveis com barra: as quatro de sempre mais a quinta, "Guardado em sonhos" (aportes − retiradas do mês, seção 37), que abre a lista `#/entradas/lista/sonhos`. O resultado do mês passa a descontar essa linha; a tela "Resumo do mês" ganha a mesma linha.

```gherkin
# language: pt

Funcionalidade: Aba Entradas na nova versão (desenho v3)

  Cenário: Saldo com o resultado do mês
    Dado que o resultado do mês é + R$ 4.109,84 e o saldo R$ 12.349,54
    Quando eu abro a aba "Entradas"
    Então vejo o saldo R$ 12.349,54
    E a linha "+ R$ 4.109,84 neste mês"

  Cenário: Saldo mês a mês
    Dado que o app tem dados desde 6 meses atrás
    Quando eu olho "Saldo mês a mês"
    Então vejo uma linha com 6 pontos, os nomes dos meses e as marcas "0", "7 mil" e "14 mil"
    E o último ponto está destacado, com o valor escrito ao lado

  Cenário: Ver o saldo de outro mês
    Quando eu toco no ponto de setembro
    Então o ponto fica destacado
    E vejo "Set: R$ 8.239,70" abaixo do título

  Cenário: Escolher o mês pelo teclado
    Dado que o gráfico está com o foco
    Quando eu aperto a seta para a esquerda
    Então o mês anterior é escolhido e o texto muda

  Cenário: Pouco histórico
    Dado que só existe o mês corrente
    Então a seção mostra "Ainda sem histórico." e não desenha o gráfico

  Cenário: Origens como linhas
    Dado que o mês tem entradas de R$ 4.527,00 e uma fatura de R$ 417,16
    Quando eu olho "Entrou e saiu"
    Então vejo "Entradas" com "+ R$ 4.527,00" e "1 lançamento"
    E "Cartões" com "− R$ 417,16" e "1 fatura"
    E "Contas fixas" e "Gastos do dia a dia" com "R$ 0,00", "nenhuma neste mês" / "nenhum neste mês" e sem sinal

  Cenário: Barras proporcionais
    Dado que entraram R$ 4.527,00 e saíram R$ 417,16 em cartões
    Então a barra de "Entradas" está cheia
    E a barra de "Cartões" tem cerca de 9% da largura

  Cenário: Abrir uma lista e o resumo
    Quando eu toco na linha "Cartões"
    Então abre a tela de faturas por cartão do mês aberto
    Quando eu volto e toco em "Resumo"
    Então abre a tela "Resumo do mês"

  Cenário: Saldo negativo
    Dado que as saídas passam das entradas e do saldo anterior
    Então o saldo aparece na cor de alerta com o aviso
    E o gráfico mostra o ponto abaixo do zero

  Cenário: Valores escondidos
    Quando eu toco no olho
    Então os valores, os eixos e o texto do mês escolhido aparecem como "R$ ••••"
    E o gráfico vira uma faixa neutra e as barras viram barras neutras

  Cenário: Falha na série do gráfico
    Dado que a leitura da série falha
    Quando eu abro a aba "Entradas"
    Então a seção mostra "Gráfico indisponível" e "Tentar novamente"
    E o saldo e as linhas aparecem normalmente

  Cenário: Leitor de tela
    Quando um leitor de tela chega ao gráfico
    Então lê a descrição com os 6 saldos
    E há uma tabela de apoio com mês e saldo
```

Detalhes que a spec fecha na implementação: os rótulos do eixo ficam dentro da área do gráfico (as colunas de toque têm 51,6 px em 360 px); abaixo de 400 px o ícone das linhas some e o texto quebra em vez de ser cortado; sem nenhuma entrada no mês, todas as barras ficam em zero; o gráfico tem no máximo 440 px de largura. Identificadores: `chart-balance-line`, `text-balance-selected`, `point-balance-AAAA-MM`, `row-origin-income`, `row-origin-bills`, `row-origin-daily` e `row-origin-cards` (novos), além de `section-balance`, `text-cash-balance`, `text-cash-warning`, `button-summary` e `section-chart` (mantidos; `section-chart` agora é a seção "Saldo mês a mês").

---

## 36. Aba Cartões na nova versão

Resumo. A especificação completa está em [`specs/redesign-v2-cartoes.md`](specs/redesign-v2-cartoes.md). Nenhuma regra de cálculo muda. A aba fica com: seletor de cartão, Fatura, Próximas faturas, Para onde foi e Compras. O gráfico "Ritmo do mês" (e o `StepLine`) foi removido, e a lista longa "O que já aconteceu", com chips de categoria e "Ver mais", virou "Compras" (que na seção 39 passou a listar todas as compras do mês).

```gherkin
# language: pt

Funcionalidade: Aba Cartões na nova versão

  Cenário: Ordem das seções
    Dado um cartão com compras no mês
    Quando eu abro a aba "Cartões"
    Então vejo, nesta ordem, o seletor de cartão, "Fatura", "Próximas faturas", "Para onde foi" e "Compras"
    E não vejo "Ritmo do mês"

  Cenário: Fatura em destaque
    Dado que a fatura de outubro é R$ 417,16 e a de novembro é R$ 397,16
    Então vejo "Fatura de outubro" e "R$ 417,16"
    E "3 compras · próxima fatura prevista R$ 397,16"

  Cenário: Próximas faturas
    Dado uma compra parcelada em 7 vezes
    Então vejo 7 colunas, a do mês aberto mais forte
    E a legenda "Lançada" e "Prevista"
    Quando eu toco em "Histórico"
    Então abre o histórico de faturas

  Cenário: Resumo por categoria mantido
    Dado compras em "Eletrônicos" e em "Mercado"
    Então "Para onde foi" lista as duas categorias com valor e barra

  Cenário: Filtrar as compras por categoria
    Dado compras em "Eletrônicos" e em "Mercado"
    Quando eu toco em "Eletrônicos" em "Para onde foi"
    Então "Compras" mostra só as de "Eletrônicos", com "Total do filtro"
    E aparece o botão "Limpar filtro"
    Quando eu toco em "Limpar filtro"
    Então "Compras" volta a mostrar todas as compras do mês

  Cenário: Compras do mês (substituído pela seção 39)
    Dado que o mês tem 5 compras
    Então "Compras" mostra as 5
    E o link "Todas as compras" leva à lista completa, sem filtro

  Cenário: Editar uma compra pela lista
    Quando eu toco numa compra registrada
    Então abre o formulário de edição dela

  Cenário: Mês sem compras
    Dado um cartão sem compras no mês
    Então "Para onde foi" mostra "O resumo por categoria aparece quando houver compras no mês."
    E "Compras" mostra o estado vazio com a chamada para lançar

  Cenário: Valores escondidos
    Quando eu toco no olho
    Então os valores aparecem como "R$ ••••"
    E as colunas e as barras viram formas neutras

  Cenário: Trocar de mês limpa o filtro
    Dado um filtro de categoria ativo
    Quando eu vou para o mês seguinte
    Então o filtro some
```

Detalhes que a spec fecha na implementação: o valor da Fatura tem 36 px abaixo de 380 px, 42 px até 419 px e 48 px a partir de 420 px; trocar de cartão também remove o filtro; com o olho fechado as barras de `Para onde foi` e as colunas (e as de Benefícios e do Histórico, que usam os mesmos componentes) perdem a forma e o percentual. O item de compra tem a parcela junto do nome ("Teste 1/7"), "Categoria · data" embaixo e os selos "Mensal" e "prevista" ao lado; o mínimo é de 64 px. Identificadores: sai `section-pace`, `text-pace-empty`, `filter-categories` e os `filter-…`; entram `section-purchases` e `button-clear-filter`; os demais ficam (`section-invoice`, `text-invoice`, `button-card-menu`, `section-where`, `list-category-summary`, `row-summary-…`, `section-next`, `button-history`, `button-all-purchases`, `list-movements`, `row-movement-…`, `row-planned-…`, `text-movements-empty`, `text-filter-total`, `button-create-card`).

---

## 37. Sonhos

Resumo. A especificação completa está em [`specs/sonhos.md`](specs/sonhos.md). Cada sonho é uma **caixinha** com meta, valor guardado, ritmo e previsão de chegada. A pessoa define quanto da renda quer guardar por mês e como dividir entre os sonhos (**plano**), guarda dinheiro quando quiser (o valor sai do saldo e vai para a caixinha) e, ao chegar na meta, escolhe entre **usar** o dinheiro ou **mantê-lo guardado**. Aportes e retiradas entram numa quinta linha, **"Guardado em sonhos"**, em Entradas, no Resumo do mês e numa lista própria; o resultado do mês passa a descontar essa linha. O formato salvo é a versão 12 (`dreams`, `dreamEntries`, `dreamPlan`). As telas ficam em `#/sonhos`, `#/sonhos/plano`, `#/sonhos/novo`, `#/sonhos/ID`, `#/sonhos/ID/editar`, `#/sonhos/ID/conquista` e `#/entradas/lista/sonhos`; o acesso é pelo painel do Início e pelo item "Sonhos" do menu ⋯.

```gherkin
# language: pt

Funcionalidade: Sonhos

  Contexto:
    Dado que hoje é 15 de outubro de 2026
    E as entradas do mês somam R$ 4.527,00

  Cenário: Estado vazio
    Quando eu abro "Sonhos" pelo menu ⋯
    Então vejo "Criar meu primeiro sonho"

  Cenário: Criar um sonho
    Quando eu crio "Viagem ao Japão", meta R$ 18.000,00, já guardado R$ 4.320,00, parte 100%
    Então ele aparece em "Meus sonhos" com 24% e "R$ 4.320,00 de R$ 18.000,00"
    E o saldo não muda

  Cenário: Validar o novo sonho
    Quando eu tento criar um sonho com já guardado igual à meta
    Então vejo o erro no formulário e nada é salvo

  Cenário: Dividir o plano
    Dado os sonhos "Japão", "Reserva" e "Notebook" ativos
    Quando eu defino o plano em 20% e a divisão 40%, 35% e 25%
    Então vejo "R$ 905,40 por mês" e o total 100%
    E o botão "Salvar plano" fica ativo

  Cenário: Divisão que não fecha
    Quando eu aumento uma parte sem diminuir outra
    Então o total passa de 100% e "Salvar plano" fica desativado

  Cenário: Sobra do mês
    Dado uma fatura de R$ 417,16 e o plano em 20%
    Então o plano mostra "sobram R$ 3.204,44 para o mês"

  Cenário: Ritmo e previsão
    Dado o sonho "Japão" com parte 40%, falta R$ 13.680,00 e o plano em 20%
    Então o ritmo é "R$ 362,16/mês" e a previsão é "dez/2029"

  Cenário: Guardar agora
    Dado o sonho "Japão" com R$ 4.320,00 guardados
    Quando eu guardo R$ 200,00
    Então a caixinha passa a R$ 4.520,00
    E o saldo cai R$ 200,00
    E "Guardado em sonhos" do mês mostra "− R$ 200,00" e "1 aporte"
    E o resultado do mês diminui R$ 200,00

  Cenário: Guardar mais do que o saldo
    Quando eu tento guardar mais do que o saldo de hoje
    Então vejo o motivo e nada é salvo

  Cenário: Marco de 25%
    Dado o sonho "Japão" com 24% da meta
    Quando eu guardo R$ 200,00
    Então a tela "Guardado!" diz "Primeiro quarto da meta!"

  Cenário: Retirar
    Dado o sonho "Japão" com R$ 4.520,00 guardados
    Quando eu retiro R$ 100,00
    Então a caixinha passa a R$ 4.420,00 e o saldo sobe R$ 100,00

  Cenário: Retirar mais do que o guardado
    Quando eu tento retirar mais do que a caixinha tem
    Então vejo o motivo e nada é salvo

  Cenário: Conquistar um sonho
    Dado o sonho "Notebook novo" com R$ 5.900,00 de R$ 6.000,00
    Quando eu guardo R$ 100,00
    Então abre "Você conquistou o Notebook novo!"

  Cenário: Manter guardado
    Dado o sonho "Notebook novo" conquistado
    Quando eu toco em "Manter guardado"
    Então ele vai para "Conquistados" com o dinheiro na caixinha
    E o saldo não muda

  Cenário: Usar o dinheiro
    Dado o sonho "Notebook novo" conquistado com R$ 6.000,00
    Quando eu toco em "Usar o dinheiro"
    Então o saldo não muda
    E existe um gasto do dia a dia "Notebook novo" de R$ 6.000,00 hoje
    E a parte dele passa aos outros sonhos

  Cenário: Excluir um sonho
    Dado o sonho "Reserva" com R$ 6.750,00 guardados
    Quando eu excluo "Reserva" e confirmo
    Então o saldo sobe R$ 6.750,00
    E os aportes antigos continuam nos meses em que aconteceram

  Cenário: Linha nas contas do mês
    Dado um aporte de R$ 200,00 hoje
    Quando eu abro a aba "Entradas"
    Então vejo a linha "Guardado em sonhos" com "− R$ 200,00" e "1 aporte"
    E a lista "Guardado em sonhos" mostra o aporte; tocar nele abre o sonho

  Cenário: Painel no Início
    Dado os 3 sonhos ativos e o plano em 20%
    Quando eu abro o Início
    Então vejo "Guardando R$ 905,40 por mês · 20% da renda" e uma barra por sonho

  Cenário: Animações reduzidas
    Dado que o aparelho pede menos movimento
    Quando eu abro a caixinha
    Então os números, o anel e a caixinha aparecem já no estado final

  Cenário: Valores escondidos
    Quando o olho está fechado
    Então os valores e os percentuais aparecem mascarados
    E anéis e caixinhas viram formas neutras

  Cenário: Falha ao ler os sonhos
    Dado que a leitura dos sonhos falha
    Quando eu abro "Meus sonhos"
    Então vejo o erro com "Tentar de novo"
    E o Início mostra "Sonhos indisponível" sem afetar o resto
```

Detalhes que a spec fecha na implementação: o plano guarda partes inteiras (de 1 a 100) que somam 100% entre os sonhos ativos, e o "−" e o "+" mexem de 5 em 5 pontos; o percentual vai de 0 a 50%; no máximo 12 sonhos ativos; o guardado inicial não mexe no saldo e deve ser menor que a meta; um sonho conquistado ou encerrado devolve a parte aos outros na proporção; editar a meta não a deixa menor que o já guardado; sonhos não entram no Desfazer. Os testes dos cenários estão em `src/data/dreams.test.ts` (dados) e `src/pages/sonhos.test.tsx` (telas).

---

## 38. Carrinho de compras

Resumo. A especificação completa está em [`specs/carrinho.md`](specs/carrinho.md). O carrinho é uma lista única de produtos (nome, preço da unidade, quantidade, categoria e uma anotação de loja, no máximo 50), guardada no aparelho. Enquanto está aberto, **nada é lançado**. Só ao fechar a pessoa escolhe de onde o dinheiro sai: **Saldo da conta** (vira gasto do dia a dia), um **Cartão** em 1x, 2x, 3x, 6x ou 12x (compra avulsa ou parcelada), um **Benefício** (gasto do benefício) ou uma **divisão** entre várias formas. Ao confirmar, cada pedaço de produto vira um lançamento de hoje, na categoria do produto, tudo numa só gravação. O formato salvo é a versão 13 (`cartItems`). As telas ficam em `#/carrinho`, `#/carrinho/produto`, `#/carrinho/produto/ID`, `#/carrinho/pagamento`, `#/carrinho/dividir`, `#/carrinho/confirmar` e `#/carrinho/ok`; o acesso é pelo item "Carrinho" do menu ⋯ e pela barra do Início.

```gherkin
# language: pt

Funcionalidade: Carrinho de compras

  Contexto:
    Dado que hoje é 15 de outubro de 2026
    E um cartão "Nubank" com fatura de R$ 417,16 neste mês
    E o benefício "Vale-refeição" com divisão só em "Alimentação" e R$ 480,00 disponíveis
    E o saldo é R$ 12.349,54

  Cenário: Carrinho vazio
    Quando eu abro "Carrinho" pelo menu ⋯
    Então vejo "Seu carrinho está vazio" e o botão "Adicionar produto"

  Cenário: Adicionar produtos
    Quando eu adiciono "Fone de ouvido" R$ 120,00 x1 "Eletrônicos"
    E "Arroz 5 kg" R$ 32,90 x2 "Alimentação"
    E "Café" R$ 18,50 x1 "Alimentação"
    Então o carrinho mostra 4 itens e o total R$ 204,30
    E o saldo, a fatura e o benefício não mudaram

  Cenário: Validar o produto
    Quando eu tento adicionar um produto com preço zero
    Então vejo o erro no formulário e nada é salvo

  Cenário: Alterar a quantidade
    Quando eu aumento a quantidade do "Café" para 2
    Então o total do produto passa a R$ 37,00 e o do carrinho a R$ 222,80

  Cenário: Remover e desfazer
    Quando eu removo um produto
    Então ele some e aparece "Desfazer"
    Quando eu toco em "Desfazer"
    Então o produto volta na mesma posição

  Cenário: Barra no Início
    Dado 3 produtos no carrinho
    Quando eu abro o Início
    Então vejo a barra "Carrinho · 4 itens" com o total R$ 204,30

  Cenário: Pagar no saldo
    Quando eu fecho o carrinho e escolho "Saldo da conta" e confirmo
    Então os 3 produtos viram gastos do dia a dia de hoje, na categoria de cada um
    E o saldo cai R$ 204,30 e o carrinho fica vazio

  Cenário: Pagar no cartão à vista
    Quando eu escolho "Cartão Nubank" em 1x e confirmo
    Então os 3 produtos viram compras avulsas hoje
    E a fatura de outubro passa de R$ 417,16 para R$ 621,46

  Cenário: Pagar no cartão em 3x
    Quando eu escolho "Cartão Nubank" em 3x
    Então vejo "3x de R$ 68,10" e a fatura de outubro passando de R$ 417,16 para R$ 485,28
    Quando eu confirmo
    Então cada produto vira uma compra parcelada em 3 vezes
    # O resto dos centavos de cada produto fica na 1.ª parcela: 40,00 + 21,94 + 6,18 = 68,12.

  Cenário: Benefício que não cobre sozinho
    Dado que só "Arroz 5 kg" e "Café" são de Alimentação
    Então "Vale-refeição" aparece desativado com "Cobre R$ 84,30 de R$ 204,30"

  Cenário: Benefício que cobre sozinho
    Dado um carrinho só com produtos de Alimentação de R$ 84,30
    Então "Vale-refeição" pode ser escolhido sozinho

  Cenário: Dividir pagamento
    Quando eu divido R$ 84,30 no "Vale-refeição" e R$ 120,00 no "Cartão Nubank" em 3x
    Então "Falta alocar" mostra R$ 0,00
    E ao confirmar, "Arroz 5 kg" e "Café" são gastos do benefício
    E "Fone de ouvido" é uma compra em 3x no cartão

  Cenário: Sugerir divisão
    Quando eu toco em "Sugerir divisão"
    Então o Vale-refeição recebe R$ 84,30 e o cartão o resto

  Cenário: Divisão que não fecha
    Quando a soma dos valores é menor que o total
    Então "Falta alocar" mostra a diferença e "Continuar" fica desativado

  Cenário: Benefício acima da cobertura
    Quando eu aloco R$ 100,00 no "Vale-refeição"
    Então vejo o aviso do limite de R$ 84,30 e "Continuar" fica desativado

  Cenário: Produto quebrado entre duas formas
    Quando eu aloco R$ 50,00 no benefício e o resto no saldo
    Então "Arroz 5 kg" gera um gasto de benefício de R$ 50,00 e um gasto do dia a dia de R$ 15,80

  Cenário: Confirmar mostra o que muda
    Dado a divisão R$ 84,30 no benefício e R$ 120,00 no cartão em 3x
    Então vejo "Disponível fica R$ 395,70" e "Fatura de outubro passa de R$ 417,16 para R$ 457,16"
    E o saldo que ficará, porque a fatura também desconta do saldo

  Cenário: Falha ao confirmar
    Dado que o benefício foi fechado para Alimentação antes de confirmar
    Quando eu confirmo
    Então nada é criado, o carrinho continua cheio e a tela volta para "Dividir" com o motivo

  Cenário: Saldo negativo
    Dado o saldo de hoje menor que o total
    Quando eu escolho "Saldo da conta"
    Então vejo "Deixa o saldo negativo" e posso continuar

  Cenário: Excluir uma categoria
    Dado "Café" na categoria "Alimentação"
    Quando eu excluo a categoria "Alimentação"
    Então "Café" continua no carrinho sem categoria

  Cenário: Compra registrada
    Quando eu confirmo a compra dividida
    Então vejo "Compra registrada" com os lançamentos por forma
    E "Ver lançamentos" abre a aba da forma com mais valor

  Cenário: Esvaziar o carrinho
    Quando eu escolho "Esvaziar carrinho" e confirmo
    Então o carrinho fica vazio

  Cenário: Valores escondidos
    Quando o olho está fechado
    Então preços, totais e efeitos aparecem mascarados
    E o campo de preço do formulário continua editável

  Cenário: Falha ao ler o carrinho
    Dado que a leitura do carrinho falha
    Quando eu abro "Carrinho"
    Então vejo o erro com "Tentar de novo" e o Início não mostra a barra
```

Detalhes que a spec fecha na implementação: o item "Carrinho" do menu ⋯ aparece sempre (abre o estado vazio) e mostra a quantidade só quando há produtos; a barra do Início some com o carrinho vazio; o benefício **dividido** só cobre categorias da divisão que estejam abertas (produto sem categoria não é coberto) e o benefício **sem divisão** cobre qualquer produto até o disponível; o "Saldo depois" vem de uma simulação do fechamento, então inclui o gasto do dia a dia e a 1.ª parcela (ou a compra à vista) que entra na fatura; sem cartão, "Sugerir divisão" põe o resto no saldo. O rascunho do pagamento vive só na memória: recarregar o app em qualquer passo leva de volta a `#/carrinho`. Os testes dos cenários estão em `src/lib/cart-checkout.test.ts` (distribuição), `src/data/cart.test.ts` (dados) e `src/pages/carrinho.test.tsx` (telas).

---

## 39. Fatura com todas as compras do mês

Resumo. A especificação completa está em [`specs/fatura-com-todas-as-compras.md`](specs/fatura-com-todas-as-compras.md). A lista "Compras" da aba Cartões deixou de mostrar só as 3 mais recentes: agora lista **todas** as compras do mês aberto, da mais recente para a mais antiga, e o "N compras" da Fatura bate com as linhas. Em mês futuro entram também as parcelas e recorrentes previstas (com o selo "prevista"); com filtro de categoria, a lista mostra todas as da categoria. O botão "Todas as compras" continua abrindo a lista de todos os meses. Nenhuma regra de cálculo muda.

```gherkin
# language: pt

Funcionalidade: Fatura com todas as compras do mês

  Cenário: Lista completa do mês
    Dado um cartão com 11 compras no mês
    Quando eu abro a aba "Cartões"
    Então a fatura mostra "11 compras"
    E "Compras" lista as 11, da mais recente para a mais antiga

  Cenário: Filtro mostra todas da categoria
    Dado 6 compras em "Mercado" e 5 em "Eletrônicos" no mês
    Quando eu toco em "Mercado" em "Para onde foi"
    Então "Compras" lista as 6 de "Mercado" e o "Total do filtro"

  Cenário: Mês futuro lista as previstas
    Dado uma compra parcelada em 7 vezes
    Quando eu abro o mês seguinte
    Então "Compras" lista a parcela prevista com o selo "prevista"
```

---

## 40. Histórico e Todas as compras na nova versão

Resumo. A especificação completa está em [`specs/redesign-v2-historico-e-compras.md`](specs/redesign-v2-historico-e-compras.md). As duas telas que saem da aba Cartões ganham o visual v2 (voltar de 48 px, listas em cartões, sem selos coloridos) e duas mudanças de comportamento: o **Histórico** mostra um gráfico de 6 colunas (5 meses fechados + o mês atual "em aberto") e a **média dos últimos 5 meses fechados**; **Todas as compras** abre `#/compras/mes/AAAA-MM`, rolada até o mês de onde a pessoa veio (o mês atual em `#/compras`), e o voltar leva de volta a esse mês. Nenhuma regra de cálculo muda.

```gherkin
# language: pt

Funcionalidade: Histórico e Todas as compras na nova versão

  Cenário: Gráfico do histórico com 6 colunas
    Dado faturas fechadas de maio a setembro e a de outubro em aberto
    Quando eu abro o Histórico
    Então vejo 6 colunas e a de outubro marcada como "em aberto"

  Cenário: Média dos últimos 5 meses
    Dado faturas fechadas de 1850, 2200, 2600, 3100 e 3420
    Então vejo "Média dos últimos 5 meses" com "R$ 2.634,00"

  Cenário: Média só com meses fechados
    Dado uma fatura fechada de R$ 70,00 e a do mês atual de R$ 200,00
    Então a média é "R$ 70,00"

  Cenário: Sem meses fechados não há média
    Dado só a fatura do mês atual
    Então não vejo "Média dos últimos 5 meses"

  Cenário: Todos os meses
    Dado compras em setembro e outubro
    Então "Todos os meses" lista outubro ("em aberto") e setembro ("fatura fechada"), do mais recente ao mais antigo

  Cenário: Filtrar por categoria em Todas as compras
    Dado compras em "Eletrônicos" e em "Mercado"
    Quando eu escolho "Eletrônicos"
    Então vejo só as de "Eletrônicos", a etiqueta "Eletrônicos ✕" e o "Total do filtro"
    Quando eu toco no ✕
    Então voltam todas as compras

  Cenário: Item sem selos coloridos
    Dado uma parcela prevista de uma compra parcelada
    Então o item mostra "Parcela 2/3 · 05 de nov · prevista" em texto

  Cenário: A lista abre no mês de onde vim
    Dado compras em setembro, outubro e novembro
    E que estou na aba Cartões em setembro
    Quando eu toco em "Todas as compras"
    Então abre `#/compras/mes/2026-09` com "Setembro de 2026" visível logo abaixo do cabeçalho
    Quando eu toco em voltar
    Então abre a aba Cartões em setembro

  Cenário: Mês sem compras
    Dado compras só em agosto e novembro e a lista aberta em outubro
    Então a lista rola até "Agosto de 2026"

  Cenário: Busca não rola sozinha
    Dado a lista aberta em setembro
    Quando eu digito uma busca
    Então a posição da lista não é forçada de volta a setembro

  Cenário: Olho fechado
    Dado o olho fechado
    Então nenhum valor em reais aparece nas duas telas e as colunas ficam neutras
```

Detalhes que a implementação fecha: o rótulo da média é sempre "Média dos últimos 5 meses", mesmo quando há menos de 5 meses fechados (a média usa os que existem); em "Todos os meses" tocar num mês abre o painel dele na aba Cartões (não a lista de compras); o ⋯ de cada compra e o botão voltar têm 48 px. Os testes estão em `src/pages/historico.test.tsx` e `src/pages/compras.test.tsx`.
