import { Preferences } from '@capacitor/preferences';
import { CARD_COLOR_KEYS, isCardColor, type CardColor } from '@/lib/card-colors';
import { currentMonth, isFutureMonth, isMonthKey, lastDayOf, money, monthLabel, monthOf, shiftMonth, type MonthKey } from '@/lib/format';

const STORAGE_KEY = 'controle-cartao:v1';

export type { MonthKey } from '@/lib/format';
export type { CardColor } from '@/lib/card-colors';
export type StoredCard = { id: number; name: string; limitAmount: number; color: CardColor };
export type StoredMonth = { cardId: number; month: MonthKey; limitAmount: number };
// Global (purchases and categories D2): no card, month or budget.
export type StoredCategory = { id: number; name: string };
// A purchase on a card; its month is monthOf(date). Installments carry the
// purchase they belong to; installmentCount stays even after the purchase is
// gone, so a kept installment still shows "k/N".
export type StoredMovement = {
  id: number; cardId: number; categoryId: number | null; description: string; amount: number; date: string;
  purchaseId?: number; installment?: number; installmentCount?: number;
};
export type StoredPurchase = {
  id: number;
  cardId: number;
  categoryId: number | null;
  description: string;
  totalAmount: number;
  installmentCount: number;
  firstInstallment: number;
  firstMonth: MonthKey;
  day: number;
};

export const INCOME_KINDS = ['salario', 'prolabore', 'bonus', 'outro'] as const;
export type IncomeKind = (typeof INCOME_KINDS)[number];
// Income is global (no card). A recurring one is a rule from firstMonth to
// lastMonth (null = no end); its months are computed, never stored.
export type StoredIncome = {
  id: number; kind: IncomeKind; description: string; amount: number;
  firstMonth: MonthKey; day: number; recurring: boolean; lastMonth: MonthKey | null;
};
// Adjusts a single month of a recurring income; skip removes that month.
export type StoredIncomeException = {
  incomeId: number; month: MonthKey; skip: boolean; amount?: number; description?: string; day?: number;
};

type State = {
  version: 6;
  nextId: number;
  selectedCardId: number | null;
  cards: StoredCard[];
  months: StoredMonth[];
  categories: StoredCategory[];
  movements: StoredMovement[];
  purchases: StoredPurchase[];
  incomes: StoredIncome[];
  incomeExceptions: StoredIncomeException[];
};

// Previous formats, kept only to migrate saved data.
type OldCategory = { id: number; cardId: number; month: MonthKey; name: string; amount: number; isClosed: boolean };
type OldMovement = Omit<StoredMovement, 'cardId' | 'categoryId'> & { categoryId: number };
type OldPurchase = Omit<StoredPurchase, 'categoryId'> & { categoryName: string };
type StateV5 = Omit<State, 'version' | 'categories' | 'movements' | 'purchases'> & {
  version: 5; categories: OldCategory[]; movements: OldMovement[]; purchases: OldPurchase[];
};
type StateV4 = Omit<StateV5, 'version' | 'incomes' | 'incomeExceptions'> & { version: 4 };
type StateV3 = Omit<StateV4, 'version' | 'purchases'> & { version: 3 };
type CardV2 = Omit<StoredCard, 'color'>;
type StateV2 = {
  version: 2;
  nextId: number;
  card: CardV2 | null;
  months: Omit<StoredMonth, 'cardId'>[];
  categories: Omit<OldCategory, 'cardId'>[];
  movements: OldMovement[];
};
type StateV1 = {
  version: 1;
  nextId: number;
  card: CardV2 | null;
  categories: Omit<OldCategory, 'cardId' | 'month'>[];
  movements: OldMovement[];
};
type Saved = StateV5 | StateV4 | StateV3 | StateV2 | StateV1;

