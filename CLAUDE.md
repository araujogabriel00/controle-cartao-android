# Controle do Cartão — Android

Visão geral, regras de cálculo e comandos de build estão no [README](README.md).

## Processo para novas funcionalidades (spec-driven development)

Toda nova funcionalidade segue estes passos, nesta ordem:

1. **Criar uma spec nova** em `specs/<nome-da-funcionalidade>.md` (kebab-case, em português) **antes de escrever código**. Use [`specs/historico-mensal.md`](specs/historico-mensal.md) como modelo. A spec deve ter:
   - cabeçalho com Status (`Proposta` → `Implementada`), data de criação e escopo;
   - contexto e objetivo, glossário e decisões de produto (com o motivo de cada uma);
   - requisitos funcionais (RF-xx) e regras de negócio (RN-xx);
   - cenários BDD em Gherkin (`# language: pt`) e uma matriz ligando cada RF/RN a pelo menos um cenário;
   - modelo de dados e migração (se o formato salvo mudar), contrato da camada de dados e interface;
   - fora de escopo, critérios de aceite (checklist), tarefas em ordem de implementação e roteiro de verificação.
2. **Aprovar a spec com o usuário** antes de implementar. Mudanças de comportamento entram primeiro na spec e só depois no código.
3. **Implementar seguindo as tarefas da spec.** Ao terminar, mudar o Status para `Implementada` e marcar só os critérios de aceite que foram de fato verificados; o que ficou pendente continua desmarcado, com a explicação.
4. **Atualizar o [`FUNCIONALIDADES.md`](FUNCIONALIDADES.md)** no mesmo PR:
   - adicionar uma seção para a funcionalidade nova (com entrada no Sumário), com os cenários principais em Gherkin e um link para a spec;
   - ajustar os cenários das seções existentes que mudaram de comportamento, para que o arquivo continue descrevendo o app como ele é.
5. Atualizar o README quando a funcionalidade mudar regras de cálculo, estrutura de pastas ou comandos.

Uma correção de bug ou ajuste pequeno que não muda o comportamento descrito não precisa de spec nova. Se mudar algum comportamento, atualize a spec correspondente e o `FUNCIONALIDADES.md`.

## Verificação

- `npm run typecheck` e `npm run build` precisam passar.
- Não há suíte de testes; confira os cenários da spec no navegador (`npm run dev`) e, para regras de dados, exercitando `src/data/store.ts`.
