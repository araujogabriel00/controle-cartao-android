import { useSyncExternalStore } from 'react';
import { Preferences } from '@capacitor/preferences';

// Marca do "Está certo" do aviso do Início (specs/previsoes.md D12, RN-11): a data (AAAA-MM-DD) em que a pessoa dispensou o
// aviso. Fica em Preferences, fora do estado do app (sem versão e sem migração), como o tema e o olho.
const KEY = 'controle-cartao:forecast-ack';

const listeners = new Set<() => void>();
let ack: string | null = null;

// RN-11: se a marca não puder ser lida, o aviso aparece.
export async function loadForecastAck() {
  try {
    const { value } = await Preferences.get({ key: KEY });
    ack = value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
  } catch {
    ack = null;
  }
  listeners.forEach((listener) => listener());
}

export function saveForecastAck(date: string) {
  ack = date;
  listeners.forEach((listener) => listener());
  void Preferences.set({ key: KEY, value: date }).catch(() => undefined);
}

export function useForecastAck(): string | null {
  return useSyncExternalStore((listener) => { listeners.add(listener); return () => { listeners.delete(listener); }; }, () => ack);
}