// limitAmount is the limit of the requested month; currentLimitAmount is the card's own.
export type Card = StoredCard & { currentLimitAmount: number; usedAmount: number; availableAmount: number; percentUsed: number };
export type Cards = { selectedCardId: number | null; nextColor: CardColor; cards: Card[] };
export type Category = StoredCategory & { movementCount: number };
export type CategorySummary = { categoryId: number | null; name: string | null; amount: number; percent: number };
export type Movement = StoredMovement & {
  categoryName: string | null;
  purchase?: { id: number; totalAmount: number; installmentCount: number; firstInstallment: number };
};
export type PlannedInstallment = {
  purchaseId: number; description: string; installment: number; installmentCount: number; amount: number; date: string;
  categoryId: number | null; categoryName: string | null;
};
export type MonthPreview = { month: MonthKey; amount: number; installments: PlannedInstallment[] };
export type FutureInstallments = { month: MonthKey; amount: number; count: number };
export type MonthSummary = {
  month: MonthKey;
  limitAmount: number;
  usedAmount: number;
  availableAmount: number;
  percentUsed: number;
  movementCount: number;
};
export type MonthStatus = { needsStart: boolean };
export type Consolidated = {
  month: MonthKey;
  cardCount: number;
  limitAmount: number;
  usedAmount: number;
  availableAmount: number;
  percentUsed: number;
};

export type IncomeOccurrence = { incomeId: number; kind: IncomeKind; description: string; amount: number; date: string; recurring: boolean; lastMonth: MonthKey | null };
export type Incomes = { month: MonthKey; totalAmount: number; items: IncomeOccurrence[] };
export type IncomeRange = { first: MonthKey; last: MonthKey };
export type IncomeScope = 'month' | 'forward';

export type CardInput = { name: string; limitAmount: number; color?: CardColor };
export type CategoryInput = { name: string };
export type MovementInput = { description: string; amount: number; date: string };
export type IncomeInput = { kind: IncomeKind; description?: string; amount: number; date: string; recurring: boolean; lastMonth?: MonthKey | null };
// `installment` is the one that falls in the month of `date`; on create the
// purchase starts there, on update `firstInstallment` says where it starts.
export type PurchaseInput = { description: string; totalAmount: number; installmentCount: number; installment: number; firstInstallment?: number; date: string };

const emptyState = (): State => ({ version: 6, nextId: 1, selectedCardId: null, cards: [], months: [], categories: [], movements: [], purchases: [], incomes: [], incomeExceptions: [] });

// RN-05 (categories): names match ignoring case and surrounding spaces.
const nameKey = (name: string) => name.trim().toLocaleLowerCase('pt-BR');

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
  if (!card) return { version: 3, nextId: old.nextId, selectedCardId: null, cards: [], months: [], categories: [], movements: [] };
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
const migrateV3 = (old: StateV3): StateV4 => ({ ...old, version: 4, purchases: [] });

// Income didn't exist before v5.
const migrateV4 = (old: StateV4): StateV5 => ({ ...old, version: 5, incomes: [], incomeExceptions: [] });

// RN-14: one global category per distinct name; budgets and open/closed are
// dropped; every old movement becomes a purchase on its category's card.
function migrateV5(old: StateV5): State {
  const byName = new Map<string, StoredCategory>();
  const categories: StoredCategory[] = [];
  let nextId = old.nextId;
  const categoryFor = (name: string) => {
    const key = nameKey(name);
    let category = byName.get(key);
    if (!category) {
      category = { id: nextId++, name: name.trim() };
      byName.set(key, category);
      categories.push(category);
    }
    return category.id;
  };
  for (const c of [...old.categories].sort((a, b) => a.id - b.id)) categoryFor(c.name);
  const oldCategories = new Map(old.categories.map((c) => [c.id, c]));
  const movements = old.movements.flatMap((m): StoredMovement[] => {
    const category = oldCategories.get(m.categoryId);
    if (!category) return [];
    const { categoryId: _old, ...rest } = m;
    return [{ ...rest, cardId: category.cardId, categoryId: categoryFor(category.name) }];
  });
  const purchases = old.purchases.map((p): StoredPurchase => {
    const { categoryName, ...rest } = p;
    return { ...rest, categoryId: categoryFor(categoryName) };
  });
  return { ...old, version: 6, nextId, categories, movements, purchases };
}

