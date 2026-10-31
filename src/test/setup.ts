import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';

// jsdom não implementa a rolagem que as telas pedem ao abrir.
window.scrollTo = () => {};

// jsdom não tem matchMedia. Nos testes o aparelho "pede menos movimento": as animações dos Sonhos (contagem dos
// números, anel, caixinha) aparecem já no estado final, sem esperar o tempo da animação.
window.matchMedia = ((query: string) => ({
  matches: query.includes('prefers-reduced-motion'), media: query, onchange: null,
  addEventListener: () => {}, removeEventListener: () => {}, addListener: () => {}, removeListener: () => {}, dispatchEvent: () => false,
})) as typeof window.matchMedia;

// Tela de teste: Galaxy S25 (1080 x 2340 px, 19,5:9, densidade 3) = viewport CSS de 360 x 780.
export const VIEWPORT = { width: 360, height: 780, pixelRatio: 3 };
Object.defineProperty(window, 'innerWidth', { configurable: true, value: VIEWPORT.width });
Object.defineProperty(window, 'innerHeight', { configurable: true, value: VIEWPORT.height });
Object.defineProperty(window, 'devicePixelRatio', { configurable: true, value: VIEWPORT.pixelRatio });

// Hora local fixa: 15/10/2026. Só o Date é falso, para não travar timers do react-query e do userEvent.
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-10-15T12:00:00'));
  window.location.hash = '#/';
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.resetModules();
  vi.useRealTimers();
});
