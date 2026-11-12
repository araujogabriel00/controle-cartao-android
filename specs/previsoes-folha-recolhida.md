# Spec — Previsões: folha do dia recolhida, sem cobrir o calendário

| Campo | Valor |
| ----- | ----- |
| Status | Implementada |
| Criada em | 12/11/2026 |
| Escopo | `src/pages/previsoes.tsx` (folha do dia recolhida/aberta, calendário), `src/components/quick-add.tsx` (botão flutuante some em Previsões), testes de `previsoes.test.tsx`, `FUNCIONALIDADES.md` |
| Depende de | [`previsoes-saldo-por-dia.md`](previsoes-saldo-por-dia.md) |
| Substitui em parte | [`previsoes-saldo-por-dia.md`](previsoes-saldo-por-dia.md) D6, D7, RF-07 e a seção "Interface" (folha e botão Lançar) |
| Referência visual | Canvas "Controle do Cartão", grupo Previsões (sem sobreposição): **V13_01** (folha recolhida) e **V13_02** (folha aberta), clara e escura, em 360 × 780. V13_03 a V13_05 são alternativas descartadas |

> Mudanças de comportamento entram primeiro aqui e só depois no código.

---

## 1. Contexto e objetivo

Na implementação de `previsoes-saldo-por-dia.md`, no celular (360 × 780) a **folha do dia fixa (até 45% da altura)** cobre as últimas semanas do calendário (dias 27 a 31) e o botão **"Nova previsão"** cobre os dias 23 a 26. Isso fere a RF-07 ("a folha e o botão não se sobrepõem"). **Pedido do usuário:** não se sobrepor. **Escolha:** opção A, folha recolhida com o "+" dentro dela.

**Objetivo:** a folha fixa vira uma **barra baixa** (56 px) que nunca cobre o calendário; o botão "+" fica **dentro** dela e o botão flutuante "Nova previsão" deixa de existir na tela Previsões. A lista completa do dia continua a um toque, numa folha aberta com fundo escurecido.

## 2. Decisões de produto

| # | Decisão | Origem |
| - | ------- | ------ |
| D1 | A folha do dia tem dois estados: **recolhida** (padrão) e **aberta**. | V13_01, V13_02. |
| D2 | **Recolhida:** barra fixa acima da barra inferior, 56 px de conteúdo + alça, com: título do dia ("Terça, 1 de dezembro", Fraunces 18 px, uma linha), segunda linha "N previsões · saldo R$ X" (14 px; "Nada previsto · saldo R$ X" sem previsões; sem a parte do saldo em dia passado), seta ↑ e o botão **"+"** (48 × 48, `brand`, `aria-label="Nova previsão"`). A barra **nunca cresce** com o conteúdo do dia. | V13_01. |
| D3 | Tocar na **área do título** (não no "+") **abre** a folha. Tocar no fundo escurecido, arrastar para baixo ou voltar do sistema **recolhe**. | V13_02. |
| D4 | **Aberta:** folha por cima do calendário com fundo escurecido (`rgba(0,0,0,.35)`), até **45%** da altura da tela, cantos de 24 px em cima. Conteúdo: título do dia, total que mexe no saldo, previsões do dia (lista rola dentro da folha), "Saldo no fim do dia" com centavos, e dois botões de 48 px: **"Abrir o dia"** (contorno; vai para a tela do dia) e **"+ Nova previsão"** (`brand`). Tocar numa previsão abre a edição (como hoje). | V13_02. |
| D5 | **"+" cria a previsão já no dia selecionado:** abre `/previsoes/nova` com a data do dia selecionado preenchida (se a rota já aceitar data; caso contrário, a data padrão do formulário continua a de hoje e isto vira pendência registrada). | Pedido implícito: o "+" mora na folha daquele dia. |
| D6 | O **botão flutuante "Nova previsão" some** da área Previsões (`button-new-forecast` em `quick-add.tsx` e a variável `--forecast-sheet-h`). O estado vazio ("Como funciona") mantém o seu botão `button-new-forecast-empty`. | Evita dois botões iguais e a sobreposição. |
| D7 | **O calendário nunca é coberto no estado recolhido:** a página reserva embaixo a altura da barra (56 px + alça + 72 px da barra inferior + área segura), então o dia 31 e a legenda ficam visíveis rolando. As células voltam a **50 px** de altura (5 a 6 semanas cabem em 360 × 780 com a folha recolhida), toque ≥ 48 px de altura e 48 px de largura (7 colunas em 360 px dão ~51 px). | V13_01. |
| D8 | Trocar de dia com a folha aberta atualiza a folha. Trocar de mês recolhe a folha. Com o **olho fechado**, valores mascarados como no resto do app (`R$ ••••`), inclusive na segunda linha da barra. | Regra global v2. |
| D9 | Acessibilidade: a barra é um `section aria-label="Previsões do dia"`; o título é um botão com `aria-expanded`; ao abrir, o foco vai para o título da folha e, ao recolher, volta ao botão que abriu; o "+" tem nome acessível próprio. Alvos ≥ 48 px. | Regras v2. |

