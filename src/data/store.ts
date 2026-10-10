import { Preferences } from '@capacitor/preferences';
import { currentMonth, isFutureMonth, isMonthKey, monthLabel, monthOf, type MonthKey } from '@/lib/format';

const STORAGE_KEY = 'controle-cartao:v1';

export type { MonthKey } from '@/lib/format';
export type StoredCard = { id: number; name: string; limitAmount: number };
export type StoredMonth = { month: MonthKey; limitAmount: number };
export type StoredCategory = { id: number; month: MonthKey; name: string; amount: number; isClosed: boolean };
export type StoredMovement = { id: number; categoryId: number; description: string; amount: number; date: string };

type State = {
  version: 2;
  nextId: number;
  card: StoredCard | null;
  months: StoredMonth[];
  categories: StoredCategory[];
  movements: StoredMovement[];
};

type StateV1 = {
  version: 1;
  nextId: number;
  card: StoredCard | null;
  categories: Omit<StoredCategory, 'month'>[];
  movements: StoredMovement[];
};

export type Card = StoredCard & { usedAmount: number; availableAmount: number; percentUsed: number };
export type Category = StoredCategory & { usedAmount: number; availableAmount: number; percentUsed: number };
export type Movement = StoredMovement;
export type Overview = { openBudgetAmount: number; closedSpentAmount: number; openCategoryCount: number };
export type MonthSummary = {
  month: MonthKey;
  limitAmount: number;
  spentAmount: number;
  plannedAmount: number;
  committedAmount: number;
  percentUsed: number;
  categoryCount: number;
  movementCount: number;
};
export type MonthStatus = { needsStart: boolean; previousMonth: MonthKey | null; previousHasCategories: boolean };

export type CardInput = { name: string; limitAmount: number };
export type CategoryInput = { name: string; amount: number };
export type MovementInput = { description: string; amount: number; date: string };

const emptyState = (): State => ({ version: 2, nextId: 1, card: null, months: [], categories: [], movements: [] });

// Everything saved before the monthly history existed lands in the month the
// app is first opened after the update. Movement dates are kept as they were.
function migrateV1(old: StateV1): State {
  const month = currentMonth();
  return {
    version: 2,
    nextId: old.nextId,
    card: old.card,
    months: old.card ? [{ month, limitAmount: old.card.limitAmount }] : [],
    categories: old.categories.map((c) => ({ ...c, month })),
    movements: old.movements,
  };
}

let statePromise: Promise<State> | null = null;
let writeQueue: Promise<void> = Promise.resolve();

function persist(state: State) {
  const value = JSON.stringify(state);
  const write = writeQueue.then(() => Preferences.set({ key: STORAGE_KEY, value }));
  writeQueue = write.catch(() => undefined);
  return write;
}

function load(): Promise<State> {
  statePromise ??= Preferences.get({ key: STORAGE_KEY }).then(({ value }) => {
    if (!value) return emptyState();
    try {
      const parsed = JSON.parse(value) as State | StateV1;
      if (parsed?.version === 2) return parsed;
      if (parsed?.version === 1) {
        const migrated = migrateV1(parsed);
        // Saved right away so the data stays in this month even if the next
        // change only happens in a later month.
        void persist(migrated).catch(() => undefined);
        return migrated;
      }
      return emptyState();
    } catch {
      return emptyState();
    }
  });
  return statePromise;
}

// Applies a change to the in-memory state and persists it. Writes are queued
// so they reach storage in the same order they were made.
async function mutate<T>(change: (state: State) => T): Promise<T> {
  const state = await load();
  const draft = structuredClone(state);
  const result = change(draft);
  await persist(draft);
  Object.assign(state, draft);
  return result;
}

const cents = (value: number) => Math.round(value * 100) / 100;
const percent = (used: number, total: number) => (total > 0 ? (used / total) * 100 : 0);

const categoriesOf = (state: State, month: MonthKey) => state.categories.filter((c) => c.month === month);
const findMonth = (state: State, month: MonthKey) => state.months.find((m) => m.month === month);

function categoryUsed(state: State, categoryId: number) {
  return cents(state.movements.filter((m) => m.categoryId === categoryId).reduce((sum, m) => sum + m.amount, 0));
}

function toCategory(state: State, category: StoredCategory): Category {
  const usedAmount = categoryUsed(state, category.id);
  return { ...category, usedAmount, availableAmount: cents(category.amount - usedAmount), percentUsed: percent(usedAmount, category.amount) };
}

