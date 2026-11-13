# Spec — Caixinhas: quando posso guardar (com reserva mínima)

| Campo | Valor |
| ----- | ----- |
| Status | Implementada |
| Criada em | 13/11/2026 |
| Escopo | `src/data/store.ts` (reserva no plano, `getDreamSavingWindow`), `src/data/api.ts` (hook), `src/pages/sonhos.tsx` (cartão "Quando guardar"), `src/pages/sonhos-plano.tsx` (campo "Reserva mínima"), `src/components/dream-parts.tsx` (faixa de dias), testes (`dreams.test.ts`, `sonhos.test.tsx`), `FUNCIONALIDADES.md` |
| Depende de | [`sonhos.md`](sonhos.md), [`sonhos-viram-caixinhas.md`](sonhos-viram-caixinhas.md), [`previsoes.md`](previsoes.md) (saldo previsto, RN-08), [`previsoes-saldo-por-dia.md`](previsoes-saldo-por-dia.md) |
| Referência visual | Canvas "Controle do Cartão", grupo Caixinhas (quando posso guardar): **V15_02** (faixa de dias) e **V15_04** (reserva mínima), claras e escuras, em 360 × 780. V14_01 a V14_04, V15_01 e V15_03 são alternativas descartadas |

> Mudanças de comportamento entram primeiro aqui e só depois no código.

---

## 1. Contexto e objetivo

O plano das Caixinhas diz **quanto** guardar por mês (um percentual da renda), mas não diz **quando dá**. Quem guarda cedo demais deixa o saldo curto antes de uma conta grande. **Pedido do usuário:** as caixinhas mostram **quando posso ou não guardar** o valor do plano e **a partir de que dia**, levando em conta o **saldo previsto** e uma **reserva mínima que a própria pessoa digita**.

**Objetivo:** um cartão **"Guardar R$ X"** na lista de caixinhas com a data a partir da qual o valor cabe sem deixar o saldo previsto abaixo da reserva, e uma faixa de dias que mostra de relance os dias em que ainda não dá e os em que já dá. O app **só calcula** sobre o saldo da pessoa: não recomenda se vale a pena guardar nem onde investir, e **não bloqueia** nenhum aporte.

## 2. Glossário

| Termo | Significado |
| ----- | ----------- |
| Reserva mínima | Valor em reais que o saldo previsto **não deve ficar abaixo**, definido pela pessoa. Padrão 0. |
| Valor a guardar | O que ainda falta do plano neste mês: `max(0, valor do plano − guardado no mês)`. |
| Janela | Os **30 dias** a partir de hoje (hoje e os 30 seguintes), usando o saldo previsto de cada dia. |
| Folga de hoje | Quanto dá para guardar hoje sem o saldo previsto cair abaixo da reserva em nenhum dia da janela. |
| Dia liberado | Dia a partir do qual guardar o valor a guardar não deixa o saldo previsto abaixo da reserva em nenhum dia dali em diante. |

## 3. Decisões de produto

