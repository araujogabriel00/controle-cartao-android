# Spec — Sonhos: caixinhas para objetivos

| Campo | Valor |
| ----- | ----- |
| Status | Proposta |
| Criada em | 30/10/2026 |
| Escopo | `src/data/store.ts` (formato v12, sonhos, aportes, plano, linha "Guardado em sonhos" no caixa), `src/data/api.ts`, `src/App.tsx` (rotas), `src/lib/format.ts` (rotas e `ListKind`), novas telas `src/pages/{sonhos,sonhos-plano,sonho-novo,sonho-caixinha,sonho-conquista,sonhos-lista}.tsx`, novos componentes `src/components/{dream-parts,dream-sheets}.tsx` e `src/components/charts/{dream-ring,jar}.tsx`, `src/pages/inicio.tsx` (painel), `src/pages/{entradas,entradas-resumo,entradas-lista}.tsx` (5.ª linha), `src/components/app-header.tsx` (item no menu ⋯), `FUNCIONALIDADES.md`, `README.md`, testes (seção 10) |
| Depende de | [`contas-e-gastos.md`](contas-e-gastos.md) (caixa do mês, gastos do dia a dia), [`redesign-v2-entradas.md`](redesign-v2-entradas.md) (linhas "Entrou e saiu"), [`inicio-com-minigraficos.md`](inicio-com-minigraficos.md), [`previsoes.md`](previsoes.md) (renda inclui previsões que entraram), [`desfazer-exclusao.md`](desfazer-exclusao.md), [`redesign-v2-fundacao.md`](redesign-v2-fundacao.md) (olho, tema) |
| Substitui em parte | A tela Entradas e o Resumo do mês ganham uma **5.ª linha** ("Guardado em sonhos"); a fórmula do resultado do mês ganha um termo (D8). |
| Referência visual | Canvas "Controle do Cartão", grupo v5: V5_01 Sonhos, V5_02 Plano, V5_03 Novo sonho, V5_04 Caixinha, V5_05 Guardar agora, V5_06 Guardado, V5_07 Conquistado, V5_08 Início com Sonhos; claras e escuras, com animações |

> Mudanças de comportamento entram primeiro aqui e só depois no código.

---

## 1. Contexto e objetivo

O app registra o que entrou e o que saiu, mas não ajuda a **guardar para um objetivo**. Quem quer juntar para uma viagem, uma reserva ou um notebook faz a conta de cabeça e não vê o progresso.

**Objetivo:** uma área **Sonhos**, onde cada objetivo é uma **caixinha** com meta, valor guardado, ritmo e previsão de chegada. A pessoa define **quanto da renda quer guardar por mês** e **como dividir** entre os sonhos, guarda dinheiro quando quiser (o valor sai do saldo e vai para a caixinha), acompanha o progresso com animações e, ao chegar na meta, escolhe entre **usar** o dinheiro ou **mantê-lo guardado**.

## 2. Glossário

| Termo | Significado |
| ----- | ----------- |
| Sonho | Um objetivo com nome, ícone e meta em reais. |
| Caixinha | O dinheiro guardado de um sonho. |
| Aporte | Dinheiro que a pessoa **guarda** num sonho (sai do saldo). |
| Retirada | Dinheiro que a pessoa **tira** da caixinha (volta ao saldo). |
| Guardado inicial | Valor que a pessoa já tinha separado ao criar o sonho; **não** sai do saldo. |
| Plano | O percentual da renda que a pessoa quer guardar por mês e a divisão entre os sonhos. |
| Parte | O percentual do plano que cabe a um sonho. |
| Ativo | Sonho que ainda não chegou à meta e não foi encerrado. |
| Conquistado | Sonho cujo guardado chegou à meta. |
| Encerrado | Sonho conquistado cuja decisão (usar ou manter) já foi tomada. |

## 3. Decisões de produto

