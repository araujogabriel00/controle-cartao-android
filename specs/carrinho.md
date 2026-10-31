# Spec — Carrinho de compras

| Campo | Valor |
| ----- | ----- |
| Status | Proposta |
| Criada em | 30/10/2026 |
| Escopo | `src/data/store.ts` (formato com `cartItems`, fechar o carrinho), `src/data/api.ts`, `src/App.tsx` (rotas), `src/lib/format.ts` (rotas), novas telas `src/pages/{carrinho,carrinho-produto,carrinho-pagamento,carrinho-dividir,carrinho-confirmar,carrinho-ok}.tsx`, novo `src/components/cart-parts.tsx` e `src/lib/cart-checkout.ts` (distribuição entre as formas de pagamento), `src/components/app-header.tsx` (item no menu ⋯), `src/pages/inicio.tsx` (barra), `src/components/undo-snackbar.tsx` (só se precisar), `FUNCIONALIDADES.md`, `README.md`, testes (seção 10) |
| Depende de | [`compras-e-categorias.md`](compras-e-categorias.md), [`parcelamento.md`](parcelamento.md), [`multiplos-cartoes.md`](multiplos-cartoes.md), [`beneficios.md`](beneficios.md), [`lancamentos-do-beneficio.md`](lancamentos-do-beneficio.md), [`contas-e-gastos.md`](contas-e-gastos.md), [`desfazer-exclusao.md`](desfazer-exclusao.md), [`redesign-v2-fundacao.md`](redesign-v2-fundacao.md) |
| Substitui em parte | Nada. O carrinho **cria** lançamentos que já existem (compra no cartão, compra parcelada, gasto de benefício e gasto do dia a dia) pelas mesmas regras de hoje. |
| Referência visual | Canvas "Controle do Cartão", grupo v6: V6_01 Carrinho, V6_02 Adicionar produto, V6_03 Pagamento, V6_04 Dividido, V6_05 Confirmar, V6_06 Sucesso, V6_07 Vazio, V6_08 Início com carrinho; claras e escuras |

> Mudanças de comportamento entram primeiro aqui e só depois no código.

---

## 1. Contexto e objetivo

Hoje o app só registra o que **já foi comprado**. Quem está planejando uma compra (lista do mercado, o fone que quer comprar) não tem onde montar a lista, ver o total e decidir **de onde o dinheiro vai sair** antes de gastar.

**Objetivo:** um **carrinho** onde a pessoa adiciona produtos (nome, preço, quantidade, categoria), vê o total e, **só ao fechar**, escolhe a forma de pagamento: saldo da conta, um cartão (à vista ou parcelado), um benefício (como o vale-refeição) ou **uma divisão entre várias formas**. Ao confirmar, o app cria os lançamentos de verdade, nas regras de sempre.

## 2. Glossário

| Termo | Significado |
| ----- | ----------- |
| Carrinho | A lista de produtos que a pessoa pretende comprar. Não gera nenhum lançamento enquanto estiver aberto. |
| Produto | Um item do carrinho: nome, preço da unidade, quantidade, categoria e uma anotação de loja. |
| Forma de pagamento | De onde o dinheiro sai: **Saldo da conta**, **Cartão** (um dos cadastrados) ou **Benefício** (um dos cadastrados). |
| Cobertura | Quanto de um carrinho um benefício consegue pagar (D6). |
| Fechar o carrinho | Escolher a(s) forma(s) de pagamento, confirmar e transformar os produtos em lançamentos. |
| Pedaço | Parte de um produto paga por uma forma de pagamento (um produto pode ter mais de um pedaço). |

## 3. Decisões de produto

