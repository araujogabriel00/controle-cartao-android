# Spec — Nova versão (v2), parte 1: fundação

| Campo | Valor |
| ----- | ----- |
| Status | Proposta |
| Criada em | 29/10/2026 |
| Escopo | `src/index.css`, `src/App.tsx`, `src/lib/format.ts`, `src/lib/footer.ts`, `src/components/app-tabs.tsx` (vira barra inferior), `src/components/month-nav.tsx`, `src/components/quick-add.tsx` (botão Lançar), novos `src/components/app-header.tsx`, `src/lib/theme.ts`, `src/lib/hide-values.ts`, `src/pages/inicio.tsx`, troca de hexadecimais por cores com nome em `src/**/*.tsx`, `FUNCIONALIDADES.md`, `README.md` |
| Depende de | [`mes-compartilhado.md`](mes-compartilhado.md), [`botao-lancar.md`](botao-lancar.md), [`redesign-opcao-d-entradas.md`](redesign-opcao-d-entradas.md), [`redesign-opcao-d-cartoes.md`](redesign-opcao-d-cartoes.md), [`redesign-opcao-d-beneficios.md`](redesign-opcao-d-beneficios.md), [`redesign-opcao-d-telas-de-apoio.md`](redesign-opcao-d-telas-de-apoio.md) |
| Substitui em parte | As abas em pílula no topo (`redesign-entradas.md` RF-06) e o rodapé com "Resumo / Lançar / Categorias" (`redesign-entradas.md` RF-07, `redesign-opcao-d-entradas.md` D8). A rota `/` deixa de abrir Cartões. |
| Referência visual | Canvas "Controle do Cartão", grupo "Nova versão (v2)", telas V2_01 a V2_13, claras e escuras |

> Mudanças de comportamento entram primeiro aqui e só depois no código.

---

## 1. Contexto e objetivo

A v2 foi desenhada com 13 telas, claras e escuras. Esta spec cobre a **primeira entrega (PR 1)**, a fundação que as outras telas usam: o tema claro/escuro, a navegação por barra inferior, o cabeçalho único e a tela **Início**. Hoje o app abre direto em Cartões, tem três abas em pílula no topo, não tem modo escuro de verdade (existe a classe `.dark` no CSS, mas nada a liga) e cerca de 165 usos de cor em hexadecimal nos `.tsx` impedem que um tema novo chegue às telas.

**Objetivo:** o app abre numa tela Início com o resumo das outras áreas, navega por uma barra inferior de 4 itens, respeita o tema do celular (ou a escolha da pessoa) e permite esconder os valores. O conteúdo das telas Entradas, Cartões, Benefícios e de apoio **não muda**; só ganham o novo casco e as cores com nome. Nenhuma regra de cálculo muda.

## 2. Decisões de produto

| # | Decisão | Motivo |
| - | ------- | ------ |
| D1 | **Barra inferior** com 4 itens, sempre com texto: **Início, Entradas, Cartões, Benefícios**. Item ativo com pílula de 56–64 × 32 px, alvo de toque de 48 px. | Navegação principal ao alcance do polegar; os rótulos evitam ícones ambíguos. |
| D2 | **Início é a rota `/`** (mês corrente) e `/inicio/mes/AAAA-MM` (outro mês). Cartões passa para `/cartoes` (e `/cartoes/mes/AAAA-MM`). As rotas `/mes/AAAA-MM` antigas **redirecionam** para `/cartoes/mes/AAAA-MM`. | Escolha do usuário: quem abre o app cai no Início. O Início em outro mês precisa de endereço próprio (D3, RF-02), no mesmo padrão das outras áreas. |
| D3 | Ao abrir o app com endereço vazio, o app abre o **Início** no mês lembrado (hoje abre Cartões). | Segue o comportamento já existente de lembrar o mês, trocando só o destino. |
| D4 | O botão **Lançar** vira um botão flutuante estendido (ícone "+" e texto), no canto inferior direito, 88 px acima do fim da tela, sobre a barra. "Categorias" e "Resumo" saem do rodapé. | Libera a barra para a navegação. |
| D5 | **Categorias** e **Histórico** passam para o menu **⋯** do cabeçalho, junto com **Aparência**. O "Resumo do mês" continua existindo e passa a ser aberto por um link no topo da aba Entradas. | Rotas e telas continuam as mesmas; muda só o jeito de chegar nelas. |
| D6 | Cabeçalho único nas telas de área: **olho** (esconde valores), **‹ mês ›** e **⋯**. As telas abertas a partir de uma área (listas, lançamentos, categorias, histórico, resumo) mantêm "voltar + título". | Padrão previsível; o mês continua compartilhado entre as áreas. |
| D7 | **Tema**: Auto (segue o celular), Claro, Escuro, escolhido em ⋯ › Aparência e lembrado. Padrão: Auto. | Escolha do usuário (v2 com troca automática). |
| D8 | Todo hexadecimal solto nos `.tsx` é trocado por **cores com nome** que têm valor claro e escuro. Sem isso, o tema escuro deixaria blocos claros no meio das telas. | O tema só funciona se todas as telas usarem as mesmas cores. |
| D9 | **Esconder valores**: o olho troca todo valor em reais por "R$ ••••" em todas as telas, inclusive nos textos para leitor de tela. A escolha é lembrada. | Pedido da referência do Início; privacidade em público. |
| D10 | Início mostra o saldo do mês, o resumo de Entradas (entrou, saiu), a próxima fatura, o saldo do benefício e mini-gráficos (versão v3 com mini-gráficos fica para a parte 2; aqui entram os blocos da V2_01). | Mantém a PR 1 revisável. |
| D11 | **Desfazer** no lugar de confirmar: fica para a parte 2 (mexe em todos os fluxos de exclusão). Aqui os diálogos de confirmação atuais não mudam. | Fora do núcleo de navegação e tema. |