| # | Decisão | Motivo |
| - | ------- | ------ |
| D1 | **Acesso** pelo painel **Sonhos** do Início (V5_08) e pelo item **Sonhos** do menu ⋯ do cabeçalho. Não é uma área da barra inferior (que já tem 5 itens). As telas de Sonhos são subtelas com "voltar" e título, sem barra de mês. | Escolha do usuário. |
| D2 | **Aporte só manual.** O plano é uma **meta mensal** (e a base da previsão de chegada); nada sai do saldo sozinho. A pessoa guarda com **Guardar agora**. | Escolha do usuário. |
| D3 | **Plano**: percentual da renda por mês (0 a 50%, passos de 1; atalhos 10, 15, 20, 25, 30) e **divisão entre os sonhos ativos que soma 100%**. A renda de referência é o total de **Entradas do mês corrente** (inclui previsões que já entraram); se for zero, usa a do mês anterior. | Desenho V5_02; sem renda não há ritmo. |
| D4 | **Ritmo** de um sonho = renda de referência × percentual do plano × parte efetiva do sonho. **Previsão de chegada** = mês corrente + `ceil(falta ÷ ritmo)` meses, escrita "dez/2029". Sem ritmo (plano 0%, sem renda ou sem parte), a previsão é "—". | Desenho V5_01/V5_04. |
| D5 | **Parte efetiva**: a divisão considera só os sonhos **ativos**; quando um sonho é conquistado ou encerrado, a parte dele é redistribuída entre os demais **na proporção das partes salvas**, sem mudar os números salvos. | O desenho diz "A parte da economia dele passa para os outros sonhos". |
| D6 | **Guardar agora** tira o valor do **saldo** e o põe na caixinha. Não pode ser maior que o **saldo de hoje** (saldo do mês corrente). O valor sugerido é a parte do plano para aquele sonho, quando houver. **Retirar** devolve ao saldo e não pode passar do guardado. | Desenho V5_05: "Sai do saldo e vai para a caixinha". |
| D7 | **Guardado inicial** ao criar o sonho **não** mexe no saldo (é dinheiro que já estava separado) e deve ser menor que a meta. | Evita criar dinheiro nem gastar o que já foi guardado. |
| D8 | **Contas do mês:** aportes e retiradas entram numa **5.ª linha "Guardado em sonhos"** em "Entrou e saiu", na tela Resumo e numa lista própria. Valor da linha = **aportes − retiradas do mês**. Resultado do mês = entradas − contas fixas − gastos − cartões − **guardado em sonhos**. O saldo segue a fórmula de sempre com o resultado novo. | Escolha do usuário; cada real que sai do saldo tem uma linha que o explica. |
| D9 | **Conquista**: ao guardado chegar à meta, a próxima tela mostra a comemoração (V5_07) com **Usar o dinheiro** e **Manter guardado**. **Manter guardado** encerra o sonho com o dinheiro na caixinha. **Usar o dinheiro** devolve todo o guardado ao saldo (retirada) e registra, no mesmo ato, um **gasto do dia a dia** de mesmo valor, com a descrição igual ao nome do sonho, na data de hoje. | Desenho V5_07; as duas pontas se anulam no saldo e o gasto fica registrado. |
| D10 | **Editar** o sonho muda nome, ícone, meta e parte. **Excluir** pede confirmação (envolve dinheiro): devolve o guardado ao saldo com uma retirada e arquiva o sonho; os aportes e retiradas antigos **permanecem** nas contas dos meses em que aconteceram. | Excluir não pode reescrever o passado. |
| D11 | Marcos de **25%, 50% e 75%** da meta mostram uma mensagem na tela de sucesso do aporte ("Primeiro quarto da meta!"). Sonho com **80% ou mais** leva a etiqueta "Quase lá". | Desenho V5_01 e V5_06. |
| D12 | O painel de Início mostra "Guardando R$ X por mês · N% da renda" e uma barra de progresso por sonho ativo (até 3; se houver mais, "e mais N"). Sem sonhos, o painel convida a criar o primeiro. | Desenho V5_08. |
| D13 | **Animações** (contagem dos números, anel de progresso, enchimento da caixinha, moedas, brilho, confete) são uma camada de apresentação e valem só na primeira exibição de cada tela. Com `prefers-reduced-motion`, tudo aparece já no estado final, sem movimento. Com o olho fechado não há contagem nem formas proporcionais. | Pedido do usuário ("quero animações"); acessibilidade e privacidade. |
| D14 | Máximo de **12 sonhos ativos**. | Mantém a divisão legível. |
| D15 | Sem sonho, "Meus sonhos" mostra o estado vazio com a chamada "Criar meu primeiro sonho" e 3 passos curtos. | Estado vazio como no resto do app. |

