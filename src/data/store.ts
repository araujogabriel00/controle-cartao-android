import { Preferences } from '@capacitor/preferences';
import { CARD_COLOR_KEYS, isCardColor, type CardColor } from '@/lib/card-colors';
import { currentMonth, isFutureMonth, isMonthKey, monthLabel, monthOf, type MonthKey } from '@/lib/format';

const STORAGE_KEY = 'controle-cartao:v1';

export type { MonthKey } from '@/lib/format';
export type { CardColor } from '@/lib/card-colors';
export type StoredCard = { id: number; name: string; limitAmount: number; color: CardColor };
export type StoredMonth = { cardId: number; month: MonthKey; limitAmount: number };
export type StoredCategory = { id: number; cardId: number; month: MonthKey; name: string; amount: number; isClosed: boolean };
export type StoredMovement = { id: number; categoryId: number; description: string; amount: number; date: string };

type State = {
  version: 3;
  nextId: number;
  selectedCardId: number | null;
  cards: StoredCard[];
  months: StoredMonth[];
  categories: StoredCategory[];
  movements: StoredMovement[];
};

// Previous formats, kept only to migrate saved data.
type CardV2 = Omit<StoredCard, 'color'>;
type StateV2 = {
  version: 2;
  nextId: number;
  card: CardV2 | null;
  months: Omit<StoredMonth, 'cardId'>[];
  categories: Omit<StoredCategory, 'cardId'>[];
  movements: StoredMovement[];
};
type StateV1 = {
  version: 1;
  nextId: number;
  card: CardV2 | null;
  categories: Omit<StoredCategory, 'cardId' | 'month'>[];
  movements: StoredMovement[];
};

// limitAmount is the limit of the requested month; currentLimitAmount is the card's own.
export type Card = StoredCard & { currentLimitAmount: number; usedAmount: number; availableAmount: number; percentUsed: number };
export type Cards = { selectedCardId: number | null; nextColor: CardColor; cards: Card[] };
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
export type Consolidated = {
  month: MonthKey;
  cardCount: number;
  limitAmount: number;
  committedAmount: number;
  availableAmount: number;
  spentAmount: number;
  percentUsed: number;
};

export type CardInput = { name: string; limitAmount: number; color?: CardColor };
export type CategoryInput = { name: string; amount: number };
export type MovementInput = { description: string; amount: number; date: string };

const emptyState = (): State => ({ version: 3, nextId: 1, selectedCardId: null, cards: [], months: [], categories: [], movements: [] });

