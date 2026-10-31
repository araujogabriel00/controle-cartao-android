import { useSyncExternalStore } from 'react';
import type { CartCheckoutResult, CartFormInput } from '@workspace/api-client-react';

// O rascunho do pagamento (specs/carrinho.md RN-03): a forma, as parcelas e a divisão escolhidas durante o fechamento.
// Vive só na memória: recarregar o app em qualquer passo leva de volta a /carrinho, com os produtos intactos.
export type CartMode = 'single' | 'split';
type Draft = {
  mode: CartMode;
  forms: CartFormInput[];
  // Motivo de a divisão ter deixado de valer (RN-10), mostrado em "Dividir".
  warning: string | null;
  // O que o fechamento criou, para a tela "Compra registrada".
  result: CartCheckoutResult | null;
};

const EMPTY: Draft = { mode: 'single', forms: [], warning: null, result: null };
let draft: Draft = EMPTY;
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
const emit = () => listeners.forEach((listener) => listener());

export const setCartDraft = (patch: Partial<Draft>) => { draft = { ...draft, ...patch }; emit(); };
export const resetCartDraft = () => { draft = EMPTY; emit(); };
export const useCartDraft = () => useSyncExternalStore(subscribe, () => draft);

// Chave estável de uma forma, para testId e para comparar.
export const draftKey = (form: CartFormInput) => (form.kind === 'balance' ? 'balance' : `${form.kind}-${form.id}`);
