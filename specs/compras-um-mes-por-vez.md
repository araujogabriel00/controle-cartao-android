# Spec — Todas as compras: um mês por vez, busca e filtros

| Campo | Valor |
| ----- | ----- |
| Status | Proposta |
| Criada em | 12/11/2026 |
| Escopo | `src/pages/compras.tsx` (faixa de meses, busca, folha de filtros, mês vazio), `src/App.tsx` (rota sem remontar ao trocar de mês), `src/lib/format.ts` (se precisar de rótulos curtos de mês), `src/pages/compras.test.tsx`, `FUNCIONALIDADES.md`, `README.md` |
| Depende de | [`redesign-v2-historico-e-compras.md`](redesign-v2-historico-e-compras.md), [`todas-as-compras.md`](todas-as-compras.md), [`compras-em-qualquer-mes.md`](compras-em-qualquer-mes.md), [`desfazer-exclusao.md`](desfazer-exclusao.md) |
| Substitui em parte | [`redesign-v2-historico-e-compras.md`](redesign-v2-historico-e-compras.md): na tela "Todas as compras", D6 a D9 (cabeçalho, busca e categoria sempre visíveis, lista de todos os meses em sequência), D13/D14 (a rolagem até o mês passa a ser a seleção do mês), RF-06, RF-07, RF-08, RF-10 e RF-13. O item da lista (D10), editar e excluir (D11) e o olho (D12) continuam. O **Histórico** não muda |
| Referência visual | Canvas "Controle do Cartão": V11_01 (um mês por vez) e V12_01 a V12_04 (busca, folha de filtros, filtro ativo, mês sem compras), claras e escuras |

> Mudanças de comportamento entram primeiro aqui e só depois no código.

---

## 1. Contexto e objetivo

Hoje "Todas as compras" é uma lista longa com todos os meses em sequência, com busca e categoria sempre ocupando o alto da tela. **Pedido do usuário:** refatorar usando a opção "um mês por vez" do canvas. **Objetivo:** mostrar **um mês de cada vez**, escolhido numa **faixa de meses** com o total de cada um, com a busca e os filtros **recolhidos em ícones** no cabeçalho. Nenhum dado, cálculo, rota ou regra de edição/exclusão muda.

## 2. Glossário

| Termo | Significado |
| ----- | ----------- |
| Faixa de meses | Linha horizontal de pílulas (uma por mês) no alto da tela; a pílula do mês aberto fica marcada. |
| Mês aberto | O mês cujas compras a lista mostra; vem da rota (`/compras` = mês atual, `/compras/mes/AAAA-MM`). |
| Compra "prevista" | Parcela futura ou cobrança recorrente ainda não lançada (já existe hoje). |
| Filtros | Categoria (uma) e Tipo (Parceladas, Mensais, Previstas) da folha de filtros. |

## 3. Decisões de produto