| # | Decisão | Origem |
| - | ------- | ------ |
| D1 | O cartão **"Quando guardar"** aparece na lista de caixinhas (`/caixinhas`), **entre o cartão do plano e a lista**, só quando há plano salvo e pelo menos uma caixinha ativa. Sem plano, nada aparece. | V15_02. |
| D2 | Conteúdo do cartão: rótulo "Guardar **R$ X**" (valor a guardar), a **resposta** em destaque (Fraunces 26 px) e a **faixa de dias**. | V15_02. |
| D3 | **A resposta** tem quatro formas: (a) **"Pode guardar agora"**, quando o dia liberado é hoje; (b) **"A partir de DD/MM"**, quando o dia liberado é um dia depois de hoje; (c) **"Ainda não nos próximos 30 dias"**, quando nenhum dia da janela é liberado, com a linha "Hoje cabem R$ N" (ou "Hoje não cabe nada" se N = 0); (d) **"Meta do mês cumprida"**, quando o valor a guardar é 0 (sem faixa). Nos casos (a) e (b) há uma linha de apoio com a **folga de hoje**: "Hoje cabem R$ N." | V15_02. |
| D4 | **A faixa de dias** tem um segmento por dia da janela (hoje a +30). Cor **laranja** = ainda não, **azul** = liberado, com legenda em texto ("ainda não", "pode guardar") e os marcadores "hoje", a data liberada e a data final. Nunca só a cor: a resposta em texto diz o mesmo. A faixa some no caso (d). | V15_02, regra v2 (nunca só a cor). |
| D5 | **Reserva mínima** é um campo em **"Ajustar plano"** (V15_04), em reais, abaixo do percentual, com a legenda "O saldo não deve ficar abaixo disso." É um valor que a pessoa digita; **o app nunca o altera sozinho**. Padrão 0 (vale para quem já tem plano). Aceita 0 a 999.999,99. | Escolha do usuário. |
| D6 | O **valor a guardar** é o que falta do plano no mês corrente (`valor do plano − guardado no mês`, mínimo 0). Se a pessoa já guardou o planejado, o cartão mostra (d). | Faz o cartão responder "ainda cabe guardar o que falta?". |
| D7 | **Não bloqueia nada:** "Guardar agora" (D6 de `sonhos.md`) continua limitado só pelo saldo de hoje. A reserva só alimenta este cartão. | Menor risco; avisos na folha ficam para depois. |
| D8 | Com o **olho fechado**, os valores em reais viram `R$ ••••` (rótulo, "Hoje cabem…"); a data e a faixa continuam visíveis. | Regra global v2. |
| D9 | O cartão atualiza sozinho quando mudam o saldo, as previsões, os aportes, a renda ou o plano (mesmas chaves que já recarregam o plano). | Consistência com o resto do app. |

## 4. Requisitos funcionais

| # | Requisito |
| - | --------- |
| RF-01 | Com plano salvo e caixinha ativa, `/caixinhas` mostra o cartão "Quando guardar" (D1, D2). |
| RF-02 | Se o dia liberado é hoje, o cartão diz "Pode guardar agora" e a faixa toda é azul (D3a, D4). |
| RF-03 | Se o dia liberado é futuro, diz "A partir de DD/MM"; os dias antes dele são laranja e os dali em diante azuis (D3b, D4). |
| RF-04 | Se nenhum dia da janela é liberado, diz "Ainda não nos próximos 30 dias" e mostra a folga de hoje; a faixa toda é laranja (D3c). |
| RF-05 | Se o valor a guardar é 0, diz "Meta do mês cumprida" e não mostra a faixa (D3d, D6). |
| RF-06 | "Ajustar plano" tem o campo "Reserva mínima"; salvar grava a reserva junto com o percentual e a divisão (D5). |
| RF-07 | Mudar a reserva muda a resposta do cartão (D5, D9). |
| RF-08 | Aportar, retirar, criar ou apagar previsões e mudar o plano recalculam o cartão (D9). |
| RF-09 | Sem plano salvo o cartão não aparece e o resto da tela não muda (D1). |
| RF-10 | Com o olho fechado, nenhum valor em reais aparece no cartão (D8). |
| RF-11 | Guardar valores maiores que a folga continua permitido (D7). |

## 5. Regras de negócio

| # | Regra |
| - | ----- |
| RN-01 | **Saldo por dia:** `s[0..30]` é o saldo previsto de hoje até hoje + 30 dias (a mesma série de `getBalanceForecast(mês corrente, 30)`: saldo de hoje mais as previsões que mexem no saldo, mês a mês; lembretes não entram). |
| RN-02 | **Valor a guardar:** `V = max(0, round(renda de referência × percentual / 100, 2) − guardado no mês)`, com a renda de referência e o guardado no mês que `getDreamPlan` já calcula. |
| RN-03 | **Mínimo à frente:** `m[i] = min(s[i], s[i+1], …, s[30])` (o menor saldo dali até o fim da janela). |
| RN-04 | **Dia liberado:** o menor `i` tal que `m[i] − V ≥ reserva`. Se `V = 0`, não há dia liberado nem faixa. Sem tal `i`, nenhum dia é liberado. |
| RN-05 | **Folga de hoje:** `max(0, m[0] − reserva)`, arredondada para baixo em centavos. Se o saldo de hoje já está abaixo da reserva, é 0. |
| RN-06 | A data de "A partir de" é a de `s[i]`, no formato `DD/MM`. |
| RN-07 | Arredondar valores a 2 casas; comparar em centavos. |
| RN-08 | Reserva: número ≥ 0 e ≤ 999.999,99; salva dentro do plano (`dreamPlan.reserve`). Quem já tem plano, ou backup antigo, abre com reserva 0 (sem migração de versão). |

