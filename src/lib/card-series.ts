// Pure helpers that shape the data of the Cartões charts (specs/redesign-opcao-d-cartoes.md RN-02).
import { currentMonth, shiftMonth, type MonthKey } from '@/lib/format';

// 4 round marks, the last one at or just above `max` (1, 1.5, 2, 2.5, 3, 4, 5 x 10^n).
export function niceScale(max: number, marks = 4) {
  if (!(max > 0)) return { top: marks, ticks: Array.from({ length: marks }, (_, i) => i + 1) };
  const raw = max / marks;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 1.5, 2, 2.5, 3, 4, 5, 10].map((n) => n * magnitude).find((n) => n >= raw - 1e-9) ?? raw;
  return { top: step * marks, ticks: Array.from({ length: marks }, (_, i) => step * (i + 1)) };
}

export type InvoiceColumn = { month: MonthKey; amount: number; planned: boolean };

// Seven months from the open one: up to the current month "Lançada" (history), after it "Prevista" (RN-03).
export function invoiceColumns(
  openMonth: MonthKey, history: { month: MonthKey; invoiceAmount: number }[], future: { month: MonthKey; amount: number }[], count = 7,
): InvoiceColumn[] {
  const now = currentMonth();
  return Array.from({ length: count }, (_, i) => {
    const month = shiftMonth(openMonth, i);
    const planned = month > now;
    const amount = planned ? future.find((item) => item.month === month)?.amount : history.find((item) => item.month === month)?.invoiceAmount;
    return { month, amount: amount ?? 0, planned };
  });
}

export type CategoryRow = { key: string; label: string; amount: number; percent: number; other?: boolean };

// At most `limit` categories; the rest add up in "Outras" (RF-05).
export function topCategories(items: { key: string; label: string; amount: number; percent: number }[], limit = 6): CategoryRow[] {
  if (items.length <= limit) return items;
  const rest = items.slice(limit);
  return [...items.slice(0, limit), {
    key: 'outras', label: 'Outras', other: true,
    amount: Math.round(rest.reduce((sum, item) => sum + item.amount, 0) * 100) / 100,
    percent: rest.reduce((sum, item) => sum + item.percent, 0),
  }];
}
