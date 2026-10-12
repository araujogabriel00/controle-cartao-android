import { Preferences } from '@capacitor/preferences';
import { CARD_COLOR_KEYS, isCardColor, type CardColor } from '@/lib/card-colors';
import { currentMonth, isFutureMonth, isMonthKey, lastDayOf, money, monthLabel, monthOf, shiftMonth, type MonthKey } from '@/lib/format';

const STORAGE_KEY = 'controle-cartao:v1';

export type { MonthKey } from '@/lib/format';
export type { CardColor } from '@/lib/card-colors';
export type StoredCard = { id: number; name: string; limitAmount: number; color: CardColor };
export type StoredMonth = { cardId: number; month: MonthKey; limitAmount: number };
export type StoredCategory = { id: number; cardId: number; month: MonthKey; name: string; amount: number; isClosed: boolean };
// Installments carry the purchase they belong to; installmentCount stays even
// after the purchase is gone, so a kept installment still shows "k/N".
export type StoredMovement = {
  id: number; categoryId: number; description: string; amount: number; date: string;
  purchaseId?: number; installment?: number; installmentCount?: number;
};
export type StoredPurchase = {
  id: number;
  cardId: number;
  categoryName: string;
  description: string;
  totalAmount: number;
  installmentCount: number;
  firstInstallment: number;
  firstMonth: MonthKey;
  day: number;
};

type State = {
  version: 4;
  nextId: number;
  selectedCardId: number | null;
  cards: StoredCard[];
  months: StoredMonth[];
  categories: StoredCategory[];
  movements: StoredMovement[];
  purchases: StoredPurchase[];
};

// Previous formats, kept only to migrate saved data.
type StateV3 = Omit<State, 'version' | 'purchases'> & { version: 3 };
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
export type Movement = StoredMovement & {
  purchase?: { id: number; totalAmount: number; installmentCount: number; firstInstallment: number };
};
export type PlannedInstallment = { purchaseId: number; description: string; installment: number; installmentCount: number; amount: number; date: string };
export type MonthPreview = { month: MonthKey; amount: number; groups: { categoryName: string; amount: number; installments: PlannedInstallment[] }[] };
export type FutureInstallments = { month: MonthKey; amount: number; count: number };
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
// `installment` is the one that falls in the month of `date`; on create the
// purchase starts there, on update `firstInstallment` says where it starts.
export type PurchaseInput = { description: string; totalAmount: number; installmentCount: number; installment: number; firstInstallment?: number; date: string };