function overviewOf(state: State, month: MonthKey): Overview {
  const categories = categoriesOf(state, month);
  const open = categories.filter((c) => !c.isClosed);
  const closed = categories.filter((c) => c.isClosed);
  return {
    openBudgetAmount: cents(open.reduce((sum, c) => sum + c.amount, 0)),
    closedSpentAmount: cents(closed.reduce((sum, c) => sum + categoryUsed(state, c.id), 0)),
    openCategoryCount: open.length,
  };
}

// A month that was never started borrows the card's current limit.
function monthLimit(state: State, month: MonthKey) {
  return findMonth(state, month)?.limitAmount ?? state.card?.limitAmount ?? 0;
}

function summaryOf(state: State, month: MonthKey): MonthSummary {
  const categories = categoriesOf(state, month);
  const ids = new Set(categories.map((c) => c.id));
  const movements = state.movements.filter((m) => ids.has(m.categoryId));
  const { openBudgetAmount, closedSpentAmount } = overviewOf(state, month);
  const limitAmount = monthLimit(state, month);
  const committedAmount = cents(openBudgetAmount + closedSpentAmount);
  return {
    month,
    limitAmount,
    spentAmount: cents(movements.reduce((sum, m) => sum + m.amount, 0)),
    plannedAmount: openBudgetAmount,
    committedAmount,
    percentUsed: percent(committedAmount, limitAmount),
    categoryCount: categories.length,
    movementCount: movements.length,
  };
}

// --- validation -------------------------------------------------------------

function requireText(value: unknown, field: string, max: number): string {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!text) throw new Error(`${field} é obrigatório.`);
  if (text.length > max) throw new Error(`${field} deve ter no máximo ${max} caracteres.`);
  return text;
}

function requireAmount(value: unknown, field: string): number {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0.01) throw new Error(`${field} deve ser de pelo menos R$ 0,01.`);
  return cents(amount);
}

function requireDate(value: unknown): string {
  const date = typeof value === 'string' ? value.slice(0, 10) : '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(`${date}T12:00:00`))) throw new Error('Data inválida.');
  return date;
}

function requireMonth(value: unknown): MonthKey {
  const month = typeof value === 'string' ? value : '';
  if (!isMonthKey(month)) throw new Error('Mês inválido.');
  if (isFutureMonth(month)) throw new Error('Não é possível usar um mês futuro.');
  return month;
}

// RN-01: a movement's date must fall inside its category's month.
function requireDateInMonth(date: string, month: MonthKey) {
  if (monthOf(date) !== month) throw new Error(`A data deve estar dentro de ${monthLabel(month)}.`);
  return date;
}

function findCategory(state: State, categoryId: number) {
  const category = state.categories.find((c) => c.id === categoryId);
  if (!category) throw new Error('Categoria não encontrada.');
  return category;
}

function findMovement(state: State, movementId: number) {
  const movement = state.movements.find((m) => m.id === movementId);
  if (!movement) throw new Error('Lançamento não encontrado.');
  return movement;
}

function requireOpen(category: StoredCategory) {
  if (category.isClosed) throw new Error('A categoria está fechada.');
}

// Starts the month with the card's current limit, if it wasn't started yet.
function ensureMonth(state: State, month: MonthKey) {
  if (findMonth(state, month)) return false;
  if (!state.card) throw new Error('Cadastre um cartão antes de começar um mês.');
  state.months.push({ month, limitAmount: state.card.limitAmount });
  return true;
}

// --- reads ------------------------------------------------------------------

export async function getCard(month: MonthKey): Promise<Card | null> {
  const state = await load();
  if (!state.card) return null;
  const { committedAmount, limitAmount, percentUsed } = summaryOf(state, month);
  return { ...state.card, limitAmount, usedAmount: committedAmount, availableAmount: cents(limitAmount - committedAmount), percentUsed };
}

export async function getOverview(month: MonthKey): Promise<Overview> {
  return overviewOf(await load(), month);
}

export async function getCategories(month: MonthKey): Promise<Category[]> {
  const state = await load();
  return categoriesOf(state, month).map((c) => toCategory(state, c));
}

export async function getMovements(categoryId: number): Promise<Movement[]> {
  const state = await load();
  return state.movements
    .filter((m) => m.categoryId === categoryId)
    .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
}

export async function getMonthHistory(): Promise<MonthSummary[]> {
  const state = await load();
  return state.months
    .map((m) => summaryOf(state, m.month))
    .sort((a, b) => b.month.localeCompare(a.month));
}

