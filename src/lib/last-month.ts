import { useEffect } from 'react';
import { Preferences } from '@capacitor/preferences';
import { currentMonth, isMonthKey, type MonthKey } from '@/lib/format';

// The last month opened, kept apart from the app's state (no version, no migration).
// Only a month other than the current one is remembered (shared-month D7, D8).
const KEY = 'controle-cartao:last-month';

// RN-12: if the memory can't be read, the app goes on without it.
export async function readLastMonth(): Promise<MonthKey | null> {
  try {
    const { value } = await Preferences.get({ key: KEY });
    return value && isMonthKey(value) ? value : null;
  } catch {
    return null;
  }
}

export function saveLastMonth(month: MonthKey) {
  const write = month === currentMonth() ? Preferences.remove({ key: KEY }) : Preferences.set({ key: KEY, value: month });
  void write.catch(() => undefined);
}

// RN-09: every area calls this with the month it shows.
export function useRememberMonth(month: MonthKey) {
  useEffect(() => saveLastMonth(month), [month]);
}