| # | Decisão | Motivo |
| - | ------- | ------ |
| D1 | A lista mostra **um mês por vez**: o **mês aberto**. Os outros meses não aparecem na lista. | Pedido do usuário (V11_01). |
| D2 | A **faixa de meses** vai do **mês da compra mais antiga** até o **último mês com compra ou parcela prevista**, **sempre incluindo o mês atual**, sem pular meses (um mês sem compras aparece com "—"). Ordem **do mais recente para o mais antigo**, da esquerda para a direita. | V11_01; faixa contínua evita "buracos" difíceis de entender. |
| D3 | Cada pílula tem **64 px de altura e no mínimo 96 px de largura**, mostra o mês e o ano ("Out 26") e o **total do mês** (mono, sem "R$"; "—" se não há compras; "••••" com o olho fechado). A pílula do mês aberto fica preenchida em `ink`. Ao abrir a tela e ao trocar de mês, a pílula do mês aberto é **rolada para a vista**. | V11_01; alvo de toque ≥ 48 px. |
| D4 | O **título do mês** ("Outubro de 2026") e "N compras" ficam acima da lista do mês. Com filtros, "N de M compras". | V11_01/V12_03. |
| D5 | **Trocar de mês** (tocar numa pílula) muda a rota para `/compras/mes/AAAA-MM` (`/compras` se for o mês atual) **sem empilhar histórico** (substitui a entrada) e **sem remontar a tela**: busca e filtros não se perdem. A lista volta ao topo. | Pedido de abrir no mês de origem continua valendo; trocar de mês não deve limpar o que a pessoa configurou. |
| D6 | O **voltar** leva à aba **Cartões no mês aberto** no momento (não no mês de origem). | O mês é compartilhado entre as áreas; sai com o mês que a pessoa estava vendo. |
| D7 | O cabeçalho tem **dois ícones de 48 px**: **Buscar** e **Filtros**. O campo de busca e o seletor de categoria **não ficam mais visíveis o tempo todo**. Abaixo do título, o subtítulo "‹cartão› · todos os meses" fica. | V11_01. |
| D8 | **Buscar** abre o modo de busca (V12_01): o cabeçalho vira "← campo de busca com ✕", com foco automático. A busca **vale para todos os meses**, e os resultados vêm **agrupados por mês** (mais recente primeiro), cada grupo com "N resultados". No rodapé: "N resultados · total R$ X". Os **filtros continuam valendo** sobre a busca. A faixa de meses **some** durante a busca. | V12_01. |
| D9 | Sair da busca (← ou ✕ com o campo já vazio) **volta ao mês que estava aberto**. O ✕ com texto só limpa o texto. | Fluxo previsível. |
| D10 | **Filtros** abre uma **folha** (V12_02) com **Categoria** (uma opção: "Todas", "Sem categoria" e as categorias) e **Tipo** (**Parceladas**, **Mensais** e **Previstas**, **combináveis**), e os botões **"Limpar"** (zera as duas escolhas) e **"Ver N compras"**, em que N é o total de compras (de todos os meses) que passam pelos filtros. Os filtros só valem ao tocar "Ver"; fechar pelo ✕ descarta. | V12_02. |
| D11 | Definições do Tipo: **Parceladas** = compra com parcela (`installment` presente), inclusive as parcelas previstas; **Mensais** = compra recorrente; **Previstas** = ainda não lançada. Tipos marcados se combinam com **"ou"** (basta passar em um); Categoria e Tipo se combinam com **"e"**. Sem nenhum Tipo marcado, vale tudo. | Regras simples e previsíveis. |
| D12 | Com filtro ativo (V12_03): o **ícone de Filtros mostra um contador** (número de filtros ativos), aparece uma **etiqueta com ✕ de 48 px** para cada filtro (Categoria e cada Tipo) sob a faixa, e **os totais da faixa passam a ser os totais filtrados**. O texto "Os filtros valem para todos os meses" e "Total do mês R$ X" aparecem abaixo da lista. | V12_03; deixa claro que o filtro não é só do mês. |
| D13 | **Mês sem compras** (V12_04): ícone, "Nenhuma compra em ‹mês›", o botão **"Lançar compra de ‹mês›"** (abre o formulário de compra no cartão com a data no mês aberto; desabilitado sem cartão) e o link **"Ir para o mês mais recente com compras"** (o mais recente anterior; se não houver, o mais próximo depois; escondido se não houver nenhum). | V12_04. |
| D14 | Com **filtro ou busca ativos** e nenhuma compra no mês, o texto vira "Nenhuma compra com esses filtros em ‹mês›" e o botão de lançar é trocado por **"Limpar filtros"**. | Não oferecer lançar quando o problema é o filtro. |
| D15 | **Sem nenhuma compra no cartão** (nem previstas), a tela mostra o estado vazio de hoje e **não** mostra a faixa, a busca nem os filtros. | Sem o que filtrar. |
| D16 | O item da lista, o ⋯ (Editar, Excluir), o `ScopeDialog` das recorrentes e o Desfazer **não mudam**. Com o olho fechado, valores, totais da faixa e dos meses viram "••••". | Escopo só visual. |

## 4. Requisitos

### 4.1 Requisitos funcionais (RF)

