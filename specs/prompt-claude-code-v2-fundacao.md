# Prompt para o Claude Code — Nova versão (v2), parte 1: fundação

Cole o texto abaixo no Claude Code, na raiz do repositório `controle-cartao-android`.
Antes, salve o arquivo `redesign-v2-fundacao.md` (a spec aprovada) em `specs/`.

---

Implemente a spec `specs/redesign-v2-fundacao.md`, já **aprovada** (Status: Proposta → Implementada ao final). Siga o `CLAUDE.md`.

Comece a partir da `main` atualizada, em uma branch `feat/redesign-v2-fundacao`.

## Como trabalhar

1. Leia a spec inteira e o `CLAUDE.md`. Leia também `src/App.tsx`, `src/components/{app-tabs,month-nav,quick-add}.tsx`, `src/lib/{format,footer,last-month}.ts` e `src/index.css`.
2. Siga as **tarefas da seção 9, na ordem**, e faça um commit por tarefa (ou por grupo pequeno de tarefas), em português, no estilo dos commits do repositório.
3. Não mude regras de cálculo, `src/data/**` nem a API. Mantenha todos os `data-testid` existentes (RN-04).
4. Rode `npm run typecheck` e `npm run build` ao fim de cada tarefa. Corrija antes de seguir.
5. Ao terminar: Status → `Implementada`; marque na seção 8 **só** o que você verificou de fato (pendências ficam desmarcadas, com explicação); acrescente a seção 32 em `FUNCIONALIDADES.md` (com entrada no Sumário e cenários da seção 4) e ajuste as seções 19, 20, 25, 26 e 29 onde o rodapé, as abas ou a rota `/` mudaram; atualize o `README.md`.
6. Abra a PR para a `main`.

## Pontos de atenção

- **Tema (D7, D8, RN-09):** a variante `dark` já existe em `index.css` (`&:is(.dark *)`). Defina as cores com nome (seção 6) como variáveis de `:root` e `.dark`, e registre-as no `@theme`. Aplique a classe `dark` em `<html>` **antes da primeira renderização** (leia `Preferences` no `Bootstrap` ou em `main.tsx`, e use `matchMedia('(prefers-color-scheme: dark)')` no modo Auto, com listener para mudar na hora).
- **Hexadecimais (D8):** há cerca de 165 usos de `[#xxxxxx]` nos `.tsx`. Troque por classes com nome (`bg-tint`, `hover:bg-hover`, etc.) mapeando cada hex para a cor mais próxima. Ao fim, `grep -rnE "#[0-9a-fA-F]{6}" src --include=*.tsx` não deve achar nada (exceto cores de gráfico que já usem variáveis). Cores de gráfico (`chart-in`, `chart-out`, …) devem ler variáveis CSS para trocar no escuro; confira `src/components/charts/*`.
- **Esconder valores (D9, RF-09):** `money()` em `format.ts` é função pura usada em todo lugar. Implemente um estado global simples (`src/lib/hide-values.ts` com `useSyncExternalStore`) e faça a árvore reagir na troca (por exemplo, usando o valor como `key` do `<Router/>`), de modo que `money()` devolva `R$ ••••` quando escondido. Cuide também dos `aria-label` e das tabelas `sr-only` dos gráficos.
- **Rotas (D2, D3, RF-03):** `/` vira Início; Cartões vai para `/cartoes` e `/cartoes/mes/:month`; `/mes/:month` redireciona. Ajuste `areaPath`/`AREA_ROOT`, `monthPath`, `MonthRoute`, `Bootstrap` (abrir o Início no mês lembrado) e `hasFooter`. Procure todos os usos de `'/'` e `/mes/` com `grep` e corrija (botões "voltar", redirecionamentos, `AppTabs`).
- **Barra inferior e Lançar (D1, D4):** troque `AppTabs` por uma barra fixa de 4 itens (Início, Entradas, Cartões, Benefícios) e transforme o botão Lançar em botão flutuante estendido, sem perder o menu de 5 opções nem os formulários. Remova "Resumo" e "Categorias" do rodapé; "Categorias" e "Histórico" vão para o menu ⋯ do cabeçalho; "Resumo do mês" vira link no topo de Entradas. Reserve espaço no fim das telas (hoje `h-28`).
- **Cabeçalho (D6):** `AppHeader` com olho, `MonthNav` e ⋯ (menu com Categorias, Histórico, Aparência Auto/Claro/Escuro). Telas abertas a partir de uma área mantêm "voltar + título".
- **Início (RF-04, RF-05):** `src/pages/inicio.tsx`, só leitura (`useGetMonthCash`, faturas do mês, benefícios do mês). Referência visual: telas V2_01 (clara/escura) do canvas. Inclua estado vazio e os 3 passos do primeiro uso.
- Texto de no mínimo 14 px e alvos de 48 px nos itens novos (RN-06). Nada pode depender só de cor (RN-05).

## Verificação

Siga o roteiro da seção 10 da spec, em 390 px de largura, nos dois temas. Se algo da spec não fizer sentido com o código atual, **pare e me pergunte**, em vez de decidir sozinho; mudanças de comportamento entram primeiro na spec.