## 3. Requisitos

### 3.1 Requisitos funcionais (RF)

| ID | Requisito |
| -- | --------- |
| RF-01 | A barra inferior aparece nas telas de área (Início, Entradas, Cartões, Benefícios) e nas telas abertas a partir delas, com o item da área ativo e `aria-current="page"`. |
| RF-02 | Tocar num item da barra abre a área **no mês aberto** (mês compartilhado). Tocar no item já ativo volta à tela raiz da área. |
| RF-03 | `/` abre o Início e `/inicio/mes/AAAA-MM` abre o Início em outro mês. `/cartoes` e `/cartoes/mes/AAAA-MM` abrem Cartões. `/mes/AAAA-MM` redireciona para `/cartoes/mes/AAAA-MM`. |
| RF-04 | O Início mostra, no mês aberto: **Saldo** (com anterior e resultado), **Entrou** e **Saiu**, **Próxima fatura** (valor e cartão), **Benefícios** (saldo disponível por benefício) e atalhos para cada área. Cada bloco abre a área correspondente. |
| RF-05 | O Início tem estado vazio com chamada para ação ("Lance sua primeira entrada") e, no primeiro uso, 3 passos: cadastrar um cartão, registrar uma entrada, ver o saldo. |
| RF-06 | O botão flutuante **Lançar** abre as mesmas cinco opções do menu de hoje e os mesmos formulários, no mês aberto, sem sair da tela. |
| RF-07 | O cabeçalho mostra o botão do olho, o seletor de mês (RF de `mes-compartilhado.md`) e o botão ⋯ com **Categorias**, **Histórico** e **Aparência**. |
| RF-08 | **Aparência** oferece Auto, Claro e Escuro. Auto segue `prefers-color-scheme` e muda na hora quando o celular muda. A escolha é lembrada entre aberturas do app. |
| RF-09 | O olho esconde os valores em reais de todas as telas e volta a mostrá-los ao tocar de novo. O estado é lembrado. |
| RF-10 | Em Entradas, um link "Resumo do mês" no topo abre a tela de resumo que o rodapé abria. |
| RF-11 | O seletor de mês do Início respeita o intervalo de Entradas (do mês mais antigo até daqui a 12 meses). |

### 3.2 Regras de negócio (RN)

| ID | Regra |
| -- | ----- |
| RN-01 | Nenhum cálculo muda. O Início só **lê** os dados que as áreas já leem (`useGetMonthCash`, faturas do mês, benefícios do mês). |
| RN-02 | O mês aberto continua sendo o do fim do endereço; sem ele, o mês corrente. Trocar de área mantém o mês. |
| RN-03 | O Início não grava nada e não altera cartões, compras, entradas nem benefícios. |
| RN-04 | Os `data-testid` existentes são mantidos. Novos: `nav-home`, `tab-income`, `tab-cards`, `tab-benefits` (os três últimos passam a ser da barra inferior), `button-hide-values`, `button-header-menu`, `menu-categories`, `menu-history`, `menu-appearance`, `button-quick-add`. |
| RN-05 | Cor nunca é o único sinal: valores continuam com "+" e "−"; estados continuam com ícone ou texto. |
| RN-06 | Texto com no mínimo 14 px (12 px só nos rótulos da barra e nos eixos de gráficos) e alvos de toque de no mínimo 48 px nos itens novos. |
| RN-07 | Se a leitura do tema ou do esconder-valores falhar, o app abre em Auto e com valores à mostra. |
| RN-08 | A escolha de tema e o estado do olho ficam em `Preferences` do Capacitor, fora do estado do app (sem versão e sem migração), como o mês lembrado. |
| RN-09 | O tema é aplicado antes da primeira tela aparecer, para o app não piscar claro e depois escuro. |
| RN-10 | Quem já tem `#/` salvo ou favoritado e esperava Cartões passa a ver o Início. Não há migração de dados. |