function migrate(old: Saved): State {
  if (old.version === 1) return migrate(migrateV1(old));
  if (old.version === 2) return migrate(migrateV2(old));
  if (old.version === 3) return migrate(migrateV3(old));
  if (old.version === 4) return migrate(migrateV4(old));
  return migrateV5(old);
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
      const parsed = JSON.parse(value) as State | Saved;
      if (parsed?.version === 6) return parsed;
      const version: number | undefined = parsed?.version;
      if (version !== 5 && version !== 4 && version !== 3 && version !== 2 && version !== 1) return emptyState();
      const migrated = migrate(parsed as Saved);
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
const sum = (values: number[]) => cents(values.reduce((total, value) => total + value, 0));
const percent = (used: number, total: number) => (total > 0 ? (used / total) * 100 : 0);

const findMonth = (state: State, cardId: number, month: MonthKey) => state.months.find((m) => m.cardId === cardId && m.month === month);
const cardOf = (state: State, cardId: number) => state.cards.find((c) => c.id === cardId);
const categoryNameOf = (state: State, categoryId: number | null) => (categoryId === null ? null : state.categories.find((c) => c.id === categoryId)?.name ?? null);

// --- installments -------------------------------------------------------------

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

type Planned = PlannedInstallment & { cardId: number; month: MonthKey };

// Installments of future months, which only exist as part of the purchase
// until their month comes. A null cardId means every card.
function plannedOf(state: State, cardId: number | null, month?: MonthKey): Planned[] {
  const current = currentMonth();
  return state.purchases
    .filter((p) => cardId === null || p.cardId === cardId)
    .flatMap((p) => installmentsOf(p)
      .filter((k) => installmentMonth(p, k) > current && (!month || installmentMonth(p, k) === month))
      .map((k) => ({
        cardId: p.cardId,
        month: installmentMonth(p, k),
        purchaseId: p.id,
        description: p.description,
        installment: k,
        installmentCount: p.installmentCount,
        amount: installmentAmount(p, k),
        date: installmentDate(p, k),
        categoryId: p.categoryId,
        categoryName: categoryNameOf(state, p.categoryId),
      })));
}

// --- month totals -------------------------------------------------------------

const movementsOf = (state: State, cardId: number, month: MonthKey) =>
  state.movements.filter((m) => m.cardId === cardId && monthOf(m.date) === month);

// RN-01: the purchases of the month; a future month adds its planned installments.
function usedOf(state: State, cardId: number, month: MonthKey) {
  const planned = isFutureMonth(month) ? plannedOf(state, cardId, month).map((p) => p.amount) : [];
  return sum([...movementsOf(state, cardId, month).map((m) => m.amount), ...planned]);
}

// A month that was never started (or is still in the future) borrows the card's current limit.
function monthLimit(state: State, card: StoredCard, month: MonthKey) {
  return findMonth(state, card.id, month)?.limitAmount ?? card.limitAmount;
}

function summaryOf(state: State, card: StoredCard, month: MonthKey): MonthSummary {
  const limitAmount = monthLimit(state, card, month);
  const usedAmount = usedOf(state, card.id, month);
  const movementCount = movementsOf(state, card.id, month).length + (isFutureMonth(month) ? plannedOf(state, card.id, month).length : 0);
  return { month, limitAmount, usedAmount, availableAmount: cents(limitAmount - usedAmount), percentUsed: percent(usedAmount, limitAmount), movementCount };
}

function toCard(state: State, card: StoredCard, month: MonthKey): Card {
  const { usedAmount, limitAmount, availableAmount, percentUsed } = summaryOf(state, card, month);
  return { ...card, limitAmount, currentLimitAmount: card.limitAmount, usedAmount, availableAmount, percentUsed };
}

// RN-03: every card counts, even the ones that haven't started this month.
function consolidatedOf(state: State, month: MonthKey): Consolidated {
  const summaries = state.cards.map((card) => summaryOf(state, card, month));
  const limitAmount = sum(summaries.map((s) => s.limitAmount));
  const usedAmount = sum(summaries.map((s) => s.usedAmount));
  return {
    month,
    cardCount: state.cards.length,
    limitAmount,
    usedAmount,
    availableAmount: cents(limitAmount - usedAmount),
    percentUsed: percent(usedAmount, limitAmount),
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

// RN-05 (categories)
function requireCategoryName(state: State, value: unknown, exceptId?: number) {
  const name = requireText(value, 'Nome da categoria', 120);
  if (state.categories.some((c) => c.id !== exceptId && nameKey(c.name) === nameKey(name))) throw new Error('Já existe uma categoria com esse nome.');
  return name;
}

// RN-04: the category is optional, but it must exist when given.
function requireCategory(state: State, categoryId: number | null | undefined) {
  if (categoryId === null || categoryId === undefined) return null;
  if (!state.categories.some((c) => c.id === categoryId)) throw new Error('Categoria não encontrada.');
  return categoryId;
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

const isLinked = (state: State, movement: StoredMovement) => state.purchases.some((p) => p.id === movement.purchaseId);

// RN-11: an installment only changes through its purchase.
function requireStandalone(state: State, movement: StoredMovement) {
  if (isLinked(state, movement)) throw new Error('Este lançamento é uma parcela. Altere a compra parcelada.');
}

// Starts the card's month with its current limit, if it wasn't started yet.
function ensureMonth(state: State, card: StoredCard, month: MonthKey) {
  if (findMonth(state, card.id, month)) return false;
  state.months.push({ cardId: card.id, month, limitAmount: card.limitAmount });
  return true;
}

// RN-07: a purchase in a past or current month starts that month; a future
// month stays unstarted until it arrives (D12).
function ensureMonthOf(state: State, card: StoredCard, date: string) {
  const month = monthOf(date);
  if (!isFutureMonth(month)) ensureMonth(state, card, month);
}

function findPurchase(state: State, purchaseId: number) {
  const purchase = state.purchases.find((p) => p.id === purchaseId);
  if (!purchase) throw new Error('Compra parcelada não encontrada.');
  return purchase;
}

const hasInstallment = (state: State, purchaseId: number, k: number) =>
  state.movements.some((m) => m.purchaseId === purchaseId && m.installment === k);

// RN-08: records installment k as a purchase, starting its month if needed.
function placeInstallment(state: State, purchase: StoredPurchase, k: number) {
  ensureMonth(state, findCard(state, purchase.cardId), installmentMonth(purchase, k));
  state.movements.push({
    id: state.nextId++, cardId: purchase.cardId, categoryId: purchase.categoryId, description: purchase.description,
    amount: installmentAmount(purchase, k), date: installmentDate(purchase, k),
    purchaseId: purchase.id, installment: k, installmentCount: purchase.installmentCount,
  });
}

// Records every missing installment of the card up to the current month.
function syncPurchases(state: State, cardId: number) {
  const current = currentMonth();
  for (const purchase of state.purchases.filter((p) => p.cardId === cardId)) {
    for (const k of installmentsOf(purchase)) {
      if (installmentMonth(purchase, k) > current) break;
      if (!hasInstallment(state, purchase.id, k)) placeInstallment(state, purchase, k);
    }
  }
}

// RN-05 / RN-15. On create the purchase starts at `installment`.
function requirePurchase(input: PurchaseInput, firstFallback?: number) {
  const installmentCount = Number(input.installmentCount);
  if (!Number.isInteger(installmentCount) || installmentCount < 2 || installmentCount > 24) throw new Error('Nº de parcelas deve ser de 2 a 24.');
  const installment = Number(input.installment);
  if (!Number.isInteger(installment) || installment < 1 || installment > installmentCount) throw new Error(`A parcela neste mês deve ser de 1 a ${installmentCount}.`);
  const firstInstallment = Number(input.firstInstallment ?? firstFallback ?? installment);
  if (!Number.isInteger(firstInstallment) || firstInstallment < 1 || firstInstallment > installment) throw new Error(`A compra deve começar entre a parcela 1 e a ${installment}.`);
  const minimum = cents(installmentCount * 0.01);
  const totalAmount = Number(input.totalAmount);
  if (!Number.isFinite(totalAmount) || cents(totalAmount) < minimum) throw new Error(`Valor total deve ser de pelo menos ${money(minimum)}.`);
  const date = requireDate(input.date);
  if (isFutureMonth(monthOf(date))) throw new Error('Compra parcelada não aceita data em mês futuro.');
  return {
    description: requireText(input.description, 'Descrição', 200),
    totalAmount: cents(totalAmount),
    installmentCount,
    firstInstallment,
    firstMonth: shiftMonth(monthOf(date), firstInstallment - installment),
    day: Number(date.slice(8, 10)),
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

// RF-03: the card's purchases of the month, newest first.
export async function getMovements(cardId: number, month: MonthKey): Promise<Movement[]> {
  const state = await load();
  return movementsOf(state, cardId, month)
    .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id)
    .map((m) => {
      const purchase = state.purchases.find((p) => p.id === m.purchaseId);
      const base = { ...m, categoryName: categoryNameOf(state, m.categoryId) };
      return purchase ? { ...base, purchase: { id: purchase.id, totalAmount: purchase.totalAmount, installmentCount: purchase.installmentCount, firstInstallment: purchase.firstInstallment } } : base;
    });
}

// RF-05: amount and share of each category in the month, biggest first.
export async function getCategorySummary(cardId: number, month: MonthKey): Promise<CategorySummary[]> {
  const state = await load();
  const rows = [
    ...movementsOf(state, cardId, month).map((m) => ({ categoryId: m.categoryId, amount: m.amount })),
    ...(isFutureMonth(month) ? plannedOf(state, cardId, month).map((p) => ({ categoryId: p.categoryId, amount: p.amount })) : []),
  ];
  const total = sum(rows.map((r) => r.amount));
  const byCategory = new Map<number | null, number>();
  for (const row of rows) byCategory.set(row.categoryId, cents((byCategory.get(row.categoryId) ?? 0) + row.amount));
  return [...byCategory.entries()]
    .map(([categoryId, amount]) => ({ categoryId, name: categoryNameOf(state, categoryId), amount, percent: percent(amount, total) }))
    .sort((a, b) => b.amount - a.amount);
}

// RF-07: a purchase counts once, and so does an installment purchase.
export async function getCategories(): Promise<Category[]> {
  const state = await load();
  return state.categories
    .map((c) => ({
      ...c,
      movementCount: state.movements.filter((m) => m.categoryId === c.id && !isLinked(state, m)).length + state.purchases.filter((p) => p.categoryId === c.id).length,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
}

// RF-11: planned installments and registered purchases of the card, one entry per future month.
export async function getFutureInstallments(cardId: number): Promise<FutureInstallments[]> {
  const state = await load();
  const byMonth = new Map<MonthKey, FutureInstallments>();
  const add = (month: MonthKey, amount: number) => {
    const entry = byMonth.get(month) ?? { month, amount: 0, count: 0 };
    entry.amount = cents(entry.amount + amount);
    entry.count += 1;
    byMonth.set(month, entry);
  };
  for (const { month, amount } of plannedOf(state, cardId)) add(month, amount);
  for (const m of state.movements) if (m.cardId === cardId && isFutureMonth(monthOf(m.date))) add(monthOf(m.date), m.amount);
  return [...byMonth.values()].sort((a, b) => a.month.localeCompare(b.month));
}

// RF-10: planned installments of the card in a future month (read-only).
export async function getMonthPreview(cardId: number, month: MonthKey): Promise<MonthPreview> {
  const planned = plannedOf(await load(), cardId, month).sort((a, b) => a.date.localeCompare(b.date) || a.purchaseId - b.purchaseId);
  return { month, amount: sum(planned.map((p) => p.amount)), installments: planned };
}

// RN-13: the furthest future month that has a planned installment or a purchase, across every card.
export async function getLastFutureMonth(): Promise<MonthKey | null> {
  const state = await load();
  const months = [
    ...plannedOf(state, null).map((p) => p.month),
    ...state.movements.map((m) => monthOf(m.date)).filter(isFutureMonth),
  ];
  return months.sort().at(-1) ?? null;
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
  return { needsStart: Boolean(cardOf(state, cardId)) && !findMonth(state, cardId, currentMonth()) };
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

// RN-07: the month starts by itself with the card's current limit, and the
// installments that are due are recorded.
export function startMonth(cardId: number, month: MonthKey) {
  return mutate((state) => {
    const card = findCard(state, cardId);
    ensureMonth(state, card, requireMonth(month));
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

// RN-12: removing a card wipes its months, purchases and installment purchases; categories stay.
export function deleteCard(cardId: number) {
  return mutate((state) => {
    findCard(state, cardId);
    state.cards = state.cards.filter((c) => c.id !== cardId);
    state.months = state.months.filter((m) => m.cardId !== cardId);
    state.movements = state.movements.filter((m) => m.cardId !== cardId);
    state.purchases = state.purchases.filter((p) => p.cardId !== cardId);
    if (state.selectedCardId === cardId) state.selectedCardId = state.cards[0]?.id ?? null;
  });
}

// --- categories -------------------------------------------------------------

export function createCategory(input: CategoryInput) {
  return mutate((state) => {
    const category: StoredCategory = { id: state.nextId++, name: requireCategoryName(state, input.name) };
    state.categories.push(category);
    return category;
  });
}

export function updateCategory(categoryId: number, input: CategoryInput) {
  return mutate((state) => {
    const category = findCategory(state, categoryId);
    category.name = requireCategoryName(state, input.name, category.id);
    return category;
  });
}

// RN-06: purchases and installment purchases keep existing, without a category.
export function deleteCategory(categoryId: number) {
  return mutate((state) => {
    findCategory(state, categoryId);
    state.categories = state.categories.filter((c) => c.id !== categoryId);
    for (const m of state.movements) if (m.categoryId === categoryId) m.categoryId = null;
    for (const p of state.purchases) if (p.categoryId === categoryId) p.categoryId = null;
  });
}

// --- purchases (movements) ----------------------------------------------------

export function createMovement(cardId: number, categoryId: number | null, input: MovementInput) {
  return mutate((state) => {
    const card = findCard(state, cardId);
    const movement: StoredMovement = {
      id: state.nextId++, cardId, categoryId: requireCategory(state, categoryId),
      description: requireText(input.description, 'Descrição', 200), amount: requireAmount(input.amount, 'Valor'), date: requireDate(input.date),
    };
    ensureMonthOf(state, card, movement.date);
    state.movements.push(movement);
    return movement;
  });
}

export function updateMovement(movementId: number, categoryId: number | null, input: MovementInput) {
  return mutate((state) => {
    const movement = findMovement(state, movementId);
    requireStandalone(state, movement);
    Object.assign(movement, {
      categoryId: requireCategory(state, categoryId),
      description: requireText(input.description, 'Descrição', 200), amount: requireAmount(input.amount, 'Valor'), date: requireDate(input.date),
    });
    ensureMonthOf(state, findCard(state, movement.cardId), movement.date);
    return movement;
  });
}

export function deleteMovement(movementId: number) {
  return mutate((state) => {
    const movement = findMovement(state, movementId);
    requireStandalone(state, movement);
    state.movements = state.movements.filter((m) => m.id !== movement.id);
  });
}

// --- installment purchases ----------------------------------------------------

export function createPurchase(cardId: number, categoryId: number | null, input: PurchaseInput) {
  return mutate((state) => {
    findCard(state, cardId);
    const purchase: StoredPurchase = { id: state.nextId++, cardId, categoryId: requireCategory(state, categoryId), ...requirePurchase(input) };
    state.purchases.push(purchase);
    syncPurchases(state, cardId);
    return purchase;
  });
}

// RN-09: every recorded installment is dropped and recorded again.
export function updatePurchase(purchaseId: number, categoryId: number | null, input: PurchaseInput) {
  return mutate((state) => {
    const purchase = findPurchase(state, purchaseId);
    const next = { categoryId: requireCategory(state, categoryId), ...requirePurchase(input, purchase.firstInstallment) };
    state.movements = state.movements.filter((m) => m.purchaseId !== purchase.id);
    Object.assign(purchase, next);
    syncPurchases(state, purchase.cardId);
    return purchase;
  });
}

// RN-10
export function deletePurchase(purchaseId: number) {
  return mutate((state) => {
    const purchase = findPurchase(state, purchaseId);
    state.movements = state.movements.filter((m) => m.purchaseId !== purchase.id);
    state.purchases = state.purchases.filter((p) => p.id !== purchase.id);
  });
}

// --- income -------------------------------------------------------------------

const findIncome = (state: State, incomeId: number) => {
  const income = state.incomes.find((i) => i.id === incomeId);
  if (!income) throw new Error('Entrada não encontrada.');
  return income;
};

// RN-01: a one-off income occurs in its own month; a recurring one from
// firstMonth to lastMonth (or with no end).
const incomeOccursIn = (income: StoredIncome, month: MonthKey) =>
  income.recurring ? month >= income.firstMonth && (!income.lastMonth || month <= income.lastMonth) : month === income.firstMonth;

// D10: the same day, or the month's last day when it has no such day.
function incomeDate(month: MonthKey, day: number) {
  const date = `${month}-${String(day).padStart(2, '0')}`;
  const last = lastDayOf(month);
  return date > last ? last : date;
}

const exceptionOf = (state: State, incomeId: number, month: MonthKey) =>
  state.incomeExceptions.find((e) => e.incomeId === incomeId && e.month === month);

// RN-02: the month's exception, if any, overrides the rule or removes the month.
function occurrenceOf(state: State, income: StoredIncome, month: MonthKey): IncomeOccurrence | null {
  if (!incomeOccursIn(income, month)) return null;
  const exception = exceptionOf(state, income.id, month);
  if (exception?.skip) return null;
  return {
    incomeId: income.id, kind: income.kind, recurring: income.recurring, lastMonth: income.lastMonth,
    description: exception?.description ?? income.description,
    amount: exception?.amount ?? income.amount,
    date: incomeDate(month, exception?.day ?? income.day),
  };
}

// RN-04
function requireIncome(input: IncomeInput) {
  if (!INCOME_KINDS.includes(input?.kind)) throw new Error('Tipo é obrigatório.');
  const description = typeof input.description === 'string' ? input.description.trim() : '';
  if (description.length > 200) throw new Error('Descrição deve ter no máximo 200 caracteres.');
  const amount = Number(input.amount);
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('Valor deve ser maior que zero.');
  const date = requireDate(input.date);
  const month = monthOf(date);
  const recurring = Boolean(input.recurring);
  let lastMonth: MonthKey | null = null;
  if (recurring && input.lastMonth) {
    if (!isMonthKey(input.lastMonth)) throw new Error('Mês inválido.');
    if (input.lastMonth < month) throw new Error('O mês final deve ser igual ou posterior ao mês inicial.');
    lastMonth = input.lastMonth;
  }
  return { kind: input.kind, description, amount: cents(amount), month, day: Number(date.slice(8, 10)), recurring, lastMonth };
}

const dropExceptionsFrom = (state: State, incomeId: number, month: MonthKey) => {
  state.incomeExceptions = state.incomeExceptions.filter((e) => e.incomeId !== incomeId || e.month < month);
};

const removeIncome = (state: State, incomeId: number) => {
  state.incomes = state.incomes.filter((i) => i.id !== incomeId);
  state.incomeExceptions = state.incomeExceptions.filter((e) => e.incomeId !== incomeId);
};

function requireOccurrence(state: State, incomeId: number, month: MonthKey) {
  const income = findIncome(state, incomeId);
  if (!isMonthKey(month) || !incomeOccursIn(income, month)) throw new Error('Esta entrada não ocorre neste mês.');
  return income;
}

export async function getIncomes(month: MonthKey): Promise<Incomes> {
  const state = await load();
  const items = state.incomes
    .map((income) => occurrenceOf(state, income, month))
    .filter((item): item is IncomeOccurrence => item !== null)
    .sort((a, b) => a.date.localeCompare(b.date) || a.incomeId - b.incomeId);
  return { month, totalAmount: cents(items.reduce((sum, item) => sum + item.amount, 0)), items };
}

// RN-09: from the oldest income (never later than now) to a year ahead. With
// no income at all only the current month opens.
export async function getIncomeRange(): Promise<IncomeRange> {
  const state = await load();
  const now = currentMonth();
  if (!state.incomes.length) return { first: now, last: now };
  return { first: state.incomes.reduce((min, i) => (i.firstMonth < min ? i.firstMonth : min), now), last: shiftMonth(now, 12) };
}

export function createIncome(input: IncomeInput) {
  return mutate((state) => {
    const { month, ...fields } = requireIncome(input);
    const income: StoredIncome = { id: state.nextId++, firstMonth: month, ...fields };
    state.incomes.push(income);
    return income;
  });
}

// RN-05 / RN-06: "month" adjusts one month; "forward" splits the rule.
export function updateIncome(incomeId: number, month: MonthKey, scope: IncomeScope, input: IncomeInput) {
  return mutate((state) => {
    const income = requireOccurrence(state, incomeId, month);
    const { month: inputMonth, ...fields } = requireIncome(input);
    if (!income.recurring) {
      Object.assign(income, { firstMonth: inputMonth, ...fields });
      return income;
    }
    if (inputMonth !== month) throw new Error(`A data deve estar dentro de ${monthLabel(month)}.`);
    if (scope === 'month') {
      state.incomeExceptions = state.incomeExceptions.filter((e) => !(e.incomeId === incomeId && e.month === month));
      state.incomeExceptions.push({ incomeId, month, skip: false, amount: fields.amount, description: fields.description, day: fields.day });
      return income;
    }
    dropExceptionsFrom(state, incomeId, month);
    if (month === income.firstMonth) {
      Object.assign(income, fields);
      return income;
    }
    income.lastMonth = shiftMonth(month, -1);
    const next: StoredIncome = { id: state.nextId++, firstMonth: month, ...fields };
    state.incomes.push(next);
    return next;
  });
}

// RN-07 / RN-08
export function deleteIncome(incomeId: number, month: MonthKey, scope: IncomeScope) {
  return mutate((state) => {
    const income = requireOccurrence(state, incomeId, month);
    if (!income.recurring || (scope === 'forward' && month === income.firstMonth)) return removeIncome(state, incomeId);
    if (scope === 'month') {
      state.incomeExceptions = state.incomeExceptions.filter((e) => !(e.incomeId === incomeId && e.month === month));
      state.incomeExceptions.push({ incomeId, month, skip: true });
      return;
    }
    income.lastMonth = shiftMonth(month, -1);
    dropExceptionsFrom(state, incomeId, month);
  });
}
