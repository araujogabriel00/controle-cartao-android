// Formatting and calendar-month helpers shared by the data layer and the pages.
import { HIDDEN_MONEY, isHidden } from '@/lib/hide-values';

export type MonthKey = string; // 'YYYY-MM'

// RF-09: com o olho fechado todo valor em reais vira "R$ ••••" (specs/redesign-v2-fundacao.md D9).
export const money = (value = 0) => isHidden() ? HIDDEN_MONEY : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value) || 0);
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

// The areas of the app (the bottom bar). The current month always lives at the area's short route
// ("/" for the Início); any other month at "<area>/mes/AAAA-MM" (shared-month RN-02,
// specs/redesign-v2-fundacao.md D2).
export type Area = 'home' | 'cards' | 'income' | 'forecasts' | 'benefits';
const AREA_ROOT: Record<Area, string> = { home: '/inicio', cards: '/cartoes', income: '/entradas', forecasts: '/previsoes', benefits: '/beneficios' };
export const areaPath = (area: Area, month: MonthKey) => (month === currentMonth() ? (area === 'home' ? '/' : AREA_ROOT[area]) : `${AREA_ROOT[area]}/mes/${month}`);
// The area an address belongs to, or null for the screens that are in none (history, categories, all purchases).
export const areaOf = (path: string): Area | null => {
  if (path === '/' || path === '/inicio' || path.startsWith('/inicio/')) return 'home';
  if (path.startsWith('/entradas')) return 'income';
  if (path === '/previsoes' || path.startsWith('/previsoes/')) return 'forecasts';
  if (path.startsWith('/beneficios')) return 'benefits';
  if (path === '/cartoes' || path.startsWith('/cartoes/')) return 'cards';
  return null;
};
// Screens of the Entradas lists (specs/telas-de-entradas.md D10); the month goes at the end like the areas.
export type ListKind = 'entradas' | 'contas-fixas' | 'gastos' | 'cartoes' | 'sonhos';
export const listPath = (kind: ListKind, month: MonthKey) => `/entradas/lista/${kind}${month === currentMonth() ? '' : `/mes/${month}`}`;
// Tela "Resumo do mês" da aba Entradas (specs/redesign-opcao-d-entradas.md D7).
// Telas de Previsões (specs/previsoes.md D1): o dia, o saldo previsto e o formulário (nova e edição).
export const forecastBalancePath = (month: MonthKey) => `/previsoes/saldo/${month}`;
export const forecastDayPath =(date: string) => `/previsoes/dia/${date}`;
export const forecastEditPath = (forecastId: number, month: MonthKey) => `/previsoes/editar/${forecastId}/${month}`;
export const summaryPath = (month: MonthKey) => `/entradas/resumo${month === currentMonth() ? '' : `/mes/${month}`}`;
// Screen with the spends of a benefit in a month: all of them, the ones without category ('sem') or one category.
export const benefitSpendsPath = (benefitId: number, category: number | 'todos' | 'sem', month: MonthKey) =>
  `/beneficios/lancamentos/${benefitId}/${category}${month === currentMonth() ? '' : `/mes/${month}`}`;
export const monthPath = (month: MonthKey) => areaPath('cards', month);
// RN-01: the open month is the one at the end of the address; without it, the current month.
export const monthInPath = (path: string): MonthKey => {
  // The day screen of Previsões (/previsoes/dia/AAAA-MM-DD) belongs to the month of its date.
  const month = path.match(/\/mes\/(\d{4}-\d{2})$/)?.[1] ?? path.match(/^\/previsoes\/dia\/(\d{4}-\d{2})-\d{2}$/)?.[1];
  return month && isMonthKey(month) ? month : currentMonth();
};

// "1 compra", "2 compras"
export const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;