## 4. Cenários

```gherkin
# language: pt

Funcionalidade: Fundação da nova versão

  Cenário: Abrir o app
    Dado que o endereço está vazio
    Quando eu abro o app
    Então vejo o Início do mês corrente
    E a barra inferior mostra "Início" como ativo

  Cenário: Abrir o app num mês lembrado
    Dado que eu fechei o app em outro mês
    Quando eu abro o app
    Então vejo o Início nesse mês

  Cenário: Navegar pela barra
    Dado que estou no Início em um mês diferente do atual
    Quando eu toco em "Cartões" na barra inferior
    Então abre a aba Cartões no mesmo mês

  Cenário: Endereço antigo de Cartões
    Quando eu abro "#/mes/2026-08"
    Então sou levado para "#/cartoes/mes/2026-08"

  Cenário: Lançar de qualquer lugar
    Quando eu toco em "Lançar"
    Então vejo as cinco opções de lançamento
    E o formulário escolhido abre no mês aberto

  Cenário: Menu do cabeçalho
    Quando eu toco no botão "⋯"
    Então vejo "Categorias", "Histórico" e "Aparência"

  Cenário: Tema escuro automático
    Dado que a aparência está em "Auto"
    Quando o celular troca para o modo escuro
    Então o app troca para o tema escuro sem recarregar

  Cenário: Escolher o tema
    Quando eu escolho "Escuro" em Aparência
    Então o app fica escuro
    E continua escuro quando eu fecho e abro o app

  Cenário: Esconder valores
    Quando eu toco no olho
    Então todos os valores em reais aparecem como "R$ ••••"
    E tocar de novo mostra os valores

  Cenário: Início vazio
    Dado que não há cartão, entrada nem benefício
    Quando eu abro o Início
    Então vejo os 3 passos de primeiro uso
    E o botão "Lançar" continua disponível

  Cenário: Resumo a partir de Entradas
    Quando eu toco em "Resumo do mês" na aba Entradas
    Então abre a tela de resumo do mês aberto
```

| Requisito | Cenário |
| --------- | ------- |
| RF-01, RF-02, RN-02 | Navegar pela barra |
| RF-03, RN-10 | Abrir o app; Endereço antigo de Cartões |
| D3 | Abrir o app num mês lembrado |
| RF-04, RN-01, RN-03 | Abrir o app (Início); verificação manual |
| RF-05 | Início vazio |
| RF-06 | Lançar de qualquer lugar |
| RF-07 | Menu do cabeçalho |
| RF-08, RN-07, RN-08, RN-09 | Tema escuro automático; Escolher o tema |
| RF-09 | Esconder valores |
| RF-10 | Resumo a partir de Entradas |
| RF-11, RN-06 | Verificação manual no roteiro |

## 5. Dados e contrato

Sem mudança no formato salvo, na camada de dados nem na API. Duas chaves novas em `Preferences`, fora do estado do app:

| Chave | Valores |
| ----- | ------- |
| `controle-cartao:theme` | `auto` (padrão, também quando ausente), `light`, `dark` |
| `controle-cartao:hide-values` | `1` quando escondido; ausente quando visível |

## 6. Interface