## 4. Requisitos

### 4.1 Requisitos funcionais (RF)

| ID | Requisito |
| -- | --------- |
| RF-01 | **Meus sonhos** (`/sonhos`) mostra o cartão do plano (percentual, valor por mês, barra empilhada com a divisão, link "Ajustar plano"), "Neste mês você guardou R$ X de R$ Y", a lista de sonhos e o botão "Novo sonho". |
| RF-02 | Cada sonho na lista mostra anel com o percentual (animado), ícone, nome, "R$ guardado de R$ meta", "N% da economia · previsão" e, com 80% ou mais, "Quase lá". Sonhos conquistados vão para uma seção "Conquistados" ao fim. |
| RF-03 | **Plano** (`/sonhos/plano`): percentual com controle deslizante e atalhos, o valor por mês, o texto "Depois de guardar e pagar os cartões, sobram R$ X para o mês" (renda − guardado planejado − faturas do mês), e a divisão com "−" e "+" por sonho; o botão "Salvar plano" só fica ativo com a soma em 100%. |
| RF-04 | **Novo sonho** (`/sonhos/novo`): nome, quanto custa, já guardado, ícone (6 opções), parte da economia, e a previsão calculada na hora; botão fixo "Criar sonho". |
| RF-05 | **Caixinha** (`/sonhos/:id`): a caixinha animada com o percentual, "Guardado R$ X de R$ meta", três indicadores (Ritmo, Faltam, Previsão), os botões "Guardar agora" e "Retirar", e "Últimos aportes" (aportes, retiradas e o guardado inicial). Menu ⋯ com "Editar" e "Excluir sonho". |
| RF-06 | **Guardar agora** abre uma folha com a caixinha, o valor (com atalhos +50, +100, +200, +500), o aviso "Sai do saldo e vai para a caixinha. Saldo depois: R$ X" e o botão "Guardar R$ X". |
| RF-07 | Depois de guardar, a tela **Guardado!** mostra a caixinha enchendo, moedas, "+ R$ X", o total guardado, a mensagem de marco quando houver e o botão "Voltar ao sonho". |
| RF-08 | **Retirar** abre uma folha parecida, com o aviso "Volta para o saldo", sem atalhos além de "Tudo". |
| RF-09 | Quando o guardado chega à meta, abre **Conquistado** (`/sonhos/:id/conquista`) com anel completo, confete, "Você conquistou o ‹sonho›!" e os botões "Usar o dinheiro" e "Manter guardado". |
| RF-10 | A 5.ª linha de "Entrou e saiu" (Entradas), do Resumo do mês e a lista `/entradas/lista/sonhos` mostram "Guardado em sonhos" com quantidade ("1 aporte"), valor e barra; a lista mostra cada aporte e retirada do mês, e tocar abre o sonho. |
| RF-11 | O painel **Sonhos** do Início e o item "Sonhos" do menu ⋯ levam a `/sonhos`. |
| RF-12 | Editar e excluir um sonho conforme D10; a exclusão pede confirmação com o texto do que acontece com o dinheiro. |
| RF-13 | Com o olho fechado, valores, percentuais, anéis e caixinhas viram formas neutras (D13). |

### 4.2 Regras de negócio (RN)

