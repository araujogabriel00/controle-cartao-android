# Spec — Sonhos passam a se chamar Caixinhas

| Campo | Valor |
| ----- | ----- |
| Status | Rascunho |
| Criada em | 13/11/2026 |
| Escopo | Textos, rotas e menu da área hoje chamada Sonhos: `src/App.tsx` (rotas), `src/lib/format.ts` (rotas e `ListKind`), `src/lib/dream-nav.ts`, `src/components/app-header.tsx` (item do menu ⋯), `src/components/dream-parts.tsx`, `src/components/dream-sheets.tsx`, `src/pages/{sonhos,sonhos-plano,sonho-novo,sonho-caixinha,sonho-conquista,sonhos-lista,inicio,entradas,entradas-resumo,entradas-lista}.tsx`, mensagens de erro de `src/data/store.ts`, testes, `FUNCIONALIDADES.md`, `README.md` |
| Depende de | [`sonhos.md`](sonhos.md) |
| Substitui em parte | [`sonhos.md`](sonhos.md): nome da área, glossário, rotas e textos (o comportamento não muda) |

> Mudanças de comportamento entram primeiro aqui e só depois no código.

---

## 1. Contexto e objetivo

**Pedido do usuário:** a aba de Sonhos passa a se chamar só **Caixinhas**. Hoje "sonho" é o objetivo e "caixinha" é só o dinheiro guardado dele; com o novo nome, **cada objetivo é uma caixinha**. É um renomeio: **nenhuma regra, cálculo, tela ou dado muda**.

## 2. Decisões de produto

| # | Decisão | Origem |
| - | ------- | ------ |
| D1 | O nome da área é **Caixinhas** (menu ⋯, painel do Início, título da lista). A lista passa a se chamar **"Minhas caixinhas"** e o botão **"Nova caixinha"**. | Pedido do usuário. |
| D2 | "Sonho" some de todo texto visível e vira **"caixinha"** (substantivo **feminino**: "esta caixinha", "da caixinha", "caixinhas ativas"). Ex.: "Novo sonho" → "Nova caixinha", "Excluir sonho" → "Excluir caixinha", "Nome do sonho" → "Nome da caixinha", "Conquistados" → "Conquistadas". | Consequência de D1. |
| D3 | **Glossário:** *Caixinha* = o objetivo (nome, ícone, meta, guardado, ritmo, previsão). O dinheiro dentro dela passa a ser chamado de **guardado**. Os termos *Aporte*, *Retirada* e *Guardado inicial* não mudam. | Evita "caixinha da caixinha". |
| D4 | **Rotas:** `/sonhos` → `/caixinhas`, `/sonhos/plano` → `/caixinhas/plano`, `/sonhos/novo` → `/caixinhas/nova`, `/sonhos/:id` → `/caixinhas/:id`, `/sonhos/:id/editar` → `/caixinhas/:id/editar`, `/sonhos/:id/conquista` → `/caixinhas/:id/conquista`. Os endereços antigos `/sonhos…` **redirecionam** para os novos (links e histórico guardados continuam funcionando). | Consistência com o nome. |
| D5 | A linha **"Guardado em sonhos"** (Entradas, Resumo do mês, listas) vira **"Guardado em caixinhas"**. | Consequência de D1. |
| D6 | O **formato dos dados não muda** (sem migração): o código mantém `dreams`, `Dream`, `dream-*` e os nomes dos arquivos. Só texto visível, rotas, `aria-label` e mensagens de erro mudam. Os `data-testid` **continuam os mesmos** (ex.: `dream-*`, `button-new-dream`) para não quebrar testes sem necessidade. | Menor risco; renomear código fica fora de escopo. |
| D7 | O item do menu ⋯ e o painel do Início usam o mesmo ícone de hoje; só o texto muda para "Caixinhas". Não é item da barra inferior (continua com 5 itens). | `sonhos.md` D1. |

## 3. Requisitos funcionais

| # | Requisito |
| - | --------- |
| RF-01 | Nenhum texto visível, `aria-label`, título de página ou mensagem de erro contém "sonho" ou "sonhos" (D2). |
| RF-02 | O menu ⋯ mostra **"Caixinhas"** e o painel do Início mostra o título **Caixinhas** (D1, D7). |
| RF-03 | A lista mostra "Minhas caixinhas", "Nova caixinha" e a seção "Conquistadas" (D1, D2). |
| RF-04 | As rotas novas abrem as mesmas telas de antes; as rotas `/sonhos…` redirecionam para as equivalentes (D4). |
| RF-05 | A linha "Guardado em caixinhas" aparece onde estava "Guardado em sonhos" (D5). |
| RF-06 | Mensagens ficam no feminino: "Caixinha não encontrada.", "Esta caixinha já foi encerrada.", "A caixinha ainda não chegou à meta.", "A divisão deve cobrir todas as caixinhas ativas." (D2). |
| RF-07 | Os dados já salvos continuam abrindo sem migração e com os mesmos valores (D6). |