| ID | Requisito |
| -- | --------- |
| RF-01 | A tela mostra, nesta ordem: cabeçalho (voltar, título, Buscar, Filtros), subtítulo do cartão, faixa de meses, título do mês com a contagem e a lista do mês aberto (D1, D2, D4, D7). |
| RF-02 | A faixa traz um mês por pílula, conforme D2, com o total e a marcação do mês aberto (D3); a pílula do mês aberto é levada à vista. |
| RF-03 | Tocar numa pílula abre aquele mês pela rota e **não** perde busca nem filtros (D5). |
| RF-04 | A lista do mês traz as compras do mês (lançadas, parcelas previstas e recorrentes previstas), mais recente primeiro, no item compacto de hoje, com `group-AAAA-MM` e `total-AAAA-MM` (este agora na pílula do mês) (D1, D16). |
| RF-05 | O voltar leva a `#/cartoes/mes/AAAA-MM` do mês aberto (ou `#/cartoes` no mês atual) (D6). |
| RF-06 | Buscar segue D8 e D9: todos os meses, agrupado por mês, com rodapé de resultados e total, e a saída volta ao mês aberto. |
| RF-07 | Filtros segue D10 e D11, e o filtro ativo aparece como D12. |
| RF-08 | Mês sem compras e mês vazio por filtro seguem D13 e D14. |
| RF-09 | Sem nenhuma compra no cartão vale D15. |
| RF-10 | Editar, excluir (com Desfazer) e o escopo das recorrentes continuam funcionando em qualquer mês aberto e nos resultados da busca (D16). |
| RF-11 | Com o olho fechado nenhum valor em reais aparece nas pílulas, nas listas, nas contagens de total e na folha de filtros (D16). |

### 4.2 Regras de negócio (RN)

| ID | Regra |
| -- | ----- |
| RN-01 | Os valores são os de hoje (`useGetAllMovements`); nada é recalculado fora da tela. Os totais da faixa e do mês somam as linhas do mês que passam pelos filtros, em centavos. |
| RN-02 | Mês aberto inválido na rota → `/compras` (mês atual), como hoje. Mês aberto fora da faixa (sem compras e longe das outras) **é incluído na faixa** para não desaparecer. |
| RN-03 | O estado de busca e de filtros vive na tela; **sair da tela** o descarta (não persiste). |
| RN-04 | Alvos de toque ≥ 48 px; texto ≥ 14 px (12–13 só em eixos e rótulos de gráfico); nenhuma informação só por cor (pílula ativa também por preenchimento e `aria-pressed`). |
| RN-05 | Nome acessível da pílula: "Outubro de 2026, 5 compras, R$ 587,06" (sem valor com o olho fechado). |

## 5. Cenários