| ID | Regra |
| -- | ----- |
| RN-01 | **Guardado** de um sonho = guardado inicial + aportes − retiradas. Nunca fica negativo nem passa da meta por retirada; o aporte pode passar da meta (a conquista é aberta e o guardado fica acima). |
| RN-02 | **Caixa:** `savingsAmount` do mês = soma dos aportes − soma das retiradas **datados** no mês; o guardado inicial não entra. O resultado do mês é `entradas − contas fixas − gastos − cartões − savingsAmount`. |
| RN-03 | Aportes e retiradas têm data de hoje ao serem criados e contam no mês dessa data; não há aporte futuro nem retroativo. |
| RN-04 | **Aporte** exige valor maior que zero e **menor ou igual ao saldo de hoje** (arredondado em centavos); caso contrário o formulário mostra o motivo e nada é salvo. **Retirada** exige valor maior que zero e menor ou igual ao guardado. |
| RN-05 | **Validações do sonho:** nome de 1 a 60 caracteres; meta maior que zero; guardado inicial maior ou igual a zero e **menor que a meta**; ícone entre os seis; parte inteira entre 1 e 100. |
| RN-06 | **Divisão do plano:** partes inteiras dos sonhos ativos somam 100. Ao criar um sonho com parte P, os outros sonhos ativos são reduzidos na proporção para a soma voltar a 100 (maior resto), nunca abaixo de 1. Com um só sonho ativo, a parte é 100. |
| RN-07 | **Parte efetiva** (D5) = parte salva ÷ soma das partes salvas dos sonhos ativos × 100. Ritmo e previsão usam a parte efetiva. |
| RN-08 | **Renda de referência** (D3) vem do caixa do mês corrente (`incomeAmount`), ou do mês anterior se aquele for zero; sem renda, ritmo e previsão são "—" e o texto de sobra usa só o que há. |
| RN-09 | **Usar o dinheiro** é atômico: cria a retirada de todo o guardado e o gasto do dia a dia (sem categoria) e encerra o sonho; se qualquer parte falhar, nada muda. **Manter guardado** só encerra. |
| RN-10 | Um sonho encerrado não recebe parte, não aparece no painel do Início e permanece na seção "Conquistados"; aportes e retiradas nele não são mais permitidos. |
| RN-11 | **Excluir** um sonho com guardado maior que zero cria a retirada do guardado e arquiva o sonho; sonho arquivado não aparece em nenhuma lista, e seus lançamentos antigos continuam somando nos meses em que ocorreram (D10). |
| RN-12 | O Desfazer (`desfazer-exclusao.md`) **não** cobre sonhos, aportes nem retiradas (têm confirmação ou são reversíveis por retirada/aporte). |
| RN-13 | A lista de lançamentos recentes do Início e o `getBalanceSeries` continuam funcionando: aportes e retiradas só entram em `getBalanceSeries` pelo caixa (RN-02) e não aparecem em "Lançamentos recentes". |
| RN-14 | Marcos (D11): a mensagem aparece quando um aporte faz o guardado cruzar 25, 50 ou 75% da meta; se cruzar mais de um, mostra o maior. |
| RN-15 | `data-testid`: `card-dreams-plan`, `text-dreams-month`, `list-dreams`, `row-dream-ID`, `ring-dream-ID`, `button-new-dream`, `form-dream`, `input-dream-name`, `input-dream-goal`, `input-dream-initial`, `button-dream-icon-NOME`, `button-save-dream`, `slider-plan-percent`, `button-plan-chip-N`, `button-plan-minus-ID`, `button-plan-plus-ID`, `text-plan-total`, `button-save-plan`, `card-dream-jar`, `text-dream-saved`, `text-dream-eta`, `button-save-money`, `button-withdraw`, `list-dream-entries`, `sheet-save-money`, `input-save-amount`, `button-save-confirm`, `screen-dream-saved`, `screen-dream-done`, `button-use-money`, `button-keep-saved`, `menu-dream`, `button-edit-dream`, `button-delete-dream`, `row-origin-dreams`, `card-home-dreams`, `menu-dreams`. |
| RN-16 | Texto de no mínimo 14 px (12 px só em rótulos de gráfico), alvos de 48 px, nada depende só de cor ou animação (valores e percentuais em texto), contraste de 4,5:1 nos dois temas. |
| RN-17 | Se a leitura dos sonhos falhar, a tela mostra o erro com "Tentar de novo"; o Início mostra o painel com "Sonhos indisponível" e o resto do app segue normal. |

## 5. Cenários