## 4. Regras de negócio

Nenhuma. Plano, aportes, retiradas, conquista, animações e a fórmula do resultado do mês são os de `sonhos.md`.

## 5. Cenários

```gherkin
# language: pt
Funcionalidade: Caixinhas (antigos Sonhos)

  Cenário: Menu e painel com o novo nome
    Quando eu abro o menu ⋯
    Então vejo "Caixinhas" e não vejo "Sonhos"
    E o painel do Início tem o título "Caixinhas"

  Cenário: Lista com o novo nome
    Quando eu abro "Caixinhas"
    Então vejo "Minhas caixinhas" e o botão "Nova caixinha"

  Cenário: Criar uma caixinha
    Quando eu toco em "Nova caixinha"
    Então vejo o campo "Nome da caixinha"

  Cenário: Rota antiga redireciona
    Quando eu abro o endereço "#/sonhos"
    Então chego em "#/caixinhas"
    E o mesmo vale para "#/sonhos/plano" e "#/sonhos/:id"

  Cenário: Linha no caixa do mês
    Dado que guardei R$ 300,00 em uma caixinha neste mês
    Então a tela Entradas mostra "Guardado em caixinhas" com R$ 300,00

  Cenário: Mensagens no feminino
    Quando eu tento encerrar uma caixinha que não chegou à meta
    Então vejo "A caixinha ainda não chegou à meta."

  Cenário: Dados antigos continuam
    Dado um backup feito antes desta mudança, com sonhos guardados
    Quando eu abro "Caixinhas"
    Então vejo as mesmas caixinhas, metas e valores guardados
```

## 6. Matriz de rastreabilidade

| Requisito | Cenários |
| --------- | -------- |
| RF-01, RF-03, D1, D2 | Lista com o novo nome; Criar uma caixinha |
| RF-02, D7 | Menu e painel com o novo nome |
| RF-04, D4 | Rota antiga redireciona |
| RF-05, D5 | Linha no caixa do mês |
| RF-06 | Mensagens no feminino |
| RF-07, D6 | Dados antigos continuam |

## 7. Interface

Sem mudança visual: mesmas telas V5_01 a V5_08, só com os textos novos. Nomes dos botões e títulos em D1 e D2. Conferir que os rótulos novos cabem sem cortar em 360 px ("Minhas caixinhas", "Nova caixinha", "Guardado em caixinhas").

## 8. Fora de escopo

- Renomear identificadores e arquivos do código (`dreams`, `dream-*`, `sonhos-*.tsx`) e mudar o formato dos dados.
- Mudar comportamento, cálculo, ícones ou animações.
- Reescrever o texto histórico de `sonhos.md`: ele ganha só uma nota apontando para esta spec.

## 9. Critérios de aceite

- [ ] Cada cenário da seção 5 tem teste (atualizar `sonhos.test.tsx` e os testes que citam "Sonhos" ou "Guardado em sonhos"; incluir um teste de redirecionamento `/sonhos…`).
- [ ] Uma busca por `sonho` (sem diferenciar maiúsculas) em `src/**/*.tsx` e nas mensagens de `store.ts` não acha **texto visível**; só comentários e identificadores (D6).
- [ ] `FUNCIONALIDADES.md` e `README.md` usam "Caixinhas"; `sonhos.md`, `carrinho.md`, `inicio-com-minigraficos.md` e `redesign-v2-fundacao.md` ganham uma nota "área hoje chamada Caixinhas, ver `sonhos-viram-caixinhas.md`".
- [ ] Em 360 × 780 nenhum rótulo novo é cortado.
- [ ] `npm test`, `npm run typecheck` e `npm run build` passam.

## 10. Tarefas

1. Trocar os textos visíveis e os `aria-label` (D2), no feminino, em páginas e componentes listados no escopo.
2. Trocar as rotas (D4) em `App.tsx`, `format.ts` e `dream-nav.ts`, e criar os redirecionamentos `/sonhos…`.
3. Ajustar as mensagens de erro de `store.ts` (RF-06).
4. "Guardado em caixinhas" (D5) e título do painel do Início e do menu ⋯ (D1, D7).
5. Atualizar testes e acrescentar o de redirecionamento.
6. Atualizar `FUNCIONALIDADES.md`, `README.md` e as notas nas specs.
