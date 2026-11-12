# Spec â€” InÃ­cio sem os atalhos no fim de "LanÃ§amentos recentes"

| Campo | Valor |
| ----- | ----- |
| Status | Implementada |
| Criada em | 12/11/2026 |
| Escopo | `src/pages/inicio.tsx` (remove o bloco "Atalhos"), `src/pages/inicio.test.tsx`, `FUNCIONALIDADES.md` |
| Depende de | [`inicio-com-minigraficos.md`](inicio-com-minigraficos.md), [`redesign-v2-fundacao.md`](redesign-v2-fundacao.md) |
| Substitui em parte | [`redesign-v2-fundacao.md`](redesign-v2-fundacao.md) RF-04 e a linha de Interface do InÃ­cio, que citam "atalhos para cada Ã¡rea" |

> MudanÃ§as de comportamento entram primeiro aqui e sÃ³ depois no cÃ³digo.

---

## 1. Contexto e objetivo

No fim do InÃ­cio, depois de "LanÃ§amentos recentes", hÃ¡ uma fileira de trÃªs botÃµes (Entradas, CartÃµes, BenefÃ­cios; `nav aria-label="Atalhos"`, `data-testid="shortcut-*"`). **Pedido do usuÃ¡rio:** removÃª-los. Eles repetem a barra inferior (e os painÃ©is Saldo, CartÃµes e BenefÃ­cios do prÃ³prio InÃ­cio jÃ¡ abrem as Ã¡reas), entÃ£o o InÃ­cio fica mais curto sem perder navegaÃ§Ã£o.

## 2. DecisÃµes de produto

| # | DecisÃ£o | Motivo |
| - | ------- | ------ |
| D1 | O InÃ­cio **nÃ£o mostra mais** a fileira "Atalhos" (Entradas, CartÃµes, BenefÃ­cios) depois de "LanÃ§amentos recentes". | Pedido do usuÃ¡rio. |
| D2 | O resto do InÃ­cio **nÃ£o muda**: painÃ©is, "LanÃ§amentos recentes" com "Ver todos", estado vazio, botÃ£o LanÃ§ar e a barra do carrinho. | Ajuste pequeno e isolado. |
| D3 | A navegaÃ§Ã£o para as Ã¡reas continua pela **barra inferior** e pelos **painÃ©is** do InÃ­cio. Nada Ã© adicionado no lugar. | Evita duplicar o que a barra jÃ¡ faz. |

## 3. Requisitos

| ID | Requisito |
| -- | --------- |
| RF-01 | O fim do InÃ­cio Ã© a lista "LanÃ§amentos recentes" (ou o texto de vazio); nÃ£o hÃ¡ mais botÃµes "Entradas", "CartÃµes" e "BenefÃ­cios" abaixo dela (D1). |
| RF-02 | As linhas de "LanÃ§amentos recentes", o "Ver todos", os painÃ©is e a barra inferior continuam abrindo o que abriam (D2, D3). |
| RN-01 | Nenhuma regra de cÃ¡lculo, rota ou dado salvo muda. |

## 4. CenÃ¡rios

```gherkin
# language: pt

Funcionalidade: InÃ­cio sem os atalhos do fim da tela

  CenÃ¡rio: Sem a fileira de atalhos
    Dado um mÃªs com gastos
    Quando eu abro o InÃ­cio
    EntÃ£o "LanÃ§amentos recentes" Ã© a Ãºltima seÃ§Ã£o
    E nÃ£o vejo os botÃµes "Entradas", "CartÃµes" e "BenefÃ­cios" abaixo dela

  CenÃ¡rio: Chegar Ã s Ã¡reas continua possÃ­vel
    Quando eu toco em "CartÃµes" na barra inferior
    EntÃ£o abre a Ã¡rea CartÃµes
    E tocar no painel CartÃµes do InÃ­cio tambÃ©m abre a Ã¡rea

  CenÃ¡rio: LanÃ§amentos recentes nÃ£o mudam
    Quando eu toco numa linha de "LanÃ§amentos recentes"
    EntÃ£o abre a Ã¡rea do gasto
    E "Ver todos" abre o Resumo do mÃªs
```

| Requisito / regra | CenÃ¡rio(s) |
| ----------------- | ---------- |
| RF-01, D1 | Sem a fileira de atalhos |
| RF-02, D2, D3 | Chegar Ã s Ã¡reas continua possÃ­vel; LanÃ§amentos recentes nÃ£o mudam |
| RN-01 | todos (nenhum valor muda) |

## 5. Dados e contrato

Sem mudanÃ§a no formato salvo, na camada de dados nem nas rotas.

## 6. Interface

Remove o `<nav aria-label="Atalhos">` ao fim de `inicio.tsx` e os Ã­cones/imports que sÃ³ ele usava. O espaÃ§o abaixo de "LanÃ§amentos recentes" Ã© o do espaÃ§ador de rodapÃ© do app, como nas outras telas.

## 7. Fora de escopo

- Trocar o que "LanÃ§amentos recentes" mostra ou o "Ver todos".
- Mexer nos painÃ©is do InÃ­cio, na barra inferior ou no botÃ£o LanÃ§ar.

## 8. CritÃ©rios de aceite

- [x] `npm test`, `npm run typecheck` e `npm run build` passam.
- [x] O teste "os atalhos levam Ã s Ã¡reas" Ã© trocado por testes dos cenÃ¡rios acima (a Ã¡rea continua alcanÃ§Ã¡vel pela barra e pelo painel).
- [x] Nenhum `shortcut-*`, `Atalhos` ou import sem uso restou em `inicio.tsx`.
- [ ] Em 360 Ã— 780, claro e escuro, o InÃ­cio termina em "LanÃ§amentos recentes" sem espaÃ§o sobrando estranho.
- [x] `FUNCIONALIDADES.md` nÃ£o cita mais os atalhos do InÃ­cio; `redesign-v2-fundacao.md` RF-04 marcado como substituÃ­do nesse ponto.

## 9. Tarefas

1. Remover o bloco "Atalhos" e os imports sem uso de `inicio.tsx`.
2. Trocar o teste dos atalhos pelos cenÃ¡rios da seÃ§Ã£o 4.
3. Ajustar `FUNCIONALIDADES.md` (seÃ§Ã£o do InÃ­cio, 33) e rodar `test`, `typecheck` e `build`.

## 10. Roteiro de verificaÃ§Ã£o

1. `npm run dev`, 360 Ã— 780, claro e escuro, `#/`.
2. Conferir que o InÃ­cio termina em "LanÃ§amentos recentes" e que a barra e os painÃ©is abrem as Ã¡reas.