```gherkin
# language: pt

Funcionalidade: Sonhos

  Contexto:
    Dado que hoje é 15 de outubro de 2026
    E as entradas do mês somam R$ 4.527,00 e o saldo é R$ 12.349,54

  Cenário: Estado vazio
    Quando eu abro "Sonhos" pelo menu ⋯
    Então vejo "Criar meu primeiro sonho"

  Cenário: Criar um sonho
    Quando eu crio "Viagem ao Japão", meta R$ 18.000,00, já guardado R$ 4.320,00, parte 100%
    Então ele aparece em "Meus sonhos" com 24% e "R$ 4.320,00 de R$ 18.000,00"
    E o saldo continua R$ 12.349,54

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
    Então o ritmo é "R$ 362,16/mês"
    E a previsão é "dez/2029"

  Cenário: Guardar agora
    Dado o sonho "Japão" com R$ 4.320,00 guardados
    Quando eu guardo R$ 200,00
    Então a caixinha passa a R$ 4.520,00
    E o saldo cai para R$ 12.149,54
    E "Guardado em sonhos" do mês mostra "− R$ 200,00" e "1 aporte"
    E o resultado do mês diminui R$ 200,00

  Cenário: Guardar mais do que o saldo
    Quando eu tento guardar R$ 20.000,00
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
    Quando eu tento retirar R$ 99.999,00
    Então vejo o motivo e nada é salvo

  Cenário: Conquistar um sonho
    Dado o sonho "Notebook" com R$ 5.900,00 de R$ 6.000,00
    Quando eu guardo R$ 100,00
    Então abre "Você conquistou o Notebook novo!"

  Cenário: Manter guardado
    Dado o sonho "Notebook" conquistado
    Quando eu toco em "Manter guardado"
    Então ele vai para "Conquistados" com o dinheiro na caixinha
    E o saldo não muda

  Cenário: Usar o dinheiro
    Dado o sonho "Notebook" conquistado com R$ 6.000,00
    Quando eu toco em "Usar o dinheiro"
    Então o saldo não muda
    E existe um gasto do dia a dia "Notebook novo" de R$ 6.000,00 hoje
    E "Guardado em sonhos" do mês fica sem o valor do notebook
    E a parte dele passa aos outros sonhos

  Cenário: Excluir um sonho
    Dado o sonho "Reserva" com R$ 6.750,00 guardados
    Quando eu excluo "Reserva" e confirmo
    Então o saldo sobe R$ 6.750,00
    E os aportes antigos continuam nos meses em que aconteceram

  Cenário: Linha nas contas do mês
    Dado um aporte de R$ 200,00 hoje
    Quando eu abro a aba "Entradas"
    Então vejo a linha "Guardado em sonhos" com "− R$ 200,00"
    E a lista "Guardado em sonhos" mostra o aporte; tocar nele abre o sonho

  Cenário: Painel no Início
    Dado os 3 sonhos ativos
    Quando eu abro o Início
    Então vejo "Guardando R$ 905,40 por mês · 20% da renda" e uma barra por sonho

  Cenário: Animações reduzidas
    Dado que o aparelho pede menos movimento
    Quando eu abro a caixinha
    Então os números, o anel e a caixinha aparecem já no estado final

  Cenário: Valores escondidos
    Quando eu toco no olho
    Então os valores e os percentuais aparecem mascarados
    E anéis e caixinhas viram formas neutras

  Cenário: Falha ao ler os sonhos
    Dado que a leitura dos sonhos falha
    Quando eu abro "Meus sonhos"
    Então vejo o erro com "Tentar de novo"
    E o Início mostra "Sonhos indisponível" sem afetar o resto
```

