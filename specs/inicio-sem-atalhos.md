# Spec — Início sem os atalhos no fim de "Lançamentos recentes"

| Campo | Valor |
| ----- | ----- |
| Status | Proposta |
| Criada em | 12/11/2026 |
| Escopo | `src/pages/inicio.tsx` (remove o bloco "Atalhos"), `src/pages/inicio.test.tsx`, `FUNCIONALIDADES.md` |
| Depende de | [`inicio-com-minigraficos.md`](inicio-com-minigraficos.md), [`redesign-v2-fundacao.md`](redesign-v2-fundacao.md) |
| Substitui em parte | [`redesign-v2-fundacao.md`](redesign-v2-fundacao.md) RF-04 e a linha de Interface do Início, que citam "atalhos para cada área" |

> Mudanças de comportamento entram primeiro aqui e só depois no código.

---

## 1. Contexto e objetivo

No fim do Início, depois de "Lançamentos recentes", há uma fileira de três botões (Entradas, Cartões, Benefícios; `nav aria-label="Atalhos"`, `data-testid="shortcut-*"`). **Pedido do usuário:** removê-los. Eles repetem a barra inferior (e os painéis Saldo, Cartões e Benefícios do próprio Início já abrem as áreas), então o Início fica mais curto sem perder navegação.

## 2. Decisões de produto

| # | Decisão | Motivo |
| - | ------- | ------ |
| D1 | O Início **não mostra mais** a fileira "Atalhos" (Entradas, Cartões, Benefícios) depois de "Lançamentos recentes". | Pedido do usuário. |
| D2 | O resto do Início **não muda**: painéis, "Lançamentos recentes" com "Ver todos", estado vazio, botão Lançar e a barra do carrinho. | Ajuste pequeno e isolado. |
| D3 | A navegação para as áreas continua pela **barra inferior** e pelos **painéis** do Início. Nada é adicionado no lugar. | Evita duplicar o que a barra já faz. |

## 3. Requisitos

| ID | Requisito |
| -- | --------- |
| RF-01 | O fim do Início é a lista "Lançamentos recentes" (ou o texto de vazio); não há mais botões "Entradas", "Cartões" e "Benefícios" abaixo dela (D1). |
| RF-02 | As linhas de "Lançamentos recentes", o "Ver todos", os painéis e a barra inferior continuam abrindo o que abriam (D2, D3). |
| RN-01 | Nenhuma regra de cálculo, rota ou dado salvo muda. |

## 4. Cenários

```gherkin
# language: pt

Funcionalidade: Início sem os atalhos do fim da tela

  Cenário: Sem a fileira de atalhos
    Dado um mês com gastos
    Quando eu abro o Início
    Então "Lançamentos recentes" é a última seção
    E não vejo os botões "Entradas", "Cartões" e "Benefícios" abaixo dela

  Cenário: Chegar às áreas continua possível
    Quando eu toco em "Cartões" na barra inferior
    Então abre a área Cartões
    E tocar no painel Cartões do Início também abre a área

  Cenário: Lançamentos recentes não mudam
    Quando eu toco numa linha de "Lançamentos recentes"
    Então abre a área do gasto
    E "Ver todos" abre o Resumo do mês
```

| Requisito / regra | Cenário(s) |
| ----------------- | ---------- |
| RF-01, D1 | Sem a fileira de atalhos |
| RF-02, D2, D3 | Chegar às áreas continua possível; Lançamentos recentes não mudam |
| RN-01 | todos (nenhum valor muda) |

## 5. Dados e contrato

Sem mudança no formato salvo, na camada de dados nem nas rotas.

## 6. Interface

Remove o `<nav aria-label="Atalhos">` ao fim de `inicio.tsx` e os ícones/imports que só ele usava. O espaço abaixo de "Lançamentos recentes" é o do espaçador de rodapé do app, como nas outras telas.

## 7. Fora de escopo

- Trocar o que "Lançamentos recentes" mostra ou o "Ver todos".
- Mexer nos painéis do Início, na barra inferior ou no botão Lançar.

## 8. Critérios de aceite

- [ ] `npm test`, `npm run typecheck` e `npm run build` passam.
- [ ] O teste "os atalhos levam às áreas" é trocado por testes dos cenários acima (a área continua alcançável pela barra e pelo painel).
- [ ] Nenhum `shortcut-*`, `Atalhos` ou import sem uso restou em `inicio.tsx`.
- [ ] Em 360 × 780, claro e escuro, o Início termina em "Lançamentos recentes" sem espaço sobrando estranho.
- [ ] `FUNCIONALIDADES.md` não cita mais os atalhos do Início; `redesign-v2-fundacao.md` RF-04 marcado como substituído nesse ponto.

## 9. Tarefas

1. Remover o bloco "Atalhos" e os imports sem uso de `inicio.tsx`.
2. Trocar o teste dos atalhos pelos cenários da seção 4.
3. Ajustar `FUNCIONALIDADES.md` (seção do Início, 33) e rodar `test`, `typecheck` e `build`.

## 10. Roteiro de verificação

1. `npm run dev`, 360 × 780, claro e escuro, `#/`.
2. Conferir que o Início termina em "Lançamentos recentes" e que a barra e os painéis abrem as áreas.
