import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';

// jsdom não implementa a rolagem que as telas pedem ao abrir.
window.scrollTo = () => {};

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
