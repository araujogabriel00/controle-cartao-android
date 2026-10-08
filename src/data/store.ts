import { Preferences } from '@capacitor/preferences';

const STORAGE_KEY = 'controle-cartao:v1';

export type StoredCard = { id: number; name: string; limitAmount: number };
export type StoredCategory = { id: number; name: string; amount: number; isClosed: boolean };
export type StoredMovement = { id: number; categoryId: number; description: string; amount: number; date: string };

type State = {
  version: 1;
  nextId: number;
  card: StoredCard | null;
  categories: StoredCategory[];
  movements: StoredMovement[];
};

export type Card = StoredCard & { usedAmount: number; availableAmount: number; percentUsed: number };
export type Category = StoredCategory & { usedAmount: number; availableAmount: number; percentUsed: number };
export type Movement = StoredMovement;
export type Overview = { openBudgetAmount: number; closedSpentAmount: number; openCategoryCount: number };

export type CardInput = { name: string; limitAmount: number };
export type CategoryInput = { name: string; amount: number };
export type MovementInput = { description: string; amount: number; date: string };

const emptyState = (): State => ({ version: 1, nextId: 1, card: null, categories: [], movements: [] });

let statePromise: Promise<State> | null = null;
let writeQueue: Promise<void> = Promise.resolve();

function load(): Promise<State> {
  statePromise ??= Preferences.get({ key: STORAGE_KEY }).then(({ value }) => {
    if (!value) return emptyState();
    try {
      const parsed = JSON.parse(value) as State;
      return parsed?.version === 1 ? parsed : emptyState();
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
  const value = JSON.stringify(draft);
  const write = writeQueue.then(() => Preferences.set({ key: STORAGE_KEY, value }));
  writeQueue = write.catch(() => undefined);
  await write;
  Object.assign(state, draft);
  return result;
}

const cents = (value: number) => Math.round(value * 100) / 100;
const percent = (used: number, total: number) => (total > 0 ? (used / total) * 100 : 0);

function categoryUsed(state: State, categoryId: number) {
  return cents(state.movements.filter((m) => m.categoryId === categoryId).reduce((sum, m) => sum + m.amount, 0));
}

function toCategory(state: State, category: StoredCategory): Category {
  const usedAmount = categoryUsed(state, category.id);
  return { ...category, usedAmount, availableAmount: cents(category.amount - usedAmount), percentUsed: percent(usedAmount, category.amount) };
}

function overviewOf(state: State): Overview {
  const open = state.categories.filter((c) => !c.isClosed);
  const closed = state.categories.filter((c) => c.isClosed);
  return {
    openBudgetAmount: cents(open.reduce((sum, c) => sum + c.amount, 0)),
    closedSpentAmount: cents(closed.reduce((sum, c) => sum + categoryUsed(state, c.id), 0)),
    openCategoryCount: open.length,
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

// --- reads ------------------------------------------------------------------

export async function getCard(): Promise<Card | null> {
  const state = await load();
  if (!state.card) return null;
  const { openBudgetAmount, closedSpentAmount } = overviewOf(state);
  const usedAmount = cents(openBudgetAmount + closedSpentAmount);
  return { ...state.card, usedAmount, availableAmount: cents(state.card.limitAmount - usedAmount), percentUsed: percent(usedAmount, state.card.limitAmount) };
}

export async function getOverview(): Promise<Overview> {
  return overviewOf(await load());
}

export async function getCategories(): Promise<Category[]> {
  const state = await load();
  return state.categories.map((c) => toCategory(state, c));
}

export async function getMovements(categoryId: number): Promise<Movement[]> {
  const state = await load();
  return state.movements
    .filter((m) => m.categoryId === categoryId)
    .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
}

// --- card -------------------------------------------------------------------

export function saveCard(input: CardInput, mode: 'create' | 'update') {
  return mutate((state) => {
    const name = requireText(input.name, 'Nome do cartão', 120);
    const limitAmount = requireAmount(input.limitAmount, 'Limite total');
    if (mode === 'create') {
      if (state.card) throw new Error('Já existe um cartão cadastrado.');
      state.card = { id: state.nextId++, name, limitAmount };
    } else {
      if (!state.card) throw new Error('Nenhum cartão cadastrado.');
      state.card = { ...state.card, name, limitAmount };
    }
    return state.card;
  });
}

// Removing the card wipes every category and movement with it.
export function deleteCard() {
  return mutate((state) => {
    state.card = null;
    state.categories = [];
    state.movements = [];
  });
}

// --- categories -------------------------------------------------------------

export function createCategory(input: CategoryInput) {
  return mutate((state) => {
    if (!state.card) throw new Error('Cadastre um cartão antes de criar categorias.');
    const category = { id: state.nextId++, name: requireText(input.name, 'Nome da categoria', 120), amount: requireAmount(input.amount, 'Orçamento planejado'), isClosed: false };
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
    requireOpen(findCategory(state, categoryId));
    const movement = { id: state.nextId++, categoryId, description: requireText(input.description, 'Descrição', 200), amount: requireAmount(input.amount, 'Valor'), date: requireDate(input.date) };
    state.movements.push(movement);
    return movement;
  });
}

export function updateMovement(movementId: number, input: MovementInput) {
  return mutate((state) => {
    const movement = findMovement(state, movementId);
    requireOpen(findCategory(state, movement.categoryId));
    movement.description = requireText(input.description, 'Descrição', 200);
    movement.amount = requireAmount(input.amount, 'Valor');
    movement.date = requireDate(input.date);
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