## 6. Cenários

```gherkin
# language: pt
Funcionalidade: Quando posso guardar nas caixinhas

  Contexto:
    Dado a renda de R$ 6.000,00 e o plano de 10% (R$ 600,00 por mês)
    E a reserva mínima de R$ 1.500,00
    E nada guardado neste mês

  Cenário: Cabe a partir de uma data
    Dado o saldo de hoje R$ 3.280,00
    E uma previsão a pagar de R$ 1.350,00 no dia 17
    E uma previsão a receber de R$ 2.000,00 no dia 25
    E uma previsão a pagar de R$ 700,00 no dia 30
    Quando eu abro "Caixinhas" no dia 13
    Então o cartão mostra "Guardar R$ 600,00" e "A partir de 25/11"
    E mostra "Hoje cabem R$ 430,00."
    E os dias 13 a 24 estão marcados como "ainda não" e os dias 25 em diante como "pode guardar"

  Cenário: Pode guardar agora
    Dado o saldo de hoje R$ 4.000,00 e nenhuma previsão
    Então o cartão mostra "Pode guardar agora"
    E a faixa inteira está marcada como "pode guardar"

  Cenário: Ainda não nos próximos 30 dias
    Dado o saldo de hoje R$ 1.600,00 e nenhuma entrada prevista
    Então o cartão mostra "Ainda não nos próximos 30 dias"
    E mostra "Hoje cabem R$ 100,00."

  Cenário: Saldo já abaixo da reserva
    Dado o saldo de hoje R$ 1.000,00
    Então o cartão mostra "Hoje não cabe nada."

  Cenário: Meta do mês cumprida
    Dado que já guardei R$ 600,00 neste mês
    Então o cartão mostra "Meta do mês cumprida"
    E não mostra a faixa de dias

  Cenário: Só falta uma parte
    Dado que já guardei R$ 250,00 neste mês
    Então o cartão mostra "Guardar R$ 350,00"

  Cenário: Lembrete não entra no saldo
    Dado um lembrete a pagar de R$ 2.000,00 no dia 20 que não mexe no saldo
    Então a resposta do cartão não muda

  Cenário: Definir a reserva
    Quando eu abro "Ajustar plano"
    E digito "2.000,00" em "Reserva mínima" e toco em "Salvar plano"
    Então o cartão passa a usar a reserva de R$ 2.000,00

  Cenário: Sem plano não há cartão
    Dado que não salvei nenhum plano
    Então não vejo o cartão "Quando guardar"

  Cenário: Guardar além da folga continua permitido
    Dado a folga de hoje de R$ 430,00
    Quando eu guardo R$ 600,00 em "Viagem"
    Então o aporte é registrado normalmente

  Cenário: Olho fechado
    Quando eu fecho o olho
    Então o cartão mostra "R$ ••••" no lugar dos valores e mantém a data
```

## 7. Matriz de rastreabilidade

| Requisito | Cenários |
| --------- | -------- |
| RF-01, D1, D2 | Cabe a partir de uma data; Sem plano não há cartão |
| RF-02 | Pode guardar agora |
| RF-03 | Cabe a partir de uma data |
| RF-04, RN-05 | Ainda não nos próximos 30 dias; Saldo já abaixo da reserva |
| RF-05, D6 | Meta do mês cumprida; Só falta uma parte |
| RF-06, RF-07, D5 | Definir a reserva |
| RF-08, D9 | Cabe a partir de uma data (recalcula) |
| RF-09 | Sem plano não há cartão |
| RF-10, D8 | Olho fechado |
| RF-11, D7 | Guardar além da folga continua permitido |
| RN-01 | Lembrete não entra no saldo |

## 8. Interface