| Requisito | Cenário |
| --------- | ------- |
| RF-01, RF-02, D15 | Estado vazio; Criar um sonho |
| RF-04, RN-05, D7 | Criar um sonho; Validar o novo sonho |
| RF-03, D3, RN-06 | Dividir o plano; Divisão que não fecha; Sobra do mês |
| D4, D5, RN-07, RN-08 | Ritmo e previsão |
| RF-05, RF-06, RF-07, D6, RN-02, RN-03, RN-04 | Guardar agora; Guardar mais do que o saldo |
| D11, RN-14 | Marco de 25% |
| RF-08, RN-04 | Retirar; Retirar mais do que o guardado |
| RF-09, D9, RN-09, RN-10 | Conquistar um sonho; Manter guardado; Usar o dinheiro |
| RF-12, D10, RN-11 | Excluir um sonho |
| RF-10, D8 | Linha nas contas do mês |
| RF-11, D12 | Painel no Início |
| D13 | Animações reduzidas |
| RF-13 | Valores escondidos |
| RN-17 | Falha ao ler os sonhos |
| RN-01, RN-13, RN-15, RN-16 | Testes de dados (seção 10) e verificação manual |

## 6. Modelo de dados e migração

Novo formato salvo **versão 12** (hoje 11, das Previsões). Estado ganha:

```ts
type DreamIcon = 'plane' | 'shield' | 'laptop' | 'book' | 'target' | 'star';
type StoredDream = {
  id: number; name: string; icon: DreamIcon;
  goal: number;            // meta, em reais
  share: number;           // parte salva no plano, inteiro 1 a 100
  closed: boolean;         // encerrado (usado ou mantido)
  archived: boolean;       // excluído
  createdAt: string;       // AAAA-MM-DD
};
type StoredDreamEntry = {
  id: number; dreamId: number;
  kind: 'initial' | 'deposit' | 'withdraw';
  amount: number; date: string;   // 'initial' não mexe no caixa
  linkedExpenseId?: number;       // "Usar o dinheiro": o gasto do dia a dia criado junto
};
// estado: dreams: StoredDream[]; dreamEntries: StoredDreamEntry[]; dreamPlan: { percent: number } | null
```

- **Migração v11 → v12:** `dreams: []`, `dreamEntries: []`, `dreamPlan: null`; nada mais muda.
- **Caixa:** `cashOf` devolve também `savingsAmount`, e `MonthCash` ganha esse campo; `resultAmount` usa o termo novo (RN-02). Quem lê `MonthCash` (Início, Entradas, Resumo, séries) recebe o campo novo; para meses sem sonhos o valor é 0 e nada muda.
- **Leituras** (`store.ts` + hooks): `getDreams()` (sonhos com guardado, percentual, parte efetiva, ritmo, previsão e estado), `getDream(id)` (com lançamentos), `getDreamPlan()` (percentual, renda de referência, valor por mês, sobra, divisão, guardado no mês), `getDreamEntries(month)` (para a lista de RF-10).
- **Escritas:** `createDream`, `updateDream`, `deleteDream`, `saveDreamPlan`, `depositDream(id, amount)`, `withdrawDream(id, amount)`, `closeDream(id, 'keep' | 'use')`. Todas validam conforme RN-04, RN-05 e RN-06, e `closeDream('use')` é atômica (RN-09).
- **Preferências:** nenhuma chave nova.

## 7. Interface

- **Meus sonhos:** cartão do plano (percentual em 48 px com contagem, valor por mês, barra empilhada de 16 px com as cores `chart-in`, `chart-violet` e `chart-rose`, legenda, "Ajustar plano ›"); cartões de sonho de 88 px com anel de 64 px, ícone, nome, valores, "N% da economia · mês/ano" e seta; botão "Novo sonho".
- **Plano:** valor grande (56 px), controle deslizante com atalhos de 48 px, texto de sobra, divisão com botões "−"/"+" de 48 px e indicador do total (✓ com 100%).
- **Caixinha:** frasco de 124 px com o nível, onda no topo e moedas ao guardar; três indicadores; botões "Guardar agora" (principal) e "Retirar".
- **Conquistado:** anel de 150 px, ícone de 56 px, confete limitado à área da tela (queda de 210 px com fade), botões de 56 px.
- **Animações:** contagem de números (700 ms), anel e frasco (900 ms, saída suave), moedas e brilho (3,5 s), confete (4 s) e "pop" ao completar; todas só na primeira exibição da tela e desligadas com `prefers-reduced-motion`.
- **Cores e temas:** as cores dos sonhos usam as cores com nome da v2 (claras e escuras).
- Referência exata de medidas: V5_01 a V5_08 (claras e escuras) do canvas.

