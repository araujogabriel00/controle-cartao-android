import { useSyncExternalStore } from 'react';
import { Preferences } from '@capacitor/preferences';

// "Esconder valores" (specs/redesign-v2-fundacao.md D9, RF-09): money() devolve R$ •••• enquanto o olho
// está fechado. Fica em Preferences, fora do estado do app (RN-08).
const KEY = 'controle-cartao:hide-values';
export const HIDDEN_MONEY = 'R$ ••••';

const listeners = new Set<() => void>();
let hidden = false;

export const isHidden = () => hidden;

function set(value: boolean) {
  if (value === hidden) return;
  hidden = value;
  listeners.forEach((listener) => listener());
}

// RN-07: se a leitura falhar, os valores ficam à mostra.
export async function loadHideValues() {
  try {
    const { value } = await Preferences.get({ key: KEY });
    set(value === '1');
  } catch {
    set(false);
  }
}

export function toggleHideValues() {
  const next = !hidden;
  set(next);
  const write = next ? Preferences.set({ key: KEY, value: '1' }) : Preferences.remove({ key: KEY });
  void write.catch(() => undefined);
}

export function useHideValues(): boolean {
  return useSyncExternalStore((listener) => { listeners.add(listener); return () => { listeners.delete(listener); }; }, () => hidden);
}