const emptyState = (): State => ({ version: 4, nextId: 1, selectedCardId: null, cards: [], months: [], categories: [], movements: [], purchases: [] });

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
function migrateV2(old: StateV2): StateV3 {
  const card = old.card;
  if (!card) return { ...emptyState(), version: 3, nextId: old.nextId };
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

// Nothing was bought in installments before v4.
const migrateV3 = (old: StateV3): State => ({ ...old, version: 4, purchases: [] });

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
      const parsed = JSON.parse(value) as State | StateV3 | StateV2 | StateV1;
      if (parsed?.version === 4) return parsed;
      if (parsed?.version !== 3 && parsed?.version !== 2 && parsed?.version !== 1) return emptyState();
      const migrated = migrateV3(parsed.version === 3 ? parsed : migrateV2(parsed.version === 1 ? migrateV1(parsed) : parsed));
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

// --- installments -------------------------------------------------------------

// RN-04: category names match ignoring case and surrounding spaces.
const nameKey = (name: string) => name.trim().toLocaleLowerCase('pt-BR');

// RN-01: the cents left over from the split go to installment 1.
function installmentAmount(purchase: StoredPurchase, k: number) {
  const base = Math.floor(Math.round(purchase.totalAmount * 100) / purchase.installmentCount) / 100;
  return k === 1 ? cents(purchase.totalAmount - base * (purchase.installmentCount - 1)) : base;
}

// RN-02: same day of the month, or the month's last day when it has no such day.
const installmentMonth = (purchase: StoredPurchase, k: number) => shiftMonth(purchase.firstMonth, k - purchase.firstInstallment);

function installmentDate(purchase: StoredPurchase, k: number) {
  const month = installmentMonth(purchase, k);
  const date = `${month}-${String(purchase.day).padStart(2, '0')}`;
  const last = lastDayOf(month);
  return date > last ? last : date;
}

const installmentsOf = (purchase: StoredPurchase) =>
  Array.from({ length: purchase.installmentCount - purchase.firstInstallment + 1 }, (_, i) => purchase.firstInstallment + i);

// Installments of future months, which only exist as part of the purchase
// until their month comes. A null cardId means every card.
function plannedOf(state: State, cardId: number | null, month?: MonthKey) {
  const current = currentMonth();
  return state.purchases
    .filter((p) => cardId === null || p.cardId === cardId)
    .flatMap((p) => installmentsOf(p)
      .filter((k) => installmentMonth(p, k) > current && (!month || installmentMonth(p, k) === month))
      .map((k) => ({
        cardId: p.cardId,
        categoryName: p.categoryName,
        month: installmentMonth(p, k),
        installment: { purchaseId: p.id, description: p.description, installment: k, installmentCount: p.installmentCount, amount: installmentAmount(p, k), date: installmentDate(p, k) } as PlannedInstallment,
      })));
}

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
  // RN-14: a future month is a preview made only of its planned installments.
  if (isFutureMonth(month)) {
    const planned = plannedOf(state, card.id, month);
    const amount = cents(planned.reduce((sum, p) => sum + p.installment.amount, 0));
    return { month, limitAmount: card.limitAmount, spentAmount: amount, plannedAmount: 0, committedAmount: amount, percentUsed: percent(amount, card.limitAmount), categoryCount: 0, movementCount: planned.length };
  }
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

const isLinked = (state: State, movement: StoredMovement) => state.purchases.some((p) => p.id === movement.purchaseId);

// RN-09: an installment only changes through its purchase.
function requireStandalone(state: State, movement: StoredMovement) {
  if (isLinked(state, movement)) throw new Error('Este lançamento é uma parcela. Altere a compra parcelada.');
}

// Starts the card's month with its current limit, if it wasn't started yet.
function ensureMonth(state: State, card: StoredCard, month: MonthKey) {
  if (findMonth(state, card.id, month)) return false;
  state.months.push({ cardId: card.id, month, limitAmount: card.limitAmount });
  return true;
}

function findPurchase(state: State, purchaseId: number) {
  const purchase = state.purchases.find((p) => p.id === purchaseId);
  if (!purchase) throw new Error('Compra parcelada não encontrada.');
  return purchase;
}

const hasInstallment = (state: State, purchaseId: number, k: number) =>
  state.movements.some((m) => m.purchaseId === purchaseId && m.installment === k);

// RN-03: records installment k, starting its month and creating the category
// when needed. `created` holds the categories made in this pass, whose budget
// grows with every installment they get (D6).
function placeInstallment(state: State, purchase: StoredPurchase, k: number, created: Set<number>, into?: StoredCategory) {
  const month = installmentMonth(purchase, k);
  const amount = installmentAmount(purchase, k);
  ensureMonth(state, findCard(state, purchase.cardId), month);
  let category = into ?? categoriesOf(state, purchase.cardId, month).find((c) => nameKey(c.name) === nameKey(purchase.categoryName));
  if (!category) {
    category = { id: state.nextId++, cardId: purchase.cardId, month, name: purchase.categoryName, amount: 0, isClosed: false };
    state.categories.push(category);
    created.add(category.id);
  }
  if (category.isClosed) throw new Error(`A categoria ${category.name} está fechada em ${monthLabel(month)}.`);
  if (created.has(category.id)) category.amount = cents(category.amount + amount);
  state.movements.push({
    id: state.nextId++, categoryId: category.id, description: purchase.description, amount, date: installmentDate(purchase, k),
    purchaseId: purchase.id, installment: k, installmentCount: purchase.installmentCount,
  });
}

// Records every missing installment of the card up to the current month.
function syncPurchases(state: State, cardId: number, created = new Set<number>()) {
  const current = currentMonth();
  for (const purchase of state.purchases.filter((p) => p.cardId === cardId)) {
    for (const k of installmentsOf(purchase)) {
      if (installmentMonth(purchase, k) > current) break;
      if (!hasInstallment(state, purchase.id, k)) placeInstallment(state, purchase, k, created);
    }
  }
}

// RN-05. On create the purchase starts at `installment`.
function requirePurchase(input: PurchaseInput, category: StoredCategory, firstFallback?: number) {
  const installmentCount = Number(input.installmentCount);
  if (!Number.isInteger(installmentCount) || installmentCount < 2 || installmentCount > 24) throw new Error('Nº de parcelas deve ser de 2 a 24.');
  const installment = Number(input.installment);
  if (!Number.isInteger(installment) || installment < 1 || installment > installmentCount) throw new Error(`A parcela neste mês deve ser de 1 a ${installmentCount}.`);
  const firstInstallment = Number(input.firstInstallment ?? firstFallback ?? installment);
  if (!Number.isInteger(firstInstallment) || firstInstallment < 1 || firstInstallment > installment) throw new Error(`A compra deve começar entre a parcela 1 e a ${installment}.`);
  const minimum = cents(installmentCount * 0.01);
  const totalAmount = Number(input.totalAmount);
  if (!Number.isFinite(totalAmount) || cents(totalAmount) < minimum) throw new Error(`Valor total deve ser de pelo menos ${money(minimum)}.`);
  const date = requireDateInMonth(requireDate(input.date), category.month);
  return {
    categoryName: category.name,
    description: requireText(input.description, 'Descrição', 200),
    totalAmount: cents(totalAmount),
    installmentCount,
    firstInstallment,
    firstMonth: shiftMonth(category.month, firstInstallment - installment),
    day: Number(date.slice(8, 10)),
    installment,
  };
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
    .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id)
    .map((m) => {
      const purchase = state.purchases.find((p) => p.id === m.purchaseId);
      return purchase ? { ...m, purchase: { id: purchase.id, totalAmount: purchase.totalAmount, installmentCount: purchase.installmentCount, firstInstallment: purchase.firstInstallment } } : m;
    });
}

