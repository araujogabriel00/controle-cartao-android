# Spec — Botão de lançar e categorias no menu de rodapé

| Campo | Valor |
| ----- | ----- |
| Status | Implementada |
| Criada em | 18/10/2026 |
| Escopo | `src/components/footer-menu.tsx` (novo), `src/components/quick-add.tsx` (novo), `src/pages/entradas.tsx`, `src/pages/dashboard.tsx`, `src/pages/beneficios.tsx`, `src/App.tsx`, `src/index.css`, `FUNCIONALIDADES.md`, `README.md` |
| Depende de | [`entradas.md`](entradas.md), [`contas-e-gastos.md`](contas-e-gastos.md), [`compras-e-categorias.md`](compras-e-categorias.md), [`beneficios.md`](beneficios.md), [`mes-compartilhado.md`](mes-compartilhado.md) |
| Substitui em parte | Os botões "Registrar compra" (Cartões) e "Registrar gasto" (cada benefício): ficam só no rodapé. Também o botão "Categorias" das abas Entradas, Cartões e Benefícios ([`tela-de-categorias.md`](tela-de-categorias.md)): o acesso passa para o rodapé. Os botões de lançar de cada aba continuam. |

> Mudanças de comportamento entram primeiro aqui e só depois no código.

## 1. Contexto e objetivo

Cada tipo de lançamento tem o botão dentro da própria aba (entrada, conta fixa e gasto do dia a dia em Entradas, compra em Cartões, gasto de benefício dentro de cada benefício). Para lançar algo, é preciso ir até a aba certa.

**Objetivo:** um **menu de rodapé** com um botão "Lançar" por onde entram, de qualquer aba: **entradas**, **contas fixas**, **gastos do dia a dia**, **compras do cartão** e **gastos do benefício (ticket)**.

## 2. Decisões de produto

| # | Decisão | Motivo |
| - | ------- | ------ |
| D1 | **Há um menu de rodapé fixo** nas abas Entradas, Cartões e Benefícios, com um botão central "+" (rótulo "Lançar"). As abas continuam no topo. | Pedido do usuário ("um botão em um footer menu"). Não mexe na navegação por mês. |
| D2 | **Tocar em "Lançar" abre uma lista com 5 opções:** Entrada, Conta fixa, Gasto do dia a dia, Compra no cartão, Gasto de benefício. | Pedido do usuário. |
| D3 | **Escolher uma opção abre o formulário que já existe** daquele tipo, por cima da tela atual, **sem trocar de aba**. Ao salvar, a pessoa continua onde estava. | Escolha do usuário. Reaproveita os formulários e as validações. |
| D4 | **O lançamento usa o mês aberto** (a data inicial segue a regra de cada formulário: hoje no mês corrente, 1º dia em mês futuro, último dia em mês passado). | O mês é compartilhado entre as abas. |
| D5 | **Compra no cartão vai para o cartão selecionado.** Sem cartão cadastrado, a opção fica desabilitada ("Cadastre um cartão primeiro"). | O carrossel já guarda o cartão selecionado. |
| D6 | **Gasto de benefício pede o benefício** num seletor no próprio formulário (entre os que existem no mês aberto). Sem benefício, a opção fica desabilitada ("Cadastre um benefício primeiro"). | O formulário atual é aberto já dentro de um benefício. |
| D7 | **Entrada e conta fixa abrem o formulário de criação**, com as opções de recorrência que já existem. | Mesmos formulários das abas. |
| D8 | **Gasto do dia a dia abre o formulário de novo gasto** (descrição, categoria opcional, valor, data) no mês aberto. | Pedido do usuário. Mesmo formulário da aba Entradas. |
| D9 | **Fora das três abas** (Histórico e Categorias) **o rodapé não aparece.** | Telas de consulta e de gestão; sem mês aberto para lançar. |
| D11 | **O botão do centro mostra só o ícone "+"** (sem a palavra "Lançar"); o rótulo acessível continua "Lançar". | Pedido do usuário. |
| D12 | **O acesso a Categorias vai para o rodapé:** um botão só com o ícone de etiqueta (rótulo acessível "Categorias"), ao lado direito do "+", que abre `#/categorias`. Os botões "Categorias" saem das três abas. | Pedido do usuário ("leve o crud de categorias para o menu footer"). A tela de categorias em si não muda. |
| D13 | **A entrada de compra e de gasto de benefício é só o botão "+" do rodapé:** saem o "Registrar compra" da aba Cartões e o "Registrar gasto" de cada benefício. Editar e excluir lançamentos continuam na lista. | Pedido do usuário. Entradas, contas fixas e gastos do dia a dia mantêm os botões da aba (não foram citados). |
| D10 | **O rodapé não cobre o conteúdo:** a página ganha espaço no fim, respeitando a barra de gestos do Android. O aviso de confirmação sobe acima do rodapé. | Usabilidade em 360 px. |

## 3. Requisitos

