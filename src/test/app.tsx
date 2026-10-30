// Renderiza o App inteiro numa rota. Store, preferências e QueryClient guardam estado no módulo, então tudo
// (inclusive React e Testing Library, para não haver duas cópias de React) é importado de novo a cada teste.
import { vi } from 'vitest';

export type Store = typeof import('@/data/store');

export async function openApp(hash: string, seed?: (store: Store) => Promise<unknown>) {
  vi.resetModules();
  localStorage.clear();
  const store = await import('@/data/store');
  if (seed) await seed(store);
  window.location.hash = hash;
  const rtl = await import('@testing-library/react');
  const { default: userEvent } = await import('@testing-library/user-event');
  const { default: App } = await import('@/App');
  const { createElement } = await import('react');
  const view = rtl.render(createElement(App));
  return { store, user: userEvent.setup(), ...rtl, ...view };
}

// Espaço não separável do Intl (R$ 1.234,56) vira espaço comum para comparar com texto digitado.
export const plain = (text: string | null | undefined) => (text ?? '').replace(/ /g, ' ');
