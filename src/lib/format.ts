// Formatting and calendar-month helpers shared by the data layer and the pages.

export type MonthKey = string; // 'YYYY-MM'

export const money = (value = 0) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value) || 0);
export const dateLabel = (date?: string) => date ? new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(new Date(`${date.slice(0, 10)}T12:00:00`)).replace('.', '') : '';
export const today = () => new Date().toLocaleDateString('en-CA');

export const currentMonth = (): MonthKey => today().slice(0, 7);
export const monthOf = (date: string): MonthKey => date.slice(0, 7);
export const isMonthKey = (value: string) => /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
export const isFutureMonth = (month: MonthKey) => month > currentMonth();

function monthParts(month: MonthKey) {
  const [year, index] = month.split('-').map(Number);
  return { year, index: index - 1 };
}

export function shiftMonth(month: MonthKey, delta: number): MonthKey {
  const { year, index } = monthParts(month);
  const date = new Date(year, index + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export const firstDayOf = (month: MonthKey) => `${month}-01`;

export function lastDayOf(month: MonthKey) {
  const { year, index } = monthParts(month);
  return `${month}-${String(new Date(year, index + 1, 0).getDate()).padStart(2, '0')}`;
}

// "outubro de 2026"
export function monthLabel(month: MonthKey) {
  const { year, index } = monthParts(month);
  return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date(year, index, 1));
}

// "outubro"
export function monthName(month: MonthKey) {
  const { year, index } = monthParts(month);
  return new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(new Date(year, index, 1));
}

export const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

// Today when it falls inside the month, otherwise the month's last day.
export const defaultDateFor = (month: MonthKey) => monthOf(today()) === month ? today() : lastDayOf(month);

// The current month always lives at "/".
export const monthPath = (month: MonthKey) => month === currentMonth() ? '/' : `/mes/${month}`;

// "1 compra", "2 compras"
export const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;