| ID | Requisito |
| -- | --------- |
| RF-10 | O botão do centro do rodapé mostra só o ícone "+" (D11). |
| RF-11 | O rodapé tem um botão só com o ícone de categorias que abre `#/categorias`; as abas Entradas, Cartões e Benefícios não têm mais o botão "Categorias" (D12). |
| RF-12 | A aba Cartões não tem o botão "Registrar compra" e os benefícios não têm "Registrar gasto"; lançar é só pelo rodapé (D13). |
| RF-01 | As abas Entradas, Cartões e Benefícios têm um menu de rodapé fixo com o botão "Lançar" (D1, D9). |
| RF-02 | Tocar em "Lançar" abre a lista com "Entrada", "Conta fixa", "Gasto do dia a dia", "Compra no cartão" e "Gasto de benefício"; tocar fora ou em "Fechar" a fecha (D2). |
| RF-03 | "Entrada" abre o formulário de nova entrada no mês aberto (D3, D4, D7). |
| RF-04 | "Conta fixa" abre o formulário de nova conta fixa no mês aberto (D3, D4, D7). |
| RF-09 | "Gasto do dia a dia" abre o formulário de novo gasto no mês aberto (D3, D4, D8). |
| RF-05 | "Compra no cartão" abre o formulário de nova compra no cartão selecionado (D3, D5). |
| RF-06 | "Gasto de benefício" abre o formulário de novo gasto com um seletor de benefício (D3, D6). |
| RF-07 | Ao salvar, o formulário fecha, aparece a confirmação do tipo ("Compra registrada.", etc.) e a pessoa **continua na mesma aba**; o que a aba exibe é atualizado (D3). |
| RF-08 | As opções sem pré-requisito (compra sem cartão, gasto sem benefício) ficam desabilitadas com a explicação (D5, D6). |
| RN-01 | As validações e mensagens de erro são as dos formulários atuais; o menu não cria regra nova. |
| RN-02 | Lançar de uma aba que não é a do tipo (ex.: entrada estando em Cartões) grava normalmente e **não** troca de aba; o dado aparece quando a pessoa abre a aba do tipo no mesmo mês. |
| RN-03 | O botão não altera o formato salvo nem a camada de dados. |

## 4. Cenários

```gherkin
# language: pt
Funcionalidade: Botão Lançar no menu de rodapé
  Contexto:
    Dado que hoje é 18/10/2026 e existe o cartão "Nubank"

  Cenário: O rodapé aparece nas três abas
    Quando eu abro as abas "Entradas", "Cartões" e "Benefícios"
    Então vejo o menu de rodapé com o botão "Lançar"
    Mas no Histórico e em Categorias ele não aparece

  Cenário: As opções do menu
    Quando eu toco no botão "+"
    Então vejo "Entrada", "Conta fixa", "Gasto do dia a dia", "Compra no cartão" e "Gasto de benefício"

  Cenário: Lançar uma entrada estando em Cartões
    Dado que estou na aba "Cartões" em outubro de 2026
    Quando eu toco no botão "+" e em "Entrada"
    Então abre o formulário de nova entrada
    Quando eu salvo "Salário" de R$ 5.000,00
    Então continuo na aba "Cartões"
    E ao abrir "Entradas" vejo o salário em outubro

  Cenário: Lançar uma conta fixa
    Quando eu toco no botão "+" e em "Conta fixa"
    Então abre o formulário de nova conta fixa

  Cenário: Lançar um gasto do dia a dia
    Dado que estou na aba "Benefícios" em outubro de 2026
    Quando eu toco no botão "+" e em "Gasto do dia a dia"
    Então abre o formulário de novo gasto
    Quando eu salvo "Mercado" de R$ 300,00
    Então continuo na aba "Benefícios"
    E ao abrir "Entradas" vejo o gasto em outubro

  Cenário: Lançar uma compra no cartão selecionado
    Dado que "Nubank" é o cartão selecionado
    Quando eu toco no botão "+" e em "Compra no cartão"
    Então abre o formulário de nova compra
    Quando eu salvo "Feira" de R$ 120,00
    Então vejo "Compra registrada." e a fatura do "Nubank" sobe R$ 120,00

  Cenário: Lançar um gasto de benefício
    Dado que existem os benefícios "VR" e "VA"
    Quando eu toco no botão "+" e em "Gasto de benefício"
    Então abre o formulário de gasto com o seletor de benefício
    Quando eu escolho "VA" e salvo "Almoço" de R$ 40,00
    Então o saldo do "VA" diminui R$ 40,00

  Cenário: Sem cartão ou sem benefício
    Dado que não existe nenhum cartão
    Quando eu toco no botão "+"
    Então "Compra no cartão" está desabilitada, com "Cadastre um cartão primeiro"
    E o mesmo vale para "Gasto de benefício" sem benefício

  Cenário: Só o ícone no botão do centro
    Quando eu olho o rodapé
    Então o botão do centro mostra o ícone "+" sem texto
    E ele continua com o nome acessível "Lançar"

  Cenário: Categorias no rodapé
    Quando eu toco no ícone de categorias do rodapé
    Então abre a tela de categorias
    E as abas "Entradas", "Cartões" e "Benefícios" não têm mais um botão "Categorias"

  Cenário: Compra e gasto de benefício só pelo rodapé
    Quando eu abro as abas "Cartões" e "Benefícios"
    Então não há botão "Registrar compra" nem "Registrar gasto"
    Mas editar e excluir um lançamento continuam na lista

  Cenário: O rodapé não cobre o conteúdo
    Dado que estou a 360 px de largura
    Então consigo rolar até o último item da aba acima do rodapé, sem rolagem horizontal
```