| # | Decisão | Motivo |
| - | ------- | ------ |
| D1 | O carrinho é **único**, guardado no aparelho e **sobrevive** ao fechar o app. Tem no máximo **50 produtos**. | Lista de compras é algo que se monta aos poucos. |
| D2 | Enquanto o carrinho está aberto, **nada é lançado**: não muda saldo, fatura nem benefício. | Texto do desenho V6_02: "Nada é lançado agora." |
| D3 | **Acesso:** item **Carrinho** no menu ⋯ do cabeçalho (com a quantidade de produtos) e, quando há produtos, uma **barra** no Início — "Carrinho · N itens · total · Abrir" (V6_08). | Escolha do usuário. |
| D4 | **Formas de pagamento:** Saldo da conta, cada Cartão, cada Benefício e "Dividir em mais de uma forma". **Saldo da conta** vira **gasto do dia a dia**; **Cartão** vira compra no cartão (parcelada se escolhido); **Benefício** vira gasto do benefício. Cada um segue a regra de lançamento de hoje. | O carrinho não inventa tipo de lançamento. |
| D5 | **Cartão** oferece **1x, 2x, 3x, 6x e 12x** (1x é compra à vista; as demais, compra parcelada de hoje, com a 1.ª parcela na fatura do mês corrente). Mostra "3x de R$ X · fatura de ‹mês› passa de R$ A para R$ B". | Desenho V6_03; reaproveita o parcelamento existente. |
| D6 | **Benefício paga por categoria.** Para cada categoria do carrinho, o benefício cobre `min(total dos produtos da categoria, disponível da categoria no benefício)`; categoria fechada ou sem linha na divisão do benefício não é coberta. Um benefício **sem divisão** cobre qualquer categoria (e produtos sem categoria), até o disponível total. A cobertura do benefício é a soma. | Escolha do usuário; o desenho diz "Só alimentação · cobre R$ 84,30 de R$ 204,30". |
| D7 | Um benefício só pode ser escolhido **sozinho** se cobrir o total; senão aparece desativado com o motivo e só entra em **Dividir**. | Desenho V6_03. |
| D8 | **Dividir** reparte o total por **valor** entre as formas. O app **distribui os produtos** pelas formas: primeiro os benefícios, na ordem em que aparecem (só produtos que cada um cobre), depois o cartão, depois o saldo; os produtos entram na ordem do carrinho e **um produto pode ser quebrado** quando o valor da forma acaba no meio dele. | Escolha do usuário. |
| D9 | "**Sugerir divisão**" coloca cada benefício no máximo da cobertura (na ordem), e o resto no primeiro cartão (ou no saldo, se não houver cartão). | Desenho V6_04. |
| D10 | **Confirmar** mostra o resumo e "O que vai mudar" por forma (benefício: disponível depois; cartão: fatura depois e parcelas; saldo: saldo depois). Cada **pedaço** vira um lançamento **na data de hoje**, na categoria do produto. Tudo é gravado de uma vez: se algo falhar, nada é criado e o carrinho fica como estava. | Desenho V6_05. |
| D11 | Depois de confirmar, o carrinho **esvazia**, e a tela de sucesso lista o que foi criado por forma, com "Ver lançamentos" e "Voltar ao início". | Desenho V6_06. |
| D12 | **Saldo da conta** que deixaria o saldo de hoje negativo é **permitido**, com aviso na cor de alerta ("Deixa o saldo negativo"). | O app já aceita saldo negativo com aviso. |
| D13 | Remover um produto **não pede confirmação** e mostra o aviso **Desfazer**; "Esvaziar carrinho" (menu ⋯ do carrinho) pede confirmação. | Consistência com o Desfazer do resto do app. |
| D14 | O produto tem o campo **Loja ou link (opcional)** como texto simples; o app não abre nem valida o link. | Só uma anotação. |
| D15 | Excluir uma categoria deixa os produtos do carrinho dela **sem categoria**. | A categoria some, o produto não. |

## 4. Requisitos

### 4.1 Requisitos funcionais (RF)