// RN-13: planned installments of the card, one entry per future month.
export async function getFutureInstallments(cardId: number): Promise<FutureInstallments[]> {
  const byMonth = new Map<MonthKey, FutureInstallments>();
  for (const { month, installment } of plannedOf(await load(), cardId)) {
    const entry = byMonth.get(month) ?? { month, amount: 0, count: 0 };
    entry.amount = cents(entry.amount + installment.amount);
    entry.count += 1;
    byMonth.set(month, entry);
  }
  return [...byMonth.values()].sort((a, b) => a.month.localeCompare(b.month));
}

// RF-09: planned installments of the card in a future month, grouped by category name.
export async function getMonthPreview(cardId: number, month: MonthKey): Promise<MonthPreview> {
  const groups = new Map<string, MonthPreview['groups'][number]>();
  for (const { categoryName, installment } of plannedOf(await load(), cardId, month)) {
    const group = groups.get(nameKey(categoryName)) ?? { categoryName, amount: 0, installments: [] };
    group.amount = cents(group.amount + installment.amount);
    group.installments.push(installment);
    groups.set(nameKey(categoryName), group);
  }
  const list = [...groups.values()];
  for (const group of list) group.installments.sort((a, b) => a.date.localeCompare(b.date) || a.purchaseId - b.purchaseId);
  return { month, amount: cents(list.reduce((sum, g) => sum + g.amount, 0)), groups: list };
}