- **Cartão** (V15_02): `surface`, borda `line`, cantos de 20 px, padding 16 px; rótulo "Guardar" em 14 px `ink-soft` com o valor em `font-mono-data` bold; resposta em Fraunces 26 px; faixa logo abaixo.
- **Faixa de dias:** uma linha de 14 px de altura com 31 segmentos (gap de 2 px), pontas arredondadas; laranja (`chart-out`) = ainda não, azul (`chart-in`) = liberado; abaixo, "hoje" à esquerda, a data liberada em negrito na posição do segmento e a data final à direita (13 px); legenda "ainda não / pode guardar" (13 px). A faixa tem `role="img"` e `aria-label` com a mesma frase da resposta.
- **Reserva** (V15_04): campo de 56 px com o valor em `font-mono-data` 20 px, rótulo "Reserva mínima" acima e a legenda "O saldo não deve ficar abaixo disso." abaixo; entre o percentual e o botão "Salvar plano". Usa o mesmo componente de valor em reais dos outros formulários.
- Texto ≥ 14 px (exceto rótulos de eixo), alvos ≥ 48 px.

## 9. Dados e API

- `dreamPlan` passa de `{ percent }` a `{ percent, reserve?: number }`. Backup antigo abre com `reserve = 0` (`parsed.dreamPlan.reserve ??= 0` no carregamento), **sem** subir a versão do formato.
- `DreamPlanInput` ganha `reserve` (opcional na implementação: ausente mantém a reserva salva, para os chamadores antigos) (≥ 0 e ≤ 999.999,99; erro: "A reserva deve ser um valor de 0 a 999.999,99."). `DreamPlan` ganha `reserve`.
- Nova `getDreamSavingWindow(): Promise<DreamSavingWindow>` em `store.ts`:
  `{ hasPlan; reserve; amount /* V */; todayRoom /* folga */; state: 'now' | 'later' | 'never' | 'done'; releaseDate: string | null; days: { date: string; ok: boolean }[] }`.
  Reusa `getBalanceForecast` (série de 30 dias) e `getDreamPlan`.
- Hook `useGetDreamSavingWindow` em `api.ts` com chave sob `'dreams'` (como `getGetDreamPlanQueryKey`), recarregada pelas mutações que já invalidam tudo.

## 10. Fora de escopo

- Avisos dentro de "Guardar agora" e simulador de percentuais (V14_03, V14_04): ficam para depois.
- Recomendar quanto ou onde investir; qualquer bloqueio de aporte.
- Reserva calculada pelo app (só valor digitado).
- Janela diferente de 30 dias; considerar meses com mais de uma caixinha em separado (o cálculo é do valor total do plano).

## 11. Critérios de aceite

- [x] Cada cenário da seção 6 tem teste (`dreams.test.ts` para `getDreamSavingWindow`; `sonhos.test.tsx` para o cartão e o campo).
- [x] Teste de carga: backup sem `reserve` abre com 0.
- [x] A conta bate com o exemplo: saldo 3.280, reserva 1.500, V = 600, pagar 1.350 no dia 17 e receber 2.000 no dia 25 dão "A partir de 25/11" e "Hoje cabem R$ 430,00".
- [ ] Em 360 × 780 o cartão e a faixa cabem sem rolagem horizontal; nada só por cor; olho fechado mascara valores. *(Verificados em teste: texto na legenda e na resposta, `aria-label` na faixa, valores mascarados. Pendente: a conferência visual em 360 px.)*
- [x] `FUNCIONALIDADES.md` ganha a seção desta funcionalidade; `README.md` se citar o plano.
- [x] `npm test`, `npm run typecheck` e `npm run build` passam.

## 12. Tarefas

1. `store.ts`: `reserve` no plano, validação, carga sem migração de versão, `getDreamSavingWindow` (RN-01 a RN-07).
2. `api.ts`: tipos e hook.
3. `sonhos-plano.tsx`: campo "Reserva mínima" (D5) e envio no salvar.
4. `sonhos.tsx` e `dream-parts.tsx`: cartão e faixa de dias (D1 a D4, D8).
5. Testes de cálculo (os cenários com números), do cartão e do campo.
6. `FUNCIONALIDADES.md` e conferência em 360 × 780.