// Everything saved before the monthly history existed lands in the month the
// app is first opened after the update. Movement dates are kept as they were.
function migrateV1(old: StateV1): StateV2 {
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

// The single card becomes the first (and selected) card, in the original green.
function migrateV2(old: StateV2): State {
  const card = old.card;
  if (!card) return { ...emptyState(), nextId: old.nextId };
  return {
    version: 3,
    nextId: old.nextId,
    selectedCardId: card.id,
    cards: [{ ...card, color: 'verde' }],
    months: old.months.map((m) => ({ ...m, cardId: card.id })),
    categories: old.categories.map((c) => ({ ...c, cardId: card.id })),
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
      const parsed = JSON.parse(value) as State | StateV2 | StateV1;
      if (parsed?.version === 3) return parsed;
      if (parsed?.version !== 2 && parsed?.version !== 1) return emptyState();
      const migrated = migrateV2(parsed.version === 1 ? migrateV1(parsed) : parsed);
      // Saved right away so the data stays in this month even if the next
      // change only happens in a later month.
      void persist(migrated).catch(() => undefined);
      return migrated;
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

const categoriesOf = (state: State, cardId: number, month: MonthKey) => state.categories.filter((c) => c.cardId === cardId && c.month === month);
const findMonth = (state: State, cardId: number, month: MonthKey) => state.months.find((m) => m.cardId === cardId && m.month === month);
const cardOf = (state: State, cardId: number) => state.cards.find((c) => c.id === cardId);

function categoryUsed(state: State, categoryId: number) {
  return cents(state.movements.filter((m) => m.categoryId === categoryId).reduce((sum, m) => sum + m.amount, 0));
}

function toCategory(state: State, category: StoredCategory): Category {
  const usedAmount = categoryUsed(state, category.id);
  return { ...category, usedAmount, availableAmount: cents(category.amount - usedAmount), percentUsed: percent(usedAmount, category.amount) };
}

function overviewOf(state: State, cardId: number, month: MonthKey): Overview {
  const categories = categoriesOf(state, cardId, month);
  const open = categories.filter((c) => !c.isClosed);
  const closed = categories.filter((c) => c.isClosed);
  return {
    openBudgetAmount: cents(open.reduce((sum, c) => sum + c.amount, 0)),
    closedSpentAmount: cents(closed.reduce((sum, c) => sum + categoryUsed(state, c.id), 0)),
    openCategoryCount: open.length,
  };
}

// A month that was never started borrows the card's current limit.
function monthLimit(state: State, card: StoredCard, month: MonthKey) {
  return findMonth(state, card.id, month)?.limitAmount ?? card.limitAmount;
}

function summaryOf(state: State, card: StoredCard, month: MonthKey): MonthSummary {
  const categories = categoriesOf(state, card.id, month);
  const ids = new Set(categories.map((c) => c.id));
  const movements = state.movements.filter((m) => ids.has(m.categoryId));
  const { openBudgetAmount, closedSpentAmount } = overviewOf(state, card.id, month);
  const limitAmount = monthLimit(state, card, month);
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

function toCard(state: State, card: StoredCard, month: MonthKey): Card {
  const { committedAmount, limitAmount, percentUsed } = summaryOf(state, card, month);
  return { ...card, limitAmount, currentLimitAmount: card.limitAmount, usedAmount: committedAmount, availableAmount: cents(limitAmount - committedAmount), percentUsed };
}

// RN-02: every card counts, even the ones that haven't started this month.
function consolidatedOf(state: State, month: MonthKey): Consolidated {
  const summaries = state.cards.map((card) => summaryOf(state, card, month));
  const limitAmount = cents(summaries.reduce((sum, s) => sum + s.limitAmount, 0));
  const committedAmount = cents(summaries.reduce((sum, s) => sum + s.committedAmount, 0));
  return {
    month,
    cardCount: state.cards.length,
    limitAmount,
    committedAmount,
    availableAmount: cents(limitAmount - committedAmount),
    spentAmount: cents(summaries.reduce((sum, s) => sum + s.spentAmount, 0)),
    percentUsed: percent(committedAmount, limitAmount),
  };
}

// First palette color no card uses yet; green once they are all taken.
function nextColorOf(state: State): CardColor {
  const used = new Set(state.cards.map((c) => c.color));
  return CARD_COLOR_KEYS.find((color) => !used.has(color)) ?? 'verde';
}

// Falls back to the first card when the saved selection is gone.
function selectedOf(state: State) {
  return cardOf(state, state.selectedCardId ?? -1)?.id ?? state.cards[0]?.id ?? null;
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

// RN-01 (monthly history): a movement's date must fall inside its category's month.
function requireDateInMonth(date: string, month: MonthKey) {
  if (monthOf(date) !== month) throw new Error(`A data deve estar dentro de ${monthLabel(month)}.`);
  return date;
}

function requireColor(value: unknown): CardColor {
  if (!isCardColor(value)) throw new Error('Cor inválida.');
  return value;
}

// RN-04: names are compared ignoring case and surrounding spaces.
function requireUniqueName(state: State, name: string, exceptId?: number) {
  const key = name.toLocaleLowerCase('pt-BR');
  if (state.cards.some((c) => c.id !== exceptId && c.name.trim().toLocaleLowerCase('pt-BR') === key)) throw new Error('Já existe um cartão com esse nome.');
  return name;
}

function findCard(state: State, cardId: number) {
  const card = cardOf(state, cardId);
  if (!card) throw new Error('Cartão não encontrado.');
  return card;
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

// Starts the card's month with its current limit, if it wasn't started yet.
function ensureMonth(state: State, card: StoredCard, month: MonthKey) {
  if (findMonth(state, card.id, month)) return false;
  state.months.push({ cardId: card.id, month, limitAmount: card.limitAmount });
  return true;
}

// --- reads ------------------------------------------------------------------

export async function getCards(month: MonthKey): Promise<Cards> {
  const state = await load();
  return { selectedCardId: selectedOf(state), nextColor: nextColorOf(state), cards: state.cards.map((c) => toCard(state, c, month)) };
}

export async function getCard(cardId: number, month: MonthKey): Promise<Card | null> {
  const state = await load();
  const card = cardOf(state, cardId);
  return card ? toCard(state, card, month) : null;
}

export async function getOverview(cardId: number, month: MonthKey): Promise<Overview> {
  return overviewOf(await load(), cardId, month);
}

export async function getCategories(cardId: number, month: MonthKey): Promise<Category[]> {
  const state = await load();
  return categoriesOf(state, cardId, month).map((c) => toCategory(state, c));
}

export async function getMovements(categoryId: number): Promise<Movement[]> {
  const state = await load();
  return state.movements
    .filter((m) => m.categoryId === categoryId)
    .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
}

export async function getMonthHistory(cardId: number): Promise<MonthSummary[]> {
  const state = await load();
  const card = cardOf(state, cardId);
  if (!card) return [];
  return state.months
    .filter((m) => m.cardId === cardId)
    .map((m) => summaryOf(state, card, m.month))
    .sort((a, b) => b.month.localeCompare(a.month));
}

export async function getMonthStatus(cardId: number): Promise<MonthStatus> {
  const state = await load();
  const current = currentMonth();
  const previousMonth = state.months
    .filter((m) => m.cardId === cardId && m.month < current)
    .map((m) => m.month)
    .sort()
    .at(-1) ?? null;
  return {
    needsStart: Boolean(cardOf(state, cardId)) && !findMonth(state, cardId, current),
    previousMonth,
    previousHasCategories: previousMonth !== null && categoriesOf(state, cardId, previousMonth).length > 0,
  };
}

export async function getConsolidated(month: MonthKey): Promise<Consolidated> {
  return consolidatedOf(await load(), month);
}

// One entry per month started by any card, newest first.
export async function getConsolidatedHistory(): Promise<Consolidated[]> {
  const state = await load();
  return [...new Set(state.months.map((m) => m.month))]
    .sort((a, b) => b.localeCompare(a))
    .map((month) => consolidatedOf(state, month));
}

// --- months -----------------------------------------------------------------

// Copies names and budgets from the same card only: the new categories start
// open and empty.
export function startMonth(cardId: number, month: MonthKey, copyFrom: MonthKey | null) {
  return mutate((state) => {
    const card = findCard(state, cardId);
    const target = requireMonth(month);
    if (!ensureMonth(state, card, target)) return;
    if (!copyFrom) return;
    for (const source of categoriesOf(state, cardId, requireMonth(copyFrom))) {
      state.categories.push({ id: state.nextId++, cardId, month: target, name: source.name, amount: source.amount, isClosed: false });
    }
  });
}

// --- cards ------------------------------------------------------------------

export function selectCard(cardId: number) {
  return mutate((state) => {
    state.selectedCardId = findCard(state, cardId).id;
  });
}

export function saveCard(input: CardInput, mode: 'create' | 'update', cardId?: number) {
  return mutate((state) => {
    const name = requireText(input.name, 'Nome do cartão', 120);
    const limitAmount = requireAmount(input.limitAmount, 'Limite total');
    if (mode === 'create') {
      requireUniqueName(state, name);
      const color = input.color === undefined ? nextColorOf(state) : requireColor(input.color);
      const card: StoredCard = { id: state.nextId++, name, limitAmount, color };
      state.cards.push(card);
      state.selectedCardId = card.id;
      ensureMonth(state, card, currentMonth());
      return card;
    }
    const card = findCard(state, cardId ?? -1);
    requireUniqueName(state, name, card.id);
    card.name = name;
    card.limitAmount = limitAmount;
    if (input.color !== undefined) card.color = requireColor(input.color);
    // Past months and other cards keep the limit they had.
    const current = findMonth(state, card.id, currentMonth());
    if (current) current.limitAmount = limitAmount;
    return card;
  });
}

// Removing a card wipes its months, categories and movements, and nothing else.
export function deleteCard(cardId: number) {
  return mutate((state) => {
    findCard(state, cardId);
    const categoryIds = new Set(state.categories.filter((c) => c.cardId === cardId).map((c) => c.id));
    state.cards = state.cards.filter((c) => c.id !== cardId);
    state.months = state.months.filter((m) => m.cardId !== cardId);
    state.categories = state.categories.filter((c) => c.cardId !== cardId);
    state.movements = state.movements.filter((m) => !categoryIds.has(m.categoryId));
    if (state.selectedCardId === cardId) state.selectedCardId = state.cards[0]?.id ?? null;
  });
}

// --- categories -------------------------------------------------------------

export function createCategory(cardId: number, month: MonthKey, input: CategoryInput) {
  return mutate((state) => {
    if (!state.cards.length) throw new Error('Cadastre um cartão antes de criar categorias.');
    const card = findCard(state, cardId);
    const target = requireMonth(month);
    const category = { id: state.nextId++, cardId, month: target, name: requireText(input.name, 'Nome da categoria', 120), amount: requireAmount(input.amount, 'Orçamento planejado'), isClosed: false };
    ensureMonth(state, card, target);
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