// RN-14: the furthest month a preview can open, across every card.
export async function getLastPlannedMonth(): Promise<MonthKey | null> {
  return plannedOf(await load(), null).map((p) => p.month).sort().at(-1) ?? null;
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
// open and empty. The installments come after the copy, so they land in the
// copied categories (RN-15), and any month skipped on the way gets its own.
export function startMonth(cardId: number, month: MonthKey, copyFrom: MonthKey | null) {
  return mutate((state) => {
    const card = findCard(state, cardId);
    const target = requireMonth(month);
    if (ensureMonth(state, card, target) && copyFrom) {
      for (const source of categoriesOf(state, cardId, requireMonth(copyFrom))) {
        state.categories.push({ id: state.nextId++, cardId, month: target, name: source.name, amount: source.amount, isClosed: false });
      }
    }
    syncPurchases(state, cardId);
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
    state.purchases = state.purchases.filter((p) => p.cardId !== cardId);
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
    // RN-11: the purchases with an installment here follow the new name.
    const purchaseIds = new Set(state.movements.filter((m) => m.categoryId === category.id && m.purchaseId !== undefined).map((m) => m.purchaseId));
    for (const purchase of state.purchases) if (purchaseIds.has(purchase.id)) purchase.categoryName = category.name;
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
    if (state.movements.some((m) => m.categoryId === categoryId && isLinked(state, m))) throw new Error('Esta categoria tem parcelas. Exclua a compra parcelada antes.');
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
    requireStandalone(state, movement);
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
    requireStandalone(state, movement);
    requireOpen(findCategory(state, movement.categoryId));
    state.movements = state.movements.filter((m) => m.id !== movementId);
  });
}

// --- purchases ----------------------------------------------------------------

export function createPurchase(categoryId: number, input: PurchaseInput) {
  return mutate((state) => {
    const category = findCategory(state, categoryId);
    requireOpen(category);
    const { installment, ...fields } = requirePurchase(input, category);
    const purchase: StoredPurchase = { id: state.nextId++, cardId: category.cardId, ...fields };
    state.purchases.push(purchase);
    // The chosen category gets its installment even if another one shares the name.
    placeInstallment(state, purchase, installment, new Set(), category);
    syncPurchases(state, purchase.cardId);
    return purchase;
  });
}

// RN-06 / RN-07: everything is recalculated except the installments in closed
// categories, which must keep their month and stay in the purchase.
export function updatePurchase(purchaseId: number, categoryId: number, input: PurchaseInput) {
  return mutate((state) => {
    const purchase = findPurchase(state, purchaseId);
    const category = findCategory(state, categoryId);
    if (category.cardId !== purchase.cardId) throw new Error('Categoria não encontrada.');
    requireOpen(category);
    const { installment, ...fields } = requirePurchase(input, category, purchase.firstInstallment);
    const next: StoredPurchase = { ...purchase, ...fields };
    const own = state.movements.filter((m) => m.purchaseId === purchase.id);
    const fixed = own.filter((m) => findCategory(state, m.categoryId).isClosed);
    for (const m of fixed) {
      const k = m.installment ?? 0;
      if (k < next.firstInstallment || k > next.installmentCount || installmentMonth(next, k) !== findCategory(state, m.categoryId).month) {
        throw new Error(`A parcela ${k}/${purchase.installmentCount} está numa categoria fechada e não pode mudar de mês nem sair da compra.`);
      }
    }
    const fixedIds = new Set(fixed.map((m) => m.id));
    state.movements = state.movements.filter((m) => m.purchaseId !== purchase.id || fixedIds.has(m.id));
    for (const m of fixed) m.installmentCount = next.installmentCount;
    Object.assign(purchase, next);
    if (!hasInstallment(state, purchase.id, installment)) placeInstallment(state, purchase, installment, new Set(), category);
    syncPurchases(state, purchase.cardId);
    return purchase;
  });
}

// RN-08: installments in closed categories stay as ordinary movements.
export function deletePurchase(purchaseId: number) {
  return mutate((state) => {
    const purchase = findPurchase(state, purchaseId);
    state.movements = state.movements.filter((m) => m.purchaseId !== purchase.id || findCategory(state, m.categoryId).isClosed);
    for (const m of state.movements) if (m.purchaseId === purchase.id) delete m.purchaseId;
    state.purchases = state.purchases.filter((p) => p.id !== purchase.id);
  });
}