## 3. Requisitos funcionais

| # | Requisito |
| - | --------- |
| RF-01 | Ao abrir Previsões, a folha aparece **recolhida** com o dia padrão (hoje, ou o dia 1 em outro mês) (D1, D2). |
| RF-02 | A barra recolhida não cobre nenhuma célula do calendário nem a legenda: com a página rolada ao fim, todos os dias e a legenda ficam acima da barra (D7). |
| RF-03 | Tocar no título da barra abre a folha completa; fundo escurecido, "Abrir o dia" e "+ Nova previsão" aparecem (D3, D4). |
| RF-04 | Tocar no fundo escurecido recolhe a folha (D3). |
| RF-05 | "Abrir o dia" abre a tela do dia; tocar numa previsão abre a edição (D4). |
| RF-06 | O "+" da barra e o "+ Nova previsão" da folha abrem `/previsoes/nova` (D5). |
| RF-07 | Não existe botão flutuante "Nova previsão" na tela Previsões (D6). O botão Lançar das outras áreas não muda. |
| RF-08 | Dia sem previsões: barra mostra "Nada previsto · saldo R$ X"; a folha aberta mostra "Nada previsto para este dia." (ou "…para hoje.") e o saldo (continua `previsoes-saldo-por-dia.md` RF-06). |
| RF-09 | Mudar de mês recolhe a folha (D8). |
| RF-10 | Com o olho fechado nenhum valor em reais aparece na barra nem na folha (D8). |
| RF-11 | Em 360 × 780 não há rolagem horizontal e nenhum elemento fixo cobre uma célula do calendário no estado recolhido. |

## 4. Regras de negócio

Nenhuma regra de cálculo muda: saldo por dia, formatação e visibilidade de `previsoes-saldo-por-dia.md` (RN-01 a RN-06) continuam valendo.

## 5. Cenários

```gherkin
# language: pt
Funcionalidade: Previsões com a folha do dia recolhida

  Cenário: A folha começa recolhida
    Quando eu abro "Previsões" em dezembro de 2026
    Então vejo a barra do dia com "Terça, 1 de dezembro" e "1 previsão · saldo R$ 437,95"
    E não vejo a lista de previsões do dia

  Cenário: A barra não cobre o calendário
    Dado o celular em 360 × 780
    Quando eu rolo Previsões até o fim
    Então o dia 31 e a legenda estão visíveis acima da barra do dia

  Cenário: Abrir a folha completa
    Quando eu toco no título da barra do dia
    Então a folha abre com "Desconto plano de saúde", "Saldo no fim do dia" "R$ 437,95"
    E vejo os botões "Abrir o dia" e "+ Nova previsão"

  Cenário: Recolher tocando no fundo
    Dado a folha aberta
    Quando eu toco no fundo escurecido
    Então a folha volta a ser a barra recolhida

  Cenário: Trocar de dia
    Quando eu toco no dia 24
    Então a barra mostra "Quinta, 24 de dezembro" e o saldo "R$ 2.327,95"

  Cenário: Criar previsão pelo "+" da barra
    Quando eu toco em "Nova previsão" na barra
    Então abre o formulário "Nova previsão"

  Cenário: Não há botão flutuante em Previsões
    Quando eu abro "Previsões"
    Então só existe um botão "Nova previsão", dentro da barra do dia

  Cenário: Dia sem previsões
    Quando eu toco num dia sem previsões
    Então a barra mostra "Nada previsto · saldo R$ …"

  Cenário: Trocar de mês recolhe a folha
    Dado a folha aberta
    Quando eu vou para o mês seguinte
    Então a folha está recolhida

  Cenário: Olho fechado
    Quando eu fecho o olho
    Então a barra e a folha mostram "R$ ••••" no lugar dos valores
```