```gherkin
# language: pt

Funcionalidade: Todas as compras, um mês por vez

  Contexto:
    Dado o cartão "Nubank" com compras em agosto (nenhuma), setembro, outubro e parcelas previstas em novembro
    E hoje é 15/10/2026

  Cenário: Abre no mês de onde vim
    Dado que estou na aba Cartões em setembro
    Quando eu toco em "Todas as compras"
    Então abre "#/compras/mes/2026-09" com "Setembro de 2026" na lista
    E a pílula "Set 26" está marcada e visível

  Cenário: A faixa traz um mês por pílula, do mais recente ao mais antigo
    Então vejo as pílulas "Nov 26", "Out 26", "Set 26" e "Ago 26", nessa ordem
    E cada uma mostra o total do mês, e "Ago 26" mostra "—"

  Cenário: Só o mês aberto aparece na lista
    Dado outubro aberto
    Então vejo as compras de outubro
    E não vejo as de setembro nem as de novembro

  Cenário: Trocar de mês
    Quando eu toco em "Set 26"
    Então a lista mostra as compras de setembro
    E a rota é "#/compras/mes/2026-09"
    E a lista volta ao topo

  Cenário: Trocar de mês não perde os filtros
    Dado o filtro "Eletrônicos" ativo
    Quando eu toco em "Set 26"
    Então o filtro "Eletrônicos" continua ativo

  Cenário: Mês atual usa /compras
    Quando eu toco em "Out 26"
    Então a rota é "#/compras"

  Cenário: Voltar leva ao mês aberto
    Dado setembro aberto
    Quando eu toco em voltar
    Então abre a aba Cartões em setembro

  Cenário: Buscar em todos os meses
    Quando eu toco em "Buscar" e digito "fone"
    Então vejo os resultados agrupados por mês, do mais recente ao mais antigo
    E o rodapé mostra "2 resultados" e o total
    E a faixa de meses não aparece

  Cenário: Sair da busca volta ao mês aberto
    Dado a busca "fone" aberta a partir de outubro
    Quando eu toco no ✕ e depois em voltar
    Então vejo outubro na lista e a faixa de volta

  Cenário: Filtrar por categoria e tipo
    Quando eu toco em "Filtros", escolho "Eletrônicos" e "Parceladas" e toco em "Ver 2 compras"
    Então o ícone de filtros mostra "2"
    E vejo as etiquetas "Eletrônicos ✕" e "Parceladas ✕"
    E os totais da faixa passam a somar só o que passa pelos filtros

  Cenário: Tipos se combinam com "ou"
    Quando eu marco "Parceladas" e "Mensais"
    Então passam as compras parceladas e as recorrentes

  Cenário: Categoria e tipo se combinam com "e"
    Quando eu escolho "Mercado" e "Parceladas"
    Então só passam as parceladas de "Mercado"

  Cenário: Limpar e remover filtros
    Quando eu toco no ✕ de uma etiqueta
    Então aquele filtro some e os totais voltam a considerá-lo
    E "Limpar" na folha zera categoria e tipos

  Cenário: Fechar a folha descarta
    Quando eu escolho "Eletrônicos" e fecho a folha pelo ✕
    Então nenhum filtro é aplicado

  Cenário: Mês sem compras
    Quando eu toco em "Ago 26"
    Então vejo "Nenhuma compra em agosto"
    E o botão "Lançar compra de agosto"
    E o link "Ir para o mês mais recente com compras" leva a "Out 26" ou ao mais próximo

  Cenário: Lançar compra do mês vazio
    Quando eu toco em "Lançar compra de agosto"
    Então abre o formulário de compra no cartão com a data em agosto

  Cenário: Mês vazio por causa do filtro
    Dado o filtro "Mercado" e setembro sem compras de "Mercado"
    Então vejo "Nenhuma compra com esses filtros em setembro"
    E o botão "Limpar filtros" no lugar de "Lançar compra de setembro"

  Cenário: Cartão sem compras
    Dado nenhuma compra no cartão
    Então vejo o estado vazio e não vejo a faixa, a busca nem os filtros

  Cenário: Editar e excluir em qualquer mês
    Quando eu toco numa compra de setembro
    Então abre a edição dela
    Quando eu excluo uma compra pelo ⋯
    Então aparece "Desfazer" e o total da pílula e do mês diminuem

  Cenário: Olho fechado
    Dado o olho fechado
    Então as pílulas, as listas e os totais mostram "••••" e nenhum valor em reais aparece

  Cenário: Mês inválido na rota
    Quando eu abro "#/compras/mes/abc"
    Então abre "#/compras" no mês atual
```

### 5.1 Matriz de rastreabilidade

| Requisito / regra | Cenário(s) |
| ----------------- | ---------- |
| RF-01, D1, D7 | Só o mês aberto aparece na lista |
| RF-02, D2, D3, RN-05 | A faixa traz um mês por pílula…; Abre no mês de onde vim |
| RF-03, D5 | Trocar de mês; Trocar de mês não perde os filtros; Mês atual usa /compras |
| RF-04, D4, RN-01 | Só o mês aberto aparece na lista; Trocar de mês |
| RF-05, D6 | Voltar leva ao mês aberto |
| RF-06, D8, D9 | Buscar em todos os meses; Sair da busca volta ao mês aberto |
| RF-07, D10, D11, D12 | Filtrar por categoria e tipo; Tipos se combinam com "ou"; Categoria e tipo se combinam com "e"; Limpar e remover filtros; Fechar a folha descarta |
| RF-08, D13, D14 | Mês sem compras; Lançar compra do mês vazio; Mês vazio por causa do filtro |
| RF-09, D15 | Cartão sem compras |
| RF-10, D16 | Editar e excluir em qualquer mês |
| RF-11 | Olho fechado |
| RN-02 | Mês inválido na rota |
| RN-03 | Trocar de mês não perde os filtros (e a saída da tela os descarta; teste de unidade) |
| RN-04 | roteiro de verificação (alvos e contraste) |

## 6. Dados e contrato

Sem mudança no formato salvo, na camada de dados, nos hooks nem nas rotas. A faixa, os totais, a busca e os filtros são calculados **na tela** a partir de `useGetAllMovements` (lançadas + previstas). Pontos de implementação:

