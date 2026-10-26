# Spec — Opção D nas telas de apoio: listas, formulários, folhas e confirmações

| Campo | Valor |
| ----- | ----- |
| Status | Proposta |
| Criada em | 26/10/2026 |
| Escopo | Telas de lista (`/entradas/lista/...`, `/beneficios/...`), `/historico`, `/categorias`, diálogos de formulário, `ScopeDialog`, confirmações, toasts, `src/components/` compartilhados, `FUNCIONALIDADES.md`, `README.md` |
| Depende de | [`redesign-opcao-d-entradas.md`](redesign-opcao-d-entradas.md), [`redesign-opcao-d-cartoes.md`](redesign-opcao-d-cartoes.md), [`redesign-opcao-d-beneficios.md`](redesign-opcao-d-beneficios.md) |
| Referência visual | Canvas: telas `FluxoD_00` a `FluxoD_17` e o mapa do fluxo |

> Mudanças de comportamento entram primeiro aqui e só depois no código.
> **Implemente por último**, depois das três specs de aba.

---

## 1. Contexto e objetivo

As telas que se abrem a partir das abas (listas, formulários, histórico, categorias) ainda têm o visual antigo. Esta spec leva a Opção D a elas, mantendo cada fluxo, texto de regra e rota.

## 2. Decisões de produto

| # | Decisão | Motivo |
| - | ------- | ------ |
| D1 | Todas as telas secundárias têm **botão de voltar** de 44 px no topo (ícone + "Voltar" com `aria-label`) e título em Fraunces 28 px. | Navegação consistente. |
| D2 | **Listas** (entradas, contas fixas, gastos, cartões do mês): total do mês em destaque no topo, linhas com hairline, linha inteira abre a edição, e **"⋯"** de 44 px por linha com Editar/Excluir quando houver mais de uma ação. Selo (ex.: "Recorrente") vai na linha de subtítulo, nunca ao lado do valor. | Evita quebra de linha e alvo pequeno. |
| D3 | **Formulários** (entrada, conta fixa, gasto, compra, cartão, benefício, categoria) abrem como **folha de rodapé** com título, campos de 48 px, rótulo acima do campo (14 px) e botão primário de 52 px no fim. Campos, validações e textos de regra permanecem como hoje. | Mesmo conteúdo, melhor toque. |
| D4 | O **diálogo de escopo** ("Só este mês" / "Este e os próximos") vira folha com dois botões grandes e a explicação de cada um. Comportamento igual. | Escolha clara. |
| D5 | **Confirmações** hoje feitas com `window.confirm` (excluir cartão, benefício, lançamento; fechar categoria) passam a um **diálogo próprio** com título, texto da consequência, botão "Cancelar" e botão destrutivo na cor `danger`, ambos de 48 px. | Visual consistente e testável. |
| D6 | **Folhas**: "Lançar" (rodapé) lista as ações de lançamento; "Qual benefício?" (quando há mais de um) lista os benefícios; "⋯" de cartão/benefício. Todas fecham ao tocar fora, em "Fechar" ou ao escolher. | Padrão único. |
| D7 | **Histórico** (`/historico`): título, gráfico de colunas por mês (mesma regra de `columns.tsx`) e tabela abaixo; voltar leva à aba Cartões. **Categorias** (`/categorias`): lista com hairlines e "⋯" por linha. | Mantém as telas, novo visual. |
| D8 | **Avisos** (toasts) ficam acima do rodapé, texto de 14 px, somem em 4 s e usam `role="status"`. | Acessibilidade. |
| D9 | O rodapé segue a regra atual de `hasFooter` mais o botão "Resumo" da spec de Entradas; nas telas sem rodapé (Histórico, Categorias) nada muda. | Sem regressão. |

## 3. Requisitos

### 3.1 Requisitos funcionais (RF)

