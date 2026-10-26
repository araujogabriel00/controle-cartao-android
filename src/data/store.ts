import { Preferences } from '@capacitor/preferences';
import { CARD_COLOR_KEYS, isCardColor, type CardColor } from '@/lib/card-colors';
import { currentMonth, isFutureMonth, isMonthKey, lastDayOf, money, monthLabel, monthOf, shiftMonth, type MonthKey } from '@/lib/format';

const STORAGE_KEY = 'controle-cartao:v1';

export type { MonthKey } from '@/lib/format';
export type { CardColor } from '@/lib/card-colors';
export type StoredCard = { id: number; name: string; color: CardColor };
export type StoredMonth = { cardId: number; month: MonthKey };
// Global (purchases and categories D2): no card, month or budget.
export type StoredCategory = { id: number; name: string };
// A purchase on a card; its month is monthOf(date). Installments carry the
// purchase they belong to; installmentCount stays even after the purchase is
// gone, so a kept installment still shows "k/N".
export type StoredMovement = {
  id: number; cardId: number; categoryId: number | null; description: string; amount: number; date: string;
  purchaseId?: number; installment?: number; installmentCount?: number;
  // Set on the charges of a recurring purchase (up to the current month).
  recurringId?: number;
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

// A monthly charge on a card. Charges up to the current month are recorded as
// purchases (recurringId); later ones are planned, never stored.
export type StoredRecurring = {
  id: number; cardId: number; categoryId: number | null; description: string; amount: number;
  firstMonth: MonthKey; day: number; lastMonth: MonthKey | null;
};
// Skips or adjusts a single month of a recurring purchase.
export type StoredRecurringException = { recurringId: number; month: MonthKey; skip: boolean; description?: string; amount?: number; day?: number };

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

// A fixed bill (rent, internet...) always repeats every month; its months are
// computed, never stored. An exception adjusts or skips a single month.
export type StoredBill = { id: number; name: string; amount: number; firstMonth: MonthKey; day: number; lastMonth: MonthKey | null };
export type StoredBillException = { billId: number; month: MonthKey; skip: boolean; name?: string; amount?: number; day?: number };
export type StoredDailyExpense = { id: number; categoryId: number | null; description: string; amount: number; date: string };

// A benefit (VR/VA...) is a monthly balance, apart from the cards. `amounts` is
// the history of its monthly value (ascending by `from`); the first entry
// starts at firstMonth.
export type BenefitSplitItem = { categoryId: number; amount: number };
export type StoredBenefit = {
  id: number; name: string; firstMonth: MonthKey; lastMonth: MonthKey | null;
  amounts: { from: MonthKey; amount: number }[];
  // How the monthly value is divided by category, by `from` ascending (RN-15); [] = never divided.
  splits: { from: MonthKey; items: BenefitSplitItem[] }[];
  // A closed category stops receiving spends in the months [from, to) (RN-21, RN-24).
  closures: { categoryId: number; from: MonthKey; to: MonthKey | null }[];
};
export type StoredBenefitSpend = {
  id: number; benefitId: number; categoryId: number | null; description: string; amount: number; date: string;
};

type State = {
  version: 10;
  nextId: number;
  selectedCardId: number | null;
  cards: StoredCard[];
  months: StoredMonth[];
  categories: StoredCategory[];
  movements: StoredMovement[];
  purchases: StoredPurchase[];
  incomes: StoredIncome[];
  incomeExceptions: StoredIncomeException[];
  benefits: StoredBenefit[];
  benefitSpends: StoredBenefitSpend[];
  bills: StoredBill[];
  billExceptions: StoredBillException[];
  dailyExpenses: StoredDailyExpense[];
  recurrings: StoredRecurring[];
  recurringExceptions: StoredRecurringException[];
};

// Previous formats, kept only to migrate saved data.
type OldCategory = { id: number; cardId: number; month: MonthKey; name: string; amount: number; isClosed: boolean };
type OldMovement = Omit<StoredMovement, 'cardId' | 'categoryId'> & { categoryId: number };
type OldPurchase = Omit<StoredPurchase, 'categoryId'> & { categoryName: string };
// Until v9 the card and its months carried a limit (cartao-sem-limite D2).
type StateV9 = Omit<State, 'version' | 'cards' | 'months'> & {
  version: 9; cards: (StoredCard & { limitAmount: number })[]; months: (StoredMonth & { limitAmount: number })[];
};
type StateV8 = Omit<StateV9, 'version' | 'recurrings' | 'recurringExceptions'> & { version: 8 };
type StateV7 = Omit<StateV8, 'version' | 'bills' | 'billExceptions' | 'dailyExpenses'> & { version: 7 };
type StateV6 = Omit<StateV7, 'version' | 'benefits' | 'benefitSpends'> & { version: 6 };
type StateV5 = Omit<StateV6, 'version' | 'categories' | 'movements' | 'purchases'> & {
  version: 5; categories: OldCategory[]; movements: OldMovement[]; purchases: OldPurchase[];
};
type StateV4 = Omit<StateV5, 'version' | 'incomes' | 'incomeExceptions'> & { version: 4 };
type StateV3 = Omit<StateV4, 'version' | 'purchases'> & { version: 3 };
type CardV2 = Omit<StoredCard, 'color'> & { limitAmount: number };
type StateV2 = {
  version: 2;
  nextId: number;
  card: CardV2 | null;
  months: (Omit<StoredMonth, 'cardId'> & { limitAmount: number })[];
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
type Saved = StateV9 | StateV8 | StateV7 | StateV6 | StateV5 | StateV4 | StateV3 | StateV2 | StateV1;

// invoiceAmount is the card's invoice (sum of the purchases) in the requested month.
export type Card = StoredCard & { invoiceAmount: number; movementCount: number };
export type Cards = { selectedCardId: number | null; nextColor: CardColor; cards: Card[] };
export type Category = StoredCategory & { movementCount: number };
export type CategorySummary = { categoryId: number | null; name: string | null; amount: number; percent: number };
export type Movement = StoredMovement & {
  categoryName: string | null;
  purchase?: { id: number; totalAmount: number; installmentCount: number; firstInstallment: number };
  recurring?: { id: number; amount: number; firstMonth: MonthKey; day: number; lastMonth: MonthKey | null };
};
// A charge of a future month: an installment of a purchase or a recurring charge.
export type PlannedInstallment = {
  kind: 'installment' | 'recurring';
  purchaseId?: number; recurringId?: number;
  description: string; installment?: number; installmentCount?: number; amount: number; date: string;
  categoryId: number | null; categoryName: string | null;
  purchase?: { id: number; totalAmount: number; installmentCount: number; firstInstallment: number };
  // Set on a planned recurring charge: what the edit dialog needs (specs/compras-em-qualquer-mes.md RF-01).
  recurring?: { id: number; lastMonth: MonthKey | null };
};
export type AllMovements = { movements: Movement[]; planned: PlannedInstallment[] };
export type MonthPreview = { month: MonthKey; amount: number; installments: PlannedInstallment[] };
export type FutureInstallments = { month: MonthKey; amount: number; count: number };
export type MonthSummary = {
  month: MonthKey;
  invoiceAmount: number;
  movementCount: number;
};
export type MonthStatus = { needsStart: boolean };
export type Consolidated = {
  month: MonthKey;
  cardCount: number;
  invoiceAmount: number;
};

export type IncomeOccurrence = { incomeId: number; kind: IncomeKind; description: string; amount: number; date: string; recurring: boolean; lastMonth: MonthKey | null };
export type Incomes = { month: MonthKey; totalAmount: number; items: IncomeOccurrence[] };
export type IncomeRange = { first: MonthKey; last: MonthKey };
export type IncomeScope = 'month' | 'forward';

export type BillOccurrence = { billId: number; name: string; amount: number; date: string; lastMonth: MonthKey | null };
export type Bills = { month: MonthKey; totalAmount: number; items: BillOccurrence[] };
export type DailyExpense = StoredDailyExpense & { categoryName: string | null };
export type DailyExpenses = { month: MonthKey; totalAmount: number; items: DailyExpense[]; summary: CategorySummary[] };
// RN-06: what comes in, what goes out and what is left in the month.
// resultAmount is the month on its own; previousAmount is what came from the months before it; balanceAmount adds the two.
export type MonthCash = {
  month: MonthKey; incomeAmount: number; billsAmount: number; dailyAmount: number; cardsAmount: number;
  resultAmount: number; previousAmount: number; balanceAmount: number;
};

export type BenefitSpend = StoredBenefitSpend & { categoryName: string | null };
// One line of the "by category" list (RN-17); categoryId null is "Sem categoria".
export type BenefitCategoryRow = {
  categoryId: number | null; name: string | null;
  amount: number; carriedAmount: number; spentAmount: number; availableAmount: number; percentUsed: number;
  closed: boolean; releasedAmount: number;
};
export type BenefitItem = {
  id: number; name: string; firstMonth: MonthKey; lastMonth: MonthKey | null;
  amount: number; carriedAmount: number; spentAmount: number; availableAmount: number; percentUsed: number;
  spends: BenefitSpend[];
  // Spends in every month, for the delete confirmation (RF-06).
  spendCount: number;
  // The division in force this month, and its lines (empty without a division, D17).
  split: BenefitSplitItem[];
  categories: BenefitCategoryRow[];
};
export type Benefits = { month: MonthKey; totalAvailable: number; items: BenefitItem[] };
export type BenefitRange = { first: MonthKey; last: MonthKey };

export type CardInput = { name: string; color?: CardColor };
export type CategoryInput = { name: string };
export type MovementInput = { description: string; amount: number; date: string };
// `date` gives the first month and the day of the month; no lastMonth = no end.
export type RecurringInput = { description: string; amount: number; date: string; lastMonth?: MonthKey | null };
export type BillInput = { name: string; amount: number; date: string; lastMonth?: MonthKey | null };
export type DailyExpenseInput = { description: string; amount: number; date: string };
export type IncomeInput = { kind: IncomeKind; description?: string; amount: number; date: string; recurring: boolean; lastMonth?: MonthKey | null };
export type BenefitInput = { name: string; amount: number; firstMonth: MonthKey; lastMonth?: MonthKey | null; split?: BenefitSplitItem[] };
// `amount` starts to count in the month the update is made for ("Vale a partir de").
export type BenefitUpdate = { name: string; amount: number; lastMonth?: MonthKey | null; split?: BenefitSplitItem[] };
export type BenefitSpendInput = { description: string; amount: number; date: string };
// `installment` is the one that falls in the month of `date`; on create the
// purchase starts there, on update `firstInstallment` says where it starts.
export type PurchaseInput = { description: string; totalAmount: number; installmentCount: number; installment: number; firstInstallment?: number; date: string };

const emptyState = (): State => ({ version: 10, nextId: 1, selectedCardId: null, cards: [], months: [], categories: [], movements: [], purchases: [], incomes: [], incomeExceptions: [], benefits: [], benefitSpends: [], bills: [], billExceptions: [], dailyExpenses: [], recurrings: [], recurringExceptions: [] });

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
function migrateV5(old: StateV5): StateV6 {
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

// Benefits didn't exist before v7.
const migrateV6 = (old: StateV6): StateV7 => ({ ...old, version: 7, benefits: [], benefitSpends: [] });

// Fixed bills and daily expenses didn't exist before v8.
const migrateV7 = (old: StateV7): StateV8 => ({
  ...old, version: 8, bills: [], billExceptions: [], dailyExpenses: [],
  benefits: old.benefits.map((b) => ({ ...b, splits: b.splits ?? [], closures: b.closures ?? [] })),
});

// Recurring purchases didn't exist before v9.
const migrateV8 = (old: StateV8): StateV9 => ({ ...old, version: 9, recurrings: [], recurringExceptions: [] });

// RN-07: the limit leaves the cards and their months for good.
const migrateV9 = (old: StateV9): State => ({
  ...old, version: 10,
  cards: old.cards.map(({ id, name, color }) => ({ id, name, color })),
  months: old.months.map(({ cardId, month }) => ({ cardId, month })),
});

function migrate(old: Saved): State {
  if (old.version === 1) return migrate(migrateV1(old));
  if (old.version === 2) return migrate(migrateV2(old));
  if (old.version === 3) return migrate(migrateV3(old));
  if (old.version === 4) return migrate(migrateV4(old));
  if (old.version === 5) return migrate(migrateV5(old));
  if (old.version === 6) return migrate(migrateV6(old));
  if (old.version === 7) return migrate(migrateV7(old));
  if (old.version === 8) return migrate(migrateV8(old));
  return migrateV9(old);
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
      if (parsed?.version === 10) {
        for (const b of parsed.benefits) { b.splits ??= []; b.closures ??= []; }
        return parsed;
      }
      const version: number | undefined = parsed?.version;
      if (version !== 9 && version !== 8 && version !== 7 && version !== 6 && version !== 5 && version !== 4 && version !== 3 && version !== 2 && version !== 1) return emptyState();
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

// RN-01: a recurring purchase charges every month from firstMonth to lastMonth (or with no end).
const recurringOccursIn = (r: StoredRecurring, month: MonthKey) => month >= r.firstMonth && (!r.lastMonth || month <= r.lastMonth);

// RN-01 / RN-02: the charge of a month, with its exception applied; null if it doesn't happen or was skipped.
function recurringCharge(state: State, r: StoredRecurring, month: MonthKey) {
  if (!recurringOccursIn(r, month)) return null;
  const exception = state.recurringExceptions.find((e) => e.recurringId === r.id && e.month === month);
  if (exception?.skip) return null;
  return { description: exception?.description ?? r.description, amount: exception?.amount ?? r.amount, date: incomeDate(month, exception?.day ?? r.day) };
}

type Planned = PlannedInstallment & { cardId: number; month: MonthKey };

// Installments of future months, which only exist as part of the purchase
// until their month comes. A null cardId means every card.
function plannedOf(state: State, cardId: number | null, month?: MonthKey): Planned[] {
  const current = currentMonth();
  const installments = state.purchases
    .filter((p) => cardId === null || p.cardId === cardId)
    .flatMap((p) => installmentsOf(p)
      .filter((k) => installmentMonth(p, k) > current && (!month || installmentMonth(p, k) === month))
      .map((k): Planned => ({
        kind: 'installment',
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
        purchase: { id: p.id, totalAmount: p.totalAmount, installmentCount: p.installmentCount, firstInstallment: p.firstInstallment },
      })));
  // RN-03: recurring charges of the months after the current one, up to a year ahead.
  const cap = shiftMonth(current, 12);
  const recurring = state.recurrings
    .filter((r) => cardId === null || r.cardId === cardId)
    .flatMap((r) => {
      const planned: Planned[] = [];
      for (let m = shiftMonth(current, 1); m <= cap && (!r.lastMonth || m <= r.lastMonth); m = shiftMonth(m, 1)) {
        if (m < r.firstMonth || (month && m !== month)) continue;
        const charge = recurringCharge(state, r, m);
        if (charge) planned.push({ kind: 'recurring', cardId: r.cardId, month: m, recurringId: r.id, ...charge, categoryId: r.categoryId, categoryName: categoryNameOf(state, r.categoryId), recurring: { id: r.id, lastMonth: r.lastMonth } });
      }
      return planned;
    });
  return [...installments, ...recurring];
}

// --- month totals -------------------------------------------------------------

const movementsOf = (state: State, cardId: number, month: MonthKey) =>
  state.movements.filter((m) => m.cardId === cardId && monthOf(m.date) === month);

// RN-01: the purchases of the month; a future month adds its planned installments.
function usedOf(state: State, cardId: number, month: MonthKey) {
  const planned = isFutureMonth(month) ? plannedOf(state, cardId, month).map((p) => p.amount) : [];
  return sum([...movementsOf(state, cardId, month).map((m) => m.amount), ...planned]);
}

function summaryOf(state: State, card: StoredCard, month: MonthKey): MonthSummary {
  const invoiceAmount = usedOf(state, card.id, month);
  const movementCount = movementsOf(state, card.id, month).length + (isFutureMonth(month) ? plannedOf(state, card.id, month).length : 0);
  return { month, invoiceAmount, movementCount };
}

function toCard(state: State, card: StoredCard, month: MonthKey): Card {
  const { invoiceAmount, movementCount } = summaryOf(state, card, month);
  return { ...card, invoiceAmount, movementCount };
}

// RN-03: every card counts, even the ones that haven't started this month.
function consolidatedOf(state: State, month: MonthKey): Consolidated {
  return { month, cardCount: state.cards.length, invoiceAmount: sum(state.cards.map((card) => usedOf(state, card.id, month))) };
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

const isRecurringCharge = (state: State, movement: StoredMovement) => state.recurrings.some((r) => r.id === movement.recurringId);

const isLinked = (state: State, movement: StoredMovement) => state.purchases.some((p) => p.id === movement.purchaseId);

// RN-11: an installment only changes through its purchase.
function requireStandalone(state: State, movement: StoredMovement) {
  if (isLinked(state, movement)) throw new Error('Este lançamento é uma parcela. Altere a compra parcelada.');
  if (isRecurringCharge(state, movement)) throw new Error('Esta compra é recorrente. Altere a compra recorrente.');
}

// Starts the card's month, if it wasn't started yet.
function ensureMonth(state: State, card: StoredCard, month: MonthKey) {
  if (findMonth(state, card.id, month)) return false;
  state.months.push({ cardId: card.id, month });
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

const hasCharge = (state: State, recurringId: number, month: MonthKey) =>
  state.movements.some((m) => m.recurringId === recurringId && monthOf(m.date) === month);

// RN-02: records every charge of the card up to the current month that is missing and wasn't skipped.
function syncRecurrings(state: State, cardId: number) {
  const current = currentMonth();
  for (const r of state.recurrings.filter((x) => x.cardId === cardId)) {
    for (let m = r.firstMonth; m <= current && (!r.lastMonth || m <= r.lastMonth); m = shiftMonth(m, 1)) {
      if (hasCharge(state, r.id, m)) continue;
      const charge = recurringCharge(state, r, m);
      if (!charge) continue;
      ensureMonth(state, findCard(state, r.cardId), m);
      state.movements.push({ id: state.nextId++, cardId: r.cardId, categoryId: r.categoryId, description: charge.description, amount: charge.amount, date: charge.date, recurringId: r.id });
    }
  }
}

// RN-05 / RN-15. On create the purchase starts at `installment`.
function requirePurchase(input: PurchaseInput, firstFallback?: number, editing = false) {
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
  if (!editing && date > lastDayOf(shiftMonth(currentMonth(), 12))) throw new Error('A data deve ser de até 12 meses à frente.');
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

// A stored purchase with its category name and the installment or recurring data the screens need.
function toMovement(state: State, m: StoredMovement): Movement {
  const purchase = state.purchases.find((p) => p.id === m.purchaseId);
  const recurring = state.recurrings.find((r) => r.id === m.recurringId);
  const base = { ...m, categoryName: categoryNameOf(state, m.categoryId) };
  if (purchase) return { ...base, purchase: { id: purchase.id, totalAmount: purchase.totalAmount, installmentCount: purchase.installmentCount, firstInstallment: purchase.firstInstallment } };
  return recurring ? { ...base, recurring: { id: recurring.id, amount: recurring.amount, firstMonth: recurring.firstMonth, day: recurring.day, lastMonth: recurring.lastMonth } } : base;
}
const newestFirst = (a: StoredMovement, b: StoredMovement) => b.date.localeCompare(a.date) || b.id - a.id;

// RF-03: the card's purchases of the month, newest first.
export async function getMovements(cardId: number, month: MonthKey): Promise<Movement[]> {
  const state = await load();
  return movementsOf(state, cardId, month).sort(newestFirst).map((m) => toMovement(state, m));
}

// specs/todas-as-compras.md RN-04: every purchase of the card in any month, plus the planned
// installments and recurring charges of the future months (specs/compras-em-qualquer-mes.md RN-05).
export async function getAllMovements(cardId: number): Promise<AllMovements> {
  const state = await load();
  return {
    movements: state.movements.filter((m) => m.cardId === cardId).sort(newestFirst).map((m) => toMovement(state, m)),
    planned: plannedOf(state, cardId),
  };
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
      movementCount: state.movements.filter((m) => m.categoryId === c.id && !isLinked(state, m) && !isRecurringCharge(state, m)).length + state.purchases.filter((p) => p.categoryId === c.id).length
        + state.recurrings.filter((r) => r.categoryId === c.id).length
        + state.benefitSpends.filter((x) => x.categoryId === c.id).length + state.dailyExpenses.filter((x) => x.categoryId === c.id).length,
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
  const planned = plannedOf(await load(), cardId, month).sort((a, b) => a.date.localeCompare(b.date) || (a.purchaseId ?? a.recurringId ?? 0) - (b.purchaseId ?? b.recurringId ?? 0));
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

// One entry per month started by any card, newest first.
export async function getConsolidatedHistory(): Promise<Consolidated[]> {
  const state = await load();
  return [...new Set(state.months.map((m) => m.month))]
    .sort((a, b) => b.localeCompare(a))
    .map((month) => consolidatedOf(state, month));
}

// --- months -----------------------------------------------------------------

// RN-06: the month starts by itself, and the
// installments that are due are recorded.
export function startMonth(cardId: number, month: MonthKey) {
  return mutate((state) => {
    const card = findCard(state, cardId);
    ensureMonth(state, card, requireMonth(month));
    syncPurchases(state, cardId);
    syncRecurrings(state, cardId);
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
    if (mode === 'create') {
      requireUniqueName(state, name);
      const color = input.color === undefined ? nextColorOf(state) : requireColor(input.color);
      const card: StoredCard = { id: state.nextId++, name, color };
      state.cards.push(card);
      state.selectedCardId = card.id;
      ensureMonth(state, card, currentMonth());
      return card;
    }
    const card = findCard(state, cardId ?? -1);
    requireUniqueName(state, name, card.id);
    card.name = name;
    if (input.color !== undefined) card.color = requireColor(input.color);
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
    const recurringIds = new Set(state.recurrings.filter((r) => r.cardId === cardId).map((r) => r.id));
    state.recurrings = state.recurrings.filter((r) => r.cardId !== cardId);
    state.recurringExceptions = state.recurringExceptions.filter((e) => !recurringIds.has(e.recurringId));
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
    for (const x of state.benefitSpends) if (x.categoryId === categoryId) x.categoryId = null;
    for (const x of state.dailyExpenses) if (x.categoryId === categoryId) x.categoryId = null;
    for (const r of state.recurrings) if (r.categoryId === categoryId) r.categoryId = null;
    for (const b of state.benefits) {
      for (const entry of b.splits) entry.items = entry.items.filter((i) => i.categoryId !== categoryId);
      b.closures = b.closures.filter((c) => c.categoryId !== categoryId);
    }
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
    const next = { categoryId: requireCategory(state, categoryId), ...requirePurchase(input, purchase.firstInstallment, true) };
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

// RN-12: from the oldest income, bill or daily expense (never later than now)
// to a year ahead. With none of them only the current month opens.
export async function getIncomeRange(): Promise<IncomeRange> {
  const state = await load();
  const now = currentMonth();
  const firsts = [...state.incomes.map((i) => i.firstMonth), ...state.bills.map((b) => b.firstMonth), ...state.dailyExpenses.map((x) => monthOf(x.date))];
  if (!firsts.length) return { first: now, last: now };
  return { first: firsts.reduce((min, m) => (m < min ? m : min), now), last: shiftMonth(now, 12) };
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

// --- benefits -----------------------------------------------------------------

const findBenefit = (state: State, benefitId: number) => {
  const benefit = state.benefits.find((b) => b.id === benefitId);
  if (!benefit) throw new Error('Benefício não encontrado.');
  return benefit;
};

// RN-01: from the first month to the last one (or with no end).
const benefitActiveIn = (benefit: StoredBenefit, month: MonthKey) =>
  month >= benefit.firstMonth && (!benefit.lastMonth || month <= benefit.lastMonth);

// RN-02: the latest history entry that started on or before the month.
function benefitAmountIn(benefit: StoredBenefit, month: MonthKey) {
  let amount = 0;
  for (const entry of benefit.amounts) if (entry.from <= month) amount = entry.amount;
  return amount;
}

// RN-04: credits of the active months before `month`, minus what was spent before it.
function benefitCarriedIn(state: State, benefit: StoredBenefit, month: MonthKey) {
  let credits = 0;
  for (let m = benefit.firstMonth; m < month && (!benefit.lastMonth || m <= benefit.lastMonth); m = shiftMonth(m, 1)) credits += benefitAmountIn(benefit, m);
  const spent = sum(state.benefitSpends.filter((x) => x.benefitId === benefit.id && monthOf(x.date) < month).map((x) => x.amount));
  return cents(credits - spent);
}

// RN-15: the entry with the greatest `from` on or before the month.
function benefitSplitAt(benefit: StoredBenefit, month: MonthKey) {
  let items: BenefitSplitItem[] = [];
  for (const entry of benefit.splits) if (entry.from <= month) items = entry.items;
  return items;
}

const closureAt = (benefit: StoredBenefit, categoryId: number, month: MonthKey) =>
  benefit.closures.find((c) => c.categoryId === categoryId && c.from <= month && (c.to === null || month < c.to));

// After its closing month, a closed category's share goes to "Sem categoria" (RN-22).
const isFrozen = (benefit: StoredBenefit, categoryId: number, month: MonthKey) => {
  const closure = closureAt(benefit, categoryId, month);
  return Boolean(closure && month > closure.from);
};

type Line = { credit: number; carried: number; spent: number; available: number; released: number; closed: boolean };

// RN-17 / RN-22: walks the months from the first one to `month`, so resets on closing are applied.
function categoryLine(state: State, benefit: StoredBenefit, categoryId: number, month: MonthKey): Line {
  const spends = state.benefitSpends.filter((x) => x.benefitId === benefit.id && x.categoryId === categoryId);
  let balance = 0;
  for (let m = benefit.firstMonth; m <= month; m = shiftMonth(m, 1)) {
    const closure = closureAt(benefit, categoryId, m);
    const frozen = Boolean(closure && m > closure.from);
    const credit = frozen || !benefitActiveIn(benefit, m) ? 0 : benefitSplitAt(benefit, m).find((i) => i.categoryId === categoryId)?.amount ?? 0;
    const carried = frozen ? 0 : balance;
    const spent = sum(spends.filter((x) => monthOf(x.date) === m).map((x) => x.amount));
    const total = cents(carried + credit - spent);
    const closing = Boolean(closure && m === closure.from);
    if (m === month) return { credit, carried, spent, available: closing || frozen ? 0 : total, released: closing ? total : 0, closed: Boolean(closure) };
    balance = closing || frozen ? 0 : total;
  }
  return { credit: 0, carried: 0, spent: 0, available: 0, released: 0, closed: false };
}

// RN-17: what the value has beyond the division, plus what closed categories released.
function otherLine(state: State, benefit: StoredBenefit, month: MonthKey): Line {
  const spends = state.benefitSpends.filter((x) => x.benefitId === benefit.id && x.categoryId === null);
  let balance = 0;
  for (let m = benefit.firstMonth; m <= month; m = shiftMonth(m, 1)) {
    const kept = benefitSplitAt(benefit, m).filter((i) => !isFrozen(benefit, i.categoryId, m));
    const released = sum(benefit.closures.filter((c) => c.from === m).map((c) => categoryLine(state, benefit, c.categoryId, m).released));
    const credit = benefitActiveIn(benefit, m) ? cents(benefitAmountIn(benefit, m) - sum(kept.map((i) => i.amount)) + released) : 0;
    const spent = sum(spends.filter((x) => monthOf(x.date) === m).map((x) => x.amount));
    const total = cents(balance + credit - spent);
    if (m === month) return { credit, carried: balance, spent, available: total, released: 0, closed: false };
    balance = total;
  }
  return { credit: 0, carried: 0, spent: 0, available: 0, released: 0, closed: false };
}

// RN-18: lines only exist once the benefit has been divided; closed categories stay listed.
function benefitCategoryRows(state: State, benefit: StoredBenefit, month: MonthKey): BenefitCategoryRow[] {
  if (!benefit.splits.some((e) => e.from <= month && e.items.length)) return [];
  const current = new Set(benefitSplitAt(benefit, month).map((i) => i.categoryId));
  const ids = new Set<number>([
    ...benefit.splits.filter((e) => e.from <= month).flatMap((e) => e.items.map((i) => i.categoryId)),
    ...state.benefitSpends.filter((x) => x.benefitId === benefit.id && x.categoryId !== null && monthOf(x.date) <= month).map((x) => x.categoryId as number),
    ...benefit.closures.filter((c) => c.from <= month).map((c) => c.categoryId),
  ]);
  const toRow = (categoryId: number | null, line: Line): BenefitCategoryRow => ({
    categoryId, name: categoryNameOf(state, categoryId),
    amount: line.credit, carriedAmount: line.carried, spentAmount: line.spent, availableAmount: line.available,
    percentUsed: percent(line.spent, line.carried + line.credit), closed: line.closed, releasedAmount: line.released,
  });
  const rows = [...ids]
    .map((id) => ({ id, line: categoryLine(state, benefit, id, month) }))
    .filter(({ id, line }) => line.closed || current.has(id) || line.credit || line.carried || line.spent)
    .map(({ id, line }) => toRow(id, line));
  const other = otherLine(state, benefit, month);
  const open = rows.filter((r) => !r.closed).sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '', 'pt-BR'));
  const closed = rows.filter((r) => r.closed).sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '', 'pt-BR'));
  const showOther = other.credit || other.carried || other.spent;
  return [...open, ...(showOther ? [toRow(null, other)] : []), ...closed];
}

function benefitItemOf(state: State, benefit: StoredBenefit, month: MonthKey): BenefitItem {
  const amount = benefitAmountIn(benefit, month);
  const carriedAmount = benefitCarriedIn(state, benefit, month);
  const spends = state.benefitSpends
    .filter((x) => x.benefitId === benefit.id && monthOf(x.date) === month)
    .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id)
    .map((x) => ({ ...x, categoryName: categoryNameOf(state, x.categoryId) }));
  const spentAmount = sum(spends.map((x) => x.amount));
  return {
    id: benefit.id, name: benefit.name, firstMonth: benefit.firstMonth, lastMonth: benefit.lastMonth,
    amount, carriedAmount, spentAmount,
    availableAmount: cents(carriedAmount + amount - spentAmount),
    percentUsed: percent(spentAmount, carriedAmount + amount),
    spends,
    spendCount: state.benefitSpends.filter((x) => x.benefitId === benefit.id).length,
    split: benefitSplitAt(benefit, month),
    categories: benefitCategoryRows(state, benefit, month),
  };
}

// RN-06
function requireBenefitName(state: State, value: unknown, exceptId?: number) {
  const name = requireText(value, 'Nome do benefício', 120);
  if (state.benefits.some((b) => b.id !== exceptId && nameKey(b.name) === nameKey(name))) throw new Error('Já existe um benefício com esse nome.');
  return name;
}

function requireLastMonth(value: unknown, firstMonth: MonthKey): MonthKey | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value !== 'string' || !isMonthKey(value)) throw new Error('Mês inválido.');
  if (value < firstMonth) throw new Error('O mês final deve ser igual ou posterior ao mês inicial.');
  return value;
}

// RN-15: each category once, existing, with a value.
function requireSplit(state: State, value: unknown): BenefitSplitItem[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<number>();
  return value.map((item: BenefitSplitItem) => {
    const categoryId = requireCategory(state, item?.categoryId);
    if (categoryId === null) throw new Error('Categoria não encontrada.');
    if (seen.has(categoryId)) throw new Error('Cada categoria só pode aparecer uma vez na divisão.');
    seen.add(categoryId);
    return { categoryId, amount: requireAmount(item.amount, 'Valor da divisão') };
  });
}

// RN-16: wherever the value or the division changes, the division must fit the value.
function requireSplitFits(benefit: StoredBenefit) {
  const months = new Set([...benefit.amounts.map((e) => e.from), ...benefit.splits.map((e) => e.from)]);
  for (const month of months) {
    if (sum(benefitSplitAt(benefit, month).map((i) => i.amount)) > benefitAmountIn(benefit, month)) throw new Error('A divisão passa do valor mensal do benefício.');
  }
}

// RN-23: no spend in a category in a month it is closed for this benefit.
function requireCategoryOpen(state: State, benefit: StoredBenefit, categoryId: number | null, date: string) {
  if (categoryId !== null && closureAt(benefit, categoryId, monthOf(date))) throw new Error(`A categoria ${categoryNameOf(state, categoryId)} está fechada neste benefício.`);
}

// RN-07
function requireBenefitSpend(state: State, benefit: StoredBenefit, categoryId: number | null, input: BenefitSpendInput) {
  const date = requireDate(input.date);
  if (!benefitActiveIn(benefit, monthOf(date))) throw new Error('A data deve estar dentro do período do benefício.');
  requireCategoryOpen(state, benefit, categoryId, date);
  return {
    categoryId: requireCategory(state, categoryId),
    description: requireText(input.description, 'Descrição', 200),
    amount: requireAmount(input.amount, 'Valor'),
    date,
  };
}

export async function getBenefits(month: MonthKey): Promise<Benefits> {
  const state = await load();
  const items = state.benefits
    .filter((b) => benefitActiveIn(b, month))
    .map((b) => benefitItemOf(state, b, month))
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  return { month, totalAvailable: sum(items.map((i) => i.availableAmount)), items };
}

// RN-12: from the oldest benefit (never later than now) to a year ahead; with
// no benefit at all only the current month opens.
export async function getBenefitRange(): Promise<BenefitRange> {
  const state = await load();
  const now = currentMonth();
  if (!state.benefits.length) return { first: now, last: now };
  return { first: state.benefits.reduce((min, b) => (b.firstMonth < min ? b.firstMonth : min), now), last: shiftMonth(now, 12) };
}

export function createBenefit(input: BenefitInput) {
  return mutate((state) => {
    const name = requireBenefitName(state, input.name);
    const amount = requireAmount(input.amount, 'Valor');
    if (!isMonthKey(input.firstMonth)) throw new Error('Mês inválido.');
    const benefit: StoredBenefit = {
      id: state.nextId++, name, firstMonth: input.firstMonth, lastMonth: requireLastMonth(input.lastMonth, input.firstMonth),
      amounts: [{ from: input.firstMonth, amount }], splits: [], closures: [],
    };
    const items = requireSplit(state, input.split);
    if (items.length) benefit.splits.push({ from: input.firstMonth, items });
    requireSplitFits(benefit);
    state.benefits.push(benefit);
    return benefit;
  });
}

// RN-08 / RN-09: the new amount counts from `month` on; the history before it stays.
export function updateBenefit(benefitId: number, month: MonthKey, input: BenefitUpdate) {
  return mutate((state) => {
    const benefit = findBenefit(state, benefitId);
    const name = requireBenefitName(state, input.name, benefit.id);
    const amount = requireAmount(input.amount, 'Valor');
    if (!isMonthKey(month) || month < benefit.firstMonth) throw new Error('O valor não pode valer antes do mês inicial do benefício.');
    const lastMonth = requireLastMonth(input.lastMonth, benefit.firstMonth);
    if (lastMonth && state.benefitSpends.some((x) => x.benefitId === benefit.id && monthOf(x.date) > lastMonth)) throw new Error('Há gastos depois do mês final.');
    if (benefitAmountIn(benefit, month) !== amount) benefit.amounts = [...benefit.amounts.filter((e) => e.from < month), { from: month, amount }];
    // RN-19: the division is compared with the one in force, like the value.
    if (input.split !== undefined) {
      const items = requireSplit(state, input.split);
      const current = benefitSplitAt(benefit, month);
      const same = items.length === current.length && items.every((i) => current.some((c) => c.categoryId === i.categoryId && c.amount === i.amount));
      if (!same) benefit.splits = [...benefit.splits.filter((e) => e.from < month), { from: month, items }];
    }
    requireSplitFits(benefit);
    benefit.name = name;
    benefit.lastMonth = lastMonth;
    return benefit;
  });
}

// RN-10
export function deleteBenefit(benefitId: number) {
  return mutate((state) => {
    findBenefit(state, benefitId);
    state.benefits = state.benefits.filter((b) => b.id !== benefitId);
    state.benefitSpends = state.benefitSpends.filter((x) => x.benefitId !== benefitId);
  });
}

export function createBenefitSpend(benefitId: number, categoryId: number | null, input: BenefitSpendInput) {
  return mutate((state) => {
    const benefit = findBenefit(state, benefitId);
    const spend: StoredBenefitSpend = { id: state.nextId++, benefitId, ...requireBenefitSpend(state, benefit, categoryId, input) };
    state.benefitSpends.push(spend);
    return spend;
  });
}

export function updateBenefitSpend(spendId: number, categoryId: number | null, input: BenefitSpendInput) {
  return mutate((state) => {
    const spend = state.benefitSpends.find((x) => x.id === spendId);
    if (!spend) throw new Error('Gasto não encontrado.');
    const benefit = findBenefit(state, spend.benefitId);
    requireCategoryOpen(state, benefit, spend.categoryId, spend.date);
    Object.assign(spend, requireBenefitSpend(state, benefit, categoryId, input));
    return spend;
  });
}

export function deleteBenefitSpend(spendId: number) {
  return mutate((state) => {
    const spend = state.benefitSpends.find((x) => x.id === spendId);
    if (!spend) throw new Error('Gasto não encontrado.');
    requireCategoryOpen(state, findBenefit(state, spend.benefitId), spend.categoryId, spend.date);
    state.benefitSpends = state.benefitSpends.filter((x) => x.id !== spendId);
  });
}

// RN-21: closes the category for this benefit from `month` on, releasing what it has left.
export function closeBenefitCategory(benefitId: number, categoryId: number, month: MonthKey) {
  return mutate((state) => {
    const benefit = findBenefit(state, benefitId);
    findCategory(state, categoryId);
    if (!isMonthKey(month) || !benefitActiveIn(benefit, month)) throw new Error('A data deve estar dentro do período do benefício.');
    if (closureAt(benefit, categoryId, month)) throw new Error('A categoria já está fechada.');
    const later = benefit.closures.find((c) => c.categoryId === categoryId && c.from > month);
    if (later) throw new Error(`A categoria já tem fechamento a partir de ${monthLabel(later.from)}.`);
    if (state.benefitSpends.some((x) => x.benefitId === benefitId && x.categoryId === categoryId && monthOf(x.date) > month)) {
      throw new Error(`Há gastos desta categoria depois de ${monthLabel(month)}. Exclua-os antes de fechar.`);
    }
    benefit.closures.push({ categoryId, from: month, to: null });
  });
}

// RN-24: reopening in the closing month undoes it; later, the closure ends at `month`.
export function reopenBenefitCategory(benefitId: number, categoryId: number, month: MonthKey) {
  return mutate((state) => {
    const benefit = findBenefit(state, benefitId);
    const closure = isMonthKey(month) ? closureAt(benefit, categoryId, month) : undefined;
    if (!closure) throw new Error('A categoria não está fechada neste mês.');
    if (closure.from === month) benefit.closures = benefit.closures.filter((c) => c !== closure);
    else closure.to = month;
  });
}

// --- fixed bills ----------------------------------------------------------------

const findBill = (state: State, billId: number) => {
  const bill = state.bills.find((b) => b.id === billId);
  if (!bill) throw new Error('Conta fixa não encontrada.');
  return bill;
};

// RN-01: every month from firstMonth to lastMonth (or with no end).
const billOccursIn = (bill: StoredBill, month: MonthKey) => month >= bill.firstMonth && (!bill.lastMonth || month <= bill.lastMonth);

// RN-02: the month's exception, if any, overrides the rule or removes the month.
function billOccurrenceOf(state: State, bill: StoredBill, month: MonthKey): BillOccurrence | null {
  if (!billOccursIn(bill, month)) return null;
  const exception = state.billExceptions.find((e) => e.billId === bill.id && e.month === month);
  if (exception?.skip) return null;
  return {
    billId: bill.id, lastMonth: bill.lastMonth,
    name: exception?.name ?? bill.name,
    amount: exception?.amount ?? bill.amount,
    date: incomeDate(month, exception?.day ?? bill.day),
  };
}

const billsOf = (state: State, month: MonthKey) =>
  state.bills.map((bill) => billOccurrenceOf(state, bill, month)).filter((item): item is BillOccurrence => item !== null);

// RN-07
function requireBill(input: BillInput) {
  const name = requireText(input.name, 'Nome', 120);
  const amount = requireAmount(input.amount, 'Valor');
  const date = requireDate(input.date);
  const month = monthOf(date);
  let lastMonth: MonthKey | null = null;
  if (input.lastMonth) {
    if (!isMonthKey(input.lastMonth)) throw new Error('Mês inválido.');
    if (input.lastMonth < month) throw new Error('O mês final deve ser igual ou posterior ao mês inicial.');
    lastMonth = input.lastMonth;
  }
  return { name, amount, month, day: Number(date.slice(8, 10)), lastMonth };
}

function requireBillOccurrence(state: State, billId: number, month: MonthKey) {
  const bill = findBill(state, billId);
  if (!isMonthKey(month) || !billOccursIn(bill, month)) throw new Error('Esta conta fixa não ocorre neste mês.');
  return bill;
}

const dropBillExceptionsFrom = (state: State, billId: number, month: MonthKey) => {
  state.billExceptions = state.billExceptions.filter((e) => e.billId !== billId || e.month < month);
};

export async function getBills(month: MonthKey): Promise<Bills> {
  const items = billsOf(await load(), month).sort((a, b) => a.date.localeCompare(b.date) || a.billId - b.billId);
  return { month, totalAmount: sum(items.map((i) => i.amount)), items };
}

export function createBill(input: BillInput) {
  return mutate((state) => {
    const { month, ...fields } = requireBill(input);
    const bill: StoredBill = { id: state.nextId++, firstMonth: month, ...fields };
    state.bills.push(bill);
    return bill;
  });
}

// RN-09: like the recurring incomes, "month" adjusts one month and "forward" splits the rule.
export function updateBill(billId: number, month: MonthKey, scope: IncomeScope, input: BillInput) {
  return mutate((state) => {
    const bill = requireBillOccurrence(state, billId, month);
    const { month: inputMonth, ...fields } = requireBill(input);
    if (inputMonth !== month) throw new Error(`A data deve estar dentro de ${monthLabel(month)}.`);
    if (scope === 'month') {
      state.billExceptions = state.billExceptions.filter((e) => !(e.billId === billId && e.month === month));
      state.billExceptions.push({ billId, month, skip: false, name: fields.name, amount: fields.amount, day: fields.day });
      return bill;
    }
    dropBillExceptionsFrom(state, billId, month);
    if (month === bill.firstMonth) {
      Object.assign(bill, fields);
      return bill;
    }
    bill.lastMonth = shiftMonth(month, -1);
    const next: StoredBill = { id: state.nextId++, firstMonth: month, ...fields };
    state.bills.push(next);
    return next;
  });
}

// RN-10
export function deleteBill(billId: number, month: MonthKey, scope: IncomeScope) {
  return mutate((state) => {
    const bill = requireBillOccurrence(state, billId, month);
    if (scope === 'month') {
      state.billExceptions = state.billExceptions.filter((e) => !(e.billId === billId && e.month === month));
      state.billExceptions.push({ billId, month, skip: true });
      return;
    }
    if (month === bill.firstMonth) {
      state.bills = state.bills.filter((b) => b.id !== billId);
      state.billExceptions = state.billExceptions.filter((e) => e.billId !== billId);
      return;
    }
    bill.lastMonth = shiftMonth(month, -1);
    dropBillExceptionsFrom(state, billId, month);
  });
}

// --- daily expenses -------------------------------------------------------------

// RN-08: any date up to the last day of the month a year ahead.
function requireDailyExpense(state: State, categoryId: number | null, input: DailyExpenseInput) {
  const date = requireDate(input.date);
  if (date > lastDayOf(shiftMonth(currentMonth(), 12))) throw new Error('A data deve ser de até 12 meses à frente.');
  return {
    categoryId: requireCategory(state, categoryId),
    description: requireText(input.description, 'Descrição', 200),
    amount: requireAmount(input.amount, 'Valor'),
    date,
  };
}

// RF-07 / RF-08: the month's expenses, newest first, and the sum by category.
export async function getDailyExpenses(month: MonthKey): Promise<DailyExpenses> {
  const state = await load();
  const items = state.dailyExpenses
    .filter((x) => monthOf(x.date) === month)
    .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id)
    .map((x) => ({ ...x, categoryName: categoryNameOf(state, x.categoryId) }));
  const totalAmount = sum(items.map((x) => x.amount));
  const byCategory = new Map<number | null, number>();
  for (const x of items) byCategory.set(x.categoryId, cents((byCategory.get(x.categoryId) ?? 0) + x.amount));
  const summary = [...byCategory.entries()]
    .map(([categoryId, amount]) => ({ categoryId, name: categoryNameOf(state, categoryId), amount, percent: percent(amount, totalAmount) }))
    .sort((a, b) => b.amount - a.amount);
  return { month, totalAmount, items, summary };
}

export function createDailyExpense(categoryId: number | null, input: DailyExpenseInput) {
  return mutate((state) => {
    const expense: StoredDailyExpense = { id: state.nextId++, ...requireDailyExpense(state, categoryId, input) };
    state.dailyExpenses.push(expense);
    return expense;
  });
}

export function updateDailyExpense(expenseId: number, categoryId: number | null, input: DailyExpenseInput) {
  return mutate((state) => {
    const expense = state.dailyExpenses.find((x) => x.id === expenseId);
    if (!expense) throw new Error('Gasto não encontrado.');
    Object.assign(expense, requireDailyExpense(state, categoryId, input));
    return expense;
  });
}

export function deleteDailyExpense(expenseId: number) {
  return mutate((state) => {
    if (!state.dailyExpenses.some((x) => x.id === expenseId)) throw new Error('Gasto não encontrado.');
    state.dailyExpenses = state.dailyExpenses.filter((x) => x.id !== expenseId);
  });
}

// --- month cash -----------------------------------------------------------------

// RN-03 to RN-06: the month on its own: what comes in minus bills, daily expenses and what the
// cards used. It only reads the cards (D7).
function cashOf(state: State, month: MonthKey) {
  const incomeAmount = sum(state.incomes.map((i) => occurrenceOf(state, i, month)).filter((o): o is IncomeOccurrence => o !== null).map((o) => o.amount));
  const billsAmount = sum(billsOf(state, month).map((b) => b.amount));
  const dailyAmount = sum(state.dailyExpenses.filter((x) => monthOf(x.date) === month).map((x) => x.amount));
  const cardsAmount = consolidatedOf(state, month).invoiceAmount;
  return { incomeAmount, billsAmount, dailyAmount, cardsAmount, resultAmount: cents(incomeAmount - billsAmount - dailyAmount - cardsAmount) };
}

// RN-16: the balance starts at the oldest income, bill or daily expense. The cards don't set it.
function cashStart(state: State): MonthKey | null {
  const firsts = [...state.incomes.map((i) => i.firstMonth), ...state.bills.map((b) => b.firstMonth), ...state.dailyExpenses.map((x) => monthOf(x.date))];
  return firsts.length ? firsts.reduce((min, m) => (m < min ? m : min)) : null;
}

// RN-15 / RN-17 / RN-18: the balance carries forward, the shortfall too. Nothing is stored: the
// previous balance is the sum of the results of every month before this one, past or future.
export async function getMonthCash(month: MonthKey): Promise<MonthCash> {
  const state = await load();
  const current = cashOf(state, month);
  const first = cashStart(state);
  let previousAmount = 0;
  if (first) for (let m = first; m < month; m = shiftMonth(m, 1)) previousAmount = cents(previousAmount + cashOf(state, m).resultAmount);
  return { month, ...current, previousAmount, balanceAmount: cents(previousAmount + current.resultAmount) };
}

// --- recurring purchases ------------------------------------------------------

// RN-04: the date gives the first month and the day, up to a year ahead.
function requireRecurring(input: RecurringInput) {
  const date = requireDate(input.date);
  if (date > lastDayOf(shiftMonth(currentMonth(), 12))) throw new Error('A data deve ser de até 12 meses à frente.');
  const month = monthOf(date);
  let lastMonth: MonthKey | null = null;
  if (input.lastMonth) {
    if (!isMonthKey(input.lastMonth)) throw new Error('Mês inválido.');
    if (input.lastMonth < month) throw new Error('O mês final deve ser igual ou posterior ao mês inicial.');
    lastMonth = input.lastMonth;
  }
  return {
    description: requireText(input.description, 'Descrição', 200),
    amount: requireAmount(input.amount, 'Valor'),
    month, day: Number(date.slice(8, 10)), lastMonth,
  };
}

function requireCharge(state: State, recurringId: number, month: MonthKey) {
  const recurring = state.recurrings.find((r) => r.id === recurringId);
  if (!recurring) throw new Error('Compra recorrente não encontrada.');
  if (!isMonthKey(month) || !recurringCharge(state, recurring, month)) throw new Error('Esta cobrança não ocorre neste mês.');
  return recurring;
}

const dropRecurringExceptionsFrom = (state: State, recurringId: number, month: MonthKey) => {
  state.recurringExceptions = state.recurringExceptions.filter((e) => e.recurringId !== recurringId || e.month < month);
};

const dropChargesFrom = (state: State, recurringId: number, month: MonthKey) => {
  state.movements = state.movements.filter((m) => m.recurringId !== recurringId || monthOf(m.date) < month);
};

const setRecurringException = (state: State, exception: StoredRecurringException) => {
  state.recurringExceptions = state.recurringExceptions.filter((e) => !(e.recurringId === exception.recurringId && e.month === exception.month));
  state.recurringExceptions.push(exception);
};

export function createRecurring(cardId: number, categoryId: number | null, input: RecurringInput) {
  return mutate((state) => {
    findCard(state, cardId);
    const { month, ...fields } = requireRecurring(input);
    const recurring: StoredRecurring = { id: state.nextId++, cardId, categoryId: requireCategory(state, categoryId), firstMonth: month, ...fields };
    state.recurrings.push(recurring);
    syncRecurrings(state, cardId);
    return recurring;
  });
}

// RN-05 / RN-06: "month" adjusts one charge; "forward" splits the rule.
export function updateRecurring(recurringId: number, month: MonthKey, scope: IncomeScope, categoryId: number | null, input: RecurringInput) {
  return mutate((state) => {
    const recurring = requireCharge(state, recurringId, month);
    const { month: inputMonth, ...fields } = requireRecurring(input);
    if (inputMonth !== month) throw new Error(`A data deve estar dentro de ${monthLabel(month)}.`);
    if (scope === 'month') {
      const charge = state.movements.find((m) => m.recurringId === recurringId && monthOf(m.date) === month);
      if (charge) Object.assign(charge, { description: fields.description, amount: fields.amount, date: input.date.slice(0, 10) });
      else setRecurringException(state, { recurringId, month, skip: false, description: fields.description, amount: fields.amount, day: fields.day });
      return recurring;
    }
    const nextCategoryId = requireCategory(state, categoryId);
    dropRecurringExceptionsFrom(state, recurringId, month);
    dropChargesFrom(state, recurringId, month);
    let target = recurring;
    if (month === recurring.firstMonth) {
      Object.assign(recurring, { ...fields, categoryId: nextCategoryId });
    } else {
      recurring.lastMonth = shiftMonth(month, -1);
      target = { id: state.nextId++, cardId: recurring.cardId, categoryId: nextCategoryId, firstMonth: month, ...fields };
      state.recurrings.push(target);
    }
    syncRecurrings(state, recurring.cardId);
    return target;
  });
}

// RN-07 / RN-08
export function deleteRecurring(recurringId: number, month: MonthKey, scope: IncomeScope) {
  return mutate((state) => {
    const recurring = requireCharge(state, recurringId, month);
    if (scope === 'month') {
      state.movements = state.movements.filter((m) => !(m.recurringId === recurringId && monthOf(m.date) === month));
      setRecurringException(state, { recurringId, month, skip: true });
      return;
    }
    dropChargesFrom(state, recurringId, month);
    if (month === recurring.firstMonth) {
      state.recurrings = state.recurrings.filter((r) => r.id !== recurringId);
      state.recurringExceptions = state.recurringExceptions.filter((e) => e.recurringId !== recurringId);
      return;
    }
    recurring.lastMonth = shiftMonth(month, -1);
    dropRecurringExceptionsFrom(state, recurringId, month);
  });
}
