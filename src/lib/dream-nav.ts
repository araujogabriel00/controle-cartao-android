// As telas de Sonhos formam uma pilha: a lista abre a caixinha, o formulário, o plano e a conquista. Sair de uma delas
// (voltar, ou terminar de criar, salvar, excluir ou fechar) desempilha com `history.back()`; empilhar de novo a lista
// deixaria entradas duplicadas e o "Voltar" da lista reabriria o formulário em vez de sair de Sonhos.
// Sem histórico (endereço aberto direto), vai para `fallback` no lugar da entrada atual.
export function leaveDreamScreen(navigate: (to: string, options?: { replace?: boolean }) => void, fallback: string) {
  if (window.history.length > 1) window.history.back();
  else navigate(fallback, { replace: true });
}
