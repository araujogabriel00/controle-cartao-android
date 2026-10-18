# Spec — Mês compartilhado entre as abas

| Campo | Valor |
| ----- | ----- |
| Status | Implementada |
| Criada em | 18/10/2026 |
| Escopo | `src/components/month-nav.tsx` (novo), `src/components/app-tabs.tsx`, `src/lib/format.ts`, `src/lib/last-month.ts` (novo), `src/App.tsx`, `src/pages/dashboard.tsx`, `src/pages/entradas.tsx`, `src/pages/beneficios.tsx`, `FUNCIONALIDADES.md`, `README.md` |
| Depende de | [`historico-mensal.md`](historico-mensal.md) (rotas por mês dos cartões), [`entradas.md`](entradas.md) e [`beneficios.md`](beneficios.md) (rotas e intervalo de meses de cada aba) |
| Substituída em parte por | [`historico-no-cartao.md`](historico-no-cartao.md): os botões "Histórico" e "Atualizar" da linha de controles de Cartões saíram. |
| Substitui em parte | A navegação de mês das três abas: antes, trocar de aba sempre abria o mês corrente. As regras de cada aba sobre quais meses abrem continuam as mesmas. |

> Esta spec é a fonte da verdade da funcionalidade. A implementação segue a seção [Tarefas](#11-tarefas) e só termina quando todos os [Critérios de aceite](#10-critérios-de-aceite) forem atendidos. Mudanças de comportamento entram primeiro aqui e só depois no código.

---

## 1. Contexto e objetivo

Cada aba (Cartões, Entradas e Benefícios) tem o seu seletor de mês e a sua rota. Quem escolhe, por exemplo, dezembro em Entradas e toca em Cartões cai no mês corrente, e precisa navegar de novo até dezembro. O seletor também fica **abaixo** da barra de abas, e o mês acaba parecendo parte de cada aba, quando na verdade ele vale para as três.

**Objetivo:**

1. O **mês aberto acompanha** quem troca de aba: tocar em outra aba abre o mesmo mês nela.
2. O **seletor de mês fica acima da barra de abas**, para deixar claro que ele vale para as três.
3. Um só componente de seletor de mês, em vez de três cópias.
4. **Lembrar o último mês aberto** e abrir o app nele, com o "Voltar para o mês atual" como caminho de volta.

## 2. Glossário

| Termo | Definição |
| ----- | --------- |
| **Mês aberto** | O mês que a tela mostra. Vem do endereço: `/mes/AAAA-MM` no fim, ou o mês corrente quando não há. |
| **Mês lembrado** | O último mês aberto, guardado no aparelho **só quando não é o mês corrente**. O app abre nele. |
| **Aba de destino** | A aba em que a pessoa toca para trocar. |
| **Mês aceito** | Um mês que a aba abre, segundo as regras dela (seção 4.2). |

## 3. Decisões de produto

| # | Decisão | Motivo |
| - | ------- | ------ |
| D1 | **O mês aberto passa de uma aba para a outra.** Tocar numa aba abre a aba de destino no mesmo mês. | Pedido do usuário. |
| D2 | **O seletor de mês fica acima da barra de abas**, nas três abas. | Pedido do usuário. O mês vale para as três. |
| D3 | **Se a aba de destino não aceita o mês, ela abre o mês aceito mais próximo**, sem mensagem. | Evita voltar ao mês corrente e perder a referência. Ex.: de março de 2027 em Entradas para Cartões, que só vai até dezembro de 2026, abre dezembro de 2026. |
| D2b | **O mês não é guardado em separado**: vem só do endereço. | Sem estado novo, o botão "Voltar" do aparelho e os links por mês continuam funcionando. |
| D4 | **O Histórico e a tela de categorias não têm seletor de mês.** Tocar numa aba a partir do Histórico abre o mês corrente. Tocar num mês do Histórico abre Cartões nesse mês (como hoje). | Essas telas não têm um mês aberto. |
| D5 | **O mês corrente continua nas rotas curtas** (`#/`, `#/entradas`, `#/beneficios`). Os outros meses usam `/mes/AAAA-MM` na rota de cada aba. | Já é assim hoje. |
| D6 | **Sem mudança de dados ou de formato salvo.** A lembrança do mês fica numa chave separada do aparelho, fora do estado do app. | Só navegação. Nada de migração. |
| D7 | **O app lembra o último mês aberto e abre nele.** Ao iniciar, abre a aba Cartões no mês lembrado. | Pedido do usuário. |
| D8 | **Só se lembra um mês que não é o corrente.** Abrir o mês corrente apaga a lembrança, e o app volta a seguir o mês de hoje. | Sem isso, quem fechou o app em outubro abriria em outubro quando já é novembro, e o app nunca avançaria sozinho. |
| D9 | **Um endereço com mês vale mais que a lembrança.** Só o início "vazio" (`#/` ou sem endereço) usa a lembrança. | Um link para um mês específico, ou o "Voltar" do aparelho, não pode ser desfeito. |
| D10 | **O "Voltar para o mês atual" é o caminho de volta.** Ele aparece sempre que o mês aberto não é o corrente, inclusive quando o app abriu num mês lembrado, e apaga a lembrança. | Pedido do usuário. Quem abre num mês passado precisa de um jeito óbvio de voltar a hoje. |

## 4. Requisitos

### 4.1 Requisitos funcionais (RF)

| ID | Requisito |
| -- | --------- |
| RF-01 | Nas abas Cartões, Entradas e Benefícios, a ordem de cima para baixo é: o **seletor de mês**, a **barra de abas** e o conteúdo. Em Cartões, a linha de controles do topo (Histórico e Atualizar) continua acima do seletor. |
| RF-02 | **Tocar em outra aba abre a aba de destino no mês aberto** (D1). |
| RF-03 | O mês corrente abre na rota curta da aba de destino, e os outros meses abrem na rota com `/mes/AAAA-MM` (D5). |
| RF-04 | Se a aba de destino não aceita o mês aberto, ela abre o **mês aceito mais próximo** (D3), sem mensagem. |
| RF-05 | O link **"Voltar para o mês atual"** continua no seletor quando o mês aberto não é o corrente, e leva ao mês corrente na aba em que a pessoa está. As outras abas passam a seguir esse mês. |
| RF-06 | O seletor é o **mesmo componente** nas três abas: setas de mês anterior e próximo, o rótulo do mês, e as setas desabilitadas nos limites da aba (como hoje). |
| RF-07 | No Histórico, tocar numa aba abre a aba de destino no mês corrente (D4). |
| RF-08 | **Ao iniciar o app**, sem um endereço com mês, a aba Cartões abre no **mês lembrado** (D7). Sem mês lembrado, abre no mês corrente, como hoje. |
| RF-09 | Escolher o mês corrente (pelas setas ou por "Voltar para o mês atual") **apaga a lembrança** (D8, D10). |
| RF-10 | Quando o app abre num mês lembrado, o link **"Voltar para o mês atual"** aparece no seletor, como em qualquer mês que não é o corrente (D10). |

### 4.2 Regras de negócio (RN)

| ID | Regra |
| -- | ----- |
| RN-01 | **Mês aberto (D2b):** é o `AAAA-MM` do fim do endereço `…/mes/AAAA-MM`; sem isso, é o mês corrente. Nada é guardado em separado. |
| RN-02 | **Caminho de cada aba:** Cartões `#/` ou `#/mes/M`; Entradas `#/entradas` ou `#/entradas/mes/M`; Benefícios `#/beneficios` ou `#/beneficios/mes/M`. |
| RN-03 | **Meses aceitos em Cartões:** qualquer mês até o corrente, e os meses futuros até o último com parcela prevista, cobrança prevista ou compra registrada (`getLastFutureMonth`). Sem nada futuro, só até o corrente. |
| RN-04 | **Meses aceitos em Entradas e em Benefícios:** do mês mais antigo da aba (nunca depois do corrente) até o corrente + 12 meses (`getIncomeRange`, `getBenefitRange`). Sem nada cadastrado, só o corrente. |
| RN-05 | **Mês mais próximo (D3):** um mês antes do primeiro aceito abre o primeiro; um depois do último aceito abre o último. A troca é feita como redirecionamento (substitui a entrada no histórico, sem criar uma entrada extra). |
| RN-06 | **Mês inválido:** um `AAAA-MM` que não existe (ex.: `2026-13`) abre o mês corrente, como hoje. |
| RN-07 | **Seletor:** as setas navegam um mês, dentro dos limites da aba aberta (RN-03, RN-04), na rota da própria aba. |
| RN-09 | **Gravar a lembrança (D7, D8):** sempre que o mês aberto numa das três abas muda, se ele não é o mês corrente, grava-se o mês; se é o corrente, a lembrança é apagada. |
| RN-10 | **Ler a lembrança (D7, D9):** ao iniciar o app, se o endereço é vazio ou `#/` e há mês lembrado, o app abre `#/mes/M` em Cartões, pelo redirecionamento (substitui a entrada, sem entrada extra no histórico). Se Cartões não aceita o mês, abre o mais próximo (RN-05). Endereços com mês, ou de outra aba, não são alterados. |
| RN-11 | **Mês lembrado velho:** um mês lembrado no passado distante continua valendo (não expira); a pessoa volta ao mês corrente pelo "Voltar para o mês atual". Um mês lembrado no futuro que deixou de ser aceito vira o mais próximo (RN-05). |
| RN-12 | **Falha na lembrança:** se ler ou gravar a lembrança falha, o app segue sem ela, no mês corrente, sem mensagem de erro. |
| RN-08 | **Dados (D6):** nada é gravado, e nenhum valor de cartão, entrada, conta, gasto ou benefício muda por causa da navegação. |

## 5. Cenários (BDD)

Os cenários usam a data de hoje como **18/10/2026**.

```gherkin
# language: pt

Funcionalidade: Mês compartilhado entre as abas
  Como pessoa que acompanha o dinheiro mês a mês
  Quero trocar de aba sem perder o mês que estou olhando
  Para comparar cartões, entradas e benefícios do mesmo mês

  # --- RF-01 / D2 ---------------------------------------------------------------
  Cenário: O seletor de mês fica acima das abas
    Dado que estou na aba "Entradas", "Cartões" ou "Benefícios"
    Então o seletor de mês aparece acima da barra de abas
    E o conteúdo da aba aparece abaixo da barra de abas

  Cenário: A linha de controles de Cartões continua no topo
    Dado que estou na aba "Cartões"
    Então a linha com "Histórico" e "Atualizar" aparece acima do seletor de mês

  # --- RF-02 / RF-03 / D1 -------------------------------------------------------
  Cenário: Trocar de aba mantém o mês
    Dado que estou na aba "Entradas" em dezembro de 2026
    Quando eu toco na aba "Cartões"
    Então vejo a aba "Cartões" em dezembro de 2026
    Quando eu toco na aba "Benefícios"
    Então vejo a aba "Benefícios" em dezembro de 2026

  Cenário: O mês corrente usa a rota curta
    Dado que estou na aba "Cartões" em outubro de 2026
    Quando eu toco na aba "Entradas"
    Então o endereço é "#/entradas"

  Cenário: Outros meses usam a rota com o mês
    Dado que estou na aba "Entradas" em dezembro de 2026
    Quando eu toco na aba "Benefícios"
    Então o endereço é "#/beneficios/mes/2026-12"

  # --- RF-04 / RN-05 / D3 -------------------------------------------------------
  Cenário: A aba de destino não abre aquele mês
    Dado que estou na aba "Entradas" em março de 2027
    E que Cartões só abre meses até dezembro de 2026
    Quando eu toco na aba "Cartões"
    Então vejo a aba "Cartões" em dezembro de 2026, o mês mais próximo que ela abre
    E nenhuma mensagem aparece

  Cenário: Mês antes do primeiro aceito
    Dado que o benefício mais antigo começa em setembro de 2026
    E que estou na aba "Cartões" em julho de 2026
    Quando eu toco na aba "Benefícios"
    Então vejo a aba "Benefícios" em setembro de 2026

  Cenário: Sem nada cadastrado na aba de destino
    Dado que não há benefícios
    E que estou na aba "Entradas" em dezembro de 2026
    Quando eu toco na aba "Benefícios"
    Então vejo a aba "Benefícios" em outubro de 2026, o único mês que ela abre

  # --- RF-05 -----------------------------------------------------------------------
  Cenário: Voltar para o mês atual
    Dado que estou na aba "Benefícios" em dezembro de 2026
    Quando eu toco em "Voltar para o mês atual"
    Então vejo a aba "Benefícios" em outubro de 2026
    E ao tocar na aba "Entradas", vejo outubro de 2026

  # --- RF-06 / RN-07 -------------------------------------------------------------
  Cenário: As setas respeitam os limites de cada aba
    Dado que Entradas abre até outubro de 2027 e Cartões só até dezembro de 2026
    Então em Entradas a seta de próximo mês avança até outubro de 2027
    E em Cartões ela para em dezembro de 2026

  # --- RF-07 / D4 -----------------------------------------------------------------
  Cenário: Trocar de aba a partir do Histórico
    Dado que estou no Histórico
    Quando eu toco na aba "Entradas"
    Então vejo a aba "Entradas" em outubro de 2026
    Mas ao tocar num mês do Histórico, abre a aba "Cartões" naquele mês

  # --- RN-01 / RN-06 --------------------------------------------------------------
  Cenário: O mês vem do endereço
    Quando eu abro "#/entradas/mes/2026-12" direto
    Então vejo "Entradas" em dezembro de 2026
    E ao tocar na aba "Cartões", vejo "Cartões" em dezembro de 2026

  Cenário: Mês inválido no endereço
    Quando eu abro "#/mes/2026-13"
    Então vejo a aba "Cartões" em outubro de 2026

  # --- RF-08 / RN-09 / RN-10 / D7 ------------------------------------------------
  Cenário: Abrir o app no último mês
    Dado que eu estava vendo dezembro de 2026 na aba "Entradas" e fechei o app
    Quando eu abro o app de novo
    Então vejo a aba "Cartões" em dezembro de 2026
    E o link "Voltar para o mês atual" aparece

  Cenário: Sem mês lembrado, abre no mês corrente
    Dado que a última vez que usei o app foi no mês corrente
    Quando eu abro o app
    Então vejo a aba "Cartões" no mês corrente

  # --- D8 / RF-09 / RN-09 ----------------------------------------------------------
  Cenário: O mês corrente não é lembrado
    Dado que eu estava vendo outubro de 2026, o mês corrente, e fechei o app
    Quando eu abro o app já em novembro de 2026
    Então vejo a aba "Cartões" em novembro de 2026, e não em outubro

  # --- D10 / RF-09 / RF-10 ----------------------------------------------------------
  Cenário: Voltar para o mês atual apaga a lembrança
    Dado que o app abriu em dezembro de 2026 por causa da lembrança
    Quando eu toco em "Voltar para o mês atual"
    Então vejo o mês corrente
    E ao fechar e abrir o app de novo, ele abre no mês corrente

  # --- D9 / RN-10 --------------------------------------------------------------------
  Cenário: Um endereço com mês vale mais que a lembrança
    Dado que o mês lembrado é dezembro de 2026
    Quando eu abro "#/entradas/mes/2026-11" direto
    Então vejo "Entradas" em novembro de 2026, e não em dezembro

  # --- RN-10 / RN-05 ------------------------------------------------------------------
  Cenário: Mês lembrado que Cartões não abre mais
    Dado que o mês lembrado é março de 2027 e Cartões só abre até dezembro de 2026
    Quando eu abro o app
    Então vejo a aba "Cartões" em dezembro de 2026

  # --- RN-11 ----------------------------------------------------------------------------
  Cenário: Mês lembrado do passado distante
    Dado que o mês lembrado é janeiro de 2026
    Quando eu abro o app em outubro de 2026
    Então vejo a aba "Cartões" em janeiro de 2026 com o link "Voltar para o mês atual"

  # --- RN-12 ----------------------------------------------------------------------------
  Cenário: A lembrança falha
    Dado que não consigo ler a lembrança do mês
    Quando eu abro o app
    Então vejo a aba "Cartões" no mês corrente, sem mensagem de erro

  # --- RN-08 / D6 -----------------------------------------------------------------
  Cenário: Navegar não altera dados
    Quando eu troco de aba e de mês
    Então nenhum valor de cartão, entrada, conta, gasto ou benefício muda
```

### 5.1 Matriz de rastreabilidade

| Requisito | Cenário(s) |
| --------- | ---------- |
| RF-01, D2 | O seletor de mês fica acima das abas; A linha de controles de Cartões continua no topo |
| RF-02, D1 | Trocar de aba mantém o mês |
| RF-03, D5, RN-02 | O mês corrente usa a rota curta; Outros meses usam a rota com o mês |
| RF-04, RN-05, D3 | A aba de destino não abre aquele mês; Mês antes do primeiro aceito; Sem nada cadastrado na aba de destino |
| RF-05 | Voltar para o mês atual |
| RF-06, RN-03, RN-04, RN-07 | As setas respeitam os limites de cada aba |
| RF-07, D4 | Trocar de aba a partir do Histórico |
| RN-01, D2b | O mês vem do endereço |
| RN-06 | Mês inválido no endereço |
| RF-08, RN-10, D7 | Abrir o app no último mês; Sem mês lembrado, abre no mês corrente; Mês lembrado que Cartões não abre mais |
| RF-09, RN-09, D8 | O mês corrente não é lembrado; Voltar para o mês atual apaga a lembrança |
| RF-10, D10 | Abrir o app no último mês; Voltar para o mês atual apaga a lembrança |
| D9 | Um endereço com mês vale mais que a lembrança |
| RN-11 | Mês lembrado do passado distante |
| RN-12 | A lembrança falha |
| RN-08, D6 | Navegar não altera dados |

## 6. Modelo de dados e migração

Nada muda no estado do app: o formato salvo (`version: 9`) e a camada de dados continuam como estão (D6). O mês aberto vem só do endereço (D2b). O **mês lembrado** é uma chave própria no armazenamento do aparelho (`controle-cartao:last-month`), com um valor `AAAA-MM`, ou sem valor quando não há lembrança. Ela não faz parte do estado, não tem versão e não precisa de migração.

## 7. Contrato da camada de dados

Sem mudanças em `src/data/store.ts` nem em `src/data/api.ts`. O módulo novo `src/lib/last-month.ts` lê e grava o mês lembrado (`readLastMonth`, `saveLastMonth`), com a mesma API de armazenamento do `store.ts`. A navegação usa as consultas que já existem: `getLastFutureMonth` (Cartões), `getIncomeRange` (Entradas) e `getBenefitRange` (Benefícios).

## 8. Interface

- **Seletor de mês** (`src/components/month-nav.tsx`, novo): recebe o mês aberto, a função que monta o caminho do mês na aba e os limites; mostra as setas, o rótulo e o link "Voltar para o mês atual". Substitui as três cópias de `dashboard.tsx`, `entradas.tsx` e `beneficios.tsx`.
- **Ordem na tela** (RF-01): seletor, depois `AppTabs`, depois o conteúdo.
- **Barra de abas** (`src/components/app-tabs.tsx`): lê o mês aberto do endereço (RN-01) e navega para o caminho da aba de destino nesse mês (RN-02). O Histórico e a tela de categorias não têm mês, então abrem o mês corrente.
- **Caminhos** (`src/lib/format.ts`): hoje `monthPath` (Cartões) está em `format.ts`, e os de Entradas e de Benefícios estão nas páginas; passam todos para um lugar só, com um parâmetro de aba.
- **Rotas** (`src/App.tsx`): os três guardas de mês, em vez de voltar ao mês corrente quando o mês não é aceito, redirecionam para o mês aceito mais próximo (RN-05). Mês inválido continua voltando ao mês corrente (RN-06).
- **Lembrança** (`src/App.tsx` e `src/lib/last-month.ts`): ao iniciar, o app lê o mês lembrado antes de mostrar a primeira tela (sem piscar o mês corrente) e, se o endereço é vazio ou `#/`, redireciona para Cartões nesse mês (RN-10). Depois, a cada mudança do endereço, grava ou apaga a lembrança (RN-09).
- **360 px:** o seletor acima das abas continua sem estourar a largura da tela.

## 9. Fora de escopo

- Lembrar a última **aba** aberta: o app continua abrindo em Cartões.
- Expirar a lembrança do mês depois de um tempo (RN-11).
- Seletor de mês no Histórico ou na tela de categorias.
- Escolher o mês por um calendário ou por um campo de data.
- Mudar quais meses cada aba aceita (RN-03 e RN-04 só descrevem o que já existe).

## 10. Critérios de aceite

- [x] RF-01 a RF-10 funcionam como descritos. *Verificados no navegador: a ordem seletor-abas e a linha de controles de Cartões (RF-01), trocar de aba mantendo o mês, com a rota curta no mês corrente e `/mes/M` nos outros (RF-02, RF-03), o mês mais próximo (RF-04), "Voltar para o mês atual" na aba em que estou (RF-05), o seletor igual nas três abas (RF-06), abrir o app no mês lembrado com o link de volta (RF-08, RF-10) e apagar a lembrança ao voltar ao mês atual (RF-09). Conferido só pelo código: tocar numa aba a partir do Histórico (RF-07).*
- [ ] Todos os cenários da seção 5 passam no navegador (`npm run dev`). *Conferidos: o seletor acima das abas, trocar de aba, rota curta e rota com o mês, mês depois do último e antes do primeiro, voltar para o mês atual, abrir no último mês, o mês corrente não lembrado, endereço com mês vencendo a lembrança, lembrança fora do alcance, lembrança inválida e início sem endereço. Pendente: a falha real de leitura da lembrança no aparelho (cobertura só por script, simulando o armazenamento quebrado), o mês corrente "de ontem" virando o mês seguinte e o Histórico.*
- [x] O seletor fica acima das abas nas três telas e cabe em 360 px, sem rolagem horizontal.
- [x] O mês aceito mais próximo funciona nas duas direções (antes do primeiro e depois do último) em cada aba.
- [x] O app abre no mês lembrado e só se lembra de um mês que não é o corrente (RF-08, RF-09); "Voltar para o mês atual" apaga a lembrança (RF-10).
- [x] Um endereço com mês vence a lembrança, e uma falha na lembrança não atrapalha o app (RN-10, RN-12).
- [x] Cartões, Entradas, Benefícios e Histórico continuam como estavam no resto (dados, valores, botões).
- [x] `npm run typecheck` e `npm run build` passam.
- [x] `FUNCIONALIDADES.md` e `README.md` atualizados.

## 11. Tarefas

1. `format.ts`: o caminho de cada aba num mês, num lugar só (RN-02); tirar os de `entradas.tsx` e `beneficios.tsx`.
2. `month-nav.tsx`: o seletor compartilhado (RF-06, RN-07).
3. `app-tabs.tsx`: ler o mês do endereço e navegar para a aba de destino nesse mês (RN-01, RN-02, RF-07).
4. `dashboard.tsx`, `entradas.tsx` e `beneficios.tsx`: usar o `MonthNav` acima do `AppTabs` (RF-01) e remover as cópias.
5. `App.tsx`: os guardas de mês redirecionam para o mês aceito mais próximo (RN-05, RN-06).
6. `last-month.ts`: ler e gravar o mês lembrado (RN-09, RN-12); em `App.tsx`, ler antes da primeira tela, redirecionar o início vazio (RN-10) e gravar a cada mudança de endereço.
7. Atualizar `FUNCIONALIDADES.md` (seção 9, "Navegar entre meses", e as seções das abas) e `README.md`.
8. Rodar o roteiro de verificação; mudar o Status para `Implementada` e marcar só o que foi verificado.

## 12. Roteiro de verificação

1. `npm run typecheck` e `npm run build`.
2. `npm run dev` com dados nas três abas: escolher um mês numa aba e trocar de aba, nas seis combinações; conferir o endereço (rota curta no mês corrente, `/mes/M` nos outros).
3. Conferir o mês mais próximo: um mês depois do último de Cartões e um antes do primeiro de Benefícios.
4. Conferir "Voltar para o mês atual", o Histórico e `#/mes/2026-13`.
5. Conferir a lembrança: abrir um mês, recarregar o app e ver que abre nele; voltar ao mês corrente e ver que deixa de lembrar; abrir `#/entradas/mes/2026-11` direto com um mês lembrado; simular uma falha na leitura.
6. Conferir a 360 px que o seletor acima das abas não estoura a largura.
7. Conferir que o resto das telas continua igual.