- **Rota sem remontar:** hoje `/compras` e `/compras/mes/:month` são duas `Route`; como trocar de mês não pode zerar busca e filtros, usar **uma só** `Route` (por exemplo, `/compras/:rest*`) ou levantar o estado de filtros para um contexto da tela, e trocar o mês com `navigate(path, { replace: true })`.
- **Lançar compra do mês vazio:** disparar `openQuickAdd('purchase')` de `quick-add.tsx`, que já usa o mês da rota para a data padrão (`defaultDateFor`).

## 7. Interface

- **Cabeçalho:** voltar (48 px), título em fonte de títulos, ícones Buscar e Filtros de 48 px (Filtros com contador em círculo de 18 px, `brand`).
- **Faixa:** pílulas de 64 px, `rounded-[18px]`, borda 1,5 px; ativa em `ink`; rolagem horizontal sem barra; rolar a ativa para a vista (`scrollIntoView({ inline: 'center' })`).
- **Etiquetas de filtro:** pílulas de 48 px com ✕, fundo `tint`, borda `brand`.
- **Folha de filtros:** folha de baixo com alça, cantos de 28 px, grupos "Categoria" e "Tipo" com pílulas de 48 px (`aria-pressed`), botões "Limpar" e "Ver N compras" de 52 px.
- **Mês vazio:** ícone de cartão em círculo `tint`, título, texto de apoio, botão primário de 52 px e link de 48 px.
- **Referência exata:** V11_01 e V12_01 a V12_04 (claras e escuras).

## 8. Fora de escopo

- O Histórico, a aba Cartões e a regra de edição/exclusão.
- Ordenar por valor, filtrar por período ou por vários cartões, buscar por valor.
- Persistir busca e filtros ao sair da tela (RN-03).
- Agrupar por categoria ("Por categoria" do canvas V11_02): ideia descartada por ora.

## 9. Critérios de aceite

- [ ] `npm test`, `npm run typecheck` e `npm run build` passam.
- [ ] Cada cenário da seção 5 tem teste em `src/pages/compras.test.tsx` (os testes do campo de busca fixo e do `select-category` foram trocados pelos novos fluxos, com testids novos para a faixa, a busca, os filtros e as etiquetas).
- [ ] Os valores das compras e dos totais são iguais aos da versão anterior para os mesmos dados.
- [ ] Trocar de mês mantém busca e filtros, não empilha histórico e leva a lista ao topo.
- [ ] Em 360 × 780, claro e escuro: sem scroll horizontal da página (só a faixa rola), pílulas e botões ≥ 48 px, textos ≥ 14 px.
- [ ] Com o olho fechado nenhum valor aparece (texto, `aria-label`, HTML).
- [ ] `FUNCIONALIDADES.md` (seção 24 e a do Histórico/Todas as compras) e `README.md` atualizados; `redesign-v2-historico-e-compras.md` marcada como substituída nos itens do campo "Substitui em parte".

## 10. Tarefas

1. Montar a faixa de meses (D2, D3) e o mês aberto na lista (D1, D4), com rolagem da pílula ativa para a vista.
2. Rota única e troca de mês sem remontar (D5); voltar para o mês aberto (D6).
3. Cabeçalho com ícones Buscar e Filtros (D7); modo de busca em todos os meses (D8, D9).
4. Folha de filtros, etiquetas com ✕, contador e totais filtrados (D10 a D12).
5. Mês sem compras e vazio por filtro (D13, D14); cartão sem compras (D15).
6. Testes dos cenários e ajuste dos que citam `select-category`, `input-search` fixo, `button-clear-category` e `text-filter-total`.
7. `FUNCIONALIDADES.md` e `README.md`.
8. Rodar `test`, `typecheck` e `build`.

## 11. Roteiro de verificação

1. `npm run dev`, 360 × 780, claro e escuro, com um cartão com compras em 3 meses, uma parcelada, uma recorrente e uma compra sem categoria.
2. Abrir "Todas as compras" a partir de meses diferentes; conferir a pílula marcada e o voltar.
3. Trocar de mês, buscar, filtrar por categoria e tipo; conferir contador, etiquetas, totais e que trocar de mês não perde o filtro.
4. Abrir um mês sem compras e um mês vazio por filtro; lançar uma compra de um mês vazio.
5. Editar e excluir (com Desfazer) em um mês e nos resultados da busca.
6. Fechar o olho e conferir texto, `aria-label` e HTML.