## 6. Matriz de rastreabilidade

| Requisito | Cenários |
| --------- | -------- |
| RF-01, D1, D2 | A folha começa recolhida |
| RF-02, RF-11, D7 | A barra não cobre o calendário |
| RF-03, RF-05, D4 | Abrir a folha completa |
| RF-04, D3 | Recolher tocando no fundo |
| RF-06, D5 | Criar previsão pelo "+" da barra |
| RF-07, D6 | Não há botão flutuante em Previsões |
| RF-08 | Dia sem previsões; Trocar de dia |
| RF-09, D8 | Trocar de mês recolhe a folha |
| RF-10, D8 | Olho fechado |

## 7. Interface

- **Barra recolhida:** `fixed`, acima da barra inferior (`bottom: 72px + área segura`), `surface`, cantos de 24 px em cima, alça de 40 × 4 px, sombra; altura de conteúdo 56 px; linha 1 título 18 px (Fraunces, uma linha com reticências), linha 2 14 px `ink-soft` com o saldo em `font-mono-data` bold; ↑ 20 px; "+" 48 × 48 `brand`, ícone 22 px.
- **Folha aberta:** mesma base, altura máxima 45vh, lista com rolagem interna; botões "Abrir o dia" (contorno 1,5 px `line`) e "+ Nova previsão" (`brand`), ambos 48 px, lado a lado; fundo escurecido cobre a página (não a barra inferior).
- **Calendário:** células de 50 px (número 15 px, ponto 6 px, saldo mono 12 px), margem inferior da página = altura da barra recolhida + 12 px.
- Referência exata: V13_01 e V13_02 (clara e escura).

## 8. Fora de escopo

- Arrastar a folha com o dedo em alturas intermediárias (só recolhida/aberta).
- Mudar o cálculo do saldo ou o menu "Saldo previsto".
- Mudar o botão Lançar das demais áreas.

## 9. Critérios de aceite

- [x] Cada cenário da seção 5 tem teste em `previsoes.test.tsx` (a sobreposição de layout fica para conferência manual em 360 × 780).
- [x] `button-new-forecast` do `quick-add.tsx` e a variável `--forecast-sheet-h` foram removidos; testes que os usavam foram atualizados.
- [ ] Em 360 × 780 (e 390 × 844): sem rolagem horizontal; com a folha recolhida, nenhuma célula, o dia 31 nem a legenda ficam cobertos; folha aberta fecha pelo fundo. (Conferido em 360 × 780, claro e escuro, em um mês de 6 semanas: dia 31, legenda e o estado vazio ficam acima da barra, sem rolagem horizontal. Pendente: 390 × 844, e o fechar pelo fundo foi conferido só por teste.)
- [ ] Alvos ≥ 48 px; nenhuma informação só por cor; olho fechado mascara tudo. (Alvos ≥ 48 px conferidos no navegador e olho fechado por teste; não conferi o olho fechado no navegador.)
- [x] `FUNCIONALIDADES.md` (seção 41) atualizada: "folha fixa" → "barra do dia recolhida que abre em folha"; `README.md` se citar o botão flutuante.
- [x] `npm test`, `npm run typecheck` e `npm run build` passam.

## 10. Tarefas

1. Estado `open` da folha em `previsoes.tsx`; barra recolhida (D2) e folha aberta com fundo (D4).
2. Remover `--forecast-sheet-h`, o `marginBottom` da página e o botão `button-new-forecast` de `quick-add.tsx`.
3. Margem inferior fixa para a barra recolhida; células de 50 px.
4. "+" e "+ Nova previsão" para `/previsoes/nova` (D5).
5. Recolher ao trocar de mês; foco e `aria-expanded` (D9).
6. Testes, `FUNCIONALIDADES.md`, `README.md`.
7. Conferir em 360 × 780 no navegador: calendário até o dia 31 visível, sem sobreposição.