| ID | Requisito |
| -- | --------- |
| RF-01 | **Carrinho** (`/carrinho`) lista os produtos (nome, "categoria · preço", total do produto, controle de quantidade de 48 px e botão de remover) em um cartão, o botão "Adicionar produto" e, fixo embaixo, "Total · N itens R$ X" com "Fechar carrinho". Menu ⋯ com "Esvaziar carrinho". |
| RF-02 | Sem produtos, mostra o estado vazio (V6_07) com a explicação e o botão "Adicionar produto". |
| RF-03 | **Adicionar produto** (`/carrinho/produto`) tem produto, preço (unidade), quantidade, categoria e loja ou link; botões "Adicionar" e "Adicionar e outro". Tocar num produto abre o mesmo formulário para editar, com "Remover produto". |
| RF-04 | O botão "Fechar carrinho" abre **Como vai pagar?** (`/carrinho/pagamento`) com o total, as opções de D4 e "Dividir em mais de uma forma". Cada opção mostra o efeito (saldo depois, fatura em ‹mês›, "cobre R$ X de R$ Y"). |
| RF-05 | Escolher **Cartão** mostra os chips de parcelas (D5) e o efeito na fatura; **Saldo** mostra "Fica R$ X depois"; **Benefício** só ativo conforme D7. |
| RF-06 | **Dividir pagamento** (`/carrinho/dividir`) mostra o total, "Falta alocar R$ X" (✓ quando zerado), a barra empilhada e um cartão por forma com valor editável, a legenda do que ela pode pagar, o efeito, e "Remover". Há "Adicionar outra forma" e "Sugerir divisão". "Continuar" só ativa com "Falta alocar" zerado e nenhum limite estourado. |
| RF-07 | **Confirmar compra** (`/carrinho/confirmar`) mostra o resumo (quantidade × produto e valor), o total, "O que vai mudar" por forma e o botão "Confirmar compra" com "Voltar e ajustar". |
| RF-08 | Confirmar cria os lançamentos de D10 e abre **Compra registrada** (`/carrinho/ok`), que lista o que foi criado por forma e oferece "Ver lançamentos" (abre a aba da forma com mais valor no mês) e "Voltar ao início". |
| RF-09 | O **Início** mostra a barra do carrinho (D3) quando há produtos; tocar abre `/carrinho`. O menu ⋯ mostra "Carrinho" com a quantidade. |
| RF-10 | Remover um produto mostra o aviso com "Desfazer" (D13). |
| RF-11 | Com o olho fechado, preços, totais e efeitos aparecem mascarados (R$ ••••); o campo de preço do formulário continua editável. |

### 4.2 Regras de negócio (RN)

| ID | Regra |
| -- | ----- |
| RN-01 | Validação do produto: nome de 1 a 120 caracteres; preço maior que zero (em centavos); quantidade inteira de 1 a 99; loja de até 120 caracteres; categoria existente ou nenhuma. O total do produto é `preço × quantidade`, arredondado em centavos; o total do carrinho é a soma. |
| RN-02 | O estado do carrinho fica em `cartItems`, no mesmo armazenamento do app; a ordem de inclusão é a ordem da lista. |
| RN-03 | O **rascunho do pagamento** (forma, parcelas, divisão) vive só na memória durante o fechamento. Recarregar o app em qualquer passo leva de volta a `/carrinho`, com os produtos intactos. |
| RN-04 | **Cobertura de benefício** conforme D6, com o disponível da categoria no **mês corrente**. Benefício fora do período no mês corrente não cobre nada. |
| RN-05 | Forma única: Saldo cobre qualquer total; Cartão cobre qualquer total (sem limite, ver `cartao-sem-limite.md`); Benefício só se `cobertura ≥ total` (D7). |
| RN-06 | Divisão válida: a soma dos valores é igual ao total do carrinho (em centavos); cada valor é maior que zero; o valor de um benefício é menor ou igual à sua cobertura; cada forma aparece uma vez (cartões diferentes são formas diferentes). |
| RN-07 | **Distribuição** (D8): para cada benefício, na ordem, preenche seu valor com pedaços dos produtos que ele cobre, na ordem do carrinho, respeitando o disponível de cada categoria; os produtos restantes preenchem o cartão e depois o saldo. Um produto pode gerar mais de um pedaço, e a soma dos pedaços de um produto é o total dele. |
| RN-08 | **Lançamento por pedaço:** descrição = nome do produto (com " (N×)" quando a quantidade for maior que 1), valor = valor do pedaço, categoria = a do produto, data = hoje. Benefício → gasto do benefício; Saldo → gasto do dia a dia; Cartão 1x → compra avulsa; Cartão 2x ou mais → compra parcelada com `firstInstallment = 1` e `installment = 1` (as parcelas seguem as regras de `parcelamento.md`). |
| RN-09 | **Atomicidade:** todos os lançamentos são criados numa só gravação. Qualquer erro (benefício fechado, valor menor que o mínimo da parcela, forma que não existe mais) desfaz tudo e mostra o motivo; o carrinho não é esvaziado. |
| RN-10 | Se entre a escolha e a confirmação a situação mudou (benefício sem saldo, cartão excluído), a confirmação recalcula e, se a divisão deixou de valer, volta para **Dividir** com o aviso do motivo. |
| RN-11 | Parcelas: o valor do pedaço de cartão deve ser de pelo menos R$ 0,01 por parcela; opções de parcelas que violam isso ficam desativadas. |
| RN-12 | "Fica R$ X depois" usa o saldo do mês corrente; "fatura de ‹mês› passa de A para B" usa a fatura do cartão no mês corrente e a 1.ª parcela. |
| RN-13 | A barra do Início e o item do menu ⋯ somem quando o carrinho está vazio. |
| RN-14 | O Desfazer de remover produto restaura o produto na mesma posição; a lista `cartItems` entra no remendo reverso. |
| RN-15 | `data-testid`: `list-cart`, `row-cart-ID`, `button-cart-minus-ID`, `button-cart-plus-ID`, `button-cart-remove-ID`, `button-add-product`, `form-product`, `input-product-name`, `input-product-price`, `input-product-qty`, `select-product-category`, `input-product-store`, `button-save-product`, `button-save-product-more`, `text-cart-total`, `button-close-cart`, `option-pay-balance`, `option-pay-card-ID`, `option-pay-benefit-ID`, `chip-installments-N`, `button-split-payment`, `text-left-to-allocate`, `input-alloc-…`, `button-add-origin`, `button-suggest-split`, `button-continue-payment`, `button-confirm-purchase`, `button-back-adjust`, `screen-cart-done`, `button-see-entries`, `bar-home-cart`, `menu-cart`, `button-empty-cart`. |
| RN-16 | Texto de no mínimo 14 px (13 px só em legendas), alvos de 48 px, nada depende só de cor (estados em texto e ícone), contraste de 4,5:1 nos dois temas. |
| RN-17 | Se a leitura do carrinho falhar, `/carrinho` mostra o erro com "Tentar de novo" e o Início não mostra a barra; o resto do app não é afetado. |