| Requisito | Cenário(s) |
| --------- | ---------- |
| RF-01, D9 | O rodapé aparece nas três abas |
| RF-02 | As opções do menu |
| RF-03, RF-07, RN-02, D3, D4 | Lançar uma entrada estando em Cartões |
| RF-04, D7 | Lançar uma conta fixa |
| RF-09, D8 | Lançar um gasto do dia a dia |
| RF-05, D5 | Lançar uma compra no cartão selecionado |
| RF-06, D6 | Lançar um gasto de benefício |
| RF-08 | Sem cartão ou sem benefício |
| RF-10, D11 | Só o ícone no botão do centro |
| RF-11, D12 | Categorias no rodapé |
| RF-12, D13 | Compra e gasto de benefício só pelo rodapé |
| D10 | O rodapé não cobre o conteúdo |
| RN-01, RN-03 | (os formulários e a camada de dados não mudam) |

## 5. Dados e contrato

Sem mudança no formato salvo (`version: 10`) nem em `store.ts`. O menu usa as mutações que já existem (`useCreateIncome`, `useCreateBill`, `useCreateDailyExpense`, `useCreateMovement`, `useCreateBenefitSpend`) e invalida as mesmas chaves de consulta que as abas.

## 6. Interface

- `footer-menu.tsx`: barra fixa no rodapé, centralizada, com o botão "+ Lançar"; abre a lista (folha inferior) de `quick-add.tsx`.
- `quick-add.tsx`: hospeda os formulários. Os formulários de entrada, conta fixa, compra e gasto são **exportados** das páginas (`IncomeDialog`, `BillDialog`, `DailyDialog`, o diálogo de compra e `SpendDialog`) em vez de duplicados; o gasto de benefício pede o benefício num passo de escolha antes do formulário (pula o passo quando só existe um benefício).
- `App.tsx`: renderiza o rodapé nas rotas das três abas, com o mês aberto.
- `index.css`: espaço no fim das páginas e posição do aviso (D10).
- 360 px: o rodapé tem a largura da tela, sem rolagem horizontal.

## 7. Fora de escopo

- Atalho para criar cartão ou benefício pelo menu (só desabilita com aviso, RF-08).
- Mover as abas para o rodapé.
- Mudanças de dados.

## 8. Critérios de aceite

- [x] RF-12 funciona (D13). *Verificado no navegador: sem "Registrar compra" em Cartões e sem "Registrar gasto" nos benefícios; editar e excluir continuam; o gasto de benefício abre pelo rodapé.*
- [x] RF-10 e RF-11 funcionam (D11, D12). *Verificados no navegador: o "+" sem texto e com o nome "Lançar"; o ícone de categorias abre `#/categorias`; cada aba tem agora um só botão de categorias (o do rodapé); a 360 px o "+" fica centralizado e sem rolagem horizontal.*
- [x] RF-01 a RF-09 funcionam como descritos. *Verificados no navegador: rodapé nas três abas e não no Histórico/Categorias; as 5 opções; entrada (estando em Cartões), conta fixa e gasto do dia a dia (estando em Benefícios), compra no cartão e gasto de benefício com escolha do benefício, todos sem trocar de aba e com os totais atualizados; opções desabilitadas sem cartão/benefício. Diferença da spec: o benefício é escolhido num passo antes do formulário, e não num seletor dentro dele (D6).*
- [x] Cenários da seção 4 conferidos no navegador; a 360 px o rodapé tem a largura da tela, não há rolagem horizontal e o fim do conteúdo fica acima do rodapé. *Não conferi na barra de gestos real do Android.*
- [x] `npm run typecheck` e `npm run build` passam.
- [x] `FUNCIONALIDADES.md` e `README.md` atualizados.

## 9. Tarefas

1. Exportar os formulários de `entradas.tsx` (entrada, conta fixa e gasto do dia a dia), `dashboard.tsx` e `beneficios.tsx`.
2. `quick-add.tsx` e `footer-menu.tsx`, com os estados desabilitados (RF-08).
3. Ligar no `App.tsx`, ajustar o `index.css` (D10).
4. Atualizar `FUNCIONALIDADES.md` e `README.md`.
5. Verificar; marcar a spec `Implementada`.
