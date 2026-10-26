# Prompt para o Claude Code local — Opção D

Cole o texto abaixo no Claude Code, na raiz do repositório `controle-cartao-android`. Antes, copie os 5 arquivos `redesign-opcao-d-*.md` para a pasta `specs/`.

---

Leia `CLAUDE.md` e as specs `specs/redesign-opcao-d-entradas.md`, `specs/redesign-opcao-d-cartoes.md`, `specs/redesign-opcao-d-beneficios.md` e `specs/redesign-opcao-d-telas-de-apoio.md`.

Contexto: vamos implementar a "Opção D" (gráficos) do redesign. Na tela de Entradas a escolhida é a variante D2 (barras divergentes) com a tela "Resumo do mês" aberta por um botão no rodapé. As specs substituem `redesign-cartoes.md` e `redesign-beneficios.md`; a PR #25 (redesign de Entradas) já está aberta e deve ser integrada ou substituída antes de começar, conforme eu decidir.

Faça nesta ordem, **uma branch e uma PR por spec**:
1. Entradas (cria os tokens `chart-*`, `src/components/charts/` e o botão "Resumo" do rodapé).
2. Cartões.
3. Benefícios.
4. Telas de apoio.

Para cada spec:
- Antes de codar, me liste os "Pontos a confirmar" e espere minhas respostas (ou proponha o padrão e siga se eu disser "pode seguir").
- Mantenha regras de negócio, rotas e `data-testid`; os textos do mock são ilustrativos, prevalecem os do código.
- Gráficos: `aria-label` + tabela `sr-only`, sem botão "Tabela"; cores só dos tokens `chart-*`.
- Atualize `FUNCIONALIDADES.md` e `README.md`, marque a spec como "Implementada" e rode `npm run typecheck` e `npm run build` até passarem.
- Abra a PR descrevendo o que mudou e como testei.