## 5. Cenários

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

  Cenário: O carrinho sobrevive ao fechar o app
    Dado os 3 produtos no carrinho
    Quando eu fecho e abro o app
    Então os 3 produtos continuam no carrinho

  Cenário: Alterar a quantidade
    Quando eu aumento a quantidade do "Café" para 2
    Então o total do produto passa a R$ 37,00 e o do carrinho a R$ 222,80

  Cenário: Remover e desfazer
    Quando eu removo "Café"
    Então ele some e aparece "Desfazer"
    Quando eu toco em "Desfazer"
    Então "Café" volta na mesma posição

  Cenário: Barra no Início
    Dado 3 produtos no carrinho
    Quando eu abro o Início
    Então vejo a barra "Carrinho · 4 itens · R$ 204,30"

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
    Então vejo "3x de R$ 68,10" e a fatura de outubro passando para R$ 485,26
    Quando eu confirmo
    Então cada produto vira uma compra parcelada em 3 vezes

  Cenário: Benefício que não cobre sozinho
    Dado que só "Arroz 5 kg" e "Café" são de Alimentação
    Então "Vale-refeição" aparece desativado com "cobre R$ 84,30 de R$ 204,30"

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
    Dado o carrinho de R$ 204,30 com "Arroz 5 kg" de R$ 65,80
    Quando eu aloco R$ 50,00 no benefício e o resto no saldo
    Então "Arroz 5 kg" gera um gasto de benefício de R$ 50,00 e um gasto do dia a dia de R$ 15,80

  Cenário: Confirmar mostra o que muda
    Então vejo "Disponível fica R$ 395,70", "fatura de outubro R$ 457,16" e "Saldo: não muda"

  Cenário: Falha ao confirmar
    Dado que o benefício foi fechado para Alimentação antes de confirmar
    Quando eu confirmo
    Então nada é criado, o carrinho continua cheio e vejo o motivo

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
    Quando eu toco no olho
    Então preços, totais e efeitos aparecem mascarados

  Cenário: Falha ao ler o carrinho
    Dado que a leitura do carrinho falha
    Quando eu abro "Carrinho"
    Então vejo o erro com "Tentar de novo"