| ID | Requisito |
| -- | --------- |
| RF-01 | Cada tela secundária mostra o botão de voltar (D1); voltar usa a navegação de hoje. |
| RF-02 | Listas seguem D2; o total no topo é o mesmo número que a tela de origem mostra para o mês. |
| RF-03 | Formulários abrem como folha (D3), com foco no primeiro campo, fecham ao salvar ou cancelar e mantêm as mensagens de erro de hoje, abaixo do campo e com `role="alert"`. |
| RF-04 | O diálogo de escopo (D4) aparece nos mesmos casos de hoje (editar ou excluir item recorrente). |
| RF-05 | As confirmações (D5) substituem `window.confirm` em todos os lugares onde ele é usado; Cancelar é o foco inicial. |
| RF-06 | Folhas (D6) e toasts (D8) conforme as decisões. |
| RF-07 | Alvos de 44 px, textos de 12 px ou mais, foco visível em todos os botões. |

### 3.2 Regras de negócio (RN)

| ID | Regra |
| -- | ----- |
| RN-01 | Nenhuma regra de dados muda: o que cada formulário grava, o que cada exclusão apaga e o que cada escopo afeta continuam como hoje. |
| RN-02 | Rotas e `data-testid` existentes são mantidos. Onde havia `window.confirm`, os testes devem passar a clicar nos botões do novo diálogo. |

## 4. Cenários

```gherkin
# language: pt
Funcionalidade: Telas de apoio na Opção D

  Cenário: Voltar de uma lista
    Dado que estou em "Gastos do dia a dia"
    Quando eu toco em "Voltar"
    Então volto para a aba Entradas

  Cenário: Excluir item recorrente
    Quando eu toco em "⋯" e em "Excluir" numa entrada recorrente
    Então vejo a folha de escopo com "Só este mês" e "Este e os próximos"
    E ao escolher uma opção vejo a confirmação com o texto da consequência
    E o item só é apagado se eu confirmar

  Cenário: Cancelar confirmação
    Quando a confirmação aparece e eu toco em "Cancelar"
    Então nada é apagado

  Cenário: Formulário com erro
    Quando eu salvo "Nova entrada" sem valor
    Então vejo a mensagem de erro abaixo do campo e a folha continua aberta

  Cenário: Histórico
    Quando eu abro o histórico pela aba Cartões
    Então vejo o gráfico de colunas e a tabela por mês
    E "Voltar" leva à aba Cartões
```

## 5. Dados e contrato

Sem mudança no formato salvo nem em `src/data/store.ts`. O diálogo de confirmação é um componente novo (`confirm-dialog.tsx`) que recebe título, texto, rótulo do botão destrutivo e callbacks.

## 6. Interface

Componentes novos ou ajustados: `back-button`, `bottom-sheet`, `confirm-dialog`, `row-menu` (o "⋯"), `toast`. Reutiliza `columns.tsx` no histórico. Mock: telas `FluxoD_00` a `FluxoD_17`.

## 7. Fora de escopo

- Novos campos, novas validações ou novas rotas.
- Alterar o que é gravado em cada formulário.

### Pontos a confirmar antes de implementar

1. **Substituir `window.confirm`** (D5) mexe em testes e em vários arquivos; confirme que quer isso agora. Se não, mantenha `window.confirm` e ignore D5/RF-05.
2. Textos de formulários e diálogos no mock são ilustrativos; **mantenha os textos do seu código**.
3. Se algum formulário já é uma folha, só ajuste as medidas.

## 8. Critérios de aceite

- Toda tela secundária tem voltar e segue o visual da Opção D.
- Formulários, escopo e confirmações funcionam como nos cenários e não há mais `window.confirm` (se D5 for aceito).
- Rotas e `data-testid` preservados; nenhum dado é gravado de forma diferente.
- `npm run typecheck` e `npm run build` passam; documentação atualizada; status "Implementada".

## 9. Tarefas

1. Criar `confirm-dialog`, `bottom-sheet`, `row-menu`, `back-button`, `toast` (reaproveitar o que já existir).
2. Aplicar nas listas, no histórico e nas categorias.
3. Migrar formulários e `ScopeDialog` para a folha.
4. Trocar `window.confirm` pelo `confirm-dialog`.
5. Atualizar testes que dependiam de `window.confirm`.
6. `FUNCIONALIDADES.md`, `README.md`, typecheck e build.

## 10. Roteiro de verificação

1. Percorrer cada lista: voltar, editar, excluir (com e sem escopo).
2. Abrir cada formulário e salvar com e sem erro.
3. Histórico e Categorias.
4. Folhas "Lançar", "Qual benefício?" e "⋯".
5. Toasts e foco por teclado/TalkBack.