- **Cores com nome**, com valor claro e escuro (a base é o que o tema já tem; os escuros vêm do canvas v2): `paper` #f5f1e7 / #0f1f18, `surface` #fbf8f0 / #16291f, `raise` #ffffff / #1d3528, `line` #d9d2c2 / #2b4636, `ink` #1f3a2e / #f1ede2, `ink-soft` #4f6256 / #a9b9ad, `brand` #28513f / #7cc0a1, `on-brand` #fffaf0 / #0c1a13, `tint` #dde7da / #24412f, `alert` #8c3f2f / #f0a090, `chart-in` #2a78d6 / #6aaaf2, `chart-out` #c8501f / #f2905f, `chart-violet` #5b46b0 / #a99cf2, `chart-rose` #a63d5a / #e58aa3, `chart-rose-tint` #e6c3cc / #5a3340, `chart-track` #e6e1d5 / #2b4636.
- Os cerca de 40 hexadecimais que aparecem mais de uma vez nas telas (por exemplo `#e9e3d7`, `#e4ece2`, `#eee9dd`, `#ece7dc`) são trocados pelo nome mais próximo (`tint`, `hover`, `chip`); os que só aparecem uma vez são trocados pelo nome mais próximo também, sem criar cor nova por tela.
- O tema escuro liga a classe `dark` em `<html>` (a variante `dark` já existe em `index.css`). O mapeamento fica nas variáveis de `:root` e `.dark`.
- **Barra inferior:** 72 px de altura mais a área segura; 4 itens iguais; ícone de 22 px; rótulo de 12 px sempre visível; pílula do item ativo na cor `tint`.
- **Botão Lançar:** 56 px de altura, canto inferior direito, 16 px da borda, 88 px acima do fim da tela (sobre a barra); espaço reservado no fim das telas para ele não cobrir o último item.
- **Cabeçalho:** 56 px de altura; olho e ⋯ com alvo de 48 px.
- **Início:** card de Saldo no topo (RF-04), linha Entrou/Saiu, card Próxima fatura, lista de benefícios e atalhos. Medidas exatas: telas V2_01 (clara e escura) do canvas.
- Referência exata de medidas e cores: canvas "Nova versão (v2)".

## 7. Fora de escopo

- Mini-gráficos do Início (v3), Previsões (v4), Sonhos (v5) e Carrinho (v6): têm specs próprias.
- Trocar a confirmação de exclusão por "Desfazer" (D11) e o fluxo de primeiro uso nas outras áreas.
- Reescrever o conteúdo das abas Entradas, Cartões e Benefícios e das telas de apoio além da troca de cores e do cabeçalho.
- Paleta de gráficos com validação de contraste para o escuro (as cores de gráfico escuras só foram conferidas por contraste; a validação completa de daltonismo fica para a parte 2).
- Notificações, tela de widgets e ícone do app.

## 8. Critérios de aceite

- [ ] `npm run typecheck` e `npm run build` passam.
- [ ] Barra inferior de 4 itens nas telas de área; `aria-current` correto.
- [ ] `/` abre o Início; `/cartoes` abre Cartões; `/mes/AAAA-MM` redireciona.
- [ ] O app abre no mês lembrado, no Início.
- [ ] "Lançar" abre as cinco opções e cada formulário, nas quatro áreas.
- [ ] ⋯ abre Categorias, Histórico e Aparência.
- [ ] Tema Auto, Claro e Escuro funcionam e são lembrados; nenhuma tela mostra bloco claro no escuro nem o contrário.
- [ ] O olho esconde e mostra os valores em todas as telas e é lembrado.
- [ ] Nenhum hexadecimal solto sobra nos `.tsx` (verificação por busca).
- [ ] Todos os `data-testid` antigos continuam existindo.
- [ ] `FUNCIONALIDADES.md` (nova seção 32) e `README.md` atualizados.

## 9. Tarefas

1. Cores com nome claro/escuro em `src/index.css` e `src/lib/theme.ts` (leitura, aplicação antes da primeira tela, Auto).
2. Trocar os hexadecimais dos `.tsx` pelas cores com nome (D8), tela a tela.
3. `src/lib/hide-values.ts` e `money()` em `format.ts` respeitando o olho (RF-09).
4. `AppHeader` (olho, mês, ⋯ com Aparência) e adaptar `MonthNav`.
5. Barra inferior no lugar de `AppTabs` e botão flutuante Lançar em `quick-add.tsx`; atualizar `hasFooter`.
6. Rotas: Início em `/`, Cartões em `/cartoes`, redirecionamento de `/mes/...`, `Bootstrap` e `areaPath` (RF-03, D3).
7. Tela `inicio.tsx` com estado vazio e primeiro uso (RF-04, RF-05).
8. Link "Resumo do mês" em Entradas (RF-10).
9. `FUNCIONALIDADES.md`, `README.md`.
10. Rodar `typecheck` e `build`.

## 10. Roteiro de verificação

1. `npm run dev`, abrir `#/` em 390 px de largura, nos temas claro e escuro.
2. Conferir cada cenário da seção 4, inclusive Auto mudando com o tema do celular.
3. Percorrer Início, Entradas (e as listas), Cartões (e compras, histórico), Benefícios (e lançamentos), Categorias e Histórico nos dois temas, procurando blocos claros no escuro.
4. Esconder os valores e repetir o percurso; conferir também gráficos e tabelas para leitor de tela.
5. Abrir `#/mes/2026-08` e `#/cartoes/mes/2026-08`.
6. Fechar e abrir o app com tema Escuro, valores escondidos e um mês diferente do atual.