## 8. Fora de escopo

- Aporte automático ou agendado (D2), notificações e lembretes.
- Foto ou ícone personalizado do sonho; mais de seis ícones.
- Rendimento, juros ou moeda estrangeira.
- Compartilhar sonhos entre pessoas.
- Desfazer para aportes, retiradas e sonhos (RN-12).
- Reabrir um sonho encerrado.
- Escolher uma renda de referência diferente da de D3.

## 9. Critérios de aceite

- [ ] `npm test`, `npm run typecheck` e `npm run build` passam.
- [ ] Dados salvos na v11 abrem sem perda e passam à v12; nada que existia muda de valor.
- [ ] Criar, editar e excluir sonho funcionam conforme D7, D10 e RN-05; o guardado inicial não mexe no saldo.
- [ ] Guardar e retirar mexem no saldo e na linha "Guardado em sonhos" do mês certo; resultado do mês, saldo e as séries do Início conferem.
- [ ] Plano só salva com 100%; ritmo e previsão conferem com D4 e D5.
- [ ] Conquista abre ao chegar na meta; "Manter guardado" e "Usar o dinheiro" têm o efeito de D9 e a parte do sonho é redistribuída.
- [ ] Excluir devolve o guardado e preserva o histórico dos meses anteriores.
- [ ] A 5.ª linha aparece em Entradas, no Resumo e na lista, com valores que somam com o resultado.
- [ ] Painel no Início e item no menu ⋯ levam aos Sonhos; estado vazio e falha tratados.
- [ ] Animações funcionam e param com movimento reduzido; olho fechado mascara valores e formas.
- [ ] Temas claro e escuro, leitor de tela e 360 px sem scroll horizontal.
- [ ] `FUNCIONALIDADES.md` (nova seção e ajustes nas de Entradas, Resumo e Início) e `README.md` atualizados.

## 10. Tarefas

1. Formato v12: tipos, `emptyState`, migração v11 → v12, `savingsAmount` em `cashOf` e `MonthCash`, ajuste do resultado.
2. Regras dos sonhos (guardado, partes efetivas, ritmo, previsão, renda de referência) e leituras com hooks.
3. Escritas (`createDream`, `updateDream`, `deleteDream`, `saveDreamPlan`, `depositDream`, `withdrawDream`, `closeDream`) com validação e atomicidade.
4. **Testes de dados** em `src/data/store.test.ts` para os cenários de dados (criar e validar, guardar, retirar, saldo e linha, plano, ritmo e previsão, conquista nas duas saídas, excluir, migração).
5. Rotas, item no menu ⋯ e componentes de base (`dream-parts`, `dream-sheets`, anel e frasco).
6. Telas: Meus sonhos, Plano, Novo sonho, Caixinha (com Guardar agora, Guardado! e Retirar) e Conquistado.
7. 5.ª linha em Entradas, no Resumo e na lista `/entradas/lista/sonhos`; painel no Início.
8. Animações com redução de movimento e mascaramento do olho.
9. **Testes de telas** em `src/pages/sonhos.test.tsx` (e ajustes em `entradas`, `inicio`) com `openApp`, um por cenário da seção 5.
10. `FUNCIONALIDADES.md` e `README.md`.
11. Rodar `npm test`, `typecheck` e `build`.

## 11. Roteiro de verificação

1. `npm run dev`, 390 px, nos temas claro e escuro. Com saldo e uma entrada de renda, criar três sonhos com o guardado inicial.
2. Definir o plano; guardar em cada sonho; retirar; cruzar 25%, 50% e 75%; conquistar um sonho e testar as duas saídas.
3. Comparar o saldo, o resultado e a linha "Guardado em sonhos" antes e depois de cada passo; abrir a lista da linha.
4. Excluir um sonho com guardado e conferir os meses anteriores.
5. Ver as animações (e com movimento reduzido ligado no sistema); fechar o olho.
6. Abrir um app com dados da v11 e conferir que nada mudou.
7. Simular erro na leitura dos sonhos.