```

| Requisito | Cenário |
| --------- | ------- |
| RF-01, RF-02, RN-02 | Carrinho vazio; Adicionar produtos; O carrinho sobrevive ao fechar o app |
| RF-03, RN-01 | Validar o produto; Alterar a quantidade |
| RF-10, D13, RN-14 | Remover e desfazer |
| RF-09, D3, RN-13 | Barra no Início |
| RF-04, RF-05, D4, D5, RN-12 | Pagar no saldo; Pagar no cartão à vista; Pagar no cartão em 3x |
| D6, D7, RN-04, RN-05 | Benefício que não cobre sozinho; Benefício que cobre sozinho |
| RF-06, D8, D9, RN-06, RN-07 | Dividir pagamento; Sugerir divisão; Divisão que não fecha; Benefício acima da cobertura; Produto quebrado entre duas formas |
| RF-07, D10 | Confirmar mostra o que muda |
| RN-08, RN-09, RN-10, RN-11 | Falha ao confirmar; verificação nos testes de dados |
| D12 | Saldo negativo |
| D15 | Excluir uma categoria |
| RF-08, D11 | Compra registrada |
| D13 | Esvaziar o carrinho |
| RF-11 | Valores escondidos |
| RN-17 | Falha ao ler o carrinho |
| D2, RN-03, RN-15, RN-16 | Adicionar produtos (nada lançado); verificação manual |

## 6. Modelo de dados e migração

Novo formato salvo (**uma versão acima da vigente quando for implementado**: hoje 11; se os Sonhos entrarem antes, este será o 13). Estado ganha:

```ts
type StoredCartItem = {
  id: number;
  name: string;
  price: number;            // preço da unidade
  quantity: number;         // 1 a 99
  categoryId: number | null;
  store: string;            // anotação, pode ser vazia
};
// estado: cartItems: StoredCartItem[]
```

- **Migração:** `cartItems: []`; nada mais muda.
- **Exclusão de categoria:** `deleteCategory` também zera `categoryId` dos produtos do carrinho (D15).
- **Leituras** (`store.ts` + hooks): `getCart()` (produtos com nome da categoria e total), `getCartCoverage(month)` (cobertura de cada benefício), `getCartPaymentPreview(draft)` (efeitos por forma e validações).
- **Escritas:** `addCartItem`, `updateCartItem`, `removeCartItem` (com remendo reverso do Desfazer, RN-14), `clearCart`, `checkoutCart(draft)`, que valida (RN-06), distribui (RN-07) e cria todos os lançamentos numa só gravação (RN-09), devolvendo os lançamentos criados por forma.
- **Distribuição** em `src/lib/cart-checkout.ts`, função pura e testável, usada por `checkoutCart` e pela tela de confirmação.
- **Preferências:** nenhuma chave nova.

## 7. Interface

- **Carrinho:** cartão de produtos com divisórias de 1 px; linha de 88 px (nome 16 px/600, "categoria · preço" 13 px, total do produto à direita, lixeira de 48 px, controle de quantidade de 48 px com "−" e "+"); botão "Adicionar produto" tracejado; barra inferior fixa com "Total · N itens" e o valor em 24 px, e o botão "Fechar carrinho" de 56 px.
- **Pagamento:** opções como cartões de 72 px com ícone, nome, descrição, seletor de rádio e área extra (chips de parcelas e efeito); opções desativadas com 55% de opacidade e o motivo em texto.
- **Dividir:** cartões por forma com valor editável em 18 px, legenda do limite, efeito, e barra empilhada de 12 px no topo; "Falta alocar" com ✓ quando zerado.
- **Confirmar e Sucesso:** resumo em cartão, "O que vai mudar" com ícone e delta de cada forma, check de sucesso desenhado na primeira exibição (sem animação com `prefers-reduced-motion`).
- **Barra no Início:** 56 px, ícone de carrinho com contador, "Carrinho · N itens", total e "Abrir ›", acima da barra inferior; o botão Lançar sobe o necessário para não ficar sobre ela.
- Referência exata de medidas e cores: V6_01 a V6_08 (claras e escuras) do canvas.

## 8. Fora de escopo

- Lista de desejos separada, vários carrinhos, favoritos ou preços sugeridos.
- Abrir links, buscar preços ou ler código de barras.
- Editar o lançamento criado a partir da tela do carrinho (use as telas de cada área).
- Pagar com a **Previsão**, com a caixinha de um **Sonho** ou com forma fora das listadas.
- Juros no parcelamento (o app não calcula juros, como hoje).
- Desfazer a confirmação inteira da compra (os lançamentos se removem um a um, com o Desfazer de cada área).

## 9. Critérios de aceite

- [ ] `npm test`, `npm run typecheck` e `npm run build` passam.
- [ ] Dados salvos antes da mudança abrem sem perda; `cartItems` começa vazio.
- [ ] Adicionar, editar, mudar a quantidade e remover (com Desfazer) produtos funciona; o carrinho sobrevive ao fechar o app; nada é lançado até confirmar.
- [ ] Pagar no saldo, no cartão (1x e parcelado) e no benefício cria os lançamentos certos e as telas das áreas, o saldo, as faturas e o disponível dos benefícios conferem.
- [ ] A cobertura do benefício respeita a categoria e o disponível (D6); benefício que não cobre sozinho só entra em Dividir.
- [ ] Dividir valida a soma, os limites e quebra produtos conforme RN-07; "Sugerir divisão" funciona.
- [ ] Falha ao confirmar não cria nada e mantém o carrinho; situação que mudou volta para Dividir.
- [ ] Excluir categoria deixa o produto sem categoria.
- [ ] Barra no Início, item no menu ⋯, estado vazio e olho fechado conforme a spec.
- [ ] Temas claro e escuro, leitor de tela e 360 px sem scroll horizontal.
- [ ] `FUNCIONALIDADES.md` (nova seção e ajuste na do Início e do menu ⋯) e `README.md` atualizados.

## 10. Tarefas

1. Formato com `cartItems`, migração, `deleteCategory` limpando a categoria dos produtos.
2. Escritas do carrinho (`addCartItem`, `updateCartItem`, `removeCartItem`, `clearCart`) com validação RN-01 e remendo reverso do Desfazer.
3. `src/lib/cart-checkout.ts`: cobertura (D6), validação da divisão (RN-06), sugestão (D9) e distribuição (RN-07), funções puras.
4. `checkoutCart` atômico (RN-08, RN-09), `getCartCoverage` e `getCartPaymentPreview`; hooks em `api.ts`.
5. **Testes de dados** em `src/data/store.test.ts` e `src/lib/cart-checkout.test.ts` para os cenários de dados (produtos, total, categoria excluída, cobertura, distribuição, quebra de produto, cada forma, parcelado, falha atômica, migração).
6. Rotas (`/carrinho`, `/carrinho/produto`, `/carrinho/produto/:id`, `/carrinho/pagamento`, `/carrinho/dividir`, `/carrinho/confirmar`, `/carrinho/ok`) e rascunho do pagamento em memória (RN-03).
7. Telas: Carrinho, Adicionar produto, Pagamento, Dividir, Confirmar e Sucesso.
8. Item no menu ⋯ e barra no Início.
9. **Testes de telas** em `src/pages/carrinho.test.tsx` (e ajustes em `inicio`), um por cenário da seção 5, com `openApp`.
10. `FUNCIONALIDADES.md` e `README.md`.
11. Rodar `npm test`, `typecheck` e `build`.

## 11. Roteiro de verificação

1. `npm run dev`, 390 px, nos temas claro e escuro, com um cartão, um benefício com divisão por categoria e saldo positivo.
2. Montar o carrinho dos cenários; fechar e abrir o app; remover e desfazer.
3. Pagar de cada jeito (saldo, cartão 1x, cartão 3x, benefício sozinho, dividido) e conferir, antes e depois: saldo, fatura, disponível do benefício e as listas de cada área.
4. Tentar divisões inválidas e produto quebrado; fechar o benefício numa categoria antes de confirmar.
5. Excluir uma categoria usada no carrinho.
6. Fechar o olho; testar leitor de tela nas telas de pagamento; simular erro na leitura do carrinho.