export async function getMonthStatus(): Promise<MonthStatus> {
  const state = await load();
  const current = currentMonth();
  const previousMonth = state.months
    .map((m) => m.month)
    .filter((m) => m < current)
    .sort()
    .at(-1) ?? null;
  return {
    needsStart: Boolean(state.card) && !findMonth(state, current),
    previousMonth,
    previousHasCategories: previousMonth !== null && categoriesOf(state, previousMonth).length > 0,
  };
}

// --- months -----------------------------------------------------------------

// Copies names and budgets only: the new categories start open and empty.
export function startMonth(month: MonthKey, copyFrom: MonthKey | null) {
  return mutate((state) => {
    const target = requireMonth(month);
    if (!ensureMonth(state, target)) return;
    if (!copyFrom) return;
    for (const source of categoriesOf(state, requireMonth(copyFrom))) {
      state.categories.push({ id: state.nextId++, month: target, name: source.name, amount: source.amount, isClosed: false });
    }
  });
}

// --- card -------------------------------------------------------------------

export function saveCard(input: CardInput, mode: 'create' | 'update') {
  return mutate((state) => {
    const name = requireText(input.name, 'Nome do cartão', 120);
    const limitAmount = requireAmount(input.limitAmount, 'Limite total');
    if (mode === 'create') {
      if (state.card) throw new Error('Já existe um cartão cadastrado.');
      state.card = { id: state.nextId++, name, limitAmount };
      ensureMonth(state, currentMonth());
    } else {
      if (!state.card) throw new Error('Nenhum cartão cadastrado.');
      state.card = { ...state.card, name, limitAmount };
      // Past months keep the limit they had.
      const current = findMonth(state, currentMonth());
      if (current) current.limitAmount = limitAmount;
    }
    return state.card;
  });
}

// Removing the card wipes every month, category and movement with it.
export function deleteCard() {
  return mutate((state) => {
    state.card = null;
    state.months = [];
    state.categories = [];
    state.movements = [];
  });
}

// --- categories -------------------------------------------------------------

export function createCategory(month: MonthKey, input: CategoryInput) {
  return mutate((state) => {
    if (!state.card) throw new Error('Cadastre um cartão antes de criar categorias.');
    const target = requireMonth(month);
    const category = { id: state.nextId++, month: target, name: requireText(input.name, 'Nome da categoria', 120), amount: requireAmount(input.amount, 'Orçamento planejado'), isClosed: false };
    ensureMonth(state, target);
    state.categories.push(category);
    return category;
  });
}

export function updateCategory(categoryId: number, input: CategoryInput) {
  return mutate((state) => {
    const category = findCategory(state, categoryId);
    category.name = requireText(input.name, 'Nome da categoria', 120);
    category.amount = requireAmount(input.amount, 'Orçamento planejado');
    return category;
  });
}

export function setCategoryClosed(categoryId: number, isClosed: boolean) {
  return mutate((state) => {
    const category = findCategory(state, categoryId);
    category.isClosed = Boolean(isClosed);
    return category;
  });
}

export function deleteCategory(categoryId: number) {
  return mutate((state) => {
    findCategory(state, categoryId);
    state.categories = state.categories.filter((c) => c.id !== categoryId);
    state.movements = state.movements.filter((m) => m.categoryId !== categoryId);
  });
}

// --- movements --------------------------------------------------------------

export function createMovement(categoryId: number, input: MovementInput) {
  return mutate((state) => {
    const category = findCategory(state, categoryId);
    requireOpen(category);
    const movement = { id: state.nextId++, categoryId, description: requireText(input.description, 'Descrição', 200), amount: requireAmount(input.amount, 'Valor'), date: requireDateInMonth(requireDate(input.date), category.month) };
    state.movements.push(movement);
    return movement;
  });
}

export function updateMovement(movementId: number, input: MovementInput) {
  return mutate((state) => {
    const movement = findMovement(state, movementId);
    const category = findCategory(state, movement.categoryId);
    requireOpen(category);
    movement.description = requireText(input.description, 'Descrição', 200);
    movement.amount = requireAmount(input.amount, 'Valor');
    movement.date = requireDateInMonth(requireDate(input.date), category.month);
    return movement;
  });
}

export function deleteMovement(movementId: number) {
  return mutate((state) => {
    const movement = findMovement(state, movementId);
    requireOpen(findCategory(state, movement.categoryId));
    state.movements = state.movements.filter((m) => m.id !== movementId);
  });
}
