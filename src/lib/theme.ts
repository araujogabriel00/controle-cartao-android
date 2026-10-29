import { useSyncExternalStore } from 'react';
import { Preferences } from '@capacitor/preferences';

// Aparência do app (specs/redesign-v2-fundacao.md D7, RF-08): Auto segue o celular, Claro e Escuro
// são escolha da pessoa. Fica em Preferences, fora do estado do app (RN-08), como o mês lembrado.
export type Theme = 'auto' | 'light' | 'dark';
const KEY = 'controle-cartao:theme';
const isTheme = (value: unknown): value is Theme => value === 'auto' || value === 'light' || value === 'dark';

const media = typeof window !== 'undefined' && typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-color-scheme: dark)') : null;
const listeners = new Set<() => void>();
let current: Theme = 'auto';

const isDark = (theme: Theme) => theme === 'dark' || (theme === 'auto' && Boolean(media?.matches));
const apply = () => document.documentElement.classList.toggle('dark', isDark(current));

// RF-08: no modo Auto, o app muda na hora quando o celular troca de tema.
media?.addEventListener('change', apply);

function set(theme: Theme) {
  current = theme;
  apply();
  listeners.forEach((listener) => listener());
}

// RN-07: se a leitura falhar, o app abre em Auto.
export async function readTheme(): Promise<Theme> {
  try {
    const { value } = await Preferences.get({ key: KEY });
    return isTheme(value) ? value : 'auto';
  } catch {
    return 'auto';
  }
}

// RN-09: chamado antes da primeira tela aparecer, para o app não piscar claro e depois escuro.
export async function loadTheme() {
  set(await readTheme());
}

export function chooseTheme(theme: Theme) {
  set(theme);
  const write = theme === 'auto' ? Preferences.remove({ key: KEY }) : Preferences.set({ key: KEY, value: theme });
  void write.catch(() => undefined);
}

// Até a leitura terminar, o tema do celular já vale (evita um clarão no escuro).
apply();

export function useTheme(): Theme {
  return useSyncExternalStore((listener) => { listeners.add(listener); return () => { listeners.delete(listener); }; }, () => current);
}
